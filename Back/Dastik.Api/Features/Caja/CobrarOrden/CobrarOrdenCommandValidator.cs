using FluentValidation;

namespace Dastik.Api.Features.Caja.CobrarOrden;

public class CobrarOrdenCommandValidator : AbstractValidator<CobrarOrdenCommand>
{
    public CobrarOrdenCommandValidator()
    {
        RuleFor(x => x.TurnoId)
            .GreaterThan(0)
            .WithMessage("El identificador del turno es obligatorio y debe ser mayor a 0.");

        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage("La orden debe contener al menos un producto a cobrar.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.VarianteId)
                .GreaterThan(0)
                .WithMessage("El identificador de la variante es inválido.");

            item.RuleFor(i => i.Cantidad)
                .GreaterThan(0)
                .WithMessage("La cantidad vendida debe ser mayor a 0.");

            item.RuleFor(i => i.PrecioUnitario)
                .GreaterThan(0)
                .WithMessage("El precio unitario debe ser mayor a 0.");
        });

        RuleFor(x => x.Pagos)
            .NotEmpty()
            .WithMessage("Debe registrar al menos un método de pago.");

        RuleForEach(x => x.Pagos).ChildRules(pago =>
        {
            pago.RuleFor(p => p.Monto)
                .GreaterThan(0)
                .WithMessage("El monto de cada pago debe ser mayor a 0.");

            pago.RuleFor(p => p.MetodoPago)
                .IsInEnum()
                .WithMessage("El método de pago es inválido.");
        });

        RuleFor(x => x)
            .Must(cmd =>
            {
                if (cmd.Items == null || cmd.Pagos == null) return false;
                decimal totalItems = cmd.Items.Sum(i => i.Cantidad * i.PrecioUnitario);
                decimal totalPagos = cmd.Pagos.Sum(p => p.Monto);
                return totalItems == totalPagos;
            })
            .WithMessage("La suma de los pagos debe coincidir exactamente con la suma de los subtotales de los ítems.");
    }
}
