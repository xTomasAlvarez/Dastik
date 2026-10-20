import { apiClient } from '../../../lib/axios/apiClient';

export interface VarianteDto {
  id: number;
  talle: string;
  color: string;
  codigoBarras: string;
  stockFisico: number;
}

export interface ProductoCatalogoDto {
  id: number;
  nombre: string;
  descripcion: string;
  marca: string;
  categoria: string;
  unidadNegocio: string;
  imagenUrl?: string;
  imagenes?: string[];
  precioVenta: number;
  costoBase?: number;
  markupAplicado?: number;
  variantes: VarianteDto[];
  tiendanubeProductId?: string | null;
}

export interface CrearVarianteItemRequest {
  talle: string;
  color: string;
  codigoBarras?: string;
  stockFisico: number;
}

export interface CrearProductoRequest {
  unidadNegocioId: number;
  categoriaId: number;
  marcaId: number;
  proveedorId: number;
  nombre: string;
  descripcion: string;
  imagenUrl?: string;
  costoBase: number;
  markupAplicado: number;
  precioVenta: number;
  variantes: CrearVarianteItemRequest[];
}

export interface CrearProductoResponse {
  productoId: number;
  nombre: string;
  cantidadVariantesCreadas: number;
}

export interface SincronizarCatalogoResponse {
  totalProductosImportados: number;
  totalVariantesImportadas: number;
  productosNuevos: number;
  productosActualizados: number;
  mensaje: string;
}

/**
 * Normaliza URLs del CDN de Tiendanube para solicitar versión de alta resolución (-1024-1024)
 * en vez de miniaturas comprimidas (-240-0, -320-0, -480-0, -640-0).
 */
export function normalizarUrlImagenAltaRes(url?: string | null): string {
  if (!url) return '';
  const limpia = url.trim();
  if (!limpia) return '';

  if (
    limpia.includes('mitiendanube.com') ||
    limpia.includes('cloudfront.net')
  ) {
    return limpia.replace(
      /-(?:240|320|480|640)-0\.(webp|jpg|jpeg|png)/gi,
      '-1024-1024.$1'
    );
  }

  return limpia;
}

export function calcularStockTotalProducto(p: ProductoCatalogoDto): number {
  return p.variantes?.reduce((acc, v) => acc + (v.stockFisico || 0), 0) ?? 0;
}

export function extraerNumeroDrop(nombre?: string, descripcion?: string): number {
  if (nombre) {
    const m = nombre.match(/\bdrop\s*#?(\d+)\b/i);
    if (m && m[1]) {
      return parseInt(m[1], 10) || 0;
    }
  }
  if (descripcion) {
    const m = descripcion.match(/\bdrop\s*#?(\d+)\b/i);
    if (m && m[1]) {
      return parseInt(m[1], 10) || 0;
    }
  }
  return 0;
}

export function compararProductosMasNuevosConStock(
  a: ProductoCatalogoDto,
  b: ProductoCatalogoDto
): number {
  const stockA = calcularStockTotalProducto(a);
  const stockB = calcularStockTotalProducto(b);

  // 1° Con stock disponible primero; agotados al final
  const tieneStockA = stockA > 0 ? 1 : 0;
  const tieneStockB = stockB > 0 ? 1 : 0;
  if (tieneStockA !== tieneStockB) {
    return tieneStockB - tieneStockA;
  }

  // 2° Número de Drop más alto primero (ej. Drop 31 antes que Drop 25)
  const dropA = extraerNumeroDrop(a.nombre, a.descripcion);
  const dropB = extraerNumeroDrop(b.nombre, b.descripcion);
  if (dropA !== dropB) {
    return dropB - dropA;
  }

  // 3° TiendanubeProductId numérico descendente
  const tnA = a.tiendanubeProductId ? parseInt(a.tiendanubeProductId, 10) || 0 : 0;
  const tnB = b.tiendanubeProductId ? parseInt(b.tiendanubeProductId, 10) || 0 : 0;
  if (tnA !== tnB) {
    return tnB - tnA;
  }

  // 4° ID local descendente
  return b.id - a.id;
}

export const ORDEN_CATEGORIAS_OFICIALES: readonly string[] = [
  'Remeras',
  'Pantalones & Jeans',
  'Polos & Chombas',
  'Camisas',
  'Buzos & Hoodies',
  'Camperas & Abrigos',
  'Bermudas & Shorts',
  'Gorras & Accesorios',
  'Zapatillas & Sneakers',
];

export const inventarioApi = {
  obtenerCatalogoPos: async (): Promise<ProductoCatalogoDto[]> => {
    const response = await apiClient.get<ProductoCatalogoDto[]>('/api/productos');
    return response.data;
  },

  obtenerProductos: async (): Promise<ProductoCatalogoDto[]> => {
    const response = await apiClient.get<ProductoCatalogoDto[]>('/api/productos');
    return response.data;
  },

  crearProducto: async (data: CrearProductoRequest): Promise<CrearProductoResponse> => {
    const response = await apiClient.post<CrearProductoResponse>('/api/inventario', data);
    return response.data;
  },

  sincronizarTiendanube: async (): Promise<SincronizarCatalogoResponse> => {
    const response = await apiClient.post<SincronizarCatalogoResponse>(
      '/api/inventario/sincronizar-tiendanube',
      undefined,
      { timeout: 120000 }
    );
    return response.data;
  },
};
