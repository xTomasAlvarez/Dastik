import React, { useState, useEffect, useId, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  WarningCircle,
  Package,
  Check,
  UploadSimple,
  Trash,
  Star,
  VideoCamera,
  MagnifyingGlass,
  Tag,
  CaretDown,
  CaretUp,
  Sparkle,
  PencilSimple,
  CloudArrowUp,
} from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  inventarioApi,
  normalizarUrlImagenAltaRes,
  type CrearProductoRequest,
  type EditarProductoRequest,
  type ProductoCatalogoDto,
} from '../../pos/api/inventarioApi';
import { configuracionApi } from '../api/configuracionApi';
import {
  CrearProductoVariantesSection,
  type VarianteTemporal,
} from './CrearProductoVariantesSection';
import { useTenantStore } from '../../../stores/useTenantStore';
import type { AxiosError } from 'axios';

interface ModalCrearProductoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  productoAEditar?: ProductoCatalogoDto | null;
}

// Algoritmo GS1 EAN-13 estándar (Prefijo '20' para retail local)
export const generarEan13 = (): string => {
  let codigo12 = '20';
  for (let i = 2; i < 12; i++) {
    codigo12 += Math.floor(Math.random() * 10).toString();
  }
  let suma = 0;
  for (let i = 0; i < 12; i++) {
    const digito = parseInt(codigo12[i], 10);
    suma += i % 2 === 0 ? digito : digito * 3;
  }
  const resto = suma % 10;
  const digitoVerificador = resto === 0 ? 0 : 10 - resto;
  return `${codigo12}${digitoVerificador}`;
};

const obtenerMultiplicadorProveedor = (markupPorDefecto: number): number => {
  if (!markupPorDefecto || markupPorDefecto <= 0) return 1.5;
  return markupPorDefecto <= 10 ? markupPorDefecto : 1 + markupPorDefecto / 100;
};

export const ModalCrearProducto: React.FC<ModalCrearProductoProps> = ({
  isOpen,
  onClose,
  onSuccess,
  productoAEditar,
}) => {
  const modalHeadingId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descripcionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { isSandboxMode } = useTenantStore();
  const esModoEdicion = Boolean(productoAEditar);

  // Estados del Formulario Principal
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [esFisico, setEsFisico] = useState(true);
  const [unidadNegocioId, setUnidadNegocioId] = useState<number>(1);
  const [categoriaId, setCategoriaId] = useState<number>(1);
  const [marcaId, setMarcaId] = useState<number>(1);
  const [proveedorId, setProveedorId] = useState<number>(1);

  // Galería de Imágenes y Video
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [inputUrlImagen, setInputUrlImagen] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Estados de Precios ERP
  const [costoBase, setCostoBase] = useState<string>('15000');
  const [precioVenta, setPrecioVenta] = useState<string>('22500');

  // Variantes
  const [variantes, setVariantes] = useState<VarianteTemporal[]>([]);
  const [nuevoTalle, setNuevoTalle] = useState('');
  const [nuevoColor, setNuevoColor] = useState('Negro');
  const [nuevoStock, setNuevoStock] = useState('5');
  const [nuevoCodigoBarras, setNuevoCodigoBarras] = useState('');
  const [nuevoPrecioPromo, setNuevoPrecioPromo] = useState('');
  const [nuevoPesoKg, setNuevoPesoKg] = useState('0.300');
  const [curvaActivaId, setCurvaActivaId] = useState<string>('arriba');

  // Subcategorías & Destacados
  const [subcategorias, setSubcategorias] = useState<string[]>([]);
  const [inputSubcategoria, setInputSubcategoria] = useState('');
  const [destacados, setDestacados] = useState<string[]>([]);

  // SEO & Buscadores (Collapsible)
  const [mostrarSeo, setMostrarSeo] = useState(false);
  const [tagsSeo, setTagsSeo] = useState('');
  const [seoTitulo, setSeoTitulo] = useState('');
  const [seoDescripcion, setSeoDescripcion] = useState('');

  // Sincronización Tiendanube
  const [sincronizarTiendanube, setSincronizarTiendanube] = useState(true);

  // Estado general
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Catálogos dinámicos
  const { data: proveedoresCatalogo = [] } = useQuery({
    queryKey: ['configuracion', 'proveedores'],
    queryFn: configuracionApi.obtenerProveedores,
    enabled: isOpen,
  });

  const { data: marcasCatalogo = [] } = useQuery({
    queryKey: ['configuracion', 'marcas'],
    queryFn: configuracionApi.obtenerMarcas,
    enabled: isOpen,
  });

  const { data: categoriasCatalogo = [] } = useQuery({
    queryKey: ['configuracion', 'categorias'],
    queryFn: configuracionApi.obtenerCategorias,
    enabled: isOpen,
  });

  const costoNum = parseFloat(costoBase) || 0;
  const ventaNum = parseFloat(precioVenta) || 0;
  const markupCalculado = costoNum > 0 ? Number((ventaNum / costoNum).toFixed(2)) : 1.5;
  const margenPorcentaje =
    costoNum > 0 ? (((ventaNum - costoNum) / costoNum) * 100).toFixed(1) : '0';

  const proveedorSeleccionado = proveedoresCatalogo.find((p) => p.id === proveedorId);
  const multiplicadorActivo = proveedorSeleccionado
    ? obtenerMultiplicadorProveedor(proveedorSeleccionado.markupPorDefecto)
    : 1.5;

  // Carga o reseteo de datos según productoAEditar
  useEffect(() => {
    if (!isOpen) return;

    if (productoAEditar) {
      setNombre(productoAEditar.nombre || '');
      setDescripcion(productoAEditar.descripcion || '');
      setEsFisico(productoAEditar.esFisico ?? true);
      setUnidadNegocioId(productoAEditar.unidadNegocioId ?? (productoAEditar.unidadNegocio?.toLowerCase().includes('hidden') ? 2 : 1));
      if (productoAEditar.categoriaId) setCategoriaId(productoAEditar.categoriaId);
      if (productoAEditar.marcaId) setMarcaId(productoAEditar.marcaId);
      if (productoAEditar.proveedorId) setProveedorId(productoAEditar.proveedorId);

      // Galería
      const galeria = (productoAEditar.imagenes && productoAEditar.imagenes.length > 0)
        ? productoAEditar.imagenes
        : productoAEditar.imagenUrl ? [productoAEditar.imagenUrl] : [];
      setImagenes(galeria);
      setVideoUrl(productoAEditar.videoUrl || '');

      // Costos
      const cBase = productoAEditar.costoBase && productoAEditar.costoBase > 0
        ? productoAEditar.costoBase
        : Math.round(productoAEditar.precioVenta / 1.5);
      setCostoBase(cBase.toString());
      setPrecioVenta(productoAEditar.precioVenta.toString());

      // Variantes
      if (productoAEditar.variantes && productoAEditar.variantes.length > 0) {
        setVariantes(
          productoAEditar.variantes.map((v) => ({
            tempId: `var-edit-${v.id}`,
            id: v.id,
            talle: v.talle,
            color: v.color,
            codigoBarras: v.codigoBarras,
            stockFisico: v.stockFisico,
            precioPromocional: v.precioPromocional,
            pesoKg: v.pesoKg ?? 0.3,
            precioOverride: v.precioOverride,
            tiendanubeVariantId: v.tiendanubeVariantId,
          }))
        );
      } else {
        setVariantes([]);
      }

      // Subcategorías & Destacados
      setSubcategorias(productoAEditar.subcategorias || []);
      setDestacados(productoAEditar.destacados || []);

      // SEO
      setTagsSeo(productoAEditar.tagsSeo || '');
      setSeoTitulo(productoAEditar.seoTitulo || '');
      setSeoDescripcion(productoAEditar.seoDescripcion || '');
      setMostrarSeo(Boolean(productoAEditar.tagsSeo || productoAEditar.seoTitulo || productoAEditar.seoDescripcion));

      setSincronizarTiendanube(true);
    } else {
      // Modo Nuevo Producto
      setNombre('');
      setDescripcion('');
      setEsFisico(true);
      setUnidadNegocioId(1);
      setImagenes([]);
      setInputUrlImagen('');
      setVideoUrl('');
      setCostoBase('15000');
      setPrecioVenta('22500');
      setSubcategorias([]);
      setDestacados([]);
      setTagsSeo('');
      setSeoTitulo('');
      setSeoDescripcion('');
      setMostrarSeo(false);
      setSincronizarTiendanube(true);
      setVariantes([
        {
          tempId: 'init-1',
          talle: 'M',
          color: 'Negro',
          codigoBarras: generarEan13(),
          stockFisico: 10,
          pesoKg: 0.3,
        },
      ]);
    }
    setErrorMessage(null);
  }, [isOpen, productoAEditar]);

  // Manejo de ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onClose]);

  // Recalcular precio sugerido al cambiar proveedor o costo
  const handleSelectProveedor = (id: number) => {
    setProveedorId(id);
    const prov = proveedoresCatalogo.find((p) => p.id === id);
    if (prov && costoNum > 0) {
      const mult = obtenerMultiplicadorProveedor(prov.markupPorDefecto);
      const sugerido = Math.round(costoNum * mult);
      if (sugerido > 0) {
        setPrecioVenta(sugerido.toString());
      }
    }
  };

  const handleChangeCostoBase = (nuevoCostoStr: string) => {
    setCostoBase(nuevoCostoStr);
    const nuevoCosto = parseFloat(nuevoCostoStr) || 0;
    if (nuevoCosto > 0) {
      const sugerido = Math.round(nuevoCosto * multiplicadorActivo);
      if (sugerido > 0) {
        setPrecioVenta(sugerido.toString());
      }
    }
  };

  // Formateo Rápido de Descripción
  const insertarTextoEnDescripcion = (textoAInsertar: string) => {
    const textarea = descripcionTextareaRef.current;
    if (!textarea) {
      setDescripcion((prev) => prev + textoAInsertar);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textoPrevio = descripcion;
    const nuevoTexto =
      textoPrevio.substring(0, start) + textoAInsertar + textoPrevio.substring(end);
    setDescripcion(nuevoTexto);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textoAInsertar.length, start + textoAInsertar.length);
    }, 0);
  };

  // Subida de imágenes a /api/inventario/upload-imagenes
  const handleArchivosSeleccionados = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arrayFiles = Array.from(files);
    setIsUploadingImage(true);
    try {
      const urlsSubidas = await inventarioApi.subirImagenes(arrayFiles);
      setImagenes((prev) => [...prev, ...urlsSubidas]);
    } catch {
      setErrorMessage('Error al subir las imágenes. Verifica que sean WEBP, PNG o JPG.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAgregarUrlImagen = () => {
    if (!inputUrlImagen.trim()) return;
    const urlLimpia = normalizarUrlImagenAltaRes(inputUrlImagen.trim());
    if (urlLimpia && !imagenes.includes(urlLimpia)) {
      setImagenes((prev) => [...prev, urlLimpia]);
    }
    setInputUrlImagen('');
  };

  const handleEliminarImagen = (index: number) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEstablecerPrincipal = (index: number) => {
    if (index === 0) return;
    setImagenes((prev) => {
      const copia = [...prev];
      const [elegida] = copia.splice(index, 1);
      return [elegida, ...copia];
    });
  };

  // Variantes
  const handleAutogenerarEan = () => {
    setNuevoCodigoBarras(generarEan13());
  };

  const handleAgregarVariante = () => {
    if (!nuevoTalle.trim()) {
      setErrorMessage('Por favor especifica el talle para la variante.');
      return;
    }
    const stock = parseInt(nuevoStock, 10);
    if (isNaN(stock) || stock < 0) {
      setErrorMessage('El stock físico debe ser mayor o igual a 0.');
      return;
    }
    const eanFinal = nuevoCodigoBarras.trim() ? nuevoCodigoBarras.trim() : generarEan13();

    const nueva: VarianteTemporal = {
      tempId: `var-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      talle: nuevoTalle.trim().toUpperCase(),
      color: nuevoColor.trim() || 'Único',
      stockFisico: stock,
      codigoBarras: eanFinal,
      precioPromocional: nuevoPrecioPromo ? parseFloat(nuevoPrecioPromo) : null,
      pesoKg: nuevoPesoKg ? parseFloat(nuevoPesoKg) : 0.3,
    };

    setVariantes((prev) => [...prev, nueva]);
    setNuevoTalle('');
    setNuevoCodigoBarras('');
    setNuevoPrecioPromo('');
    setErrorMessage(null);
  };

  const handleEliminarVariante = (tempId: string) => {
    setVariantes((prev) => prev.filter((v) => v.tempId !== tempId));
  };

  const handleActualizarVariante = (tempId: string, updates: Partial<VarianteTemporal>) => {
    setVariantes((prev) =>
      prev.map((v) => (v.tempId === tempId ? { ...v, ...updates } : v))
    );
  };

  const handleAgregarCurvaCompleta = (talles: string[]) => {
    const stock = parseInt(nuevoStock, 10) || 5;
    const color = nuevoColor.trim() || 'Único';
    const nuevas: VarianteTemporal[] = talles.map((t) => ({
      tempId: `var-${Date.now()}-${t}-${Math.random().toString(36).substring(2, 6)}`,
      talle: t,
      color,
      stockFisico: stock,
      codigoBarras: generarEan13(),
      pesoKg: parseFloat(nuevoPesoKg) || 0.3,
    }));
    setVariantes((prev) => [...prev, ...nuevas]);
    setErrorMessage(null);
  };

  // Subcategorías Chips
  const handleAgregarSubcategoria = () => {
    if (!inputSubcategoria.trim()) return;
    const limpia = inputSubcategoria.trim();
    if (!subcategorias.includes(limpia)) {
      setSubcategorias((prev) => [...prev, limpia]);
    }
    setInputSubcategoria('');
  };

  const handleToggleDestacado = (tag: string) => {
    setDestacados((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nombre.trim()) {
      setErrorMessage('El nombre del producto es obligatorio.');
      return;
    }

    if (ventaNum <= 0 || isNaN(ventaNum)) {
      setErrorMessage('El precio de venta debe ser mayor a 0.');
      return;
    }

    if (variantes.length === 0) {
      setErrorMessage('Debes configurar al menos una variante con talle y stock.');
      return;
    }

    setIsLoading(true);

    try {
      if (esModoEdicion && productoAEditar) {
        const payload: EditarProductoRequest = {
          id: productoAEditar.id,
          unidadNegocioId,
          categoriaId,
          marcaId,
          proveedorId,
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          imagenUrl: imagenes[0] || '',
          imagenes,
          costoBase: costoNum,
          markupAplicado: markupCalculado,
          precioVenta: ventaNum,
          variantes: variantes.map((v) => ({
            id: v.id,
            talle: v.talle,
            color: v.color,
            codigoBarras: v.codigoBarras,
            stockFisico: v.stockFisico,
            precioPromocional: v.precioPromocional,
            pesoKg: v.pesoKg ?? 0.3,
            precioOverride: v.precioOverride,
            tiendanubeVariantId: v.tiendanubeVariantId,
          })),
          videoUrl: videoUrl.trim() || undefined,
          esFisico,
          subcategorias,
          destacados,
          tagsSeo: tagsSeo.trim() || undefined,
          seoTitulo: seoTitulo.trim() || undefined,
          seoDescripcion: seoDescripcion.trim() || undefined,
          sincronizarTiendanube: unidadNegocioId === 1 ? sincronizarTiendanube : false,
        };

        await inventarioApi.editarProducto(payload);
      } else {
        const payload: CrearProductoRequest = {
          unidadNegocioId,
          categoriaId,
          marcaId,
          proveedorId,
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          imagenUrl: imagenes[0] || '',
          imagenes,
          costoBase: costoNum,
          markupAplicado: markupCalculado,
          precioVenta: ventaNum,
          variantes: variantes.map((v) => ({
            talle: v.talle,
            color: v.color,
            codigoBarras: v.codigoBarras,
            stockFisico: v.stockFisico,
            precioPromocional: v.precioPromocional,
            pesoKg: v.pesoKg ?? 0.3,
            precioOverride: v.precioOverride,
          })),
          videoUrl: videoUrl.trim() || undefined,
          esFisico,
          subcategorias,
          destacados,
          tagsSeo: tagsSeo.trim() || undefined,
          seoTitulo: seoTitulo.trim() || undefined,
          seoDescripcion: seoDescripcion.trim() || undefined,
          sincronizarTiendanube: unidadNegocioId === 1 ? sincronizarTiendanube : false,
        };

        await inventarioApi.crearProducto(payload);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<{
        detail?: string;
        title?: string;
        error?: string;
        errors?: Record<string, string[]>;
      }>;
      const detail = axiosError.response?.data?.detail;
      const errorMsg = axiosError.response?.data?.error;
      const title = axiosError.response?.data?.title;
      let validationMsg = '';
      if (axiosError.response?.data?.errors) {
        validationMsg = Object.values(axiosError.response.data.errors)
          .flat()
          .join(' · ');
      }

      setErrorMessage(
        validationMsg ||
          errorMsg ||
          detail ||
          title ||
          'Error al procesar la operación. Verifica los datos e inténtalo nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div
        className="w-full max-w-5xl bg-surface border border-subtle rounded-xl shadow-floating max-h-[94vh] flex flex-col text-left relative my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalHeadingId}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-subtle px-6 py-4 bg-elevated/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="border border-subtle bg-surface rounded-lg p-2 text-primary shrink-0">
              {esModoEdicion ? (
                <PencilSimple size={20} weight="duotone" className="text-amber-500" />
              ) : (
                <Package size={20} weight="duotone" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id={modalHeadingId}
                  className="text-base md:text-lg font-heading font-bold text-primary tracking-tight"
                >
                  {esModoEdicion
                    ? `Editar Prenda: ${productoAEditar?.nombre}`
                    : 'Nueva Prenda y Variantes'}
                </h2>
                {esModoEdicion && productoAEditar?.tiendanubeProductId && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                    TIENDANUBE #{productoAEditar.tiendanubeProductId}
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary font-sans">
                {esModoEdicion
                  ? 'Modifica precios, fotos, curva de talles y sincroniza bidireccionalmente.'
                  : 'Carga completa 1:1 con Tiendanube oficial y parámetros de ERP.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-muted hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-elevated cursor-pointer disabled:opacity-50"
            title="Cerrar modal [ESC]"
            aria-label="Cerrar modal [ESC]"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Formulario con Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-7">
          {errorMessage && (
            <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 text-red-600 dark:text-red-400 text-xs font-sans flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <WarningCircle size={17} weight="bold" className="shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="hover:opacity-75 p-0.5 transition-opacity cursor-pointer shrink-0"
              >
                <X size={15} weight="bold" />
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* BLOQUE 1: Nombre & Descripción (con Toolbar de Formato)  */}
          {/* ======================================================== */}
          <div className="border border-subtle bg-elevated/40 rounded-xl p-5 space-y-4">
            <span className="text-[10px] uppercase tracking-widest text-secondary font-sans font-semibold block">
              1. INFORMACIÓN PRINCIPAL &amp; DESCRIPCIÓN EDITORIAL
            </span>

            <Input
              id="nombre"
              label="NOMBRE DE LA PRENDA *"
              placeholder="ej: Hoodie Oversize Essential Heavyweight 24/1"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={isLoading}
              required
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="descripcion"
                  className="text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans"
                >
                  DESCRIPCIÓN DEL ARTÍCULO
                </label>
                <span className="text-[10px] font-mono text-muted">
                  {descripcion.length} caracteres
                </span>
              </div>

              {/* Toolbar Rápido de Formato */}
              <div className="flex items-center gap-1.5 p-1.5 border border-subtle bg-surface rounded-t-lg border-b-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => insertarTextoEnDescripcion('**texto en negrita**')}
                  className="px-2 py-0.5 rounded text-xs font-bold border border-subtle bg-elevated hover:bg-surface text-primary transition-colors cursor-pointer"
                  title="Negrita"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertarTextoEnDescripcion('*texto en cursiva*')}
                  className="px-2 py-0.5 rounded text-xs italic border border-subtle bg-elevated hover:bg-surface text-primary transition-colors cursor-pointer"
                  title="Cursiva"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => insertarTextoEnDescripcion('\n- Item 1\n- Item 2')}
                  className="px-2 py-0.5 rounded text-xs border border-subtle bg-elevated hover:bg-surface text-primary transition-colors cursor-pointer"
                  title="Lista con viñetas"
                >
                  • Lista
                </button>
                <div className="h-4 w-px bg-subtle mx-1" />
                <button
                  type="button"
                  onClick={() =>
                    insertarTextoEnDescripcion(
                      '\n# NOTA DE FIT:\nEl modelo mide 1,75 m, pesa 70 kg y usa talle M para un calce relajado.\n'
                    )
                  }
                  className="px-2.5 py-0.5 rounded text-[11px] font-mono border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer flex items-center gap-1"
                  title="Insertar plantilla estándar de medidas del modelo"
                >
                  <Sparkle size={13} weight="bold" />
                  <span>+ Template Fit Modelo</span>
                </button>
              </div>

              <textarea
                ref={descripcionTextareaRef}
                id="descripcion"
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={isLoading}
                placeholder="Detalla confección, composición textil, gramaje, instrucciones de lavado y notas de calce..."
                className="w-full bg-surface text-primary border border-subtle focus:border-strong rounded-b-lg px-3.5 py-2.5 text-xs font-sans outline-none transition-colors leading-relaxed placeholder-muted resize-y"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* BLOQUE 2: Galería de Fotos & Video (Tiendanube 1:1)       */}
          {/* ======================================================== */}
          <div className="border border-subtle bg-elevated/40 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-secondary font-sans font-semibold block">
                  2. FOTOS EDITORIALES &amp; VIDEO (ALTA RESOLUCIÓN)
                </span>
                <span className="text-xs text-secondary font-sans">
                  {imagenes.length} {imagenes.length === 1 ? 'foto cargada' : 'fotos cargadas'} · La primera foto es la portada del catálogo.
                </span>
              </div>
            </div>

            {/* Dropzone / Upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleArchivosSeleccionados(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-subtle hover:border-strong bg-surface rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".webp,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => handleArchivosSeleccionados(e.target.files)}
              />
              <div className="w-12 h-12 rounded-full border border-subtle bg-elevated group-hover:scale-105 transition-transform flex items-center justify-center text-primary">
                {isUploadingImage ? (
                  <CloudArrowUp size={24} weight="bold" className="animate-pulse text-amber-500" />
                ) : (
                  <UploadSimple size={24} weight="bold" />
                )}
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-heading font-bold text-primary block">
                  {isUploadingImage
                    ? 'Subiendo archivos locales...'
                    : 'Arrastrá fotos acá o hacé clic para explorar'}
                </span>
                <span className="text-[11px] text-muted font-sans block">
                  Formatos permitidos: WEBP, PNG, JPG/JPEG (Hasta 1024x1024px)
                </span>
              </div>
            </div>

            {/* Carga por URL manual */}
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="O pegá una URL directa de imagen (https://...)"
                value={inputUrlImagen}
                onChange={(e) => setInputUrlImagen(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAgregarUrlImagen();
                  }
                }}
                disabled={isLoading}
                className="flex-1 bg-surface text-primary border border-subtle focus:border-strong rounded-lg px-3.5 py-2 text-xs outline-none placeholder-muted"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAgregarUrlImagen}
                disabled={isLoading || !inputUrlImagen.trim()}
                className="text-xs shrink-0"
              >
                + AGREGAR URL
              </Button>
            </div>

            {/* Grid de Fotos Cargadas con Selección de Portada */}
            {imagenes.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                {imagenes.map((url, idx) => {
                  const esPortada = idx === 0;
                  return (
                    <div
                      key={`${url}-${idx}`}
                      className={`relative aspect-[3/4] rounded-lg border overflow-hidden group bg-surface ${
                        esPortada ? 'border-amber-500 ring-2 ring-amber-500/25' : 'border-subtle'
                      }`}
                    >
                      <img
                        src={normalizarUrlImagenAltaRes(url)}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />

                      {/* Badge Portada */}
                      {esPortada ? (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-amber-500 text-black text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          <Star size={10} weight="fill" />
                          PORTADA
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEstablecerPrincipal(idx)}
                          className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 hover:bg-black text-white text-[9px] font-mono font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-1"
                          title="Hacer foto principal"
                        >
                          <Star size={10} weight="bold" />
                          PRINCIPAL
                        </button>
                      )}

                      {/* Botón Borrar */}
                      <button
                        type="button"
                        onClick={() => handleEliminarImagen(idx)}
                        className="absolute top-1.5 right-1.5 p-1 rounded bg-black/75 hover:bg-red-600 text-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Eliminar foto"
                      >
                        <Trash size={13} weight="bold" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Input Video URL */}
            <div className="pt-2 border-t border-subtle">
              <label
                htmlFor="videoUrl"
                className="text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans block mb-1.5"
              >
                VIDEO DEL PRODUCTO (YOUTUBE / VIMEO / MP4)
              </label>
              <div className="flex items-center gap-2 bg-surface border border-subtle focus-within:border-strong rounded-lg px-3 py-1.5">
                <VideoCamera size={18} weight="bold" className="text-muted shrink-0" />
                <input
                  id="videoUrl"
                  type="url"
                  placeholder="ej: https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-transparent text-primary text-xs outline-none placeholder-muted"
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* BLOQUE 3: Costos ERP, Proveedor & Tipo de Producto       */}
          {/* ======================================================== */}
          <div className="border border-subtle bg-elevated/40 rounded-xl p-5 space-y-5">
            <span className="text-[10px] uppercase tracking-widest text-secondary font-sans font-semibold block">
              3. TIPO DE PRODUCTO, CANAL COMERCIAL &amp; COSTOS ERP
            </span>

            {/* Tipo de Producto: Físico vs Digital */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEsFisico(true)}
                className={`p-3 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                  esFisico
                    ? 'border-strong bg-surface text-primary shadow-xs'
                    : 'border-subtle bg-elevated/60 text-secondary hover:border-strong'
                }`}
              >
                <div>
                  <span className="font-heading font-bold text-xs uppercase block">
                    PRODUCTO FÍSICO
                  </span>
                  <span className="text-[11px] text-muted">
                    Prenda o calzado con stock en sucursal y logística de despacho.
                  </span>
                </div>
                {esFisico && <Check size={16} weight="bold" className="text-primary" />}
              </button>

              <button
                type="button"
                onClick={() => setEsFisico(false)}
                className={`p-3 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                  !esFisico
                    ? 'border-strong bg-surface text-primary shadow-xs'
                    : 'border-subtle bg-elevated/60 text-secondary hover:border-strong'
                }`}
              >
                <div>
                  <span className="font-heading font-bold text-xs uppercase block">
                    PRODUCTO DIGITAL / SERVICIO
                  </span>
                  <span className="text-[11px] text-muted">
                    Gift cards, membresías o artículos intangibles sin peso de envío.
                  </span>
                </div>
                {!esFisico && <Check size={16} weight="bold" className="text-primary" />}
              </button>
            </div>

            {/* Unidad de Negocio (Canal Comercial) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans block">
                UNIDAD DE NEGOCIO (CANAL COMERCIAL) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUnidadNegocioId(1)}
                  className={`p-3 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                    unidadNegocioId === 1
                      ? 'border-strong bg-surface text-primary shadow-xs'
                      : 'border-subtle bg-elevated/60 text-secondary hover:border-strong'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-xs">DASTIK</span>
                      <span className="text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-1 rounded">
                        TIENDANUBE + POS
                      </span>
                    </div>
                    <span className="text-[11px] text-muted">Indumentaria y prendas urbanas.</span>
                  </div>
                  {unidadNegocioId === 1 && <Check size={16} weight="bold" />}
                </button>

                <button
                  type="button"
                  onClick={() => setUnidadNegocioId(2)}
                  className={`p-3 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                    unidadNegocioId === 2
                      ? 'border-strong bg-surface text-primary shadow-xs'
                      : 'border-subtle bg-elevated/60 text-secondary hover:border-strong'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-xs">HIDDEN SNEAKERS</span>
                      <span className="text-[9px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-1 rounded">
                        EXCLUSIVO LOCAL
                      </span>
                    </div>
                    <span className="text-[11px] text-muted">Calzado y pares de colección física.</span>
                  </div>
                  {unidadNegocioId === 2 && <Check size={16} weight="bold" />}
                </button>
              </div>
            </div>

            {/* Marca, Categoría y Proveedor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5 w-full text-left">
                <label
                  htmlFor="marcaId"
                  className="text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans"
                >
                  MARCA *
                </label>
                <select
                  id="marcaId"
                  value={marcaId}
                  onChange={(e) => setMarcaId(Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full bg-surface text-primary border border-subtle focus:border-strong rounded-lg px-3.5 py-2.5 text-xs outline-none transition-colors font-sans cursor-pointer"
                >
                  {marcasCatalogo.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 w-full text-left">
                <label
                  htmlFor="categoriaId"
                  className="text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans"
                >
                  CATEGORÍA PRINCIPAL *
                </label>
                <select
                  id="categoriaId"
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full bg-surface text-primary border border-subtle focus:border-strong rounded-lg px-3.5 py-2.5 text-xs outline-none transition-colors font-sans cursor-pointer"
                >
                  {categoriasCatalogo.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 w-full text-left">
                <label
                  htmlFor="proveedorId"
                  className="text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans"
                >
                  PROVEEDOR (MARKUP SUGERIDO) *
                </label>
                <select
                  id="proveedorId"
                  value={proveedorId}
                  onChange={(e) => handleSelectProveedor(Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full bg-surface text-primary border border-subtle focus:border-strong rounded-lg px-3.5 py-2.5 text-xs outline-none transition-colors font-sans cursor-pointer"
                >
                  {proveedoresCatalogo.map((p) => {
                    const pct =
                      p.markupPorDefecto <= 10
                        ? Math.round((p.markupPorDefecto - 1) * 100)
                        : Math.round(p.markupPorDefecto);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (+{pct}%)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Estructura Financiera */}
            <div className="border border-subtle bg-surface rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle pb-2">
                <span className="text-[10px] uppercase tracking-widest text-secondary font-sans font-semibold">
                  ESTRUCTURA DE COSTO Y MARGEN COMERCIAL
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  MARGEN ESTIMADO: +{margenPorcentaje}% (MARKUP {markupCalculado}x)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="costoBase"
                  label="PRECIO DE COSTO (ARS) *"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="15000"
                  value={costoBase}
                  onChange={(e) => handleChangeCostoBase(e.target.value)}
                  disabled={isLoading}
                  required
                />

                <Input
                  id="precioVenta"
                  label="PRECIO DE VENTA AL PÚBLICO (ARS) *"
                  type="number"
                  min="1"
                  step="50"
                  placeholder="22500"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Botones de Markup Rápido */}
              <div className="flex items-center gap-2 pt-1 text-xs text-muted flex-wrap">
                <span className="text-[10px] uppercase tracking-wider font-sans">
                  MARKUP RÁPIDO:
                </span>
                {proveedorSeleccionado && (
                  <button
                    type="button"
                    onClick={() =>
                      setPrecioVenta(Math.round(costoNum * multiplicadorActivo).toString())
                    }
                    className="px-2.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 cursor-pointer"
                  >
                    Proveedor ({multiplicadorActivo.toFixed(2)}x)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPrecioVenta(Math.round(costoNum * 1.5).toString())}
                  className="px-2.5 py-0.5 rounded border border-subtle hover:border-strong bg-elevated text-[10px] font-mono text-primary cursor-pointer"
                >
                  +50% (x1.50)
                </button>
                <button
                  type="button"
                  onClick={() => setPrecioVenta(Math.round(costoNum * 1.6).toString())}
                  className="px-2.5 py-0.5 rounded border border-subtle hover:border-strong bg-elevated text-[10px] font-mono text-primary cursor-pointer"
                >
                  +60% (x1.60)
                </button>
                <button
                  type="button"
                  onClick={() => setPrecioVenta(Math.round(costoNum * 1.7).toString())}
                  className="px-2.5 py-0.5 rounded border border-subtle hover:border-strong bg-elevated text-[10px] font-mono text-primary cursor-pointer"
                >
                  +70% (x1.70)
                </button>
                <button
                  type="button"
                  onClick={() => setPrecioVenta(Math.round(costoNum * 2.0).toString())}
                  className="px-2.5 py-0.5 rounded border border-subtle hover:border-strong bg-elevated text-[10px] font-mono text-primary cursor-pointer"
                >
                  +100% (x2.00)
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* BLOQUE 4: Variantes y Stock (Tiendanube Table)            */}
          {/* ======================================================== */}
          <CrearProductoVariantesSection
            variantes={variantes}
            curvaActivaId={curvaActivaId}
            onChangeCurvaActivaId={setCurvaActivaId}
            nuevoTalle={nuevoTalle}
            onChangeNuevoTalle={setNuevoTalle}
            nuevoColor={nuevoColor}
            onChangeNuevoColor={setNuevoColor}
            nuevoStock={nuevoStock}
            onChangeNuevoStock={setNuevoStock}
            nuevoCodigoBarras={nuevoCodigoBarras}
            onChangeNuevoCodigoBarras={setNuevoCodigoBarras}
            nuevoPrecioPromo={nuevoPrecioPromo}
            onChangeNuevoPrecioPromo={setNuevoPrecioPromo}
            nuevoPesoKg={nuevoPesoKg}
            onChangeNuevoPesoKg={setNuevoPesoKg}
            onAutogenerarEan={handleAutogenerarEan}
            onAgregarVariante={handleAgregarVariante}
            onAgregarCurvaCompleta={handleAgregarCurvaCompleta}
            onEliminarVariante={handleEliminarVariante}
            onActualizarVariante={handleActualizarVariante}
            isLoading={isLoading}
          />

          {/* ======================================================== */}
          {/* BLOQUE 5: Categorías Múltiples & Colecciones Destacadas   */}
          {/* ======================================================== */}
          <div className="border border-subtle bg-elevated/40 rounded-xl p-5 space-y-4">
            <span className="text-[10px] uppercase tracking-widest text-secondary font-sans font-semibold block">
              5. SUBCATEGORÍAS &amp; COLECCIONES DESTACADAS
            </span>

            {/* Chips de Subcategorías */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans block">
                ETIQUETAS / SUBCATEGORÍAS ADICIONALES
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="ej: Oversize, Drop 31, Heavyweight (Presioná Enter)"
                  value={inputSubcategoria}
                  onChange={(e) => setInputSubcategoria(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAgregarSubcategoria();
                    }
                  }}
                  disabled={isLoading}
                  className="flex-1 bg-surface text-primary border border-subtle focus:border-strong rounded-lg px-3.5 py-2 text-xs outline-none placeholder-muted"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAgregarSubcategoria}
                  disabled={isLoading || !inputSubcategoria.trim()}
                  className="text-xs shrink-0"
                >
                  + AGREGAR CHIP
                </Button>
              </div>

              {subcategorias.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {subcategorias.map((sub) => (
                    <span
                      key={sub}
                      className="border border-subtle bg-surface px-2.5 py-1 rounded-md text-xs text-primary flex items-center gap-1.5 shadow-xs"
                    >
                      <Tag size={12} weight="bold" className="text-muted" />
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSubcategorias((prev) => prev.filter((s) => s !== sub))
                        }
                        className="text-muted hover:text-red-500 cursor-pointer ml-0.5"
                      >
                        <X size={12} weight="bold" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Colecciones Destacadas */}
            <div className="pt-2 border-t border-subtle space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans block">
                DESTACAR EN TIENDANUBE / CATÁLOGO
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {['Nuevos', 'Destacados', 'Ofertas / Sale'].map((col) => {
                  const activa = destacados.includes(col);
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => handleToggleDestacado(col)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-sans font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        activa
                          ? 'border-amber-500/60 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'border-subtle bg-surface text-secondary hover:text-primary hover:border-strong'
                      }`}
                    >
                      <Check
                        size={14}
                        weight="bold"
                        className={activa ? 'opacity-100' : 'opacity-0'}
                      />
                      <span>{col}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* BLOQUE 6: SEO & Buscadores (Collapsible)                 */}
          {/* ======================================================== */}
          <div className="border border-subtle bg-elevated/40 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setMostrarSeo((prev) => !prev)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-elevated/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <MagnifyingGlass size={18} weight="bold" className="text-secondary" />
                <span className="text-[10px] uppercase tracking-widest text-secondary font-sans font-semibold">
                  6. AJUSTES SEO PARA GOOGLE &amp; TIENDANUBE (OPCIONAL)
                </span>
              </div>
              {mostrarSeo ? (
                <CaretUp size={16} weight="bold" className="text-secondary" />
              ) : (
                <CaretDown size={16} weight="bold" className="text-secondary" />
              )}
            </button>

            {mostrarSeo && (
              <div className="p-5 pt-0 space-y-4 border-t border-subtle">
                <Input
                  id="tagsSeo"
                  label="TAGS SEO (PALABRAS CLAVE SEPARADAS POR COMA)"
                  placeholder="ej: remera, boxy, streetwear, oversize, drop 31"
                  value={tagsSeo}
                  onChange={(e) => setTagsSeo(e.target.value)}
                  disabled={isLoading}
                />

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="seoTitulo"
                      className="text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans"
                    >
                      TÍTULO SEO (GOOGLE TITLE TAG)
                    </label>
                    <span
                      className={`text-[10px] font-mono ${
                        seoTitulo.length > 70 ? 'text-red-500 font-bold' : 'text-muted'
                      }`}
                    >
                      {seoTitulo.length} / 70
                    </span>
                  </div>
                  <input
                    id="seoTitulo"
                    type="text"
                    maxLength={100}
                    placeholder="ej: Remera Boxy Heavyweight Dastik | Moda Urbana Streetwear"
                    value={seoTitulo}
                    onChange={(e) => setSeoTitulo(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-surface text-primary border border-subtle focus:border-strong rounded-lg px-3.5 py-2 text-xs outline-none placeholder-muted"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="seoDescripcion"
                      className="text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans"
                    >
                      DESCRIPCIÓN SEO (META DESCRIPTION)
                    </label>
                    <span
                      className={`text-[10px] font-mono ${
                        seoDescripcion.length > 160 ? 'text-red-500 font-bold' : 'text-muted'
                      }`}
                    >
                      {seoDescripcion.length} / 160
                    </span>
                  </div>
                  <textarea
                    id="seoDescripcion"
                    rows={2}
                    maxLength={250}
                    placeholder="Breve resumen para el snippet de resultados de búsqueda en Google..."
                    value={seoDescripcion}
                    onChange={(e) => setSeoDescripcion(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-surface text-primary border border-subtle focus:border-strong rounded-lg px-3.5 py-2 text-xs outline-none placeholder-muted resize-y"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* FOOTER: Sincronización Tiendanube & Acciones             */}
          {/* ======================================================== */}
          <div className="border border-subtle bg-elevated rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                id="toggleTiendanube"
                type="checkbox"
                checked={sincronizarTiendanube && unidadNegocioId === 1}
                disabled={unidadNegocioId !== 1 || isLoading}
                onChange={(e) => setSincronizarTiendanube(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <label
                htmlFor="toggleTiendanube"
                className={`text-xs font-heading font-bold select-none cursor-pointer ${
                  unidadNegocioId === 1 ? 'text-primary' : 'text-muted'
                }`}
              >
                Sincronizar con Tiendanube Oficial
              </label>

              {isSandboxMode ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Simulación Sandbox Activa (Offline)
                </span>
              ) : unidadNegocioId !== 1 ? (
                <span className="text-[10px] font-mono text-muted">
                  (Solo aplica a Unidad Dastik)
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onClose}
                disabled={isLoading}
                className="text-xs"
              >
                CANCELAR [ESC]
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isLoading || variantes.length === 0}
                className="gap-2 text-xs py-3 px-6 font-bold"
              >
                <Package size={17} weight="bold" />
                <span>
                  {isLoading
                    ? 'GUARDANDO CAMBIOS...'
                    : esModoEdicion
                    ? 'GUARDAR CAMBIOS'
                    : 'CREAR PRENDA EN CATÁLOGO'}
                </span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
