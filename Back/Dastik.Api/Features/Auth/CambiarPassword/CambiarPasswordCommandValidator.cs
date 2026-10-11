using FluentValidation;

namespace Dastik.Api.Features.Auth.CambiarPassword;

public class CambiarPasswordCommandValidator : AbstractValidator<CambiarPasswordCommand>
{
    public const string UsuarioIdInvalido = "El identificador de usuario es inválido.";
    public const string PasswordActualRequerido = "La contraseña actual es requerida.";
    public const string PasswordNuevoRequerido = "La nueva contraseña es requerida.";
    public const string MinimoCaracteres = "La nueva contraseña debe tener al menos 8 caracteres.";
    public const string RequiereMayuscula = "La nueva contraseña debe contener al menos una letra mayúscula.";
    public const string RequiereNumero = "La nueva contraseña debe contener al menos un número.";
    public const string PasswordIgualAAnterior = "La nueva contraseña no puede ser igual a la contraseña actual.";

    public CambiarPasswordCommandValidator()
    {
        RuleFor(x => x.UsuarioId)
            .GreaterThan(0).WithMessage(UsuarioIdInvalido);

        RuleFor(x => x.PasswordActual)
            .NotEmpty().WithMessage(PasswordActualRequerido);

        RuleFor(x => x.PasswordNuevo)
            .NotEmpty().WithMessage(PasswordNuevoRequerido)
            .MinimumLength(8).WithMessage(MinimoCaracteres)
            .Matches(@"[A-Z]").WithMessage(RequiereMayuscula)
            .Matches(@"[0-9]").WithMessage(RequiereNumero)
            .Must((cmd, nuevo) => nuevo != cmd.PasswordActual).WithMessage(PasswordIgualAAnterior);
    }
}
