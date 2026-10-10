using Dastik.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dastik.Api.Infrastructure.Persistence.Configurations;

public class VarianteConfiguration : IEntityTypeConfiguration<Variante>
{
    public void Configure(EntityTypeBuilder<Variante> builder)
    {
        builder.ToTable("Variantes");
        builder.HasKey(v => v.Id);

        // Regla: Talle es string puro
        builder.Property(v => v.Talle).IsRequired().HasMaxLength(20);
        builder.Property(v => v.Color).HasMaxLength(50);
        builder.Property(v => v.CodigoBarras).HasMaxLength(100);
        builder.Property(v => v.EsCodigoGenerado).IsRequired();
        builder.Property(v => v.StockFisico).IsRequired();
        builder.Property(v => v.TiendanubeVariantId).HasMaxLength(50);

        // Relación Producto -> Variantes (Cascada)
        builder.HasOne(v => v.Producto)
            .WithMany(p => p.Variantes)
            .HasForeignKey(v => v.ProductoId)
            .OnDelete(DeleteBehavior.Cascade);

        // Índice para búsqueda ágil de Código de Barras
        builder.HasIndex(v => v.CodigoBarras);
    }
}
