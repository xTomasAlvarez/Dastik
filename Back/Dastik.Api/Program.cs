using Dastik.Api.Domain.Services;
using Dastik.Api.Features.Inventario.CrearProducto;
using Dastik.Api.Infrastructure.Persistence;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

// 1. Cargar variables de entorno desde el archivo .env (busca en el directorio actual y padres)
DotNetEnv.Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? "Host=localhost;Database=dastik_erp;Username=postgres;Password=postgres"));

// CQRS con MediatR y FluentValidation
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly);
});
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

// Servicios de Dominio
builder.Services.AddSingleton<GeneradorEan13>();
builder.Services.AddTransient<ICalculadoraComisiones, CalculadoraComisiones>();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Endpoints (Vertical Slices)
app.MapCrearProductoEndpoint();

app.Run();
