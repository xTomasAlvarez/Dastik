using FluentValidation;

namespace Dastik.Api.Features.Caja.CerrarTurno;

public class CerrarTurnoCommandValidator : AbstractValidator<CerrarTurnoCommand>
{
    public CerrarTurnoCommandValidator()
    {
        RuleFor(x => x.TurnoId)
            .GreaterThan(0)
            .WithMessage("El identificador del turno es obligatorio y debe ser mayor a 0.");

        RuleFor(x => x.SaldoFinal)
            .GreaterThanOrEqualTo(0)
            .WithMessage("El saldo final reportado en el arqueo no puede ser negativo.");
    }
}
