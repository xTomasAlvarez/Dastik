using Dastik.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dastik.Api.Infrastructure.Persistence.Configurations;

public class TurnoConfiguration : IEntityTypeConfiguration<Turno>
{
    public void Configure(EntityTypeBuilder<Turno> builder)
    {
        builder.ToTable("Turnos");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.EmpleadoId).IsRequired();
        builder.Property(t => t.FechaApertura).IsRequired();
        builder.Property(t => t.FechaCierre);

        // Tipos de datos financieros estrictos decimal(18,2)
        builder.Property(t => t.SaldoInicial).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(t => t.SaldoFinal).HasColumnType("decimal(18,2)");

        builder.Property(t => t.Estado).HasConversion<int>().IsRequired();

        // Relaciones
        builder.HasMany(t => t.Ordenes)
            .WithOne(o => o.Turno)
            .HasForeignKey(o => o.TurnoId)
            .OnDelete(DeleteBehavior.Restrict);

        // Índices
        builder.HasIndex(t => t.EmpleadoId);
        builder.HasIndex(t => t.FechaApertura);
    }
}
