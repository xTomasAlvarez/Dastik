import { apiClient } from '../../../lib/axios/apiClient';

export interface ProveedorDto {
  id: number;
  nombre: string;
  markupPorDefecto: number;
}

export interface CrearProveedorRequest {
  nombre: string;
  markupPorDefecto: number;
}

export interface ActualizarProveedorRequest {
  nombre: string;
  markupPorDefecto: number;
}

export interface MarcaDto {
  id: number;
  nombre: string;
}

export interface CrearMarcaRequest {
  nombre: string;
}

export interface ActualizarMarcaRequest {
  nombre: string;
}

export interface CategoriaDto {
  id: number;
  nombre: string;
  temporada: string;
  esquemaTalles: string;
}

export interface CrearCategoriaRequest {
  nombre: string;
  temporada?: string;
  esquemaTalles?: string;
}

export interface ActualizarCategoriaRequest {
  nombre: string;
  temporada?: string;
  esquemaTalles?: string;
}

export interface EliminarCatalogoResponse {
  mensaje: string;
  productosReasignados: number;
}

export interface BackupInfoDto {
  archivo: string;
  motivo: string;
  fecha: string;
  tamanoBytes: number;
  tamanoLegible: string;
  esAutomatico: boolean;
}

export interface CrearBackupRequest {
  motivo?: string;
}

export interface RestaurarBackupResponse {
  mensaje: string;
  archivoRestaurado: string;
  snapshotPrevio: string;
}

export const configuracionApi = {
  obtenerProveedores: async (): Promise<ProveedorDto[]> => {
    const response = await apiClient.get<ProveedorDto[]>('/api/inventario/proveedores');
    return response.data;
  },

  crearProveedor: async (data: CrearProveedorRequest): Promise<ProveedorDto> => {
    const response = await apiClient.post<ProveedorDto>('/api/inventario/proveedores', data);
    return response.data;
  },

  actualizarProveedor: async (id: number, data: ActualizarProveedorRequest): Promise<ProveedorDto> => {
    const response = await apiClient.put<ProveedorDto>(`/api/inventario/proveedores/${id}`, data);
    return response.data;
  },

  eliminarProveedor: async (id: number): Promise<EliminarCatalogoResponse> => {
    const response = await apiClient.delete<EliminarCatalogoResponse>(`/api/inventario/proveedores/${id}`);
    return response.data;
  },

  obtenerMarcas: async (): Promise<MarcaDto[]> => {
    const response = await apiClient.get<MarcaDto[]>('/api/inventario/marcas');
    return response.data;
  },

  crearMarca: async (data: CrearMarcaRequest): Promise<MarcaDto> => {
    const response = await apiClient.post<MarcaDto>('/api/inventario/marcas', data);
    return response.data;
  },

  actualizarMarca: async (id: number, data: ActualizarMarcaRequest): Promise<MarcaDto> => {
    const response = await apiClient.put<MarcaDto>(`/api/inventario/marcas/${id}`, data);
    return response.data;
  },

  eliminarMarca: async (id: number): Promise<EliminarCatalogoResponse> => {
    const response = await apiClient.delete<EliminarCatalogoResponse>(`/api/inventario/marcas/${id}`);
    return response.data;
  },

  obtenerCategorias: async (): Promise<CategoriaDto[]> => {
    const response = await apiClient.get<CategoriaDto[]>('/api/inventario/categorias');
    return response.data;
  },

  crearCategoria: async (data: CrearCategoriaRequest): Promise<CategoriaDto> => {
    const response = await apiClient.post<CategoriaDto>('/api/inventario/categorias', data);
    return response.data;
  },

  actualizarCategoria: async (id: number, data: ActualizarCategoriaRequest): Promise<CategoriaDto> => {
    const response = await apiClient.put<CategoriaDto>(`/api/inventario/categorias/${id}`, data);
    return response.data;
  },

  eliminarCategoria: async (id: number): Promise<EliminarCatalogoResponse> => {
    const response = await apiClient.delete<EliminarCatalogoResponse>(`/api/inventario/categorias/${id}`);
    return response.data;
  },

  // Backups y Puntos de Restauración (Rollback)
  obtenerBackups: async (): Promise<BackupInfoDto[]> => {
    const response = await apiClient.get<BackupInfoDto[]>('/api/configuracion/backups');
    return response.data;
  },

  crearBackup: async (data?: CrearBackupRequest): Promise<BackupInfoDto> => {
    const response = await apiClient.post<BackupInfoDto>('/api/configuracion/backups', data ?? { motivo: 'manual' });
    return response.data;
  },

  restaurarBackup: async (fileName: string): Promise<RestaurarBackupResponse> => {
    const response = await apiClient.post<RestaurarBackupResponse>(`/api/configuracion/backups/${encodeURIComponent(fileName)}/restore`);
    return response.data;
  },
};
