using FluentValidation;

namespace Dastik.Api.Features.Auth.Login;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public const string EmailRequerido = "El correo electrónico es requerido.";
    public const string EmailInvalido = "El formato del correo electrónico no es válido.";
    public const string PasswordRequerido = "La contraseña es requerida.";

    public LoginCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage(EmailRequerido)
            .EmailAddress().WithMessage(EmailInvalido);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage(PasswordRequerido);
    }
}
