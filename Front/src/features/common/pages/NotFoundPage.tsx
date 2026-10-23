import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Storefront,
  ArrowUUpLeft,
  SquaresFour,
  Tag,
  Compass,
} from '@phosphor-icons/react';
import { useAuthStore } from '../../../stores/useAuthStore';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, usuario } = useAuthStore();

  const isDev =
    Boolean(usuario?.esOcultoDev) ||
    usuario?.email?.toLowerCase() === 'tomidev@dastik.com' ||
    usuario?.email?.toLowerCase() === 'tomi.empleado@dastik.com' ||
    Boolean(usuario?.nombre?.toLowerCase().includes('tomi (admin dev)'));

  const isAdminOrDev = isAuthenticated && (usuario?.rol === 'Admin' || isDev);

  const handleRescue = () => {
    if (isAuthenticated) {
      navigate('/pos');
    } else {
      navigate('/login');
    }
  };

  // Atajo de teclado: Escape o Backspace (fuera de inputs) para volver a la terminal POS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        handleRescue();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated]);

  return (
    <div className="min-h-full w-full flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-canvas text-primary select-none overflow-y-auto">
      {/* Tarjeta con estética de Hangtag / Etiqueta Térmica Retail */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className="relative w-full max-w-md bg-surface border border-subtle rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center overflow-hidden my-auto"
      >
        {/* Detalle de ojal de etiqueta (Hangtag hole) y cordón */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-subtle bg-canvas shadow-inner" />
          <div className="w-[1.5px] h-2.5 bg-secondary/30 -mt-0.5" />
        </div>

        {/* Marca Retail Header */}
        <div className="text-[10px] font-mono tracking-[0.28em] text-muted uppercase mt-2">
          DASTIK // HIDDEN SNEAKERS
        </div>

        {/* Badge Superior */}
        <div className="mt-3 px-3 py-1 bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[10px] sm:text-[11px] font-mono font-medium tracking-wider rounded-full uppercase flex items-center gap-1.5">
          <Tag size={13} weight="bold" />
          <span>ERROR DE RUTA // SKU FUERA DE CATÁLOGO</span>
        </div>

        {/* Tipografía Display Grande 404 con animación de resorte */}
        <motion.h1
          initial={{ scale: 0.82, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 24, delay: 0.08 }}
          className="text-7xl sm:text-8xl font-black font-mono tracking-tighter text-primary my-2 tabular-nums"
        >
          404
        </motion.h1>

        {/* Código de barras vectorial con láser ámbar animado */}
        <div className="relative w-56 h-14 bg-elevated/70 border border-subtle rounded-lg px-3.5 py-1.5 flex flex-col items-center justify-between overflow-hidden my-2">
          {/* Láser ámbar que recorre el código de arriba hacia abajo en loop suave */}
          <motion.div
            className="absolute left-0 right-0 h-[2px] bg-amber-400 shadow-[0_0_12px_2px_rgba(245,158,11,0.95)] z-10 pointer-events-none"
            animate={{ y: [0, 48, 0] }}
            transition={{
              repeat: Infinity,
              duration: 2.2,
              ease: 'easeInOut',
            }}
          />

          {/* Barras vectoriales de código retail */}
          <svg
            className="w-full h-7 text-primary/80"
            viewBox="0 0 160 32"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="0" y="0" width="3" height="32" />
            <rect x="5" y="0" width="1" height="32" />
            <rect x="8" y="0" width="4" height="32" />
            <rect x="15" y="0" width="2" height="32" />
            <rect x="19" y="0" width="1" height="32" />
            <rect x="22" y="0" width="3" height="32" />
            <rect x="28" y="0" width="1" height="32" />
            <rect x="32" y="0" width="4" height="32" />
            <rect x="39" y="0" width="2" height="32" />
            <rect x="43" y="0" width="1" height="32" />
            <rect x="46" y="0" width="3" height="32" />
            <rect x="52" y="0" width="1" height="32" />
            <rect x="56" y="0" width="2" height="32" />
            <rect x="61" y="0" width="4" height="32" />
            <rect x="68" y="0" width="1" height="32" />
            <rect x="71" y="0" width="3" height="32" />
            <rect x="76" y="0" width="2" height="32" />
            <rect x="80" y="0" width="1" height="32" />
            <rect x="83" y="0" width="4" height="32" />
            <rect x="90" y="0" width="2" height="32" />
            <rect x="95" y="0" width="1" height="32" />
            <rect x="98" y="0" width="3" height="32" />
            <rect x="104" y="0" width="1" height="32" />
            <rect x="107" y="0" width="4" height="32" />
            <rect x="114" y="0" width="2" height="32" />
            <rect x="118" y="0" width="1" height="32" />
            <rect x="122" y="0" width="3" height="32" />
            <rect x="128" y="0" width="2" height="32" />
            <rect x="132" y="0" width="4" height="32" />
            <rect x="138" y="0" width="1" height="32" />
            <rect x="142" y="0" width="3" height="32" />
            <rect x="147" y="0" width="1" height="32" />
            <rect x="151" y="0" width="4" height="32" />
            <rect x="157" y="0" width="3" height="32" />
          </svg>

          <span className="text-[9px] font-mono tracking-[0.3em] text-muted">
            0 40400 00404 0
          </span>
        </div>

        {/* Mensaje principal con tono Streetwear Retail */}
        <h2 className="text-base sm:text-lg font-semibold text-primary mt-2">
          Esta prenda o sección no está en el perchero
        </h2>
        <p className="text-xs text-secondary mt-1 max-w-xs">
          La ruta solicitada no corresponde a ningún perchero activo de la tienda o fue reclasificada.
        </p>

        {/* Chip Monoespaciado con la URL intentada */}
        <div className="mt-3.5 max-w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-elevated border border-subtle font-mono text-xs text-secondary">
          <Compass size={14} className="text-amber-500 shrink-0" />
          <span className="truncate max-w-[240px] sm:max-w-[280px]" title={location.pathname}>
            {location.pathname}
          </span>
        </div>

        {/* Acciones de Rescate Inmediato */}
        <div className="mt-6 w-full flex flex-col gap-2.5">
          {/* Botón Principal: Volver al POS */}
          <button
            type="button"
            onClick={handleRescue}
            className="w-full py-3 px-4 bg-btn-primary-bg text-btn-primary-text font-medium text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-btn-primary-hover active:scale-[0.98] transition-all shadow-md cursor-pointer"
          >
            <Storefront size={18} weight="bold" />
            <span>Volver a la Terminal POS</span>
          </button>

          {/* Botón Secundario: Solo Admin / Dev */}
          {isAdminOrDev && (
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="w-full py-2.5 px-4 bg-surface hover:bg-hover border border-subtle text-primary font-medium text-xs rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <SquaresFour size={16} weight="duotone" className="text-amber-500" />
              <span>Ir al Panel de Administración</span>
            </button>
          )}

          {/* Botón Terciario: Volver atrás */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full py-2 text-xs text-secondary hover:text-primary transition-colors flex items-center justify-center gap-1.5 pt-1 cursor-pointer"
          >
            <ArrowUUpLeft size={14} />
            <span>Volver atrás</span>
          </button>
        </div>

        {/* Atajo de teclado visual */}
        <div className="mt-4 text-[10px] font-mono text-muted/70 flex items-center justify-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-subtle text-secondary font-mono text-[9px]">
            Esc
          </kbd>
          <span>o</span>
          <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-subtle text-secondary font-mono text-[9px]">
            Backspace
          </kbd>
          <span>para volver al inicio</span>
        </div>
      </motion.div>
    </div>
  );
};
