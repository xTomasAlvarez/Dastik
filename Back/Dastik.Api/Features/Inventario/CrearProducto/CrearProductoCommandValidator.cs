using FluentValidation;

namespace Dastik.Api.Features.Inventario.CrearProducto;

public class CrearProductoCommandValidator : AbstractValidator<CrearProductoCommand>
{
    public CrearProductoCommandValidator()
    {
        RuleFor(x => x.UnidadNegocioId).GreaterThan(0).WithMessage("La Unidad de Negocio es obligatoria.");
        RuleFor(x => x.CategoriaId).GreaterThan(0).WithMessage("La Categoría es obligatoria.");
        RuleFor(x => x.MarcaId).GreaterThan(0).WithMessage("La Marca es obligatoria.");
        RuleFor(x => x.ProveedorId).GreaterThan(0).WithMessage("El Proveedor es obligatorio.");
        
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre del producto no puede estar vacío.")
            .MaximumLength(200);

        RuleFor(x => x.CostoBase).GreaterThanOrEqualTo(0).WithMessage("El costo base no puede ser negativo.");
        RuleFor(x => x.PrecioVenta).GreaterThan(0).WithMessage("El precio de venta debe ser mayor a 0.");

        RuleFor(x => x.Variantes)
            .NotEmpty().WithMessage("El producto debe contener al menos una variante de talle/color.");

        RuleForEach(x => x.Variantes).ChildRules(v =>
        {
            v.RuleFor(x => x.Talle).NotEmpty().WithMessage("El talle es obligatorio.");
            v.RuleFor(x => x.StockFisico).GreaterThanOrEqualTo(0).WithMessage("El stock no puede ser negativo.");
        });
    }
}
