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
  precioVenta: number;
  costoBase?: number;
  markupAplicado?: number;
  variantes: VarianteDto[];
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
    const response = await apiClient.post<SincronizarCatalogoResponse>('/api/inventario/sincronizar-tiendanube');
    return response.data;
  },
};

