using Dastik.Api.Common;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Services;
using Dastik.Api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Features.Caja.CobrarOrden;

public class CobrarOrdenCommandHandler : IRequestHandler<CobrarOrdenCommand, Result<CobrarOrdenResult>>
{
    private readonly AppDbContext _context;
    private readonly ICalculadoraComisiones _calculadoraComisiones;

    public CobrarOrdenCommandHandler(AppDbContext context, ICalculadoraComisiones calculadoraComisiones)
    {
        _context = context;
        _calculadoraComisiones = calculadoraComisiones;
    }

    public async Task<Result<CobrarOrdenResult>> Handle(CobrarOrdenCommand request, CancellationToken cancellationToken)
    {
        // 1. Validar que el Turno exista y esté Abierto
        var turno = await _context.Turnos
            .FirstOrDefaultAsync(t => t.Id == request.TurnoId, cancellationToken);

        if (turno == null)
        {
            return Result<CobrarOrdenResult>.Failure($"El turno con ID {request.TurnoId} no existe.");
        }

        if (turno.Estado != EstadoTurno.Abierto)
        {
            return Result<CobrarOrdenResult>.Failure("No se pueden registrar ventas en un turno que se encuentra cerrado.");
        }

        // 2. Validar que la suma de los Pagos coincida exactamente con la suma de los Subtotales de los items (usando decimal)
        decimal totalItems = request.Items.Sum(i => i.Cantidad * i.PrecioUnitario);
        decimal totalPagos = request.Pagos.Sum(p => p.Monto);

        if (totalItems != totalPagos)
        {
            return Result<CobrarOrdenResult>.Failure("La suma de los pagos no coincide con el total de los subtotales de los ítems.");
        }

        // 3. Obtener variantes involucradas para validar stock suficiente
        var varianteIds = request.Items.Select(i => i.VarianteId).Distinct().ToList();
        var variantes = await _context.Variantes
            .Where(v => varianteIds.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, cancellationToken);

        foreach (var item in request.Items)
        {
            if (!variantes.TryGetValue(item.VarianteId, out var variante))
            {
                return Result<CobrarOrdenResult>.Failure($"La variante con ID {item.VarianteId} no existe en el catálogo.");
            }

            if (variante.StockFisico < item.Cantidad)
            {
                return Result<CobrarOrdenResult>.Failure(
                    $"Stock insuficiente para la variante ID {variante.Id} ({variante.Talle} / {variante.Color}). " +
                    $"Stock disponible: {variante.StockFisico}, requerido: {item.Cantidad}.");
            }
        }

        // 4. Persistencia Transaccional ESTRICTAMENTE ACID (skill_efcore_transacciones.md)
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            // A. Descontar el stock físico de cada variante vendida
            foreach (var item in request.Items)
            {
                var variante = variantes[item.VarianteId];
                variante.StockFisico -= item.Cantidad;
            }

            // B. Crear la Orden
            var fechaActual = DateTime.UtcNow;
            var orden = new Orden
            {
                TurnoId = request.TurnoId,
                Fecha = fechaActual,
                Total = totalItems,
                Estado = EstadoOrden.Pagada
            };

            // C. Crear sus DetalleOrden
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

            // D. Crear sus Pagos
            foreach (var pago in request.Pagos)
            {
                orden.Pagos.Add(new Pago
                {
                    MetodoPago = pago.MetodoPago,
                    Monto = pago.Monto
                });
            }

            _context.Ordenes.Add(orden);

            // E. Guardar todo en una única transacción de EF Core
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            // 5. Calcular comisión del vendedor para la orden registrada
            decimal comision = _calculadoraComisiones.Calcular(fechaActual, orden.Total);

            var resultado = new CobrarOrdenResult(
                OrdenId: orden.Id,
                TurnoId: orden.TurnoId,
                Fecha: orden.Fecha,
                Total: orden.Total,
                ComisionCalculada: comision,
                CantidadItems: orden.Detalles.Count
            );

            return Result<CobrarOrdenResult>.Success(resultado);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
