using Dastik.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dastik.Api.Infrastructure.Persistence.Configurations;

public class DetalleOrdenConfiguration : IEntityTypeConfiguration<DetalleOrden>
{
    public void Configure(EntityTypeBuilder<DetalleOrden> builder)
    {
        builder.ToTable("DetallesOrden");
        builder.HasKey(d => d.Id);

        builder.Property(d => d.OrdenId).IsRequired();
        builder.Property(d => d.VarianteId).IsRequired();
        builder.Property(d => d.Cantidad).IsRequired();

        // Tipos de datos financieros estrictos decimal(18,2)
        builder.Property(d => d.PrecioUnitario).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(d => d.Subtotal).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(d => d.FueCambiado).IsRequired().HasDefaultValue(false);

        // Relaciones
        builder.HasOne(d => d.Orden)
            .WithMany(o => o.Detalles)
            .HasForeignKey(d => d.OrdenId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Variante)
            .WithMany()
            .HasForeignKey(d => d.VarianteId)
            .OnDelete(DeleteBehavior.Restrict);

        // Índices
        builder.HasIndex(d => d.OrdenId);
        builder.HasIndex(d => d.VarianteId);
    }
}
