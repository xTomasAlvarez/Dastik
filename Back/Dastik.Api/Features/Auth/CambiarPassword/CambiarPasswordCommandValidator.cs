using FluentValidation;

namespace Dastik.Api.Features.Auth.CambiarPassword;

public class CambiarPasswordCommandValidator : AbstractValidator<CambiarPasswordCommand>
{
    public const string UsuarioIdInvalido = "El identificador de usuario es inválido.";
    public const string PasswordActualRequerido = "La contraseña actual es requerida.";
    public const string PasswordNuevoRequerido = "La nueva contraseña es requerida.";
    public const string MinimoCaracteres = "La nueva contraseña debe tener al menos 8 caracteres.";
    public const string RequiereMayuscula = "La nueva contraseña debe contener al menos una letra mayúscula.";
    public const string RequiereMinuscula = "La nueva contraseña debe contener al menos una letra minúscula.";
    public const string RequiereNumero = "La nueva contraseña debe contener al menos un número.";
    public const string RequiereCaracterEspecial = "La nueva contraseña debe contener al menos un caracter especial (!@#$%^&*._-).";
    public const string PasswordIgualAAnterior = "La nueva contraseña no puede ser igual a la contraseña actual ni provisoria.";

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
            .Matches(@"[a-z]").WithMessage(RequiereMinuscula)
            .Matches(@"[0-9]").WithMessage(RequiereNumero)
            .Matches(@"[!@#$%^&*._\-]").WithMessage(RequiereCaracterEspecial)
            .Must((cmd, nuevo) => nuevo != cmd.PasswordActual && nuevo != "Dastik2026!").WithMessage(PasswordIgualAAnterior);
    }
}
