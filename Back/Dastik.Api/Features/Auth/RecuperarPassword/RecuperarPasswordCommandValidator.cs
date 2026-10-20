using FluentValidation;

namespace Dastik.Api.Features.Auth.RecuperarPassword;

public class RecuperarPasswordCommandValidator : AbstractValidator<RecuperarPasswordCommand>
{
    public const string IdentificadorRequerido = "Ingresá tu usuario o email.";
    public const string ClaveMaestraRequerida = "La Llave Maestra del local es obligatoria.";
    public const string PasswordRequerida = "La nueva contraseña es obligatoria.";
    public const string MinimoCaracteres = "La nueva contraseña debe tener al menos 8 caracteres.";
    public const string RequiereMayuscula = "La nueva contraseña debe contener al menos una letra mayúscula.";
    public const string RequiereNumero = "La nueva contraseña debe contener al menos un número.";

    public RecuperarPasswordCommandValidator()
    {
        RuleFor(x => x.Identificador)
            .NotEmpty().WithMessage(IdentificadorRequerido);

        RuleFor(x => x.ClaveMaestra)
            .NotEmpty().WithMessage(ClaveMaestraRequerida);

        RuleFor(x => x.NuevaPassword)
            .NotEmpty().WithMessage(PasswordRequerida)
            .MinimumLength(8).WithMessage(MinimoCaracteres)
            .Matches(@"[A-Z]").WithMessage(RequiereMayuscula)
            .Matches(@"[0-9]").WithMessage(RequiereNumero);
    }
}
