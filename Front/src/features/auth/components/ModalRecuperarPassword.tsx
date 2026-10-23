import React, { useState, useEffect, useRef } from 'react';
import {
  Key,
  ShieldCheck,
  WarningCircle,
  CheckCircle,
  Circle,
  X,
  LockKey,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeSlash,
  ChatCircleText,
} from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { authApi } from '../api/authApi';
import type { AxiosError } from 'axios';

interface ModalRecuperarPasswordProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalRecuperarPassword: React.FC<ModalRecuperarPasswordProps> = ({
  isOpen,
  onClose,
}) => {
  // Modo: 'pin' (Wizard de 3 pasos) | 'maestra' (Modo de emergencia)
  const [modo, setModo] = useState<'pin' | 'maestra'>('pin');

  // Pasos del Wizard PIN
  const [paso, setPaso] = useState<1 | 2 | 3>(1);

  // Datos comunes
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  // Modo Llave Maestra
  const [claveMaestra, setClaveMaestra] = useState('');

  // Estados de proceso
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exitoMensaje, setExitoMensaje] = useState<string | null>(null);
  const [pinHint, setPinHint] = useState<string | null>(null);

  // Refs para los 6 inputs OTP
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setPaso(1);
      setEmail('');
      setOtp(['', '', '', '', '', '']);
      setNuevaPassword('');
      setConfirmarPassword('');
      setClaveMaestra('');
      setErrorMessage(null);
      setExitoMensaje(null);
      setPinHint(null);
      setModo('pin');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  // Checklist de reglas de seguridad
  const tieneMinimo8 = nuevaPassword.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(nuevaPassword);
  const tieneMinuscula = /[a-z]/.test(nuevaPassword);
  const tieneNumero = /[0-9]/.test(nuevaPassword);
  const tieneEspecial = /[!@#$%^&*._\-]/.test(nuevaPassword);
  const passwordsCoinciden = nuevaPassword === confirmarPassword && nuevaPassword.length > 0;
  const noEsProvisoria = nuevaPassword !== 'Dastik2026!';

  const esPasswordValida =
    tieneMinimo8 &&
    tieneMayuscula &&
    tieneMinuscula &&
    tieneNumero &&
    tieneEspecial &&
    passwordsCoinciden &&
    noEsProvisoria;

  // ==========================================
  // PASO 1: Solicitar PIN de 6 Dígitos
  // ==========================================
  const handleSolicitarPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setExitoMensaje(null);
    setPinHint(null);

    if (!email.trim()) {
      setErrorMessage('Por favor ingresa tu correo electrónico corporativo.');
      return;
    }

    setIsLoading(true);
    try {
      const resp = await authApi.solicitarPinRecuperacion(email.trim());
      if (resp.pinSimuladoDesarrollo) {
        setPinHint(resp.pinSimuladoDesarrollo);
      }
      setPaso(2);
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string; detail?: string }>;
      const msg =
        axiosError.response?.data?.error ||
        axiosError.response?.data?.detail ||
        'Error al solicitar el código PIN. Verifica el correo ingresado.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejo de inputs OTP
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Manejo de pegado en un solo campo
      handleOtpPaste(value);
      return;
    }

    const digit = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus siguiente input si escribió un dígito
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (pastedData: string) => {
    const digits = pastedData.replace(/[^0-9]/g, '').slice(0, 6).split('');
    if (digits.length === 0) return;

    const newOtp = ['', '', '', '', '', ''];
    digits.forEach((d, idx) => {
      newOtp[idx] = d;
    });
    setOtp(newOtp);

    const nextIndex = Math.min(digits.length, 5);
    otpRefs.current[nextIndex]?.focus();
  };

  // ==========================================
  // PASO 2: Verificar PIN de 6 Dígitos
  // ==========================================
  const handleVerificarPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const pinCompleto = otp.join('');
    if (pinCompleto.length < 6) {
      setErrorMessage('Por favor ingresa los 6 dígitos del código PIN.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.verificarPinRecuperacion(email.trim(), pinCompleto);
      setPaso(3);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string; detail?: string }>;
      const msg =
        axiosError.response?.data?.error ||
        axiosError.response?.data?.detail ||
        'El código PIN es incorrecto o ha expirado.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // PASO 3: Confirmar Nueva Contraseña
  // ==========================================
  const handleConfirmarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setExitoMensaje(null);

    if (!esPasswordValida) {
      setErrorMessage('La nueva contraseña no cumple con los requisitos de seguridad requeridos.');
      return;
    }

    setIsLoading(true);
    try {
      const resp = await authApi.confirmarRecuperacionPin({
        email: email.trim(),
        pin: otp.join(''),
        nuevaPassword,
        confirmarPassword,
      });

      setExitoMensaje(resp.mensaje || '¡Contraseña restablecida con éxito! Ya puedes ingresar.');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string; detail?: string }>;
      const msg =
        axiosError.response?.data?.error ||
        axiosError.response?.data?.detail ||
        'No se pudo restablecer la contraseña. Vuelve a intentarlo.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // MODO ALTERNATIVO: Llave Maestra de Emergencia
  // ==========================================
  const handleSubmitMaestra = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setExitoMensaje(null);

    if (!email.trim() || !claveMaestra.trim()) {
      setErrorMessage('Ingresa tanto el correo como la Llave Maestra del local.');
      return;
    }

    if (nuevaPassword.length < 8) {
      setErrorMessage('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      const resp = await authApi.recuperarPassword({
        identificador: email.trim(),
        claveMaestra: claveMaestra.trim(),
        nuevaPassword,
      });

      setExitoMensaje(resp.mensaje || 'Contraseña restablecida exitosamente.');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string; detail?: string }>;
      const msg =
        axiosError.response?.data?.error ||
        axiosError.response?.data?.detail ||
        'No se pudo restablecer la contraseña con la Llave Maestra.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const checklistItems = [
    { id: 'len', label: 'Mínimo 8 caracteres', cumple: tieneMinimo8 },
    { id: 'mayus', label: '1 Mayúscula (A-Z)', cumple: tieneMayuscula },
    { id: 'minus', label: '1 Minúscula (a-z)', cumple: tieneMinuscula },
    { id: 'num', label: '1 Número (0-9)', cumple: tieneNumero },
    { id: 'spec', label: '1 Especial (!@#$%^&*._-)', cumple: tieneEspecial },
    { id: 'match', label: 'Contraseñas coinciden', cumple: passwordsCoinciden },
    { id: 'diff', label: 'Distinta a Dastik2026!', cumple: noEsProvisoria },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="rounded-2xl border border-subtle bg-surface w-full max-w-lg p-6 sm:p-8 space-y-5 shadow-floating text-left max-h-[92vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-start justify-between pb-3 border-b border-subtle">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5 text-primary">
              <Key size={22} weight="duotone" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-muted block uppercase tracking-[0.2em] font-mono">
                SEGURIDAD DE ACCESO
              </span>
              <h2 className="font-heading font-bold text-lg sm:text-xl text-primary">
                Recuperación de Contraseña
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors p-1.5 rounded-lg border border-subtle hover:border-strong cursor-pointer"
            title="Cerrar modal [ESC]"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Selector de Modo (PIN de 6 dígitos vs Llave Maestra) */}
        <div className="flex rounded-xl bg-elevated border border-subtle p-1 gap-1">
          <button
            type="button"
            onClick={() => {
              setModo('pin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-sans font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              modo === 'pin'
                ? 'bg-surface text-primary shadow-sm border border-subtle'
                : 'text-muted hover:text-primary'
            }`}
          >
            <ChatCircleText size={15} weight="bold" />
            <span>Código PIN (6 Dígitos)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setModo('maestra');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-sans font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              modo === 'maestra'
                ? 'bg-surface text-primary shadow-sm border border-subtle'
                : 'text-muted hover:text-primary'
            }`}
          >
            <ShieldCheck size={15} weight="bold" />
            <span>Llave Maestra</span>
          </button>
        </div>

        {/* Mensaje de Error */}
        {errorMessage && (
          <div className="border border-red-500/30 bg-red-500/10 rounded-xl p-3 text-red-600 dark:text-red-400 text-xs font-sans flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2">
              <WarningCircle size={17} weight="bold" className="shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="hover:opacity-75 p-0.5 transition-opacity cursor-pointer shrink-0"
              title="Cerrar"
            >
              <X size={15} weight="bold" />
            </button>
          </div>
        )}

        {/* Mensaje de Éxito */}
        {exitoMensaje && (
          <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-xl p-3 text-emerald-600 dark:text-emerald-400 text-xs font-sans flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2">
              <CheckCircle size={17} weight="fill" className="shrink-0 mt-0.5 text-emerald-500" />
              <span className="leading-snug font-medium">{exitoMensaje}</span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODO PIN (WIZARD DE 3 PASOS)                             */}
        {/* ========================================================= */}
        {modo === 'pin' && (
          <div className="space-y-4">
            {/* Indicador de Pasos */}
            <div className="flex items-center justify-between text-xs font-mono border-b border-subtle pb-3">
              <div className={`flex items-center gap-1.5 ${paso === 1 ? 'text-primary font-bold' : paso > 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'}`}>
                <span className="w-5 h-5 rounded-full border border-subtle flex items-center justify-center text-[10px] bg-elevated">1</span>
                <span>Email</span>
              </div>
              <div className="w-6 h-px bg-subtle" />
              <div className={`flex items-center gap-1.5 ${paso === 2 ? 'text-primary font-bold' : paso > 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'}`}>
                <span className="w-5 h-5 rounded-full border border-subtle flex items-center justify-center text-[10px] bg-elevated">2</span>
                <span>PIN OTP</span>
              </div>
              <div className="w-6 h-px bg-subtle" />
              <div className={`flex items-center gap-1.5 ${paso === 3 ? 'text-primary font-bold' : 'text-muted'}`}>
                <span className="w-5 h-5 rounded-full border border-subtle flex items-center justify-center text-[10px] bg-elevated">3</span>
                <span>Nueva Clave</span>
              </div>
            </div>

            {/* PASO 1: Ingreso de Email */}
            {paso === 1 && (
              <form onSubmit={handleSolicitarPin} className="space-y-4">
                <p className="text-xs text-secondary font-sans leading-relaxed">
                  Ingresa tu correo electrónico registrado. Se enviará un PIN de 6 dígitos con validez de 10 minutos.
                </p>

                <div>
                  <label className="text-[11px] font-mono uppercase text-muted tracking-wider block mb-1.5 font-semibold">
                    CORREO ELECTRÓNICO REGISTRADO
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@dastik.com"
                    disabled={isLoading}
                    autoFocus
                    required
                    className="w-full bg-elevated border border-subtle focus:border-strong rounded-xl text-primary px-3.5 py-2.5 text-xs font-mono tracking-wide placeholder:text-muted outline-none transition-colors"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full justify-between"
                    disabled={isLoading}
                  >
                    <span>{isLoading ? 'ENVIANDO PIN...' : 'GENERAR PIN DE 6 DÍGITOS'}</span>
                    <ArrowRight size={16} weight="bold" />
                  </Button>
                </div>
              </form>
            )}

            {/* PASO 2: Ingreso de PIN OTP (6 Casillas) */}
            {paso === 2 && (
              <form onSubmit={handleVerificarPin} className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-secondary font-sans">
                    Ingresa el PIN de 6 dígitos generado para <strong className="text-primary">{email}</strong>:
                  </p>
                  <button
                    type="button"
                    onClick={() => setPaso(1)}
                    className="text-[11px] text-muted hover:text-primary flex items-center gap-1 cursor-pointer font-sans"
                  >
                    <ArrowLeft size={12} weight="bold" />
                    <span>Cambiar correo</span>
                  </button>
                </div>

                {/* Banner de Ayuda de Desarrollo / Local */}
                {pinHint && (
                  <div className="border border-amber-500/30 bg-amber-500/10 rounded-xl p-3 text-amber-600 dark:text-amber-400 text-xs font-mono flex items-center justify-between gap-2">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider font-bold">PIN SIMULADO (DEV/LOCAL):</span>
                      <strong className="text-sm font-bold tracking-widest">{pinHint}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOtpPaste(pinHint)}
                      className="text-[10px] uppercase font-bold border border-amber-500/40 rounded-lg px-2 py-1 bg-surface hover:bg-elevated transition-colors cursor-pointer"
                    >
                      Autollenar
                    </button>
                  </div>
                )}

                {/* 6 Casillas OTP */}
                <div className="flex items-center justify-between gap-2 py-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={(e) => {
                        e.preventDefault();
                        handleOtpPaste(e.clipboardData.getData('text'));
                      }}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-mono font-bold bg-elevated border border-subtle focus:border-strong focus:ring-2 focus:ring-primary/20 rounded-xl text-primary outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="flex justify-between items-center text-[11px] text-muted font-sans pt-1">
                  <span>¿No recibiste el código?</span>
                  <button
                    type="button"
                    onClick={handleSolicitarPin}
                    disabled={isLoading}
                    className="text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Reenviar PIN
                  </button>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full justify-between"
                    disabled={isLoading || otp.join('').length < 6}
                  >
                    <span>{isLoading ? 'VERIFICANDO...' : 'VERIFICAR CÓDIGO PIN'}</span>
                    <ArrowRight size={16} weight="bold" />
                  </Button>
                </div>
              </form>
            )}

            {/* PASO 3: Nueva Contraseña Definitiva */}
            {paso === 3 && (
              <form onSubmit={handleConfirmarPassword} className="space-y-4">
                <p className="text-xs text-secondary font-sans leading-relaxed">
                  Código verificado correctamente. Define tu nueva contraseña personal.
                </p>

                {/* Nueva Contraseña */}
                <div>
                  <label className="text-[11px] font-mono uppercase text-muted tracking-wider block mb-1.5 font-semibold">
                    NUEVA CONTRASEÑA
                  </label>
                  <div className="relative">
                    <input
                      type={showNueva ? 'text' : 'password'}
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      disabled={isLoading}
                      autoFocus
                      required
                      className="w-full bg-elevated border border-subtle focus:border-strong rounded-xl text-primary px-3.5 py-2.5 pr-10 text-xs font-mono tracking-wide placeholder:text-muted outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNueva(!showNueva)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors cursor-pointer"
                    >
                      {showNueva ? <EyeSlash size={16} weight="bold" /> : <Eye size={16} weight="bold" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Contraseña */}
                <div>
                  <label className="text-[11px] font-mono uppercase text-muted tracking-wider block mb-1.5 font-semibold">
                    CONFIRMAR CONTRASEÑA
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmar ? 'text' : 'password'}
                      value={confirmarPassword}
                      onChange={(e) => setConfirmarPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      disabled={isLoading}
                      required
                      className="w-full bg-elevated border border-subtle focus:border-strong rounded-xl text-primary px-3.5 py-2.5 pr-10 text-xs font-mono tracking-wide placeholder:text-muted outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmar(!showConfirmar)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors cursor-pointer"
                    >
                      {showConfirmar ? <EyeSlash size={16} weight="bold" /> : <Eye size={16} weight="bold" />}
                    </button>
                  </div>
                </div>

                {/* Checklist Dinámico */}
                <div className="border border-subtle bg-elevated/70 rounded-xl p-3 text-xs font-sans space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted block mb-1.5 font-mono font-semibold">
                    REGLAS DE SEGURIDAD:
                  </span>
                  {checklistItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 text-[11px] transition-colors ${
                        item.cumple
                          ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                          : 'text-muted'
                      }`}
                    >
                      {item.cumple ? (
                        <CheckCircle size={14} weight="fill" className="shrink-0 text-emerald-500" />
                      ) : (
                        <Circle size={14} weight="regular" className="shrink-0 opacity-40" />
                      )}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full justify-between"
                    disabled={isLoading || !esPasswordValida}
                  >
                    <span>{isLoading ? 'RESTABLECIENDO...' : 'RESTABLECER Y ACTIVAR'}</span>
                    <LockKey size={16} weight="bold" />
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* MODO LLAVE MAESTRA (ACCESO DE EMERGENCIA)                 */}
        {/* ========================================================= */}
        {modo === 'maestra' && (
          <form onSubmit={handleSubmitMaestra} className="space-y-4">
            <p className="text-xs text-secondary font-sans leading-relaxed">
              Mecanismo exclusivo para el Dueño del local mediante la Llave Maestra física o configurada en el servidor.
            </p>

            <div>
              <label className="text-[11px] font-mono uppercase text-muted tracking-wider block mb-1.5 font-semibold">
                CORREO ELECTRÓNICO DE LA CUENTA ADMIN
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="diego@dastik.com o tomidev@dastik.com"
                disabled={isLoading}
                required
                className="w-full bg-elevated border border-subtle focus:border-strong rounded-xl text-primary px-3.5 py-2.5 text-xs font-mono tracking-wide placeholder:text-muted outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-muted tracking-wider block mb-1.5 font-semibold">
                LLAVE MAESTRA DEL LOCAL
              </label>
              <input
                type="password"
                value={claveMaestra}
                onChange={(e) => setClaveMaestra(e.target.value)}
                placeholder="••••••••••••"
                disabled={isLoading}
                required
                className="w-full bg-elevated border border-subtle focus:border-strong rounded-xl text-primary px-3.5 py-2.5 text-xs font-mono tracking-wide placeholder:text-muted outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-muted tracking-wider block mb-1.5 font-semibold">
                NUEVA CONTRASEÑA
              </label>
              <input
                type="password"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                disabled={isLoading}
                required
                className="w-full bg-elevated border border-subtle focus:border-strong rounded-xl text-primary px-3.5 py-2.5 text-xs font-mono tracking-wide placeholder:text-muted outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-muted tracking-wider block mb-1.5 font-semibold">
                CONFIRMAR NUEVA CONTRASEÑA
              </label>
              <input
                type="password"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                disabled={isLoading}
                required
                className="w-full bg-elevated border border-subtle focus:border-strong rounded-xl text-primary px-3.5 py-2.5 text-xs font-mono tracking-wide placeholder:text-muted outline-none transition-colors"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-between"
                disabled={isLoading}
              >
                <span>{isLoading ? 'RESTABLECIENDO...' : 'RESTABLECER CON LLAVE MAESTRA'}</span>
                <ShieldCheck size={16} weight="bold" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
