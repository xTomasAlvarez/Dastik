import React, { useState, useEffect, useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, WarningCircle, Package, Check } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  inventarioApi,
  type CrearProductoRequest,
} from '../../pos/api/inventarioApi';
import { configuracionApi } from '../api/configuracionApi';
import {
  CrearProductoVariantesSection,
  type VarianteTemporal,
} from './CrearProductoVariantesSection';
import type { AxiosError } from 'axios';

interface ModalCrearProductoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Algoritmo GS1 EAN-13 estándar (Prefijo '20' para códigos de barras internos de retail)
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

// Convierte el markup del proveedor (ej: 1.55 o 55) en multiplicador comercial (1.55)
const obtenerMultiplicadorProveedor = (markupPorDefecto: number): number => {
  if (!markupPorDefecto || markupPorDefecto <= 0) return 1.5;
  return markupPorDefecto <= 10 ? markupPorDefecto : 1 + markupPorDefecto / 100;
};

export const ModalCrearProducto: React.FC<ModalCrearProductoProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const modalHeadingId = useId();

  // Estados del Formulario Principal
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [unidadNegocioId, setUnidadNegocioId] = useState<number>(1);
  const [categoriaId, setCategoriaId] = useState<number>(1);
  const [marcaId, setMarcaId] = useState<number>(1);
  const [proveedorId, setProveedorId] = useState<number>(1);

  // Estados de Precios
  const [costoBase, setCostoBase] = useState<string>('15000');
  const [precioVenta, setPrecioVenta] = useState<string>('22500');

  // Estados de Variantes
  const [variantes, setVariantes] = useState<VarianteTemporal[]>([
    {
      tempId: 'init-1',
      talle: 'M',
      color: 'Negro',
      codigoBarras: generarEan13(),
      stockFisico: 10,
    },
  ]);

  // Mini-formulario para agregar variante
  const [nuevoTalle, setNuevoTalle] = useState('');
  const [nuevoColor, setNuevoColor] = useState('Negro');
  const [nuevoStock, setNuevoStock] = useState('5');
  const [nuevoCodigoBarras, setNuevoCodigoBarras] = useState('');
  const [curvaActivaId, setCurvaActivaId] = useState<string>('arriba');

  // Estados de Carga y Errores
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Catálogos dinámicos desde /api/inventario/* (alimentados por /admin/configuracion)
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

  // Sincronizar IDs seleccionados con la base de datos real al cargar los catálogos
  useEffect(() => {
    if (!isOpen) return;

    if (
      marcasCatalogo.length > 0 &&
      !marcasCatalogo.some((m) => m.id === marcaId)
    ) {
      setMarcaId(marcasCatalogo[0].id);
    }

    if (
      categoriasCatalogo.length > 0 &&
      !categoriasCatalogo.some((c) => c.id === categoriaId)
    ) {
      setCategoriaId(categoriasCatalogo[0].id);
    }

    if (proveedoresCatalogo.length > 0) {
      const existeProv = proveedoresCatalogo.find((p) => p.id === proveedorId);
      const provInicial = existeProv || proveedoresCatalogo[0];
      if (!existeProv) {
        setProveedorId(provInicial.id);
      }
      const mult = obtenerMultiplicadorProveedor(provInicial.markupPorDefecto);
      const costoActual = parseFloat(costoBase) || 0;
      if (costoActual > 0) {
        setPrecioVenta(Math.round(costoActual * mult).toString());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, marcasCatalogo, categoriasCatalogo, proveedoresCatalogo]);

  // Recalcular Precio de Venta sugerido al seleccionar un Proveedor
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

  // Recalcular Precio de Venta sugerido en vivo cuando cambia el Costo Base
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

  // Cambiar valores por defecto según la unidad de negocio seleccionada
  const handleSelectUnidad = (id: number) => {
    setUnidadNegocioId(id);
    if (id === 1) {
      const marcaDastik =
        marcasCatalogo.find((m) => m.nombre.toLowerCase().includes('dastik')) ||
        marcasCatalogo[0];
      const catInd =
        categoriasCatalogo.find((c) => c.nombre.toLowerCase().includes('indumentaria')) ||
        categoriasCatalogo[0];
      const provDastik =
        proveedoresCatalogo.find((p) => p.nombre.toLowerCase().includes('dastik')) ||
        proveedoresCatalogo[0];

      if (marcaDastik) setMarcaId(marcaDastik.id);
      if (catInd) setCategoriaId(catInd.id);
      setCurvaActivaId('arriba');
      if (provDastik) handleSelectProveedor(provDastik.id);
    } else {
      const marcaSneaker =
        marcasCatalogo.find((m) => !m.nombre.toLowerCase().includes('dastik')) ||
        marcasCatalogo[0];
      const catCalzado =
        categoriasCatalogo.find((c) => c.nombre.toLowerCase().includes('calzado')) ||
        categoriasCatalogo[0];
      const provSneaker =
        proveedoresCatalogo.find((p) => p.nombre.toLowerCase().includes('sneaker')) ||
        proveedoresCatalogo[proveedoresCatalogo.length - 1];

      if (marcaSneaker) setMarcaId(marcaSneaker.id);
      if (catCalzado) setCategoriaId(catCalzado.id);
      setCurvaActivaId('zapatillasBajos');
      if (provSneaker) handleSelectProveedor(provSneaker.id);
    }
  };

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
      setErrorMessage('El stock físico debe ser un número mayor o igual a 0.');
      return;
    }

    const eanFinal = nuevoCodigoBarras.trim()
      ? nuevoCodigoBarras.trim()
      : generarEan13();

    const nueva: VarianteTemporal = {
      tempId: `var-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      talle: nuevoTalle.trim().toUpperCase(),
      color: nuevoColor.trim() || 'Único',
      stockFisico: stock,
      codigoBarras: eanFinal,
    };

    setVariantes((prev) => [...prev, nueva]);
    setNuevoTalle('');
    setNuevoCodigoBarras('');
    setErrorMessage(null);
  };

  const handleEliminarVariante = (tempId: string) => {
    setVariantes((prev) => prev.filter((v) => v.tempId !== tempId));
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
    }));
    setVariantes((prev) => [...prev, ...nuevas]);
    setErrorMessage(null);
  };

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nombre.trim()) {
      setErrorMessage('El nombre del producto es obligatorio.');
      return;
    }

    if (costoNum < 0 || isNaN(costoNum)) {
      setErrorMessage('El precio de costo no puede ser negativo.');
      return;
    }

    if (ventaNum <= 0 || isNaN(ventaNum)) {
      setErrorMessage('El precio de venta debe ser mayor a 0.');
      return;
    }

    if (variantes.length === 0) {
      setErrorMessage(
        'Debes configurar al menos una variante (talle y stock) para el producto.'
      );
      return;
    }

    setIsLoading(true);

    const payload: CrearProductoRequest = {
      unidadNegocioId,
      categoriaId,
      marcaId,
      proveedorId,
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || `${nombre.trim()} - Catálogo Dastik POS`,
      imagenUrl: imagenUrl.trim() || '',
      costoBase: costoNum,
      markupAplicado: markupCalculado,
      precioVenta: ventaNum,
      variantes: variantes.map((v) => ({
        talle: v.talle,
        color: v.color,
        codigoBarras: v.codigoBarras,
        stockFisico: v.stockFisico,
      })),
    };

    try {
      await inventarioApi.crearProducto(payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<{
        detail?: string;
        title?: string;
        errors?: Record<string, string[]>;
      }>;
      const detail = axiosError.response?.data?.detail;
      const title = axiosError.response?.data?.title;
      let validationMsg = '';
      if (axiosError.response?.data?.errors) {
        validationMsg = Object.values(axiosError.response.data.errors)
          .flat()
          .join(' · ');
      }

      setErrorMessage(
        validationMsg ||
          detail ||
          title ||
          'Error al registrar el producto. Verifica los datos ingresados.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div
        className="w-full max-w-4xl bg-surface border border-subtle rounded-xl shadow-floating max-h-[92vh] flex flex-col text-left relative my-auto overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalHeadingId}
      >
        {/* 1. Header limpio sin subtítulos artificiales */}
        <div className="flex items-center justify-between border-b border-subtle px-6 py-4 bg-elevated/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="border border-subtle bg-surface rounded-lg p-2 text-primary shrink-0">
              <Package size={20} weight="duotone" />
            </div>
            <h2
              id={modalHeadingId}
              className="text-base md:text-lg font-heading font-bold text-primary tracking-tight"
            >
              Nuevo Producto y Variantes
            </h2>
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

        {/* 2. Cuerpo del Formulario con Scroll Interno */}
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

          {/* Bloque 1: Unidad de Negocio (Multi-Tenant Selector) */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-secondary font-sans font-semibold block">
              UNIDAD DE NEGOCIO (CANAL COMERCIAL)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectUnidad(1)}
                className={`p-3.5 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                  unidadNegocioId === 1
                    ? 'border-strong bg-elevated text-primary shadow-surface'
                    : 'border-subtle bg-surface text-secondary hover:border-strong'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm tracking-wide text-primary">
                      DASTIK
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded px-1.5 py-0.5">
                      TIENDANUBE + POS
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-secondary mt-1">
                    Indumentaria y prendas. Sincroniza stock físico y digital en Tiendanube.
                  </p>
                </div>
                {unidadNegocioId === 1 && (
                  <Check size={16} weight="bold" className="text-primary shrink-0 mt-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSelectUnidad(2)}
                className={`p-3.5 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                  unidadNegocioId === 2
                    ? 'border-strong bg-elevated text-primary shadow-surface'
                    : 'border-subtle bg-surface text-secondary hover:border-strong'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm tracking-wide text-primary">
                      HIDDEN SNEAKERS
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded px-1.5 py-0.5">
                      EXCLUSIVO LOCAL
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-secondary mt-1">
                    Calzado sneakerhead y pares físicos. Aislamiento físico sin sincronización outbox.
                  </p>
                </div>
                {unidadNegocioId === 2 && (
                  <Check size={16} weight="bold" className="text-primary shrink-0 mt-0.5" />
                )}
              </button>
            </div>
          </div>

          {/* Bloque 2: Información General del Producto (Conectado a /admin/configuracion) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="nombre"
              label="NOMBRE DEL PRODUCTO *"
              placeholder="ej: Hoodie Avant-Garde Heavyweight"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={isLoading}
              required
            />

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
                className="w-full bg-surface text-primary border border-subtle focus:border-strong rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors font-sans cursor-pointer"
              >
                {marcasCatalogo.length > 0 ? (
                  marcasCatalogo.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))
                ) : (
                  <>
                    <option value={1}>Dastik</option>
                    <option value={2}>Nike</option>
                    <option value={3}>Adidas</option>
                  </>
                )}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 w-full text-left">
              <label
                htmlFor="categoriaId"
                className="text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans"
              >
                CATEGORÍA *
              </label>
              <select
                id="categoriaId"
                value={categoriaId}
                onChange={(e) => setCategoriaId(Number(e.target.value))}
                disabled={isLoading}
                className="w-full bg-surface text-primary border border-subtle focus:border-strong rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors font-sans cursor-pointer"
              >
                {categoriasCatalogo.length > 0 ? (
                  categoriasCatalogo.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.esquemaTalles})
                    </option>
                  ))
                ) : (
                  <>
                    <option value={1}>Indumentaria (XS - XXL)</option>
                    <option value={2}>Calzado (Sneakers / US)</option>
                  </>
                )}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 w-full text-left">
              <label
                htmlFor="proveedorId"
                className="text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans"
              >
                PROVEEDOR (AUTO-MARKUP) *
              </label>
              <select
                id="proveedorId"
                value={proveedorId}
                onChange={(e) => handleSelectProveedor(Number(e.target.value))}
                disabled={isLoading}
                className="w-full bg-surface text-primary border border-subtle focus:border-strong rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors font-sans cursor-pointer"
              >
                {proveedoresCatalogo.length > 0 ? (
                  proveedoresCatalogo.map((p) => {
                    const pct =
                      p.markupPorDefecto <= 10
                        ? Math.round((p.markupPorDefecto - 1) * 100)
                        : Math.round(p.markupPorDefecto);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (Markup +{pct}%)
                      </option>
                    );
                  })
                ) : (
                  <>
                    <option value={1}>Proveedor Textil Dastik (Markup +50%)</option>
                    <option value={2}>Proveedor Sneakerheads (Markup +60%)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Descripción e Imagen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="descripcion"
              label="DESCRIPCIÓN DEL ARTÍCULO"
              placeholder="Detalles de tela, confección o lanzamiento..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={isLoading}
            />

            <Input
              id="imagenUrl"
              label="URL DE IMAGEN (OPCIONAL)"
              placeholder="https://..."
              value={imagenUrl}
              onChange={(e) => setImagenUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Bloque 3: Estructura Financiera (Costo, Venta y Margen Automático) */}
          <div className="border border-subtle bg-elevated rounded-xl p-4 md:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle pb-2">
              <span className="text-[10px] uppercase tracking-widest text-secondary font-sans font-semibold">
                ESTRUCTURA DE PRECIOS &amp; MARGEN (SUGERIDO POR PROVEEDOR:{' '}
                {multiplicadorActivo.toFixed(2)}x)
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                MARGEN: +{margenPorcentaje}% (MARKUP {markupCalculado}x)
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

            {/* Accesos rápidos de Markup */}
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
                  className="px-2.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                >
                  Proveedor ({multiplicadorActivo.toFixed(2)}x)
                </button>
              )}
              <button
                type="button"
                onClick={() => setPrecioVenta(Math.round(costoNum * 1.5).toString())}
                className="px-2.5 py-0.5 rounded border border-subtle hover:border-strong bg-surface text-[10px] font-mono text-primary transition-colors cursor-pointer"
              >
                +50% (x1.50)
              </button>
              <button
                type="button"
                onClick={() => setPrecioVenta(Math.round(costoNum * 1.6).toString())}
                className="px-2.5 py-0.5 rounded border border-subtle hover:border-strong bg-surface text-[10px] font-mono text-primary transition-colors cursor-pointer"
              >
                +60% (x1.60)
              </button>
              <button
                type="button"
                onClick={() => setPrecioVenta(Math.round(costoNum * 2.0).toString())}
                className="px-2.5 py-0.5 rounded border border-subtle hover:border-strong bg-surface text-[10px] font-mono text-primary transition-colors cursor-pointer"
              >
                +100% (x2.00)
              </button>
            </div>
          </div>

          {/* Bloque 4: Sección Modularizada de Variantes y Stock */}
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
            onAutogenerarEan={handleAutogenerarEan}
            onAgregarVariante={handleAgregarVariante}
            onAgregarCurvaCompleta={handleAgregarCurvaCompleta}
            onEliminarVariante={handleEliminarVariante}
            isLoading={isLoading}
          />

          {/* 3. Acciones de Cierre y Guardado */}
          <div className="flex items-center justify-between pt-4 border-t border-subtle">
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
                {isLoading ? 'GUARDANDO ARTÍCULO...' : 'GUARDAR PRODUCTO EN CATÁLOGO'}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
