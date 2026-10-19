using Dastik.Api.Domain.Entities;
using Dastik.Api.Features.Configuracion;
using Dastik.Api.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Dastik.Tests;

public class ConfiguracionEndpointsTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;

    public ConfiguracionEndpointsTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task CrearYListarProveedores_DeberiaPersistirNombreYMarkupPorDefecto()
    {
        // Arrange
        var prov1 = new Proveedor { Nombre = "Taller Textil Sur", MarkupPorDefecto = 55m };
        var prov2 = new Proveedor { Nombre = "Importadora Sneakers", MarkupPorDefecto = 60m };

        _context.Proveedores.AddRange(prov1, prov2);
        await _context.SaveChangesAsync();

        // Act
        var proveedores = await _context.Proveedores
            .AsNoTracking()
            .OrderBy(p => p.Nombre)
            .Select(p => new ProveedorResponse(
                p.Id,
                p.Nombre,
                p.MarkupPorDefecto,
                p.Productos.Count(prod => prod.Activo)
            ))
            .ToListAsync();

        // Assert
        proveedores.Should().HaveCount(2);
        proveedores.Should().Contain(p => p.Nombre == "Taller Textil Sur" && p.MarkupPorDefecto == 55m);
        proveedores.Should().Contain(p => p.Nombre == "Importadora Sneakers" && p.MarkupPorDefecto == 60m);
    }

    [Fact]
    public async Task CrearYListarMarcas_DeberiaPersistirMarcasOrdenadasAlfabeticamente()
    {
        // Arrange
        var m1 = new Marca { Nombre = "Nike" };
        var m2 = new Marca { Nombre = "Dastik" };
        var m3 = new Marca { Nombre = "Hidden Sneakers" };

        _context.Marcas.AddRange(m1, m2, m3);
        await _context.SaveChangesAsync();

        // Act
        var marcas = await _context.Marcas
            .AsNoTracking()
            .OrderBy(m => m.Nombre)
            .Select(m => new MarcaResponse(
                m.Id,
                m.Nombre,
                m.Productos.Count(prod => prod.Activo)
            ))
            .ToListAsync();

        // Assert
        marcas.Should().HaveCount(3);
        marcas[0].Nombre.Should().Be("Dastik");
        marcas[1].Nombre.Should().Be("Hidden Sneakers");
        marcas[2].Nombre.Should().Be("Nike");
    }

    [Fact]
    public async Task CrearYListarCategorias_DeberiaPersistirTemporadaYEsquemaDeTalles()
    {
        // Arrange
        var cat1 = new Categoria
        {
            Nombre = "Remeras Oversize",
            Temporada = "Verano 2026",
            EsquemaTalles = "XS-XL"
        };
        var cat2 = new Categoria
        {
            Nombre = "Pantalones Cargo",
            Temporada = "Invierno 2026",
            EsquemaTalles = "36-50"
        };

        _context.Categorias.AddRange(cat1, cat2);
        await _context.SaveChangesAsync();

        // Act
        var categorias = await _context.Categorias
            .AsNoTracking()
            .OrderBy(c => c.Nombre)
            .Select(c => new CategoriaResponse(
                c.Id,
                c.Nombre,
                c.Temporada,
                c.EsquemaTalles,
                c.CategoriaPadreId,
                c.Productos.Count(prod => prod.Activo)
            ))
            .ToListAsync();

        // Assert
        categorias.Should().HaveCount(2);
        categorias.Should().Contain(c => c.Nombre == "Remeras Oversize" && c.Temporada == "Verano 2026" && c.EsquemaTalles == "XS-XL");
        categorias.Should().Contain(c => c.Nombre == "Pantalones Cargo" && c.Temporada == "Invierno 2026" && c.EsquemaTalles == "36-50");
    }
}
