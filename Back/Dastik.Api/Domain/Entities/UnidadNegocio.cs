namespace Dastik.Api.Domain.Entities;

public class UnidadNegocio
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public bool TieneTiendaNube { get; set; }
    public string? TiendanubeStoreId { get; set; }
    public string? TiendanubeAccessToken { get; set; }

    // Propiedad de navegación
    public ICollection<Producto> Productos { get; set; } = new List<Producto>();
}
