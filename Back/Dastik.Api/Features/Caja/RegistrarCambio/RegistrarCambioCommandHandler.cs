using System.Text.Json;
using Dastik.Api.Common;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Features.Caja.RegistrarCambio;

public class RegistrarCambioCommandHandler : IRequestHandler<RegistrarCambioCommand, Result<RegistrarCambioResult>>
{
    private readonly AppDbContext _context;

    public RegistrarCambioCommandHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<RegistrarCambioResult>> Handle(RegistrarCambioCommand request, CancellationToken cancellationToken)
    {
        // 1. Validar que el Turno exista y esté Abierto
        var turno = await _context.Turnos
            .FirstOrDefaultAsync(t => t.Id == request.TurnoId, cancellationToken);

        if (turno == null)
        {
            return Result<RegistrarCambioResult>.Failure($"El turno con ID {request.TurnoId} no existe.");
        }

        if (turno.Estado != EstadoTurno.Abierto)
        {
            return Result<RegistrarCambioResult>.Failure("No se pueden registrar cambios en un turno que se encuentra cerrado.");
        }

        // 2. Obtener variantes involucradas
        var varianteIds = new[] { request.VarianteDevueltaId, request.VarianteNuevaId }.Distinct().ToList();
        var variantes = await _context.Variantes
            .Include(v => v.Producto)
                .ThenInclude(p => p.UnidadNegocio)
            .Where(v => varianteIds.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, cancellationToken);

        if (!variantes.TryGetValue(request.VarianteDevueltaId, out var varianteDevuelta))
        {
            return Result<RegistrarCambioResult>.Failure($"La variante devuelta con ID {request.VarianteDevueltaId} no existe en el catálogo.");
        }

        if (!variantes.TryGetValue(request.VarianteNuevaId, out var varianteNueva))
        {
            return Result<RegistrarCambioResult>.Failure($"La nueva variante con ID {request.VarianteNuevaId} no existe en el catálogo.");
        }

        // 3. Validar stock físico disponible para la nueva prenda
        // Si es la misma variante, el stock disponible efectivo contempla la devolución
        int stockDisponibleEfectivo = varianteNueva.Id == varianteDevuelta.Id
            ? varianteNueva.StockFisico + request.CantidadDevuelta
            : varianteNueva.StockFisico;

        if (stockDisponibleEfectivo < request.CantidadNueva)
        {
            return Result<RegistrarCambioResult>.Failure(
                $"Stock insuficiente para la nueva variante ID {varianteNueva.Id} ({varianteNueva.Talle} / {varianteNueva.Color}). " +
                $"Stock disponible: {varianteNueva.StockFisico}, requerido: {request.CantidadNueva}.");
        }

        // 4. Calcular precios, subtotales y diferencia económica
        decimal precioDevuelto = varianteDevuelta.Producto?.PrecioVenta ?? 0m;
        decimal precioNuevo = varianteNueva.Producto?.PrecioVenta ?? 0m;

        decimal subtotalDevuelto = Math.Round(precioDevuelto * request.CantidadDevuelta, 2);
        decimal subtotalNuevo = Math.Round(precioNuevo * request.CantidadNueva, 2);
        decimal diferencia = Math.Round(subtotalNuevo - subtotalDevuelto, 2);

        decimal montoCobrado = 0m;

        if (diferencia > 0)
        {
            // Cliente debe abonar diferencia
            if (!request.MetodoPagoDiferencia.HasValue)
            {
                return Result<RegistrarCambioResult>.Failure(
                    $"Existe una diferencia a pagar de ${diferencia:N2}. Debe especificar el método de pago.");
            }

            montoCobrado = request.MontoDiferenciaPagada.HasValue && request.MontoDiferenciaPagada.Value > 0
                ? request.MontoDiferenciaPagada.Value
                : diferencia;
        }

        // 5. Persistencia Transaccional ESTRICTAMENTE ACID
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            // A. Movimiento dual de stock físico
            varianteDevuelta.StockFisico += request.CantidadDevuelta;
            varianteNueva.StockFisico -= request.CantidadNueva;

            var fechaActual = DateTime.UtcNow;

            // B. Registrar la Orden con etiqueta de Cambio
            var orden = new Orden
            {
                TurnoId = request.TurnoId,
                Fecha = fechaActual,
                Total = montoCobrado,
                Estado = EstadoOrden.Pagada,
                EsCambio = true,
                MotivoCambio = request.MotivoCambio
            };

            // C. Detalles de la orden (Prenda que sale positiva, Prenda devuelta negativa para trazabilidad)
            orden.Detalles.Add(new DetalleOrden
            {
                VarianteId = varianteNueva.Id,
                Cantidad = request.CantidadNueva,
                PrecioUnitario = precioNuevo,
                Subtotal = subtotalNuevo
            });

            orden.Detalles.Add(new DetalleOrden
            {
                VarianteId = varianteDevuelta.Id,
                Cantidad = -request.CantidadDevuelta,
                PrecioUnitario = precioDevuelto,
                Subtotal = -subtotalDevuelto
            });

            // D. Si hubo diferencia cobrada (> 0), asentar únicamente la diferencia en los Pagos
            // para no inflar artificialmente el arqueo ni la recaudación de caja
            if (montoCobrado > 0 && request.MetodoPagoDiferencia.HasValue)
            {
                orden.Pagos.Add(new Pago
                {
                    MetodoPago = request.MetodoPagoDiferencia.Value,
                    Monto = montoCobrado
                });
            }

            _context.Ordenes.Add(orden);

            // E. Tenant Guard + Outbox Pattern para Omnicanalidad Tiendanube
            // Variante devuelta (entra al stock)
            if (varianteDevuelta.Producto?.UnidadNegocio?.TieneTiendaNube == true &&
                !string.IsNullOrWhiteSpace(varianteDevuelta.TiendanubeVariantId))
            {
                _context.OutboxMessages.Add(new OutboxMessage
                {
                    Id = Guid.NewGuid(),
                    TipoEvento = "StockIncrementadoPorCambio",
                    ContenidoJson = JsonSerializer.Serialize(new
                    {
                        VarianteId = varianteDevuelta.Id,
                        CantidadAjustada = request.CantidadDevuelta,
                        Operacion = "Devolucion"
                    }),
                    FechaOcurrenciaUtc = fechaActual,
                    FechaProcesadoUtc = null,
                    Intentos = 0
                });
            }

            // Variante nueva (sale del stock)
            if (varianteNueva.Producto?.UnidadNegocio?.TieneTiendaNube == true &&
                !string.IsNullOrWhiteSpace(varianteNueva.TiendanubeVariantId))
            {
                _context.OutboxMessages.Add(new OutboxMessage
                {
                    Id = Guid.NewGuid(),
                    TipoEvento = "StockReducidoPorCambio",
                    ContenidoJson = JsonSerializer.Serialize(new
                    {
                        VarianteId = varianteNueva.Id,
                        CantidadAjustada = -request.CantidadNueva,
                        Operacion = "CambioSalida"
                    }),
                    FechaOcurrenciaUtc = fechaActual,
                    FechaProcesadoUtc = null,
                    Intentos = 0
                });
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var resultado = new RegistrarCambioResult(
                OrdenId: orden.Id,
                TurnoId: orden.TurnoId,
                Fecha: orden.Fecha,
                SubtotalDevuelto: subtotalDevuelto,
                SubtotalNuevo: subtotalNuevo,
                Diferencia: diferencia,
                MontoCobrado: montoCobrado,
                MetodoPago: request.MetodoPagoDiferencia,
                MotivoCambio: request.MotivoCambio,
                StockDevueltoFinal: varianteDevuelta.StockFisico,
                StockNuevoFinal: varianteNueva.StockFisico
            );

            return Result<RegistrarCambioResult>.Success(resultado);
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result<RegistrarCambioResult>.Failure("Conflicto de concurrencia: el stock disponible de una prenda fue modificado simultáneamente por otra terminal. Vuelva a intentar la operación.");
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
