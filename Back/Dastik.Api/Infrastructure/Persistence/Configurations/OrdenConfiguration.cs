using Dastik.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dastik.Api.Infrastructure.Persistence.Configurations;

public class OrdenConfiguration : IEntityTypeConfiguration<Orden>
{
    public void Configure(EntityTypeBuilder<Orden> builder)
    {
        builder.ToTable("Ordenes");
        builder.HasKey(o => o.Id);

        builder.Property(o => o.TurnoId).IsRequired();
        builder.Property(o => o.Fecha).IsRequired();

        // Tipos de datos financieros estrictos decimal(18,2)
        builder.Property(o => o.Total).HasColumnType("decimal(18,2)").IsRequired();

        builder.Property(o => o.Estado).HasConversion<int>().IsRequired();
        builder.Property(o => o.EsCambio).HasDefaultValue(false);
        builder.Property(o => o.MotivoCambio).HasMaxLength(500);
        builder.Property(o => o.OrdenOrigenId).IsRequired(false);

        // Relaciones
        builder.HasOne(o => o.Turno)
            .WithMany(t => t.Ordenes)
            .HasForeignKey(o => o.TurnoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.Detalles)
            .WithOne(d => d.Orden)
            .HasForeignKey(d => d.OrdenId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.Pagos)
            .WithOne(p => p.Orden)
            .HasForeignKey(p => p.OrdenId)
            .OnDelete(DeleteBehavior.Cascade);

        // Índices
        builder.HasIndex(o => o.TurnoId);
        builder.HasIndex(o => o.Fecha);
    }
}
