using Dastik.Api.Common;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Features.Caja.AbrirTurno;

public class AbrirTurnoCommandHandler : IRequestHandler<AbrirTurnoCommand, Result<AbrirTurnoResult>>
{
    private readonly AppDbContext _context;

    public AbrirTurnoCommandHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<AbrirTurnoResult>> Handle(AbrirTurnoCommand request, CancellationToken cancellationToken)
    {
        // 1. Regla de negocio: Un empleado no puede tener dos turnos abiertos a la vez
        bool tieneTurnoAbierto = await _context.Turnos
            .AnyAsync(t => t.EmpleadoId == request.EmpleadoId && t.Estado == EstadoTurno.Abierto, cancellationToken);

        if (tieneTurnoAbierto)
        {
            return Result<AbrirTurnoResult>.Failure($"El empleado con ID {request.EmpleadoId} ya tiene un turno de caja abierto.");
        }

        // 2. Instanciar y persistir nuevo Turno
        var nuevoTurno = new Turno
        {
            EmpleadoId = request.EmpleadoId,
            SaldoInicial = request.SaldoInicial,
            FechaApertura = DateTime.UtcNow,
            Estado = EstadoTurno.Abierto
        };

        _context.Turnos.Add(nuevoTurno);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<AbrirTurnoResult>.Success(new AbrirTurnoResult(
            nuevoTurno.Id,
            nuevoTurno.EmpleadoId,
            nuevoTurno.FechaApertura,
            nuevoTurno.SaldoInicial
        ));
    }
}
