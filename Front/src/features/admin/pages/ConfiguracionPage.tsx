import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Gear,
  Truck,
  Tag,
  Bookmarks,
  Plus,
  Percent,
  SpinnerGap,
  CheckCircle,
  WarningCircle,
  PencilSimple,
  Trash,
  Check,
  X,
} from '@phosphor-icons/react';
import {
  configuracionApi,
  type ProveedorDto,
  type MarcaDto,
  type CategoriaDto,
} from '../api/configuracionApi';
import { Button } from '../../../components/ui/Button';

export const ConfiguracionPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Estados de formularios de alta
  const [nombreProveedor, setNombreProveedor] = useState('');
  const [markupProveedor, setMarkupProveedor] = useState('55');

  const [nombreMarca, setNombreMarca] = useState('');

  const [nombreCategoria, setNombreCategoria] = useState('');
  const [esquemaTalles, setEsquemaTalles] = useState('S-XXL');

  // Estados de edición inline - Proveedores
  const [editandoProvId, setEditandoProvId] = useState<number | null>(null);
  const [editProvNombre, setEditProvNombre] = useState('');
  const [editProvMarkup, setEditProvMarkup] = useState('');
  const [confirmDeleteProvId, setConfirmDeleteProvId] = useState<number | null>(null);

  // Estados de edición inline - Marcas
  const [editandoMarcaId, setEditandoMarcaId] = useState<number | null>(null);
  const [editMarcaNombre, setEditMarcaNombre] = useState('');
  const [confirmDeleteMarcaId, setConfirmDeleteMarcaId] = useState<number | null>(null);

  // Estados de edición inline - Categorías
  const [editandoCatId, setEditandoCatId] = useState<number | null>(null);
  const [editCatNombre, setEditCatNombre] = useState('');
  const [editCatEsquema, setEditCatEsquema] = useState('');
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<number | null>(null);

  const [feedback, setFeedback] = useState<{
    tipo: 'exito' | 'error';
    mensaje: string;
  } | null>(null);

  const mostrarFeedback = (tipo: 'exito' | 'error', mensaje: string) => {
    setFeedback({ tipo, mensaje });
    setTimeout(() => setFeedback(null), 5000);
  };

  const invalidarTodoCatalogo = () => {
    queryClient.invalidateQueries({ queryKey: ['config-proveedores'] });
    queryClient.invalidateQueries({ queryKey: ['config-marcas'] });
    queryClient.invalidateQueries({ queryKey: ['config-categorias'] });
    queryClient.invalidateQueries({ queryKey: ['productos-inventario'] });
    queryClient.invalidateQueries({ queryKey: ['catalogo-pos'] });
  };

  // Queries
  const { data: proveedores = [], isLoading: loadingProv } = useQuery({
    queryKey: ['config-proveedores'],
    queryFn: configuracionApi.obtenerProveedores,
  });

  const { data: marcas = [], isLoading: loadingMarcas } = useQuery({
    queryKey: ['config-marcas'],
    queryFn: configuracionApi.obtenerMarcas,
  });

  const { data: categorias = [], isLoading: loadingCategorias } = useQuery({
    queryKey: ['config-categorias'],
    queryFn: configuracionApi.obtenerCategorias,
  });

  // Mutations Proveedores
  const crearProveedorMutation = useMutation({
    mutationFn: configuracionApi.crearProveedor,
    onSuccess: (nuevo) => {
      invalidarTodoCatalogo();
      setNombreProveedor('');
      setMarkupProveedor('55');
      mostrarFeedback('exito', `Proveedor "${nuevo.nombre}" registrado correctamente.`);
    },
    onError: (err: any) => {
      mostrarFeedback(
        'error',
        err?.response?.data?.error || 'No se pudo registrar el proveedor.'
      );
    },
  });

  const actualizarProveedorMutation = useMutation({
    mutationFn: ({ id, nombre, markupPorDefecto }: { id: number; nombre: string; markupPorDefecto: number }) =>
      configuracionApi.actualizarProveedor(id, { nombre, markupPorDefecto }),
    onSuccess: (actualizado) => {
      invalidarTodoCatalogo();
      setEditandoProvId(null);
      mostrarFeedback('exito', `Proveedor "${actualizado.nombre}" actualizado.`);
    },
    onError: (err: any) => {
      mostrarFeedback(
        'error',
        err?.response?.data?.error || 'No se pudo actualizar el proveedor.'
      );
    },
  });

  const eliminarProveedorMutation = useMutation({
    mutationFn: configuracionApi.eliminarProveedor,
    onSuccess: (res) => {
      invalidarTodoCatalogo();
      setConfirmDeleteProvId(null);
      mostrarFeedback(
        'exito',
        res.productosReasignados > 0
          ? `${res.mensaje} (${res.productosReasignados} productos reasignados).`
          : res.mensaje
      );
    },
    onError: (err: any) => {
      mostrarFeedback(
        'error',
        err?.response?.data?.error || 'No se pudo eliminar el proveedor.'
      );
    },
  });

  // Mutations Marcas
  const crearMarcaMutation = useMutation({
    mutationFn: configuracionApi.crearMarca,
    onSuccess: (nueva) => {
      invalidarTodoCatalogo();
      setNombreMarca('');
      mostrarFeedback('exito', `Marca "${nueva.nombre}" agregada al catálogo.`);
    },
    onError: (err: any) => {
      mostrarFeedback(
        'error',
        err?.response?.data?.error || 'No se pudo registrar la marca.'
      );
    },
  });

  const actualizarMarcaMutation = useMutation({
    mutationFn: ({ id, nombre }: { id: number; nombre: string }) =>
      configuracionApi.actualizarMarca(id, { nombre }),
    onSuccess: (actualizada) => {
      invalidarTodoCatalogo();
      setEditandoMarcaId(null);
      mostrarFeedback('exito', `Marca "${actualizada.nombre}" actualizada.`);
    },
    onError: (err: any) => {
      mostrarFeedback(
        'error',
        err?.response?.data?.error || 'No se pudo actualizar la marca.'
      );
    },
  });

  const eliminarMarcaMutation = useMutation({
    mutationFn: configuracionApi.eliminarMarca,
    onSuccess: (res) => {
      invalidarTodoCatalogo();
      setConfirmDeleteMarcaId(null);
      mostrarFeedback(
        'exito',
        res.productosReasignados > 0
          ? `${res.mensaje} (${res.productosReasignados} productos reasignados a Dastik).`
          : res.mensaje
      );
    },
    onError: (err: any) => {
      mostrarFeedback(
        'error',
        err?.response?.data?.error || 'No se pudo eliminar la marca.'
      );
    },
  });

  // Mutations Categorías
  const crearCategoriaMutation = useMutation({
    mutationFn: configuracionApi.crearCategoria,
    onSuccess: (nueva) => {
      invalidarTodoCatalogo();
      setNombreCategoria('');
      mostrarFeedback('exito', `Categoría "${nueva.nombre}" agregada al catálogo.`);
    },
    onError: (err: any) => {
      mostrarFeedback(
        'error',
        err?.response?.data?.error || 'No se pudo registrar la categoría.'
      );
    },
  });

  const actualizarCategoriaMutation = useMutation({
    mutationFn: ({ id, nombre, esquemaTalles }: { id: number; nombre: string; esquemaTalles: string }) =>
      configuracionApi.actualizarCategoria(id, {
        nombre,
        temporada: 'Todo el año',
        esquemaTalles,
      }),
    onSuccess: (actualizada) => {
      invalidarTodoCatalogo();
      setEditandoCatId(null);
      mostrarFeedback('exito', `Categoría "${actualizada.nombre}" actualizada.`);
    },
    onError: (err: any) => {
      mostrarFeedback(
        'error',
        err?.response?.data?.error || 'No se pudo actualizar la categoría.'
      );
    },
  });

  const eliminarCategoriaMutation = useMutation({
    mutationFn: configuracionApi.eliminarCategoria,
    onSuccess: (res) => {
      invalidarTodoCatalogo();
      setConfirmDeleteCatId(null);
      mostrarFeedback(
        'exito',
        res.productosReasignados > 0
          ? `${res.mensaje} (${res.productosReasignados} productos reasignados).`
          : res.mensaje
      );
    },
    onError: (err: any) => {
      mostrarFeedback(
        'error',
        err?.response?.data?.error || 'No se pudo eliminar la categoría.'
      );
    },
  });

  const handleCrearProveedor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreProveedor.trim()) return;
    const markupNum = parseFloat(markupProveedor);
    if (isNaN(markupNum) || markupNum < 0) return;

    crearProveedorMutation.mutate({
      nombre: nombreProveedor.trim(),
      markupPorDefecto: markupNum,
    });
  };

  const handleCrearMarca = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreMarca.trim()) return;
    crearMarcaMutation.mutate({ nombre: nombreMarca.trim() });
  };

  const handleCrearCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCategoria.trim()) return;
    crearCategoriaMutation.mutate({
      nombre: nombreCategoria.trim(),
      temporada: 'Todo el año',
      esquemaTalles: esquemaTalles.trim() || 'S-XXL',
    });
  };

  const iniciarEdicionProveedor = (prov: ProveedorDto) => {
    setConfirmDeleteProvId(null);
    setEditandoProvId(prov.id);
    setEditProvNombre(prov.nombre);
    const pct =
      prov.markupPorDefecto <= 5 && prov.markupPorDefecto > 1
        ? Math.round((prov.markupPorDefecto - 1) * 100)
        : Math.round(prov.markupPorDefecto);
    setEditProvMarkup(String(pct));
  };

  const guardarEdicionProveedor = (id: number) => {
    if (!editProvNombre.trim()) return;
    const markupNum = parseFloat(editProvMarkup);
    if (isNaN(markupNum) || markupNum < 0) return;
    actualizarProveedorMutation.mutate({
      id,
      nombre: editProvNombre.trim(),
      markupPorDefecto: markupNum,
    });
  };

  const iniciarEdicionMarca = (marca: MarcaDto) => {
    setConfirmDeleteMarcaId(null);
    setEditandoMarcaId(marca.id);
    setEditMarcaNombre(marca.nombre);
  };

  const guardarEdicionMarca = (id: number) => {
    if (!editMarcaNombre.trim()) return;
    actualizarMarcaMutation.mutate({ id, nombre: editMarcaNombre.trim() });
  };

  const iniciarEdicionCategoria = (cat: CategoriaDto) => {
    setConfirmDeleteCatId(null);
    setEditandoCatId(cat.id);
    setEditCatNombre(cat.nombre);
    setEditCatEsquema(cat.esquemaTalles || 'S-XXL');
  };

  const guardarEdicionCategoria = (id: number) => {
    if (!editCatNombre.trim()) return;
    actualizarCategoriaMutation.mutate({
      id,
      nombre: editCatNombre.trim(),
      esquemaTalles: editCatEsquema.trim() || 'S-XXL',
    });
  };

  const formatearMarkup = (valor: number) => {
    if (valor <= 5 && valor > 1) {
      return `${Math.round((valor - 1) * 100)}%`;
    }
    return `${valor}%`;
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Notificación superior */}
      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-sans flex items-center gap-2.5 ${
            feedback.tipo === 'exito'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
          }`}
        >
          {feedback.tipo === 'exito' ? (
            <CheckCircle size={16} weight="bold" className="text-emerald-500" />
          ) : (
            <WarningCircle size={16} weight="bold" className="text-red-500" />
          )}
          <span className="font-medium">{feedback.mensaje}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-subtle">
        <div>
          <span className="text-xs font-medium text-amber-500 flex items-center gap-1.5">
            <Gear size={14} weight="duotone" />
            Parámetros del Sistema
          </span>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-primary tracking-tight mt-0.5">
            Catálogos Base y Proveedores
          </h1>
          <p className="text-xs font-sans text-secondary mt-1">
            Crea, edita o elimina proveedores, marcas y categorías oficiales de tu inventario.
          </p>
        </div>
      </div>

      {/* Grid Principal: Proveedores (Izquierda) + Marcas & Categorías (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SECCIÓN 1: PROVEEDORES (7 columnas) */}
        <section className="lg:col-span-7 rounded-xl border border-subtle bg-surface flex flex-col overflow-hidden shadow-surface">
          <div className="p-5 border-b border-subtle bg-elevated/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Truck size={18} weight="duotone" className="text-amber-500" />
              <h2 className="font-heading font-bold text-sm text-primary">
                Directorio de Proveedores
              </h2>
            </div>
            <span className="text-xs font-mono tabular-nums text-secondary bg-elevated px-2.5 py-0.5 rounded-md border border-subtle">
              {proveedores.length} registrados
            </span>
          </div>

          {/* Formulario de Alta de Proveedor */}
          <form
            onSubmit={handleCrearProveedor}
            className="p-5 border-b border-subtle bg-surface grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
          >
            <div className="sm:col-span-6">
              <label className="block text-xs font-medium text-secondary mb-1.5">
                Nombre o Razón Social
              </label>
              <input
                type="text"
                value={nombreProveedor}
                onChange={(e) => setNombreProveedor(e.target.value)}
                placeholder="Ej. Sample / Textil Sur S.A."
                className="w-full bg-elevated focus:bg-surface border border-subtle rounded-lg px-3.5 py-2 text-xs font-sans text-primary placeholder:text-muted focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-fast"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-secondary mb-1.5">
                Markup Base (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={markupProveedor}
                  onChange={(e) => setMarkupProveedor(e.target.value)}
                  placeholder="55"
                  className="w-full bg-elevated focus:bg-surface border border-subtle rounded-lg pl-3.5 pr-8 py-2 text-xs font-mono tabular-nums text-primary focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-fast"
                  required
                />
                <Percent
                  size={13}
                  weight="bold"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                disabled={crearProveedorMutation.isPending}
              >
                {crearProveedorMutation.isPending ? (
                  <SpinnerGap size={15} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={15} weight="bold" />
                    <span>Agregar</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Lista de Tarjetas de Proveedores con Editar y Eliminar */}
          <div className="p-5 flex-1">
            {loadingProv ? (
              <div className="py-12 flex items-center justify-center gap-2 text-muted text-xs font-sans">
                <SpinnerGap size={18} className="animate-spin text-amber-500" />
                Cargando proveedores...
              </div>
            ) : proveedores.length === 0 ? (
              <div className="py-12 text-center text-xs font-sans text-muted">
                No hay proveedores cargados.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {proveedores.map((prov) => {
                  const isEditing = editandoProvId === prov.id;
                  const isConfirmingDelete = confirmDeleteProvId === prov.id;

                  return (
                    <div
                      key={prov.id}
                      className="rounded-xl border border-subtle bg-elevated/50 p-4 flex flex-col justify-between gap-3 hover:border-strong transition-fast"
                    >
                      {isEditing ? (
                        <div className="space-y-2.5">
                          <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
                              Nombre del Proveedor
                            </label>
                            <input
                              type="text"
                              value={editProvNombre}
                              onChange={(e) => setEditProvNombre(e.target.value)}
                              className="w-full bg-surface border border-subtle rounded-lg px-2.5 py-1.5 text-xs font-sans text-primary focus:outline-none focus:border-amber-500"
                              autoFocus
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
                                Markup (%)
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={editProvMarkup}
                                onChange={(e) => setEditProvMarkup(e.target.value)}
                                className="w-full bg-surface border border-subtle rounded-lg px-2.5 py-1.5 text-xs font-mono text-primary focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => guardarEdicionProveedor(prov.id)}
                              disabled={actualizarProveedorMutation.isPending}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              title="Guardar cambios"
                            >
                              <Check size={14} weight="bold" />
                              <span>Guardar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditandoProvId(null)}
                              className="px-2 py-1.5 rounded-lg border border-subtle bg-surface text-secondary hover:text-primary text-xs cursor-pointer"
                              title="Cancelar"
                            >
                              <X size={14} weight="bold" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[11px] font-mono text-muted block">
                                ID #{prov.id}
                              </span>
                              <h3 className="font-heading font-bold text-primary text-sm mt-0.5">
                                {prov.nombre}
                              </h3>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-medium text-secondary block">
                                Markup Base
                              </span>
                              <span className="font-mono tabular-nums font-bold text-sm text-amber-500">
                                {formatearMarkup(prov.markupPorDefecto)}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-subtle flex items-center justify-end gap-1.5">
                            {isConfirmingDelete ? (
                              <div className="flex items-center gap-1.5 w-full justify-between">
                                <span className="text-[11px] font-sans text-red-500 font-semibold">
                                  ¿Eliminar proveedor?
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => eliminarProveedorMutation.mutate(prov.id)}
                                    disabled={eliminarProveedorMutation.isPending}
                                    className="px-2.5 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white text-[11px] font-semibold cursor-pointer"
                                  >
                                    Sí, borrar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteProvId(null)}
                                    className="px-2 py-1 rounded-md border border-subtle bg-surface text-secondary hover:text-primary text-[11px] cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => iniciarEdicionProveedor(prov)}
                                  className="px-2.5 py-1 rounded-md border border-subtle bg-surface hover:border-strong text-secondary hover:text-primary text-[11px] font-sans font-medium flex items-center gap-1 transition-fast cursor-pointer"
                                  title="Editar proveedor"
                                >
                                  <PencilSimple size={13} weight="bold" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditandoProvId(null);
                                    setConfirmDeleteProvId(prov.id);
                                  }}
                                  className="px-2.5 py-1 rounded-md border border-subtle bg-surface hover:border-red-500/40 text-secondary hover:text-red-500 text-[11px] font-sans font-medium flex items-center gap-1 transition-fast cursor-pointer"
                                  title="Eliminar proveedor"
                                >
                                  <Trash size={13} weight="bold" />
                                  <span>Eliminar</span>
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* SECCIÓN 2: MARCAS & CATEGORÍAS (5 columnas) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Bloque Marcas */}
          <section className="rounded-xl border border-subtle bg-surface flex flex-col overflow-hidden shadow-surface">
            <div className="p-4 border-b border-subtle bg-elevated/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag size={17} weight="duotone" className="text-amber-500" />
                <h2 className="font-heading font-bold text-sm text-primary">
                  Marcas Oficiales
                </h2>
              </div>
              <span className="text-xs font-mono tabular-nums text-secondary">
                {marcas.length} activas
              </span>
            </div>

            <form
              onSubmit={handleCrearMarca}
              className="p-4 border-b border-subtle flex items-center gap-2"
            >
              <input
                type="text"
                value={nombreMarca}
                onChange={(e) => setNombreMarca(e.target.value)}
                placeholder="Nueva marca (ej. Stüssy, New Balance)..."
                className="flex-1 bg-elevated focus:bg-surface border border-subtle rounded-lg px-3.5 py-2 text-xs font-sans text-primary placeholder:text-muted focus:outline-none focus:border-amber-500/80 transition-fast"
                required
              />
              <Button
                type="submit"
                variant="secondary"
                size="md"
                disabled={crearMarcaMutation.isPending}
              >
                <Plus size={14} weight="bold" />
                <span>Crear</span>
              </Button>
            </form>

            <div className="p-4 max-h-72 overflow-y-auto divide-y divide-subtle">
              {loadingMarcas ? (
                <span className="text-xs font-sans text-muted">Cargando marcas...</span>
              ) : (
                marcas.map((m) => {
                  const isEditing = editandoMarcaId === m.id;
                  const isConfirmingDelete = confirmDeleteMarcaId === m.id;

                  return (
                    <div
                      key={m.id}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={editMarcaNombre}
                            onChange={(e) => setEditMarcaNombre(e.target.value)}
                            className="flex-1 bg-elevated border border-subtle rounded-lg px-2.5 py-1 text-xs font-sans text-primary focus:outline-none focus:border-amber-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => guardarEdicionMarca(m.id)}
                            disabled={actualizarMarcaMutation.isPending}
                            className="px-2.5 py-1 rounded-md bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Check size={13} weight="bold" />
                            <span>Guardar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditandoMarcaId(null)}
                            className="p-1 rounded-md border border-subtle bg-elevated text-secondary hover:text-primary cursor-pointer"
                          >
                            <X size={13} weight="bold" />
                          </button>
                        </div>
                      ) : isConfirmingDelete ? (
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="text-xs font-sans text-red-500 font-semibold">
                            ¿Eliminar marca &quot;{m.nombre}&quot;?
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => eliminarMarcaMutation.mutate(m.id)}
                              disabled={eliminarMarcaMutation.isPending}
                              className="px-2.5 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white text-[11px] font-semibold cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteMarcaId(null)}
                              className="px-2 py-1 rounded-md border border-subtle bg-elevated text-secondary hover:text-primary text-[11px] cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-muted">#{m.id}</span>
                            <span className="text-xs font-sans font-semibold text-primary">
                              {m.nombre}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => iniciarEdicionMarca(m)}
                              className="p-1.5 rounded-md border border-subtle bg-elevated hover:bg-surface text-secondary hover:text-primary transition-fast cursor-pointer"
                              title="Editar marca"
                            >
                              <PencilSimple size={13} weight="bold" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditandoMarcaId(null);
                                setConfirmDeleteMarcaId(m.id);
                              }}
                              className="p-1.5 rounded-md border border-subtle bg-elevated hover:border-red-500/40 text-secondary hover:text-red-500 transition-fast cursor-pointer"
                              title="Eliminar marca"
                            >
                              <Trash size={13} weight="bold" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Bloque Categorías */}
          <section className="rounded-xl border border-subtle bg-surface flex flex-col overflow-hidden shadow-surface">
            <div className="p-4 border-b border-subtle bg-elevated/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmarks size={17} weight="duotone" className="text-amber-500" />
                <h2 className="font-heading font-bold text-sm text-primary">
                  Categorías de Prendas
                </h2>
              </div>
              <span className="text-xs font-mono tabular-nums text-secondary">
                {categorias.length} activas
              </span>
            </div>

            <form
              onSubmit={handleCrearCategoria}
              className="p-4 border-b border-subtle space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={nombreCategoria}
                  onChange={(e) => setNombreCategoria(e.target.value)}
                  placeholder="Categoría (ej. Accesorios)..."
                  className="bg-elevated focus:bg-surface border border-subtle rounded-lg px-3.5 py-2 text-xs font-sans text-primary placeholder:text-muted focus:outline-none focus:border-amber-500/80 transition-fast"
                  required
                />
                <input
                  type="text"
                  value={esquemaTalles}
                  onChange={(e) => setEsquemaTalles(e.target.value)}
                  placeholder="Curva (ej. S-XL / Único)"
                  className="bg-elevated focus:bg-surface border border-subtle rounded-lg px-3.5 py-2 text-xs font-mono text-primary placeholder:text-muted focus:outline-none focus:border-amber-500/80 transition-fast"
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="w-full"
                disabled={crearCategoriaMutation.isPending}
              >
                <Plus size={14} weight="bold" />
                <span>Registrar Categoría</span>
              </Button>
            </form>

            <div className="p-4 max-h-80 overflow-y-auto divide-y divide-subtle">
              {loadingCategorias ? (
                <span className="text-xs font-sans text-muted">Cargando categorías...</span>
              ) : (
                categorias.map((c) => {
                  const isEditing = editandoCatId === c.id;
                  const isConfirmingDelete = confirmDeleteCatId === c.id;

                  return (
                    <div
                      key={c.id}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2 text-xs"
                    >
                      {isEditing ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                          <input
                            type="text"
                            value={editCatNombre}
                            onChange={(e) => setEditCatNombre(e.target.value)}
                            className="flex-1 bg-elevated border border-subtle rounded-lg px-2.5 py-1 text-xs font-sans text-primary focus:outline-none focus:border-amber-500"
                            placeholder="Nombre categoría"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={editCatEsquema}
                            onChange={(e) => setEditCatEsquema(e.target.value)}
                            className="w-28 bg-elevated border border-subtle rounded-lg px-2.5 py-1 text-xs font-mono text-primary focus:outline-none focus:border-amber-500"
                            placeholder="Talles"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => guardarEdicionCategoria(c.id)}
                              disabled={actualizarCategoriaMutation.isPending}
                              className="px-2.5 py-1 rounded-md bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Check size={13} weight="bold" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditandoCatId(null)}
                              className="p-1 rounded-md border border-subtle bg-elevated text-secondary hover:text-primary cursor-pointer"
                            >
                              <X size={13} weight="bold" />
                            </button>
                          </div>
                        </div>
                      ) : isConfirmingDelete ? (
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="text-xs font-sans text-red-500 font-semibold">
                            ¿Eliminar &quot;{c.nombre}&quot;?
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => eliminarCategoriaMutation.mutate(c.id)}
                              disabled={eliminarCategoriaMutation.isPending}
                              className="px-2.5 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white text-[11px] font-semibold cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCatId(null)}
                              className="px-2 py-1 rounded-md border border-subtle bg-elevated text-secondary hover:text-primary text-[11px] cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-sans font-semibold text-primary truncate">
                              {c.nombre}
                            </span>
                            <span className="font-mono text-[11px] text-secondary bg-elevated px-2 py-0.5 rounded-md border border-subtle shrink-0">
                              {c.esquemaTalles}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => iniciarEdicionCategoria(c)}
                              className="p-1.5 rounded-md border border-subtle bg-elevated hover:bg-surface text-secondary hover:text-primary transition-fast cursor-pointer"
                              title="Editar categoría"
                            >
                              <PencilSimple size={13} weight="bold" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditandoCatId(null);
                                setConfirmDeleteCatId(c.id);
                              }}
                              className="p-1.5 rounded-md border border-subtle bg-elevated hover:border-red-500/40 text-secondary hover:text-red-500 transition-fast cursor-pointer"
                              title="Eliminar categoría"
                            >
                              <Trash size={13} weight="bold" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
