using FluentValidation;

namespace Dastik.Api.Features.Caja.RegistrarCambio;

public class RegistrarCambioCommandValidator : AbstractValidator<RegistrarCambioCommand>
{
    public RegistrarCambioCommandValidator()
    {
        RuleFor(x => x.TurnoId)
            .GreaterThan(0)
            .WithMessage("El ID del turno debe ser mayor a 0.");

        RuleFor(x => x.VarianteDevueltaId)
            .GreaterThan(0)
            .WithMessage("Debe especificar la variante que se devuelve.");

        RuleFor(x => x.CantidadDevuelta)
            .GreaterThan(0)
            .WithMessage("La cantidad devuelta debe ser mayor a 0.");

        RuleFor(x => x.VarianteNuevaId)
            .GreaterThan(0)
            .WithMessage("Debe especificar la nueva variante a llevar.");

        RuleFor(x => x.CantidadNueva)
            .GreaterThan(0)
            .WithMessage("La cantidad nueva debe ser mayor a 0.");

        RuleFor(x => x.MotivoCambio)
            .NotEmpty()
            .WithMessage("El motivo del cambio es obligatorio.");
    }
}
