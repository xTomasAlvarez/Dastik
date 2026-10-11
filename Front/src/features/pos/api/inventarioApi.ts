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
  variantes: VarianteDto[];
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
};
