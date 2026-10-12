namespace Dastik.Api.Features.Inventario.SincronizarTiendanube;

public record SincronizarCatalogoResult(
    int TotalProductosImportados,
    int TotalVariantesImportadas,
    int ProductosNuevos,
    int ProductosActualizados,
    string Mensaje
);
