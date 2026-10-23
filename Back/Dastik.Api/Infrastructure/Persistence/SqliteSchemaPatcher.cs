using System.Data;
using System.Data.Common;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Infrastructure.Persistence;

/// <summary>
/// Sincronizador no destructivo de esquema SQLite para Producción (dastik_dev.db) y Sandbox (dastik_sandbox_dev.db).
/// Garantiza que tablas y columnas agregadas evolutivamente existan sin borrar datos ni requerir recrear la base.
/// </summary>
public static class SqliteSchemaPatcher
{
    private sealed record ColumnPatch(string Table, string Column, string DefinitionSql);

    private static readonly string[] CreateTableStatements =
    [
        """
        CREATE TABLE IF NOT EXISTS "Usuarios" (
            "Id" INTEGER NOT NULL CONSTRAINT "PK_Usuarios" PRIMARY KEY AUTOINCREMENT,
            "Nombre" TEXT NOT NULL,
            "Email" TEXT NOT NULL,
            "PasswordHash" TEXT NOT NULL,
            "Rol" INTEGER NOT NULL,
            "DebeCambiarPassword" INTEGER NOT NULL DEFAULT 1,
            "Activo" INTEGER NOT NULL DEFAULT 1,
            "TurnoAsignado" TEXT NOT NULL DEFAULT 'Completo',
            "TarifaPorHora" TEXT NOT NULL DEFAULT '0',
            "FechaCreacion" TEXT NOT NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS "UnidadesNegocio" (
            "Id" INTEGER NOT NULL CONSTRAINT "PK_UnidadesNegocio" PRIMARY KEY AUTOINCREMENT,
            "Nombre" TEXT NOT NULL,
            "TieneTiendaNube" INTEGER NOT NULL DEFAULT 0,
            "TiendanubeStoreId" TEXT NULL,
            "TiendanubeAccessToken" TEXT NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS "Categorias" (
            "Id" INTEGER NOT NULL CONSTRAINT "PK_Categorias" PRIMARY KEY AUTOINCREMENT,
            "CategoriaPadreId" INTEGER NULL,
            "Nombre" TEXT NOT NULL,
            "Temporada" TEXT NOT NULL DEFAULT '',
            "EsquemaTalles" TEXT NOT NULL DEFAULT '',
            "TiendanubeCategoriaId" TEXT NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS "Marcas" (
            "Id" INTEGER NOT NULL CONSTRAINT "PK_Marcas" PRIMARY KEY AUTOINCREMENT,
            "Nombre" TEXT NOT NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS "Proveedores" (
            "Id" INTEGER NOT NULL CONSTRAINT "PK_Proveedores" PRIMARY KEY AUTOINCREMENT,
            "Nombre" TEXT NOT NULL,
            "MarkupPorDefecto" TEXT NOT NULL DEFAULT '0'
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS "Productos" (
            "Id" INTEGER NOT NULL CONSTRAINT "PK_Productos" PRIMARY KEY AUTOINCREMENT,
            "UnidadNegocioId" INTEGER NOT NULL,
            "CategoriaId" INTEGER NOT NULL,
            "MarcaId" INTEGER NOT NULL,
            "ProveedorId" INTEGER NOT NULL,
            "Nombre" TEXT NOT NULL,
            "Descripcion" TEXT NOT NULL DEFAULT '',
            "ImagenUrl" TEXT NOT NULL DEFAULT '',
            "ImagenesJson" TEXT NOT NULL DEFAULT '[]',
            "CostoBase" TEXT NOT NULL DEFAULT '0',
            "MarkupAplicado" TEXT NOT NULL DEFAULT '0',
            "PrecioVenta" TEXT NOT NULL DEFAULT '0',
            "TiendanubeProductId" TEXT NULL,
            "Activo" INTEGER NOT NULL DEFAULT 1,
            "VideoUrl" TEXT NULL,
            "EsFisico" INTEGER NOT NULL DEFAULT 1,
            "SubcategoriasJson" TEXT NOT NULL DEFAULT '[]',
            "DestacadosJson" TEXT NOT NULL DEFAULT '[]',
            "TagsSeo" TEXT NULL,
            "SeoTitulo" TEXT NULL,
            "SeoDescripcion" TEXT NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS "Variantes" (
            "Id" INTEGER NOT NULL CONSTRAINT "PK_Variantes" PRIMARY KEY AUTOINCREMENT,
            "ProductoId" INTEGER NOT NULL,
            "Talle" TEXT NOT NULL DEFAULT '',
            "Color" TEXT NOT NULL DEFAULT '',
            "CodigoBarras" TEXT NOT NULL DEFAULT '',
            "EsCodigoGenerado" INTEGER NOT NULL DEFAULT 0,
            "StockFisico" INTEGER NOT NULL DEFAULT 0,
            "TiendanubeVariantId" TEXT NULL,
            "PrecioPromocional" TEXT NULL,
            "PesoKg" TEXT NOT NULL DEFAULT '0.500',
            "PrecioOverride" TEXT NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS "Turnos" (
            "Id" INTEGER NOT NULL CONSTRAINT "PK_Turnos" PRIMARY KEY AUTOINCREMENT,
            "EmpleadoId" INTEGER NOT NULL,
            "FechaApertura" TEXT NOT NULL,
            "FechaCierre" TEXT NULL,
            "SaldoInicial" TEXT NOT NULL DEFAULT '0',
            "SaldoFinal" TEXT NULL,
            "GastosTurno" TEXT NOT NULL DEFAULT '0',
            "Estado" TEXT NOT NULL DEFAULT 'Abierto'
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS "Ordenes" (
            "Id" INTEGER NOT NULL CONSTRAINT "PK_Ordenes" PRIMARY KEY AUTOINCREMENT,
            "TurnoId" INTEGER NOT NULL,
            "FechaCreacion" TEXT NOT NULL,
            "Total" TEXT NOT NULL DEFAULT '0',
            "DescuentoTotal" TEXT NOT NULL DEFAULT '0',
            "EsCambio" INTEGER NOT NULL DEFAULT 0,
            "MotivoCambio" TEXT NULL,
            "Estado" TEXT NOT NULL DEFAULT 'Pagada'
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS "DetallesOrden" (
            "Id" INTEGER NOT NULL CONSTRAINT "PK_DetallesOrden" PRIMARY KEY AUTOINCREMENT,
            "OrdenId" INTEGER NOT NULL,
            "VarianteId" INTEGER NOT NULL,
            "Cantidad" INTEGER NOT NULL,
            "PrecioUnitario" TEXT NOT NULL DEFAULT '0',
            "Subtotal" TEXT NOT NULL DEFAULT '0'
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS "Pagos" (
            "Id" INTEGER NOT NULL CONSTRAINT "PK_Pagos" PRIMARY KEY AUTOINCREMENT,
            "OrdenId" INTEGER NOT NULL,
            "MetodoPago" TEXT NOT NULL,
            "Monto" TEXT NOT NULL DEFAULT '0'
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS "OutboxMessages" (
            "Id" TEXT NOT NULL CONSTRAINT "PK_OutboxMessages" PRIMARY KEY,
            "TipoEvento" TEXT NOT NULL,
            "ContenidoJson" TEXT NOT NULL,
            "FechaOcurrenciaUtc" TEXT NOT NULL,
            "FechaProcesadoUtc" TEXT NULL,
            "Error" TEXT NULL,
            "Intentos" INTEGER NOT NULL DEFAULT 0
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS "Gastos" (
            "Id" INTEGER NOT NULL CONSTRAINT "PK_Gastos" PRIMARY KEY AUTOINCREMENT,
            "Descripcion" TEXT NOT NULL,
            "Monto" TEXT NOT NULL DEFAULT '0',
            "Moneda" TEXT NOT NULL DEFAULT 'ARS',
            "MontoMonedaOriginal" TEXT NOT NULL DEFAULT '0',
            "TipoCambioAplicado" TEXT NULL,
            "TipoDolar" TEXT NULL,
            "Categoria" TEXT NOT NULL DEFAULT 'General',
            "Fecha" TEXT NOT NULL,
            "TurnoId" INTEGER NULL,
            "UsuarioId" INTEGER NOT NULL,
            "Activo" INTEGER NOT NULL DEFAULT 1
        );
        """,
    ];

    private static readonly ColumnPatch[] ColumnPatches =
    [
        // Ordenes
        new("Ordenes", "EsCambio", "INTEGER NOT NULL DEFAULT 0"),
        new("Ordenes", "MotivoCambio", "TEXT NULL"),
        new("Ordenes", "Estado", "TEXT NOT NULL DEFAULT 'Pagada'"),

        // Turnos
        new("Turnos", "GastosTurno", "TEXT NOT NULL DEFAULT '0'"),
        new("Turnos", "SaldoFinal", "TEXT NULL"),
        new("Turnos", "FechaCierre", "TEXT NULL"),
        new("Turnos", "Estado", "TEXT NOT NULL DEFAULT 'Abierto'"),

        // Usuarios
        new("Usuarios", "TurnoAsignado", "TEXT NOT NULL DEFAULT 'Completo'"),
        new("Usuarios", "TarifaPorHora", "TEXT NOT NULL DEFAULT '0'"),
        new("Usuarios", "DebeCambiarPassword", "INTEGER NOT NULL DEFAULT 1"),
        new("Usuarios", "Activo", "INTEGER NOT NULL DEFAULT 1"),
        new("Usuarios", "FechaCreacion", "TEXT NOT NULL DEFAULT '2026-01-01T00:00:00Z'"),
        new("Usuarios", "PinRecuperacionHash", "TEXT NULL"),
        new("Usuarios", "PinRecuperacionExpira", "TEXT NULL"),

        // Gastos
        new("Gastos", "Moneda", "TEXT NOT NULL DEFAULT 'ARS'"),
        new("Gastos", "MontoMonedaOriginal", "TEXT NOT NULL DEFAULT '0'"),
        new("Gastos", "TipoCambioAplicado", "TEXT NULL"),
        new("Gastos", "TipoDolar", "TEXT NULL"),
        new("Gastos", "Categoria", "TEXT NOT NULL DEFAULT 'General'"),
        new("Gastos", "Activo", "INTEGER NOT NULL DEFAULT 1"),

        // Proveedores
        new("Proveedores", "MarkupPorDefecto", "TEXT NOT NULL DEFAULT '0'"),

        // Productos
        new("Productos", "Descripcion", "TEXT NOT NULL DEFAULT ''"),
        new("Productos", "ImagenUrl", "TEXT NOT NULL DEFAULT ''"),
        new("Productos", "ImagenesJson", "TEXT NOT NULL DEFAULT '[]'"),
        new("Productos", "CostoBase", "TEXT NOT NULL DEFAULT '0'"),
        new("Productos", "MarkupAplicado", "TEXT NOT NULL DEFAULT '0'"),
        new("Productos", "PrecioVenta", "TEXT NOT NULL DEFAULT '0'"),
        new("Productos", "TiendanubeProductId", "TEXT NULL"),
        new("Productos", "Activo", "INTEGER NOT NULL DEFAULT 1"),
        new("Productos", "VideoUrl", "TEXT NULL"),
        new("Productos", "EsFisico", "INTEGER NOT NULL DEFAULT 1"),
        new("Productos", "SubcategoriasJson", "TEXT NOT NULL DEFAULT '[]'"),
        new("Productos", "DestacadosJson", "TEXT NOT NULL DEFAULT '[]'"),
        new("Productos", "TagsSeo", "TEXT NULL"),
        new("Productos", "SeoTitulo", "TEXT NULL"),
        new("Productos", "SeoDescripcion", "TEXT NULL"),

        // Variantes
        new("Variantes", "Talle", "TEXT NOT NULL DEFAULT ''"),
        new("Variantes", "Color", "TEXT NOT NULL DEFAULT ''"),
        new("Variantes", "CodigoBarras", "TEXT NOT NULL DEFAULT ''"),
        new("Variantes", "EsCodigoGenerado", "INTEGER NOT NULL DEFAULT 0"),
        new("Variantes", "StockFisico", "INTEGER NOT NULL DEFAULT 0"),
        new("Variantes", "TiendanubeVariantId", "TEXT NULL"),
        new("Variantes", "PrecioPromocional", "TEXT NULL"),
        new("Variantes", "PesoKg", "TEXT NOT NULL DEFAULT '0.500'"),
        new("Variantes", "PrecioOverride", "TEXT NULL"),

        // Categorias
        new("Categorias", "CategoriaPadreId", "INTEGER NULL"),
        new("Categorias", "Temporada", "TEXT NOT NULL DEFAULT ''"),
        new("Categorias", "EsquemaTalles", "TEXT NOT NULL DEFAULT ''"),
        new("Categorias", "TiendanubeCategoriaId", "TEXT NULL"),

        // UnidadesNegocio
        new("UnidadesNegocio", "TieneTiendaNube", "INTEGER NOT NULL DEFAULT 0"),
        new("UnidadesNegocio", "TiendanubeStoreId", "TEXT NULL"),
        new("UnidadesNegocio", "TiendanubeAccessToken", "TEXT NULL"),

        // OutboxMessages
        new("OutboxMessages", "FechaProcesadoUtc", "TEXT NULL"),
        new("OutboxMessages", "Error", "TEXT NULL"),
        new("OutboxMessages", "Intentos", "INTEGER NOT NULL DEFAULT 0")
    ];

    public static async Task EnsureSchemaUpdatedAsync(AppDbContext context, CancellationToken cancellationToken = default)
    {
        if (!context.Database.IsSqlite())
        {
            return;
        }

        var connection = context.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;

        if (shouldClose)
        {
            await connection.OpenAsync(cancellationToken);
        }

        try
        {
            // 1. Asegurar que todas las tablas base existan
            foreach (var createSql in CreateTableStatements)
            {
                await ExecuteNonQueryAsync(connection, createSql, cancellationToken);
            }

            // 2. Inspeccionar columnas actuales por tabla mediante PRAGMA table_info
            var columnsByTable = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);

            foreach (var patch in ColumnPatches)
            {
                if (!columnsByTable.TryGetValue(patch.Table, out var existingColumns))
                {
                    existingColumns = await GetExistingColumnsAsync(connection, patch.Table, cancellationToken);
                    columnsByTable[patch.Table] = existingColumns;
                }

                if (!existingColumns.Contains(patch.Column))
                {
                    var alterSql = $"ALTER TABLE \"{patch.Table}\" ADD COLUMN \"{patch.Column}\" {patch.DefinitionSql};";
                    await ExecuteNonQueryAsync(connection, alterSql, cancellationToken);
                    existingColumns.Add(patch.Column);
                }
            }
            // 3. Parche de datos: migración de alias histórico 'Gordo' a 'Facundo'
            await ExecuteNonQueryAsync(
                connection,
                "UPDATE \"Ordenes\" SET \"MotivoCambio\" = REPLACE(\"MotivoCambio\", 'Gordo', 'Facundo') WHERE \"MotivoCambio\" LIKE '%Gordo%';",
                cancellationToken);
        }
        finally
        {
            if (shouldClose && connection.State == ConnectionState.Open)
            {
                await connection.CloseAsync();
            }
        }
    }

    private static async Task<HashSet<string>> GetExistingColumnsAsync(
        DbConnection connection,
        string tableName,
        CancellationToken cancellationToken)
    {
        var columns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        await using var command = connection.CreateCommand();
        command.CommandText = $"PRAGMA table_info(\"{tableName}\");";

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            // En SQLite PRAGMA table_info, la columna 1 ("name") es el nombre de la columna
            var columnName = reader.GetString(1);
            columns.Add(columnName);
        }

        return columns;
    }

    private static async Task ExecuteNonQueryAsync(
        DbConnection connection,
        string sql,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
