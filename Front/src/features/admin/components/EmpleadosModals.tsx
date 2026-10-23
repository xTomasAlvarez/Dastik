import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserPlus,
  Calculator,
  X,
  Key,
  LockKey,
  WarningCircle,
  PencilSimple,
  Sparkle,
} from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { EmpleadoDto, CrearEmpleadoRequest, ActualizarEmpleadoRequest } from '../api/empleadosApi';

// ==========================================
// 1. MODAL CREAR EMPLEADO
// ==========================================
interface ModalCrearEmpleadoProps {
  isOpen: boolean;
  onClose: () => void;
  nuevoEmpleado: CrearEmpleadoRequest;
  onChangeNuevoEmpleado: (val: CrearEmpleadoRequest) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export const ModalCrearEmpleado: React.FC<ModalCrearEmpleadoProps> = ({
  isOpen,
  onClose,
  nuevoEmpleado,
  onChangeNuevoEmpleado,
  onSubmit,
  isPending,
}) => {
  const autollenarPasswordProvisoria = () => {
    onChangeNuevoEmpleado({
      ...nuevoEmpleado,
      password: 'Dastik2026!',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }}
            className="rounded-2xl border border-subtle bg-surface w-full max-w-lg p-6 space-y-5 shadow-floating relative my-auto z-10 text-left"
          >
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-2 text-primary">
                  <UserPlus size={20} weight="duotone" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted block uppercase tracking-wider font-mono">
                    ALTA DE PERSONAL
                  </span>
                  <h2 className="font-heading font-bold text-lg text-primary">
                    Registrar Nuevo Empleado
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

            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                id="nombreEmpleado"
                label="Nombre Completo *"
                type="text"
                required
                placeholder="Ej: Facundo Gómez"
                value={nuevoEmpleado.nombre}
                onChange={(e) =>
                  onChangeNuevoEmpleado({ ...nuevoEmpleado, nombre: e.target.value })
                }
                autoFocus
              />

              <Input
                id="emailEmpleado"
                label="Correo Electrónico (Usuario POS) *"
                type="email"
                required
                placeholder="facundo@dastik.com"
                value={nuevoEmpleado.email}
                onChange={(e) =>
                  onChangeNuevoEmpleado({ ...nuevoEmpleado, email: e.target.value })
                }
              />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono uppercase text-muted tracking-wider font-semibold">
                    Contraseña Provisoria * (mínimo 6 caracteres)
                  </label>
                  <button
                    type="button"
                    onClick={autollenarPasswordProvisoria}
                    className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkle size={12} weight="fill" />
                    <span>Usar "Dastik2026!"</span>
                  </button>
                </div>
                <Input
                  id="passwordEmpleado"
                  label=""
                  type="text"
                  required
                  placeholder="Dastik2026!"
                  value={nuevoEmpleado.password || ''}
                  onChange={(e) =>
                    onChangeNuevoEmpleado({ ...nuevoEmpleado, password: e.target.value })
                  }
                />
                <span className="text-[11px] text-muted font-sans block mt-1">
                  El sistema le exigirá crear su propia contraseña en su primer inicio de sesión.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-muted tracking-wider block font-semibold">
                    Turno Asignado
                  </label>
                  <select
                    value={nuevoEmpleado.turno}
                    onChange={(e) =>
                      onChangeNuevoEmpleado({ ...nuevoEmpleado, turno: e.target.value })
                    }
                    className="w-full bg-elevated border border-subtle focus:border-strong rounded-xl text-primary text-xs font-mono px-3.5 py-2.5 outline-none transition-colors"
                  >
                    <option value="Mañana">Mañana (10:00 - 16:00)</option>
                    <option value="Tarde">Tarde (16:00 - 22:00)</option>
                    <option value="Completo">Completo (10:00 - 22:00)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-muted tracking-wider block font-semibold">
                    Rol en el Sistema
                  </label>
                  <select
                    value={nuevoEmpleado.rol || 'Empleado'}
                    onChange={(e) =>
                      onChangeNuevoEmpleado({ ...nuevoEmpleado, rol: e.target.value })
                    }
                    className="w-full bg-elevated border border-subtle focus:border-strong rounded-xl text-primary text-xs font-mono px-3.5 py-2.5 outline-none transition-colors"
                  >
                    <option value="Empleado">Empleado (Cajero POS)</option>
                    <option value="Admin">Admin (Dueño / Encargado)</option>
                  </select>
                </div>
              </div>

              <Input
                id="tarifaPorHora"
                label="Tarifa por Hora ($ ARS) *"
                type="number"
                step="50"
                min="0"
                required
                value={nuevoEmpleado.tarifaPorHora}
                onChange={(e) =>
                  onChangeNuevoEmpleado({
                    ...nuevoEmpleado,
                    tarifaPorHora: parseFloat(e.target.value) || 0,
                  })
                }
              />

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-subtle">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Crear Empleado'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ==========================================
// 2. MODAL EDITAR EMPLEADO
// ==========================================
interface ModalEditarEmpleadoProps {
  isOpen: boolean;
  onClose: () => void;
  empleado: EmpleadoDto | null;
  onActualizar: (data: ActualizarEmpleadoRequest) => Promise<void>;
  isPending: boolean;
}

export const ModalEditarEmpleado: React.FC<ModalEditarEmpleadoProps> = ({
  isOpen,
  onClose,
  empleado,
  onActualizar,
  isPending,
}) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [turno, setTurno] = useState('Completo');
  const [tarifaPorHora, setTarifaPorHora] = useState<number>(3500);
  const [rol, setRol] = useState('Empleado');

  useEffect(() => {
    if (empleado) {
      setNombre(empleado.nombre);
      setEmail(empleado.email);
      setTurno(empleado.turnoAsignado || 'Completo');
      setTarifaPorHora(empleado.tarifaPorHora || 0);
      setRol(empleado.rol || 'Empleado');
    }
  }, [empleado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onActualizar({
      nombre: nombre.trim(),
      email: email.trim(),
      turno,
      tarifaPorHora,
      rol,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && Boolean(empleado) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={!isPending ? onClose : undefined}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }}
            className="rounded-2xl border border-subtle bg-surface w-full max-w-lg p-6 space-y-5 shadow-floating relative my-auto z-10 text-left"
          >
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-amber-500">
                  <PencilSimple size={20} weight="duotone" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted block uppercase tracking-wider font-mono">
                    MODIFICACIÓN DE FICHA
                  </span>
                  <h2 className="font-heading font-bold text-lg text-primary">
                    Editar Empleado
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="edit-nombre"
                label="Nombre Completo *"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoFocus
              />

              <Input
                id="edit-email"
                label="Correo Electrónico *"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-muted tracking-wider block font-semibold">
                    Turno Asignado
                  </label>
                  <select
                    value={turno}
                    onChange={(e) => setTurno(e.target.value)}
                    className="w-full bg-elevated border border-subtle focus:border-strong rounded-xl text-primary text-xs font-mono px-3.5 py-2.5 outline-none transition-colors"
                  >
                    <option value="Mañana">Mañana (10:00 - 16:00)</option>
                    <option value="Tarde">Tarde (16:00 - 22:00)</option>
                    <option value="Completo">Completo (10:00 - 22:00)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-muted tracking-wider block font-semibold">
                    Rol en el Sistema
                  </label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    className="w-full bg-elevated border border-subtle focus:border-strong rounded-xl text-primary text-xs font-mono px-3.5 py-2.5 outline-none transition-colors"
                  >
                    <option value="Empleado">Empleado (Cajero POS)</option>
                    <option value="Admin">Admin (Dueño / Encargado)</option>
                  </select>
                </div>
              </div>

              <Input
                id="edit-tarifaPorHora"
                label="Tarifa por Hora ($ ARS) *"
                type="number"
                step="50"
                min="0"
                required
                value={tarifaPorHora}
                onChange={(e) => setTarifaPorHora(parseFloat(e.target.value) || 0)}
              />

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-subtle">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ==========================================
// 3. MODAL LIQUIDAR JORNADA
// ==========================================
interface ModalLiquidarJornadaProps {
  empleado: EmpleadoDto | null;
  onClose: () => void;
  horasTrabajadas: string;
  onChangeHorasTrabajadas: (val: string) => void;
  formatearDinero: (monto: number) => string;
}

export const ModalLiquidarJornada: React.FC<ModalLiquidarJornadaProps> = ({
  empleado,
  onClose,
  horasTrabajadas,
  onChangeHorasTrabajadas,
  formatearDinero,
}) => {
  const horasNum = parseFloat(horasTrabajadas) || 0;
  const tarifaActual = empleado?.tarifaPorHora ?? 0;
  const totalCalculado = Math.round(horasNum * tarifaActual * 100) / 100;

  return (
    <AnimatePresence>
      {Boolean(empleado) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }}
            className="rounded-2xl border border-subtle bg-surface w-full max-w-lg p-6 space-y-5 shadow-floating relative my-auto z-10 text-left"
          >
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-500">
                  <Calculator size={20} weight="duotone" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted block uppercase tracking-wider font-mono">
                    LIQUIDACIÓN DIARIA
                  </span>
                  <h2 className="font-heading font-bold text-lg text-primary">
                    Liquidar Jornada de Trabajo
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

            <div className="rounded-xl border border-subtle bg-elevated/50 p-4 flex items-center justify-between">
              <div>
                <span className="font-heading font-bold text-base text-primary block">
                  {empleado?.nombre}
                </span>
                <span className="text-xs text-secondary font-sans">
                  Turno: {empleado?.turnoAsignado} · {empleado?.email}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-medium text-muted block uppercase">
                  Tarifa Asignada
                </span>
                <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatearDinero(empleado?.tarifaPorHora ?? 0)} / h
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-mono uppercase text-muted tracking-wider block font-semibold">
                ¿Cuántas horas trabajó en el turno?
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '6h (Medio turno)', val: '6' },
                  { label: '8h (Estándar)', val: '8' },
                  { label: '12h (Jornada Dastik)', val: '12' },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => onChangeHorasTrabajadas(preset.val)}
                    className={`rounded-xl border px-2 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      horasTrabajadas === preset.val
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                        : 'border-subtle bg-elevated text-secondary hover:text-primary'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={horasTrabajadas}
                  onChange={(e) => onChangeHorasTrabajadas(e.target.value)}
                  placeholder="Ingresa horas exactas (ej: 8.5)"
                  className="w-full bg-elevated border border-subtle focus:border-strong rounded-xl text-primary text-base font-mono tabular-nums pl-4 pr-16 py-2.5 outline-none transition-colors font-bold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted font-mono">
                  Horas
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block font-semibold">
                TOTAL A LIQUIDAR
              </span>
              <div className="font-mono tabular-nums font-bold text-3xl sm:text-4xl text-emerald-600 dark:text-emerald-300 tracking-tight">
                {formatearDinero(totalCalculado)}
              </div>
              <div className="text-xs font-mono tabular-nums text-secondary pt-2 border-t border-emerald-500/20 mt-2 flex items-center justify-center gap-2">
                <span>{horasNum} h</span>
                <span>×</span>
                <span>{formatearDinero(tarifaActual)}/h</span>
                <span>=</span>
                <span className="font-bold text-primary">{formatearDinero(totalCalculado)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-subtle">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cerrar [ESC]
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ==========================================
// 4. MODAL RESETEAR CONTRASEÑA EMPLEADO
// ==========================================
interface ModalResetPasswordEmpleadoProps {
  empleado: EmpleadoDto | null;
  onClose: () => void;
  onSubmit: (empleadoId: number, nuevaPassword: string, debeCambiarPassword: boolean) => Promise<void>;
  isPending: boolean;
}

export const ModalResetPasswordEmpleado: React.FC<ModalResetPasswordEmpleadoProps> = ({
  empleado,
  onClose,
  onSubmit,
  isPending,
}) => {
  const [password, setPassword] = useState('Dastik2026!');
  const [confirmarPassword, setConfirmarPassword] = useState('Dastik2026!');
  const [debeCambiarPassword, setDebeCambiarPassword] = useState(true);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    setPassword('Dastik2026!');
    setConfirmarPassword('Dastik2026!');
    setDebeCambiarPassword(true);
    setErrorLocal(null);
  }, [empleado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    if (password.length < 6) {
      setErrorLocal('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmarPassword) {
      setErrorLocal('Las contraseñas no coinciden.');
      return;
    }

    if (!empleado) return;
    await onSubmit(empleado.id, password, debeCambiarPassword);
  };

  return (
    <AnimatePresence>
      {Boolean(empleado) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={!isPending ? onClose : undefined}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }}
            className="rounded-2xl border border-subtle bg-surface w-full max-w-md p-6 space-y-5 shadow-floating relative my-auto z-10 text-left"
          >
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-amber-500">
                  <Key size={20} weight="duotone" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted block uppercase tracking-wider font-mono">
                    BLANQUEO DE CLAVE
                  </span>
                  <h2 className="font-heading font-bold text-lg text-primary">
                    Restablecer Contraseña
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

            <div className="rounded-xl border border-subtle bg-elevated/50 p-3.5 flex items-center justify-between">
              <div>
                <span className="font-heading font-bold text-sm text-primary block">
                  {empleado?.nombre}
                </span>
                <span className="text-xs text-muted font-mono">{empleado?.email}</span>
              </div>
              <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-md border border-subtle bg-surface text-secondary">
                {empleado?.turnoAsignado}
              </span>
            </div>

            {errorLocal && (
              <div className="border border-red-500/30 bg-red-500/10 rounded-xl p-3 text-red-600 dark:text-red-400 text-xs font-sans flex items-start gap-2.5">
                <WarningCircle size={16} weight="bold" className="shrink-0 mt-0.5" />
                <span className="leading-snug">{errorLocal}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono uppercase text-muted tracking-wider font-semibold">
                    Nueva Contraseña Provisoria *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPassword('Dastik2026!');
                      setConfirmarPassword('Dastik2026!');
                      setDebeCambiarPassword(true);
                    }}
                    className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkle size={12} weight="fill" />
                    <span>Usar "Dastik2026!"</span>
                  </button>
                </div>
                <Input
                  id="admin-reset-nueva-password"
                  label=""
                  type="text"
                  required
                  placeholder="Dastik2026!"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  autoFocus
                />
              </div>

              <Input
                id="admin-reset-confirmar-password"
                label="Confirmar Contraseña *"
                type="text"
                required
                placeholder="Dastik2026!"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                disabled={isPending}
              />

              <label className="flex items-center gap-2.5 text-xs text-secondary cursor-pointer select-none border border-subtle bg-elevated/40 rounded-xl p-3">
                <input
                  type="checkbox"
                  checked={debeCambiarPassword}
                  onChange={(e) => setDebeCambiarPassword(e.target.checked)}
                  className="rounded border-subtle text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <span className="leading-snug">
                  Exigir que el empleado cree su propia clave al iniciar sesión (Recomendado)
                </span>
              </label>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-subtle">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={isPending}>
                  <LockKey size={16} weight="bold" />
                  <span>{isPending ? 'Guardando...' : 'Asignar Contraseña'}</span>
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
