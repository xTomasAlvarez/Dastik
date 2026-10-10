namespace Dastik.Api.Domain.Entities;

public class Categoria
{
    public int Id { get; set; }
    public int? CategoriaPadreId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Temporada { get; set; } = string.Empty;
    public string EsquemaTalles { get; set; } = string.Empty;
    public string? TiendanubeCategoriaId { get; set; }

    // Propiedades de navegación (Jerárquica/Recursiva)
    public Categoria? CategoriaPadre { get; set; }
    public ICollection<Categoria> Subcategorias { get; set; } = new List<Categoria>();

    // Propiedad de navegación productos
    public ICollection<Producto> Productos { get; set; } = new List<Producto>();
}
