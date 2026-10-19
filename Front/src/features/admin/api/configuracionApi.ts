import { apiClient } from '../../../lib/axios/apiClient';

export interface ProveedorDto {
  id: number;
  nombre: string;
  markupPorDefecto: number;
  cantidadProductos: number;
}

export interface CrearProveedorRequest {
  nombre: string;
  markupPorDefecto: number;
}

export interface MarcaDto {
  id: number;
  nombre: string;
  cantidadProductos: number;
}

export interface CrearMarcaRequest {
  nombre: string;
}

export interface CategoriaDto {
  id: number;
  nombre: string;
  temporada: string;
  esquemaTalles: string;
  categoriaPadreId?: number | null;
  cantidadProductos: number;
}

export interface CrearCategoriaRequest {
  nombre: string;
  temporada: string;
  esquemaTalles: string;
  categoriaPadreId?: number | null;
}

export const configuracionApi = {
  // Proveedores
  obtenerProveedores: async (): Promise<ProveedorDto[]> => {
    const response = await apiClient.get<ProveedorDto[]>('/api/inventario/proveedores');
    return response.data;
  },

  crearProveedor: async (data: CrearProveedorRequest): Promise<ProveedorDto> => {
    const response = await apiClient.post<ProveedorDto>('/api/inventario/proveedores', data);
    return response.data;
  },

  // Marcas
  obtenerMarcas: async (): Promise<MarcaDto[]> => {
    const response = await apiClient.get<MarcaDto[]>('/api/inventario/marcas');
    return response.data;
  },

  crearMarca: async (data: CrearMarcaRequest): Promise<MarcaDto> => {
    const response = await apiClient.post<MarcaDto>('/api/inventario/marcas', data);
    return response.data;
  },

  // Categorías
  obtenerCategorias: async (): Promise<CategoriaDto[]> => {
    const response = await apiClient.get<CategoriaDto[]>('/api/inventario/categorias');
    return response.data;
  },

  crearCategoria: async (data: CrearCategoriaRequest): Promise<CategoriaDto> => {
    const response = await apiClient.post<CategoriaDto>('/api/inventario/categorias', data);
    return response.data;
  },
};
