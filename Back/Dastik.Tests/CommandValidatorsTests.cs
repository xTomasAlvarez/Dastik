using Dastik.Api.Domain.Entities;
using Dastik.Api.Features.Caja.AbrirTurno;
using Dastik.Api.Features.Caja.CerrarTurno;
using Dastik.Api.Features.Caja.CobrarOrden;
using Dastik.Api.Features.Inventario.CrearProducto;
using FluentAssertions;
using Xunit;

namespace Dastik.Tests;

public class CommandValidatorsTests
{
    // ==========================================
    // 1. CrearProductoCommandValidator (Fase 2)
    // ==========================================
    [Fact]
    public void CrearProductoValidator_ConCamposInvalidos_DebeRetornarErrores()
    {
        // Arrange
        var validator = new CrearProductoCommandValidator();
        var commandInvalido = new CrearProductoCommand(
            UnidadNegocioId: 0, // Invalido
            CategoriaId: -1,    // Invalido
            MarcaId: 0,        // Invalido
            ProveedorId: 0,    // Invalido
            Nombre: "",        // Vacio
            Descripcion: "Desc",
            ImagenUrl: "http://img.jpg",
            CostoBase: -500m,  // Negativo
            MarkupAplicado: 1.5m,
            PrecioVenta: 0m,   // Debe ser > 0
            Variantes: new List<CrearVarianteItemDto>() // Sin variantes
        );

        // Act
        var result = validator.Validate(commandInvalido);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName.Contains("UnidadNegocioId"));
        result.Errors.Should().Contain(e => e.PropertyName.Contains("CategoriaId"));
        result.Errors.Should().Contain(e => e.PropertyName.Contains("MarcaId"));
        result.Errors.Should().Contain(e => e.PropertyName.Contains("ProveedorId"));
        result.Errors.Should().Contain(e => e.PropertyName.Contains("Nombre"));
        result.Errors.Should().Contain(e => e.PropertyName.Contains("CostoBase"));
        result.Errors.Should().Contain(e => e.PropertyName.Contains("PrecioVenta"));
        result.Errors.Should().Contain(e => e.PropertyName.Contains("Variantes"));
    }

    [Fact]
    public void CrearProductoValidator_ConVarianteInvalida_DebeRetornarErrorEnVariante()
    {
        // Arrange
        var validator = new CrearProductoCommandValidator();
        var command = new CrearProductoCommand(
            UnidadNegocioId: 1,
            CategoriaId: 1,
            MarcaId: 1,
            ProveedorId: 1,
            Nombre: "Remera Oversize",
            Descripcion: "Algodon",
            ImagenUrl: "http://img.jpg",
            CostoBase: 10_000m,
            MarkupAplicado: 1.5m,
            PrecioVenta: 15_000m,
            Variantes: new List<CrearVarianteItemDto>
            {
                new(Talle: "", Color: "Negro", CodigoBarras: null, StockFisico: -1) // Talle vacio y Stock negativo
            }
        );

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName.Contains("Talle"));
        result.Errors.Should().Contain(e => e.PropertyName.Contains("StockFisico"));
    }

    // ==========================================
    // 2. AbrirTurnoCommandValidator (Fase 3)
    // ==========================================
    [Theory]
    [InlineData(0, 5000, "EmpleadoId")]
    [InlineData(-1, 5000, "EmpleadoId")]
    [InlineData(1, -100, "SaldoInicial")]
    public void AbrirTurnoValidator_ConParametrosInvalidos_DebeFallar(int empleadoId, decimal saldoInicial, string propiedadEsperada)
    {
        // Arrange
        var validator = new AbrirTurnoCommandValidator();
        var command = new AbrirTurnoCommand(empleadoId, saldoInicial);

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == propiedadEsperada);
    }

    [Fact]
    public void AbrirTurnoValidator_ConParametrosValidos_DebeAprobar()
    {
        var validator = new AbrirTurnoCommandValidator();
        var command = new AbrirTurnoCommand(1, 0.00m); // Saldo inicial 0 es válido

        var result = validator.Validate(command);
        result.IsValid.Should().BeTrue();
    }

    // ==========================================
    // 3. CerrarTurnoCommandValidator (Fase 3)
    // ==========================================
    [Theory]
    [InlineData(0, 10000, "TurnoId")]
    [InlineData(1, -1, "SaldoFinal")]
    public void CerrarTurnoValidator_ConParametrosInvalidos_DebeFallar(int turnoId, decimal saldoFinal, string propiedadEsperada)
    {
        var validator = new CerrarTurnoCommandValidator();
        var command = new CerrarTurnoCommand(turnoId, saldoFinal);

        var result = validator.Validate(command);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == propiedadEsperada);
    }

    // ==========================================
    // 4. CobrarOrdenCommandValidator (Fase 3)
    // ==========================================
    [Fact]
    public void CobrarOrdenValidator_CuandoSumaPagosDifiereDeSubtotales_DebeFallar()
    {
        // Arrange: 2 items de $10.000 = $20.000, pero se pagan $15.000
        var validator = new CobrarOrdenCommandValidator();
        var command = new CobrarOrdenCommand(
            TurnoId: 1,
            Items: new List<ItemCobroDto> { new(VarianteId: 1, Cantidad: 2, PrecioUnitario: 10_000m) },
            Pagos: new List<PagoCobroDto> { new(MetodoPago.Efectivo, 15_000m) }
        );

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("coincidir exactamente"));
    }

    [Fact]
    public void CobrarOrdenValidator_ConItemsYPagosValidos_DebeAprobar()
    {
        // Arrange: 1 item de $50.000 pagado mitad efectivo y mitad tarjeta
        var validator = new CobrarOrdenCommandValidator();
        var command = new CobrarOrdenCommand(
            TurnoId: 1,
            Items: new List<ItemCobroDto> { new(VarianteId: 10, Cantidad: 1, PrecioUnitario: 50_000m) },
            Pagos: new List<PagoCobroDto>
            {
                new(MetodoPago.Efectivo, 25_000m),
                new(MetodoPago.Tarjeta, 25_000m)
            }
        );

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }
}
