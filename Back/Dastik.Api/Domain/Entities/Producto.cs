namespace Dastik.Api.Domain.Entities;

public class Producto
{
    public int Id { get; set; }
    public int UnidadNegocioId { get; set; }
    public int CategoriaId { get; set; }
    public int MarcaId { get; set; }
    public int ProveedorId { get; set; }

    public string Nombre { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string ImagenUrl { get; set; } = string.Empty;
    public string ImagenesJson { get; set; } = "[]";

    public decimal CostoBase { get; set; }
    public decimal MarkupAplicado { get; set; }
    public decimal PrecioVenta { get; set; }

    public string? TiendanubeProductId { get; set; }
    public bool Activo { get; set; } = true;

    // Campos extendidos de paridad con Tiendanube & ERP
    public string VideoUrl { get; set; } = string.Empty;
    public bool EsFisico { get; set; } = true;
    public string SubcategoriasJson { get; set; } = "[]";
    public string DestacadosJson { get; set; } = "[]";
    public string TagsSeo { get; set; } = string.Empty;
    public string SeoTitulo { get; set; } = string.Empty;
    public string SeoDescripcion { get; set; } = string.Empty;

    // Propiedades de navegación
    public UnidadNegocio UnidadNegocio { get; set; } = null!;
    public Categoria Categoria { get; set; } = null!;
    public Marca Marca { get; set; } = null!;
    public Proveedor Proveedor { get; set; } = null!;

    public ICollection<Variante> Variantes { get; set; } = new List<Variante>();
}
