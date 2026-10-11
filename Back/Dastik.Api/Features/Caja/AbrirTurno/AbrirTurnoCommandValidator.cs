using FluentValidation;

namespace Dastik.Api.Features.Caja.AbrirTurno;

public class AbrirTurnoCommandValidator : AbstractValidator<AbrirTurnoCommand>
{
    public AbrirTurnoCommandValidator()
    {
        RuleFor(x => x.EmpleadoId)
            .GreaterThan(0)
            .WithMessage("El identificador del empleado es obligatorio y debe ser mayor a 0.");

        RuleFor(x => x.SaldoInicial)
            .GreaterThanOrEqualTo(0)
            .WithMessage("El saldo inicial no puede ser negativo.");
    }
}
