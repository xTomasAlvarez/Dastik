using Dastik.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dastik.Api.Infrastructure.Persistence.Configurations;

public class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("OutboxMessages");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.TipoEvento)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(m => m.ContenidoJson)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(m => m.FechaOcurrenciaUtc)
            .IsRequired();

        builder.Property(m => m.FechaProcesadoUtc)
            .IsRequired(false);

        builder.Property(m => m.Error)
            .IsRequired(false)
            .HasMaxLength(2000);

        builder.Property(m => m.Intentos)
            .IsRequired()
            .HasDefaultValue(0);

        // Índice para acelerar la consulta de mensajes pendientes por procesar
        builder.HasIndex(m => m.FechaProcesadoUtc);
    }
}
