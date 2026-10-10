using Dastik.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Dastik.Api.Infrastructure.Persistence.Configurations;

public class UnidadNegocioConfiguration : IEntityTypeConfiguration<UnidadNegocio>
{
    public void Configure(EntityTypeBuilder<UnidadNegocio> builder)
    {
        builder.ToTable("UnidadesNegocio");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Nombre).IsRequired().HasMaxLength(100);
        builder.Property(u => u.TieneTiendaNube).IsRequired();
        builder.Property(u => u.TiendanubeStoreId).HasMaxLength(50);
        builder.Property(u => u.TiendanubeAccessToken).HasMaxLength(255);
    }
}
