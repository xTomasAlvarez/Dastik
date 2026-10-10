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
        builder.Property(p => p.Descripcion).HasMaxLength(1000);
        builder.Property(p => p.ImagenUrl).HasMaxLength(500);

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
