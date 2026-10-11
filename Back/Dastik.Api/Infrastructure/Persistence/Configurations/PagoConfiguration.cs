using Dastik.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dastik.Api.Infrastructure.Persistence.Configurations;

public class PagoConfiguration : IEntityTypeConfiguration<Pago>
{
    public void Configure(EntityTypeBuilder<Pago> builder)
    {
        builder.ToTable("Pagos");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.OrdenId).IsRequired();
        builder.Property(p => p.MetodoPago).HasConversion<int>().IsRequired();

        // Tipos de datos financieros estrictos decimal(18,2)
        builder.Property(p => p.Monto).HasColumnType("decimal(18,2)").IsRequired();

        // Relaciones
        builder.HasOne(p => p.Orden)
            .WithMany(o => o.Pagos)
            .HasForeignKey(p => p.OrdenId)
            .OnDelete(DeleteBehavior.Cascade);

        // Índices
        builder.HasIndex(p => p.OrdenId);
    }
}
