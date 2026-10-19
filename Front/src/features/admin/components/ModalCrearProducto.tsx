import React, { useState, useEffect, useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Plus,
  Trash,
  Barcode,
  Sparkle,
  WarningCircle,
  Package,
  Check
} from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  inventarioApi,
  type CrearVarianteItemRequest,
  type CrearProductoRequest
} from '../../pos/api/inventarioApi';
import { configuracionApi } from '../api/configuracionApi';
import type { AxiosError } from 'axios';

interface ModalCrearProductoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface VarianteTemporal extends CrearVarianteItemRequest {
  tempId: string;
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

// Curvas de talles oficiales del negocio
const CURVAS_DISPONIBLES = [
  {
    id: 'arriba',
    label: 'Partes de arriba (Remeras, Buzos, Camperas)',
    shortLabel: 'Arriba (XS-XL)',
    talles: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    id: 'abajo',
    label: 'Partes de abajo (Pantalones, Bermudas)',
    shortLabel: 'Abajo (36-50)',
    talles: ['36', '38', '40', '42', '44', '46', '48', '50'],
  },
  {
    id: 'zapatillasBajos',
    label: 'Zapatillas Brasil (Bajos 35-39)',
    shortLabel: 'Zapatillas (35-39)',
    talles: ['35', '36', '37', '38', '39'],
  },
  {
    id: 'zapatillasAltos',
    label: 'Zapatillas Brasil (Altos 39-43)',
    shortLabel: 'Zapatillas (39-43)',
    talles: ['39', '40', '41', '42', '43'],
  },
  {
    id: 'accesorios',
    label: 'Accesorios (Gorras, Medias, Cintos)',
    shortLabel: 'Accesorios (TU)',
    talles: ['TU'],
  },
];

export const ModalCrearProducto: React.FC<ModalCrearProductoProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const modalHeadingId = useId();

  // Estados del Formulario Principal
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [unidadNegocioId, setUnidadNegocioId] = useState<number>(1); // 1 = Dastik, 2 = Hidden Sneakers
  const [categoriaId, setCategoriaId] = useState<number>(1); // 1 = Indumentaria, 2 = Calzado
  const [marcaId, setMarcaId] = useState<number>(1); // 1 = Dastik, 2 = Nike, 3 = Adidas
  const [proveedorId, setProveedorId] = useState<number>(1); // 1 = Textil Dastik, 2 = Sneakerheads

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
      stockFisico: 10
    }
  ]);

  // Mini-formulario para agregar variante
  const [nuevoTalle, setNuevoTalle] = useState('');
  const [nuevoColor, setNuevoColor] = useState('Negro');
  const [nuevoStock, setNuevoStock] = useState('5');
  const [nuevoCodigoBarras, setNuevoCodigoBarras] = useState('');

  // Curva activa de talles
  const [curvaActivaId, setCurvaActivaId] = useState<string>('arriba');

  // Estados de Carga y Errores
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Catálogos dinámicos desde /api/inventario/*
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

  const curvaActiva = CURVAS_DISPONIBLES.find((c) => c.id === curvaActivaId) || CURVAS_DISPONIBLES[0];

  // Cálculos automáticos de Markup y Margen
  const costoNum = parseFloat(costoBase) || 0;
  const ventaNum = parseFloat(precioVenta) || 0;
  const markupCalculado = costoNum > 0 ? Number((ventaNum / costoNum).toFixed(2)) : 1.5;
  const margenPorcentaje = costoNum > 0 ? (((ventaNum - costoNum) / costoNum) * 100).toFixed(1) : '0';

  const handleSelectProveedor = (id: number) => {
    setProveedorId(id);
    const prov = proveedoresCatalogo.find((p) => p.id === id);
    if (prov && costoNum > 0) {
      const multiplicador =
        prov.markupPorDefecto <= 10
          ? prov.markupPorDefecto
          : 1 + prov.markupPorDefecto / 100;
      const sugerido = Math.round(costoNum * multiplicador);
      if (sugerido > 0) {
        setPrecioVenta(sugerido.toString());
      }
    }
  };

  // Cambiar valores por defecto según la unidad de negocio seleccionada
  const handleSelectUnidad = (id: number) => {
    setUnidadNegocioId(id);
    if (id === 1) {
      setMarcaId(1); // Dastik
      setCategoriaId(1); // Indumentaria
      setCurvaActivaId('arriba');
      handleSelectProveedor(1); // Proveedor Textil Dastik
    } else {
      setMarcaId(2); // Nike
      setCategoriaId(2); // Calzado
      setCurvaActivaId('zapatillasBajos');
      handleSelectProveedor(2); // Proveedor Sneakerheads
    }
  };

  // Autogenerar código de barras en el mini-formulario
  const handleAutogenerarEan = () => {
    setNuevoCodigoBarras(generarEan13());
  };

  // Agregar variante a la lista temporal
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

    const eanFinal = nuevoCodigoBarras.trim() ? nuevoCodigoBarras.trim() : generarEan13();

    const nueva: VarianteTemporal = {
      tempId: `var-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      talle: nuevoTalle.trim().toUpperCase(),
      color: nuevoColor.trim() || 'Único',
      stockFisico: stock,
      codigoBarras: eanFinal
    };

    setVariantes((prev) => [...prev, nueva]);
    setNuevoTalle('');
    setNuevoCodigoBarras('');
    setErrorMessage(null);
  };

  // Eliminar variante de la lista
  const handleEliminarVariante = (tempId: string) => {
    setVariantes((prev) => prev.filter((v) => v.tempId !== tempId));
  };

  // Agregar la curva completa de una sola vez
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

  // Manejo de tecla Escape para cerrar y bloqueo de scroll de fondo
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

  // Guardar producto
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
      setErrorMessage('Debes configurar al menos una variante (talle y stock) para el producto.');
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
        stockFisico: v.stockFisico
      }))
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

  const totalStockConfigurado = variantes.reduce((acc, v) => acc + v.stockFisico, 0);

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div
        className="w-full max-w-4xl bg-[#090909] border border-[#333333] max-h-[92vh] flex flex-col text-left relative my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalHeadingId}
      >
        {/* 1. Header Avant-Garde */}
        <div className="flex items-center justify-between border-b border-[#222222] px-6 py-4 bg-[#0A0A0A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="border border-[#333333] bg-[#141414] p-2 text-[#FAFAFA] shrink-0">
              <Package size={22} weight="light" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#71717A] font-sans block">
                ADMIN // INVENTARIO CENTRAL
              </span>
              <h2
                id={modalHeadingId}
                className="text-lg md:text-xl font-heading font-extrabold text-[#FAFAFA] tracking-tight uppercase"
              >
                NUEVO PRODUCTO & VARIANTES
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-[#71717A] hover:text-[#FAFAFA] transition-fast p-1.5 cursor-pointer disabled:opacity-50"
            title="Cerrar modal [ESC]"
            aria-label="Cerrar modal [ESC]"
          >
            <X size={20} weight="light" />
          </button>
        </div>

        {/* 2. Cuerpo del Formulario con Scroll Interno */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-7">
          {/* Alerta de Error */}
          {errorMessage && (
            <div className="border border-red-900 bg-red-950/40 p-3 text-red-200 text-xs font-sans flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <WarningCircle size={17} weight="light" className="shrink-0 text-red-400 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-200 p-0.5 transition-fast cursor-pointer shrink-0"
              >
                <X size={15} weight="light" />
              </button>
            </div>
          )}

          {/* Bloque 1: Unidad de Negocio (Multi-Tenant Selector) */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-[#71717A] font-sans font-semibold block">
              UNIDAD DE NEGOCIO (CANAL COMERCIAL)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectUnidad(1)}
                className={`p-3 border text-left flex items-start justify-between transition-fast cursor-pointer ${
                  unidadNegocioId === 1
                    ? 'border-[#FAFAFA] bg-[#141414] text-[#FAFAFA]'
                    : 'border-[#222222] bg-[#0C0C0C] text-[#71717A] hover:border-[#444444]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm tracking-wide">DASTIK</span>
                    <span className="text-[10px] uppercase tracking-wider bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 px-1.5 py-0.5">
                      TIENDANUBE + POS
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-[#71717A] mt-1">
                    Indumentaria y prendas. Sincroniza stock físico y digital en Tiendanube.
                  </p>
                </div>
                {unidadNegocioId === 1 && <Check size={16} weight="bold" className="text-[#FAFAFA] shrink-0 mt-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => handleSelectUnidad(2)}
                className={`p-3 border text-left flex items-start justify-between transition-fast cursor-pointer ${
                  unidadNegocioId === 2
                    ? 'border-[#FAFAFA] bg-[#141414] text-[#FAFAFA]'
                    : 'border-[#222222] bg-[#0C0C0C] text-[#71717A] hover:border-[#444444]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm tracking-wide">HIDDEN SNEAKERS</span>
                    <span className="text-[10px] uppercase tracking-wider bg-amber-950/40 border border-amber-900/50 text-amber-400 px-1.5 py-0.5">
                      EXCLUSIVO LOCAL
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-[#71717A] mt-1">
                    Calzado sneakerhead y pares físicos. Aislamiento físico sin sincronización outbox.
                  </p>
                </div>
                {unidadNegocioId === 2 && <Check size={16} weight="bold" className="text-[#FAFAFA] shrink-0 mt-0.5" />}
              </button>
            </div>
          </div>

          {/* Bloque 2: Información General del Producto */}
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

            <div className="flex flex-col gap-1 w-full text-left">
              <label htmlFor="marcaId" className="text-xs uppercase tracking-widest text-[#71717A] font-sans">
                MARCA *
              </label>
              <select
                id="marcaId"
                value={marcaId}
                onChange={(e) => setMarcaId(Number(e.target.value))}
                disabled={isLoading}
                className="w-full bg-[#111111] text-[#FAFAFA] border border-[#333333] focus:border-[#FAFAFA] px-3 py-2.5 text-sm outline-none transition-fast font-sans cursor-pointer"
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

            <div className="flex flex-col gap-1 w-full text-left">
              <label htmlFor="categoriaId" className="text-xs uppercase tracking-widest text-[#71717A] font-sans">
                CATEGORÍA *
              </label>
              <select
                id="categoriaId"
                value={categoriaId}
                onChange={(e) => setCategoriaId(Number(e.target.value))}
                disabled={isLoading}
                className="w-full bg-[#111111] text-[#FAFAFA] border border-[#333333] focus:border-[#FAFAFA] px-3 py-2.5 text-sm outline-none transition-fast font-sans cursor-pointer"
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

            <div className="flex flex-col gap-1 w-full text-left">
              <label htmlFor="proveedorId" className="text-xs uppercase tracking-widest text-[#71717A] font-sans">
                PROVEEDOR *
              </label>
              <select
                id="proveedorId"
                value={proveedorId}
                onChange={(e) => handleSelectProveedor(Number(e.target.value))}
                disabled={isLoading}
                className="w-full bg-[#111111] text-[#FAFAFA] border border-[#333333] focus:border-[#FAFAFA] px-3 py-2.5 text-sm outline-none transition-fast font-sans cursor-pointer"
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
                    <option value={1}>Proveedor Textil Dastik (Markup 1.50x)</option>
                    <option value={2}>Proveedor Sneakerheads (Markup 1.60x)</option>
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

          {/* Bloque 3: Estructura Financiera (Costo, Venta y Margen) */}
          <div className="border border-[#222222] bg-[#0E0E0E] p-4 md:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-2">
              <span className="text-[10px] uppercase tracking-widest text-[#71717A] font-sans font-semibold">
                ESTRUCTURA DE PRECIOS & MARGEN
              </span>
              <span className="text-xs font-mono text-emerald-400">
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
                onChange={(e) => setCostoBase(e.target.value)}
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
            <div className="flex items-center gap-2 pt-1 text-xs text-[#71717A]">
              <span className="text-[10px] uppercase tracking-wider font-sans">MARKUP RÁPIDO:</span>
              <button
                type="button"
                onClick={() => setPrecioVenta(Math.round(costoNum * 1.5).toString())}
                className="px-2 py-0.5 border border-[#333333] hover:border-[#FAFAFA] bg-[#141414] text-[10px] text-[#FAFAFA] transition-fast cursor-pointer"
              >
                +50% (x1.50)
              </button>
              <button
                type="button"
                onClick={() => setPrecioVenta(Math.round(costoNum * 1.6).toString())}
                className="px-2 py-0.5 border border-[#333333] hover:border-[#FAFAFA] bg-[#141414] text-[10px] text-[#FAFAFA] transition-fast cursor-pointer"
              >
                +60% (x1.60)
              </button>
              <button
                type="button"
                onClick={() => setPrecioVenta(Math.round(costoNum * 2.0).toString())}
                className="px-2 py-0.5 border border-[#333333] hover:border-[#FAFAFA] bg-[#141414] text-[10px] text-[#FAFAFA] transition-fast cursor-pointer"
              >
                +100% (x2.00)
              </button>
            </div>
          </div>

          {/* Bloque 4: Sección Dinámica de Variantes y Stock */}
          <div className="border border-[#333333] bg-[#0A0A0A] p-4 md:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222222] pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#71717A] font-sans font-semibold block">
                  INVENTARIO DE VARIANTES (SKUS)
                </span>
                <span className="text-xs text-[#A1A1AA] font-sans">
                  {variantes.length} {variantes.length === 1 ? 'variante' : 'variantes'} configuradas ·{' '}
                  <span className="text-[#FAFAFA] font-bold">{totalStockConfigurado} unidades totales</span>
                </span>
              </div>

              {/* Selector de Curvas Oficiales y Talles */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wider text-[#71717A]">CURVA:</span>
                  {CURVAS_DISPONIBLES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCurvaActivaId(c.id)}
                      className={`px-2 py-0.5 text-[10px] font-mono border transition-fast cursor-pointer ${
                        curvaActivaId === c.id
                          ? 'border-[#FAFAFA] bg-[#222222] text-[#FAFAFA] font-bold'
                          : 'border-[#222222] bg-[#0E0E0E] text-[#71717A] hover:border-[#444444]'
                      }`}
                    >
                      {c.shortLabel}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fila de Talles Rápidos de la Curva Activa y Botón de Lote */}
            <div className="bg-[#0E0E0E] border border-[#222222] p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider text-[#71717A]">
                  TALLES {curvaActiva.shortLabel.toUpperCase()}:
                </span>
                {curvaActiva.talles.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNuevoTalle(t)}
                    className="border border-[#2A2A2A] hover:border-[#FAFAFA] bg-[#161616] hover:bg-[#202020] px-2 py-0.5 text-[10px] text-[#FAFAFA] font-mono transition-fast cursor-pointer"
                    title={`Seleccionar talle ${t}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleAgregarCurvaCompleta(curvaActiva.talles)}
                className="text-[10px] uppercase font-mono tracking-wider border border-[#333333] hover:border-emerald-500 bg-[#161616] hover:bg-emerald-950/30 text-emerald-300 px-2.5 py-1 transition-fast cursor-pointer shrink-0"
                title="Generar todas las variantes de esta curva con códigos EAN-13"
              >
                + AGREGAR CURVA COMPLETA ({curvaActiva.talles.length} TALLES)
              </button>
            </div>

            {/* Mini-Formulario para Añadir Variante */}
            <div className="bg-[#111111] border border-[#222222] p-3.5 space-y-3">
              <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA] font-heading font-semibold block">
                + CONFIGURAR NUEVA VARIANTE
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Input
                  id="nuevoTalle"
                  label="TALLE / MEDIDA *"
                  placeholder="ej: M, L o US 10"
                  value={nuevoTalle}
                  onChange={(e) => setNuevoTalle(e.target.value)}
                  disabled={isLoading}
                />

                <Input
                  id="nuevoColor"
                  label="COLOR"
                  placeholder="ej: Negro, Blanco"
                  value={nuevoColor}
                  onChange={(e) => setNuevoColor(e.target.value)}
                  disabled={isLoading}
                />

                <Input
                  id="nuevoStock"
                  label="STOCK INICIAL *"
                  type="number"
                  min="0"
                  placeholder="5"
                  value={nuevoStock}
                  onChange={(e) => setNuevoStock(e.target.value)}
                  disabled={isLoading}
                />

                <div className="flex flex-col gap-1 w-full text-left">
                  <label htmlFor="nuevoCodigoBarras" className="text-xs uppercase tracking-widest text-[#71717A] font-sans">
                    CÓDIGO EAN-13
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="nuevoCodigoBarras"
                      type="text"
                      placeholder="Autogenerar si vacío"
                      value={nuevoCodigoBarras}
                      onChange={(e) => setNuevoCodigoBarras(e.target.value)}
                      disabled={isLoading}
                      className="w-full bg-[#161616] text-[#FAFAFA] border border-[#333333] focus:border-[#FAFAFA] px-2.5 py-2 text-xs font-mono outline-none placeholder-[#555555]"
                    />
                    <button
                      type="button"
                      onClick={handleAutogenerarEan}
                      className="border border-[#333333] hover:border-[#FAFAFA] bg-[#222222] hover:bg-[#2A2A2A] text-[#FAFAFA] p-2 transition-fast cursor-pointer shrink-0"
                      title="Generar EAN-13 numérico aleatorio"
                    >
                      <Sparkle size={15} weight="light" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAgregarVariante}
                  disabled={isLoading || !nuevoTalle.trim()}
                  className="gap-1.5 text-xs py-2 px-4"
                >
                  <Plus size={14} weight="bold" />
                  <span>AGREGAR VARIANTE A LA LISTA</span>
                </Button>
              </div>
            </div>

            {/* Tabla de Variantes Temporales */}
            {variantes.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[#222222] text-[#71717A] text-xs">
                No hay variantes añadidas. Completa los campos arriba y haz clic en &quot;AGREGAR VARIANTE&quot;.
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#222222]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#222222] bg-[#141414] text-[#71717A] text-[10px] uppercase tracking-wider font-sans">
                      <th className="py-2.5 px-3">Talle</th>
                      <th className="py-2.5 px-3">Color</th>
                      <th className="py-2.5 px-3 text-right">Stock Físico</th>
                      <th className="py-2.5 px-3">Código EAN-13</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A] font-sans">
                    {variantes.map((v) => (
                      <tr key={v.tempId} className="hover:bg-[#121212] transition-fast">
                        <td className="py-2.5 px-3 font-heading font-bold text-[#FAFAFA]">
                          <span className="border border-[#333333] bg-[#1A1A1A] px-2 py-0.5 text-xs">
                            {v.talle}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#A1A1AA]">{v.color}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="font-mono text-[#FAFAFA] font-semibold text-sm">
                            {v.stockFisico}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#A1A1AA]">
                            <Barcode size={14} weight="light" className="text-[#71717A]" />
                            <span>{v.codigoBarras}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleEliminarVariante(v.tempId)}
                            className="text-[#71717A] hover:text-red-400 p-1 transition-fast cursor-pointer"
                            title="Eliminar variante"
                          >
                            <Trash size={15} weight="light" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. Acciones de Cierre y Guardado */}
          <div className="flex items-center justify-between pt-4 border-t border-[#222222]">
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
              <span>{isLoading ? 'GUARDANDO ARTÍCULO...' : 'GUARDAR PRODUCTO EN CATÁLOGO'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
