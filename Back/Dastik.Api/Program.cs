using System.Text;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Integrations.Tiendanube;
using Dastik.Api.Domain.Services;
using Dastik.Api.Features.Auth;
using Dastik.Api.Features.Caja;
using Dastik.Api.Features.Inventario.CrearProducto;
using Dastik.Api.Features.Inventario.SincronizarTiendanube;
using Dastik.Api.Features.Metricas;
using Dastik.Api.Features.Usuarios;
using Dastik.Api.Infrastructure.BackgroundServices;
using Dastik.Api.Infrastructure.Integrations.Tiendanube;
using Dastik.Api.Infrastructure.Persistence;
using Dastik.Api.Infrastructure.Security;
using Dastik.Api.Infrastructure.Tenancy;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

// 1. Cargar variables de entorno desde el archivo .env (busca en el directorio actual y padres)
DotNetEnv.Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

// Multi-Tenancy & Modo Sandbox
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantService, TenantService>();

// CORS para Frontend React + Vite (skill_dotnet_arquitectura.md)
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Resolución dinámica de base de datos por tenant / Modo Sandbox
builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    var tenantService = sp.GetRequiredService<ITenantService>();
    var conn = tenantService.GetConnectionString();
    if (conn.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase) || conn.EndsWith(".db", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlite(conn);
    }
    else
    {
        options.UseNpgsql(conn);
    }
});

// CQRS con MediatR y FluentValidation
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly);
});
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

// Servicios de Dominio e Infraestructura
builder.Services.AddSingleton<GeneradorEan13>();
builder.Services.AddTransient<ICalculadoraComisiones, CalculadoraComisiones>();
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<IJwtProvider, JwtProvider>();
builder.Services.AddScoped<ITiendanubeSyncService, TiendanubeSyncService>();

// Cliente HTTP Tipado para Tiendanube con Políticas de Resiliencia (Polly)
builder.Services.AddHttpClient<ITiendanubeApiClient, TiendanubeApiClient>(client =>
{
    client.BaseAddress = new Uri("https://api.tiendanube.com/v1/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd("DastikERP/1.0 (soporte@dastik.com)");
})
.AddStandardResilienceHandler();

// Background Worker para Transactional Outbox Pattern
builder.Services.AddHostedService<OutboxMessageProcessor>();

// Autenticación y Autorización JWT
var jwtSecret = builder.Configuration["JWT_SECRET"]
    ?? builder.Configuration["Jwt:SecretKey"]
    ?? JwtProvider.DefaultSecretKey;
var jwtIssuer = builder.Configuration["JWT_ISSUER"]
    ?? builder.Configuration["Jwt:Issuer"]
    ?? JwtProvider.DefaultIssuer;
var jwtAudience = builder.Configuration["JWT_AUDIENCE"]
    ?? builder.Configuration["Jwt:Audience"]
    ?? JwtProvider.DefaultAudience;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options =>
{
    // Jerarquía de roles: Dueño/Admin también opera la caja heredando permisos de Empleado
    options.AddPolicy("OperadorCaja", policy =>
        policy.RequireRole(nameof(RolUsuario.Admin), nameof(RolUsuario.Empleado)));

    // Política restrictiva: exclusiva para el Dueño/Admin (métricas financieras, liquidaciones, arqueos y sync)
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole(nameof(RolUsuario.Admin)));
});

// Swagger con soporte para Bearer Token
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Dastik ERP & POS API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Autenticación JWT mediante esquema Bearer. Ejemplo: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("FrontendPolicy");

app.UseAuthentication();
app.UseAuthorization();

// Endpoints (Vertical Slices)
app.MapAuthEndpoints();
app.MapCrearProductoEndpoint();
app.MapCajaEndpoints();
app.MapMetricasEndpoints();
app.MapUsuariosEndpoints();

// Seeder de datos iniciales (Usuario Fundador)
try
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (db.Database.IsSqlite())
        {
            await db.Database.EnsureCreatedAsync();
            try
            {
                await db.Database.ExecuteSqlRawAsync("ALTER TABLE \"Turnos\" ADD COLUMN \"GastosTurno\" TEXT DEFAULT '0' NOT NULL;");
            }
            catch
            {
                // La columna ya existe o recién fue creada
            }

            try
            {
                await db.Database.ExecuteSqlRawAsync("ALTER TABLE \"Usuarios\" ADD COLUMN \"TurnoAsignado\" TEXT DEFAULT 'Completo' NOT NULL;");
            }
            catch
            {
                // La columna ya existe
            }

            try
            {
                await db.Database.ExecuteSqlRawAsync("ALTER TABLE \"Usuarios\" ADD COLUMN \"TarifaPorHora\" TEXT DEFAULT '0' NOT NULL;");
            }
            catch
            {
                // La columna ya existe
            }
        }
    }
    await DataSeeder.SeedInitialDataAsync(app.Services);
}
catch (Exception ex)
{
    app.Logger.LogWarning(ex, "No se pudo ejecutar el DataSeeder inicial (¿base de datos desconectada?).");
}

// Seeder de catálogo de prueba para Modo Sandbox (exclusivo para desarrollo)
if (app.Environment.IsDevelopment())
{
    try
    {
        await SandboxDataSeeder.SeedSandboxDataAsync(app.Services);
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "No se pudo ejecutar el SandboxDataSeeder (¿base de datos sandbox desconectada?).");
    }
}

app.Run();
