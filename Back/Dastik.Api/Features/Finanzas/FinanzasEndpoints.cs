using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Features.Finanzas.Services;
using Dastik.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Features.Finanzas;

public static class FinanzasEndpoints
{
    public static void MapFinanzasEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/finanzas")
            .WithTags("Finanzas, Cotizaciones y Gastos Multidivisa");

        // 1. GET /api/finanzas/cotizacion-dolar: Cotización en vivo de DolarApi.com
        group.MapGet("/cotizacion-dolar", async (
            IDolarCotizacionService cotizacionService,
            CancellationToken ct) =>
        {
            var cotizacion = await cotizacionService.ObtenerCotizacionAsync(ct);
            return Results.Ok(cotizacion);
        })
        .AllowAnonymous()
        .WithName("ObtenerCotizacionDolar")
        .WithSummary("Devuelve la cotización en vivo del Dólar Blue y Oficial con caché de 15 minutos y contingencia resiliente.")
        .WithOpenApi();

        // 2. GET /api/finanzas/gastos: Listar gastos registrados (Admin)
        group.MapGet("/gastos", async (
            int? turnoId,
            DateTime? desde,
            DateTime? hasta,
            AppDbContext context,
            CancellationToken ct) =>
        {
            var query = context.Gastos
                .AsNoTracking()
                .Where(g => g.Activo);

            if (turnoId.HasValue && turnoId.Value > 0)
            {
                query = query.Where(g => g.TurnoId == turnoId.Value);
            }

            if (desde.HasValue)
            {
                query = query.Where(g => g.Fecha >= desde.Value);
            }

            if (hasta.HasValue)
            {
                query = query.Where(g => g.Fecha <= hasta.Value);
            }

            var gastos = await query
                .OrderByDescending(g => g.Fecha)
                .Select(g => new GastoDto(
                    g.Id,
                    g.Descripcion,
                    g.Monto,
                    g.Moneda,
                    g.MontoMonedaOriginal,
                    g.TipoCambioAplicado,
                    g.TipoDolar,
                    g.Categoria,
                    g.Fecha,
                    g.TurnoId,
                    g.UsuarioId
                ))
                .ToListAsync(ct);

            var totalArs = gastos.Sum(g => g.Monto);
            var totalUsd = gastos.Where(g => g.Moneda == "USD").Sum(g => g.MontoMonedaOriginal);

            var response = new ListarGastosResponse(
                Gastos: gastos,
                TotalArs: totalArs,
                TotalUsdOriginal: totalUsd,
                CantidadGastos: gastos.Count
            );

            return Results.Ok(response);
        })
        .RequireAuthorization("AdminOnly")
        .WithName("ListarGastos")
        .WithSummary("Lista todos los gastos del período o turno con totales consolidados en ARS y desglose en USD.")
        .WithOpenApi();

        // 3. POST /api/finanzas/gastos: Registrar nuevo gasto (soporte multidivisa ARS / USD)
        group.MapPost("/gastos", async (
            RegistrarGastoRequest request,
            ClaimsPrincipal user,
            AppDbContext context,
            IDolarCotizacionService cotizacionService,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Descripcion))
            {
                return Results.BadRequest(new { error = "La descripción del gasto es obligatoria." });
            }

            if (request.Monto <= 0)
            {
                return Results.BadRequest(new { error = "El importe del gasto debe ser mayor a cero." });
            }

            var usuarioIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? user.FindFirst("sub")?.Value;

            int usuarioId = 1;
            if (!string.IsNullOrWhiteSpace(usuarioIdStr) && int.TryParse(usuarioIdStr, out var parsedId))
            {
                usuarioId = parsedId;
            }

            var moneda = string.Equals(request.Moneda?.Trim(), "USD", StringComparison.OrdinalIgnoreCase)
                ? "USD"
                : "ARS";

            decimal montoArsFinal;
            decimal montoOriginal = request.Monto;
            decimal? tipoCambioAplicado = null;
            string? tipoDolar = null;

            if (moneda == "USD")
            {
                tipoDolar = string.Equals(request.TipoDolar?.Trim(), "Oficial", StringComparison.OrdinalIgnoreCase)
                    ? "Oficial"
                    : "Blue";

                if (request.TipoCambioAplicado.HasValue && request.TipoCambioAplicado.Value > 0)
                {
                    tipoCambioAplicado = request.TipoCambioAplicado.Value;
                }
                else
                {
                    var cotizacion = await cotizacionService.ObtenerCotizacionAsync(ct);
                    tipoCambioAplicado = tipoDolar == "Oficial"
                        ? cotizacion.Oficial.Venta
                        : cotizacion.Blue.Venta;
                }

                montoArsFinal = Math.Round(montoOriginal * tipoCambioAplicado.Value, 2);
            }
            else
            {
                montoArsFinal = Math.Round(montoOriginal, 2);
            }

            var categoria = string.IsNullOrWhiteSpace(request.Categoria)
                ? "General"
                : request.Categoria.Trim();

            var nuevoGasto = new Gasto
            {
                Descripcion = request.Descripcion.Trim(),
                Monto = montoArsFinal,
                Moneda = moneda,
                MontoMonedaOriginal = montoOriginal,
                TipoCambioAplicado = tipoCambioAplicado,
                TipoDolar = tipoDolar,
                Categoria = categoria,
                Fecha = DateTime.UtcNow,
                TurnoId = request.TurnoId,
                UsuarioId = usuarioId,
                Activo = true
            };

            context.Gastos.Add(nuevoGasto);

            // Si está vinculado a un turno activo, sumamos al acumulador del turno
            if (request.TurnoId.HasValue && request.TurnoId.Value > 0)
            {
                var turno = await context.Turnos.FirstOrDefaultAsync(t => t.Id == request.TurnoId.Value, ct);
                if (turno is not null)
                {
                    turno.GastosTurno += montoArsFinal;
                }
            }

            await context.SaveChangesAsync(ct);

            var dto = new GastoDto(
                nuevoGasto.Id,
                nuevoGasto.Descripcion,
                nuevoGasto.Monto,
                nuevoGasto.Moneda,
                nuevoGasto.MontoMonedaOriginal,
                nuevoGasto.TipoCambioAplicado,
                nuevoGasto.TipoDolar,
                nuevoGasto.Categoria,
                nuevoGasto.Fecha,
                nuevoGasto.TurnoId,
                nuevoGasto.UsuarioId
            );

            return Results.Created($"/api/finanzas/gastos/{nuevoGasto.Id}", dto);
        })
        .RequireAuthorization()
        .WithName("RegistrarGasto")
        .WithSummary("Registra un nuevo egreso de caja en ARS o USD con conversión exacta y vinculación opcional de turno.")
        .WithOpenApi();

        // 4. DELETE /api/finanzas/gastos/{id}: Soft-delete de gasto
        group.MapDelete("/gastos/{id:int}", async (
            int id,
            AppDbContext context,
            CancellationToken ct) =>
        {
            var gasto = await context.Gastos.FirstOrDefaultAsync(g => g.Id == id, ct);
            if (gasto is null || !gasto.Activo)
            {
                return Results.NotFound(new { error = $"Gasto con ID {id} no encontrado." });
            }

            gasto.Activo = false;

            // Si tenía un turno asignado, descontamos el valor
            if (gasto.TurnoId.HasValue && gasto.TurnoId.Value > 0)
            {
                var turno = await context.Turnos.FirstOrDefaultAsync(t => t.Id == gasto.TurnoId.Value, ct);
                if (turno is not null && turno.GastosTurno >= gasto.Monto)
                {
                    turno.GastosTurno -= gasto.Monto;
                }
            }

            await context.SaveChangesAsync(ct);

            return Results.Ok(new { message = "Gasto eliminado correctamente." });
        })
        .RequireAuthorization("AdminOnly")
        .WithName("EliminarGasto")
        .WithSummary("Realiza el borrado lógico (Soft-delete) de un gasto y actualiza el saldo del turno.")
        .WithOpenApi();
    }
}

public record GastoDto(
    int Id,
    string Descripcion,
    decimal Monto,
    string Moneda,
    decimal MontoMonedaOriginal,
    decimal? TipoCambioAplicado,
    string? TipoDolar,
    string Categoria,
    DateTime Fecha,
    int? TurnoId,
    int UsuarioId
);

public record ListarGastosResponse(
    List<GastoDto> Gastos,
    decimal TotalArs,
    decimal TotalUsdOriginal,
    int CantidadGastos
);

public record RegistrarGastoRequest(
    string Descripcion,
    decimal Monto,
    string Moneda = "ARS",
    decimal? TipoCambioAplicado = null,
    string? TipoDolar = null,
    string? Categoria = "General",
    int? TurnoId = null
);
