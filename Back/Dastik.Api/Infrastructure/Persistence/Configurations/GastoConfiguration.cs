using Dastik.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dastik.Api.Infrastructure.Persistence.Configurations;

public class GastoConfiguration : IEntityTypeConfiguration<Gasto>
{
    public void Configure(EntityTypeBuilder<Gasto> builder)
    {
        builder.ToTable("Gastos");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.Descripcion)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(g => g.Monto)
            .IsRequired()
            .HasColumnType("decimal(18,2)")
            .HasDefaultValue(0m);

        builder.Property(g => g.Moneda)
            .IsRequired()
            .HasMaxLength(10)
            .HasDefaultValue("ARS");

        builder.Property(g => g.MontoMonedaOriginal)
            .IsRequired()
            .HasColumnType("decimal(18,2)")
            .HasDefaultValue(0m);

        builder.Property(g => g.TipoCambioAplicado)
            .HasColumnType("decimal(18,2)")
            .IsRequired(false);

        builder.Property(g => g.TipoDolar)
            .HasMaxLength(20)
            .IsRequired(false);

        builder.Property(g => g.Categoria)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("General");

        builder.Property(g => g.Fecha)
            .IsRequired();

        builder.Property(g => g.TurnoId)
            .IsRequired(false);

        builder.Property(g => g.UsuarioId)
            .IsRequired();

        builder.Property(g => g.Activo)
            .IsRequired()
            .HasDefaultValue(true);
    }
}
