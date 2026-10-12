using Dastik.Api.Common;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Features.Caja.CerrarTurno;

public class CerrarTurnoCommandHandler : IRequestHandler<CerrarTurnoCommand, Result<CerrarTurnoResult>>
{
    private readonly AppDbContext _context;

    public CerrarTurnoCommandHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CerrarTurnoResult>> Handle(CerrarTurnoCommand request, CancellationToken cancellationToken)
    {
        // 1. Validar que el Turno exista y esté en estado Abierto
        var turno = await _context.Turnos
            .Include(t => t.Ordenes)
                .ThenInclude(o => o.Pagos)
            .FirstOrDefaultAsync(t => t.Id == request.TurnoId, cancellationToken);

        if (turno == null)
        {
            return Result<CerrarTurnoResult>.Failure($"El turno con ID {request.TurnoId} no existe.");
        }

        if (turno.Estado != EstadoTurno.Abierto)
        {
            return Result<CerrarTurnoResult>.Failure($"El turno con ID {request.TurnoId} ya se encuentra cerrado.");
        }

        // 2. Calcular el total acumulado en efectivo de las órdenes pagadas del turno
        var ordenesPagadas = turno.Ordenes
            .Where(o => o.Estado == EstadoOrden.Pagada)
            .ToList();

        decimal totalVentasEfectivo = ordenesPagadas
            .SelectMany(o => o.Pagos)
            .Where(p => p.MetodoPago == MetodoPago.Efectivo)
            .Sum(p => p.Monto);

        decimal saldoEsperado = turno.SaldoInicial + totalVentasEfectivo;

        // 3. Comparar con el SaldoFinal (arqueo reportado por el cajero) y calcular la Diferencia
        decimal diferencia = request.SaldoFinal - saldoEsperado;

        // 4. Establecer FechaCierre, SaldoFinal y Estado = Cerrado
        var fechaCierre = DateTime.UtcNow;
        turno.FechaCierre = fechaCierre;
        turno.SaldoFinal = request.SaldoFinal;
        turno.Estado = EstadoTurno.Cerrado;

        // 5. Guardar en PostgreSQL
        await _context.SaveChangesAsync(cancellationToken);

        // 6. Retornar el resumen del arqueo con Result Pattern
        var resultado = new CerrarTurnoResult(
            TurnoId: turno.Id,
            EmpleadoId: turno.EmpleadoId,
            FechaApertura: turno.FechaApertura,
            FechaCierre: fechaCierre,
            SaldoInicial: turno.SaldoInicial,
            TotalVentasEfectivo: totalVentasEfectivo,
            SaldoEsperado: saldoEsperado,
            SaldoFinal: turno.SaldoFinal.Value,
            Diferencia: diferencia,
            CantidadOrdenes: ordenesPagadas.Count
        );

        return Result<CerrarTurnoResult>.Success(resultado);
    }
}
