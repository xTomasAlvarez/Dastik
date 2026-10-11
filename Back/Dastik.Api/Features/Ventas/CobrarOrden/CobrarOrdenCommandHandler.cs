using Dastik.Api.Common;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Services;
using Dastik.Api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Features.Ventas.CobrarOrden;

public class CobrarOrdenCommandHandler : IRequestHandler<CobrarOrdenCommand, Result<CobrarOrdenResponse>>
{
    private readonly AppDbContext _context;
    private readonly ICalculadoraComisiones _calculadoraComisiones;

    public CobrarOrdenCommandHandler(AppDbContext context, ICalculadoraComisiones calculadoraComisiones)
    {
        _context = context;
        _calculadoraComisiones = calculadoraComisiones;
    }

    public async Task<Result<CobrarOrdenResponse>> Handle(CobrarOrdenCommand request, CancellationToken cancellationToken)
    {
        // 1. Validar existencia y estado del turno de caja
        var turno = await _context.Turnos
            .FirstOrDefaultAsync(t => t.Id == request.TurnoId, cancellationToken);

        if (turno == null)
        {
            return Result<CobrarOrdenResponse>.Failure($"El turno con ID {request.TurnoId} no existe.");
        }

        if (turno.Estado != EstadoTurno.Abierto)
        {
            return Result<CobrarOrdenResponse>.Failure("No se pueden registrar ventas en un turno que se encuentra cerrado.");
        }

        // 2. Validar coincidencia de montos (Items vs Pagos)
        decimal totalItems = request.Items.Sum(i => i.Cantidad * i.PrecioUnitario);
        decimal totalPagos = request.Pagos.Sum(p => p.Monto);

        if (totalItems != totalPagos)
        {
            return Result<CobrarOrdenResponse>.Failure("La suma de los pagos no coincide con el total de la orden.");
        }

        // 3. Obtener variantes involucradas para validar y descontar stock
        var varianteIds = request.Items.Select(i => i.VarianteId).Distinct().ToList();
        var variantes = await _context.Variantes
            .Where(v => varianteIds.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, cancellationToken);

        foreach (var item in request.Items)
        {
            if (!variantes.TryGetValue(item.VarianteId, out var variante))
            {
                return Result<CobrarOrdenResponse>.Failure($"La variante con ID {item.VarianteId} no existe en el catálogo.");
            }

            if (variante.StockFisico < item.Cantidad)
            {
                return Result<CobrarOrdenResponse>.Failure(
                    $"Stock insuficiente para la variante ID {variante.Id} ({variante.Talle} / {variante.Color}). " +
                    $"Stock disponible: {variante.StockFisico}, requerido: {item.Cantidad}.");
            }
        }

        // 4. Iniciar transacción atómica ACID (skill_efcore_transacciones.md)
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            // A. Descontar stock físico de cada variante
            foreach (var item in request.Items)
            {
                var variante = variantes[item.VarianteId];
                variante.StockFisico -= item.Cantidad;
            }

            // B. Instanciar la Orden
            var fechaActual = DateTime.UtcNow;
            var orden = new Orden
            {
                TurnoId = request.TurnoId,
                Fecha = fechaActual,
                Total = totalItems,
                Estado = EstadoOrden.Pagada
            };

            // C. Agregar Detalles de la Orden
            foreach (var item in request.Items)
            {
                orden.Detalles.Add(new DetalleOrden
                {
                    VarianteId = item.VarianteId,
                    Cantidad = item.Cantidad,
                    PrecioUnitario = item.PrecioUnitario,
                    Subtotal = item.Cantidad * item.PrecioUnitario
                });
            }

            // D. Agregar Pagos registrados
            foreach (var pago in request.Pagos)
            {
                orden.Pagos.Add(new Pago
                {
                    MetodoPago = pago.MetodoPago,
                    Monto = pago.Monto
                });
            }

            _context.Ordenes.Add(orden);

            // E. Persistir cambios y confirmar transacción ACID
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            // 5. Calcular comisión del vendedor para la orden registrada
            decimal comision = _calculadoraComisiones.Calcular(fechaActual, orden.Total);

            var response = new CobrarOrdenResponse(
                OrdenId: orden.Id,
                TurnoId: orden.TurnoId,
                Fecha: orden.Fecha,
                Total: orden.Total,
                ComisionCalculada: comision,
                CantidadItems: orden.Detalles.Count
            );

            return Result<CobrarOrdenResponse>.Success(response);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
