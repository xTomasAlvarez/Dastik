using Dastik.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dastik.Api.Infrastructure.Persistence.Configurations;

public class ProductoConfiguration : IEntityTypeConfiguration<Producto>
{
    public void Configure(EntityTypeBuilder<Producto> builder)
    {
        builder.ToTable("Productos");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Descripcion).IsRequired().HasDefaultValue("").HasMaxLength(1000);
        builder.Property(p => p.ImagenUrl).IsRequired().HasDefaultValue("").HasMaxLength(500);
        builder.Property(p => p.ImagenesJson).IsRequired().HasDefaultValue("[]");
        builder.Property(p => p.VideoUrl).IsRequired().HasDefaultValue("");
        builder.Property(p => p.EsFisico).IsRequired().HasDefaultValue(true);
        builder.Property(p => p.SubcategoriasJson).IsRequired().HasDefaultValue("[]");
        builder.Property(p => p.DestacadosJson).IsRequired().HasDefaultValue("[]");
        builder.Property(p => p.TagsSeo).IsRequired().HasDefaultValue("");
        builder.Property(p => p.SeoTitulo).IsRequired().HasDefaultValue("");
        builder.Property(p => p.SeoDescripcion).IsRequired().HasDefaultValue("");

        // Tipos de datos financieros estrictos decimal(18,2)
        builder.Property(p => p.CostoBase).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(p => p.MarkupAplicado).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(p => p.PrecioVenta).HasColumnType("decimal(18,2)").IsRequired();

        builder.Property(p => p.TiendanubeProductId).HasMaxLength(50);
        builder.Property(p => p.Activo).IsRequired();

        // Relaciones
        builder.HasOne(p => p.UnidadNegocio)
            .WithMany(u => u.Productos)
            .HasForeignKey(p => p.UnidadNegocioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Categoria)
            .WithMany(c => c.Productos)
            .HasForeignKey(p => p.CategoriaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Marca)
            .WithMany(m => m.Productos)
            .HasForeignKey(p => p.MarcaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Proveedor)
            .WithMany(pr => pr.Productos)
            .HasForeignKey(p => p.ProveedorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
