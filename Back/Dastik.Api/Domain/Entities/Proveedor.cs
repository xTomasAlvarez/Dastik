namespace Dastik.Api.Domain.Entities;

public class Proveedor
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public decimal MarkupPorDefecto { get; set; }

    // Propiedad de navegación
    public ICollection<Producto> Productos { get; set; } = new List<Producto>();
}
