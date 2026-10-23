using Dastik.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dastik.Api.Infrastructure.Persistence.Configurations;

public class MovimientoStockConfiguration : IEntityTypeConfiguration<MovimientoStock>
{
    public void Configure(EntityTypeBuilder<MovimientoStock> builder)
    {
        builder.ToTable("MovimientosStock");
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Motivo)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(m => m.Tipo)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(m => m.FechaUtc)
            .IsRequired();

        builder.HasOne(m => m.Variante)
            .WithMany()
            .HasForeignKey(m => m.VarianteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.Orden)
            .WithMany()
            .HasForeignKey(m => m.OrdenId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(m => m.Turno)
            .WithMany()
            .HasForeignKey(m => m.TurnoId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
