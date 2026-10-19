import React from 'react';
import { UserPlus, Calculator, X } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { EmpleadoDto, CrearEmpleadoRequest } from '../api/empleadosApi';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="rounded-xl border border-subtle bg-surface w-full max-w-lg p-6 space-y-5 shadow-floating">
        <div className="flex items-center justify-between pb-3 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-subtle bg-elevated p-2 text-amber-500">
              <UserPlus size={18} weight="duotone" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-muted block">
                Alta de Personal
              </span>
              <h2 className="font-heading font-bold text-lg text-primary">
                Registrar Nuevo Empleado
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-fast p-1 rounded-md cursor-pointer"
            title="Cerrar modal [ESC]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            id="nombreEmpleado"
            label="Nombre Completo *"
            type="text"
            required
            placeholder="Ej: Sofía Martínez"
            value={nuevoEmpleado.nombre}
            onChange={(e) =>
              onChangeNuevoEmpleado({ ...nuevoEmpleado, nombre: e.target.value })
            }
          />

          <Input
            id="emailEmpleado"
            label="Correo Electrónico (Usuario POS) *"
            type="email"
            required
            placeholder="sofia@dastik.com"
            value={nuevoEmpleado.email}
            onChange={(e) =>
              onChangeNuevoEmpleado({ ...nuevoEmpleado, email: e.target.value })
            }
          />

          <div>
            <Input
              id="passwordEmpleado"
              label="Contraseña Temporal * (mínimo 6 caracteres)"
              type="password"
              required
              placeholder="••••••••"
              value={nuevoEmpleado.password}
              onChange={(e) =>
                onChangeNuevoEmpleado({ ...nuevoEmpleado, password: e.target.value })
              }
            />
            <span className="text-[11px] text-muted font-sans block mt-1">
              El sistema le exigirá cambiar la contraseña en su primer inicio de sesión.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary block">
                Turno Asignado
              </label>
              <select
                value={nuevoEmpleado.turno}
                onChange={(e) =>
                  onChangeNuevoEmpleado({ ...nuevoEmpleado, turno: e.target.value })
                }
                className="w-full bg-surface border border-subtle rounded-lg focus:border-amber-500/80 text-primary text-sm font-sans px-3.5 py-2 outline-none transition-fast shadow-surface"
              >
                <option value="Mañana">Mañana (10:00 - 16:00)</option>
                <option value="Tarde">Tarde (16:00 - 22:00)</option>
                <option value="Completo">Completo (10:00 - 22:00)</option>
              </select>
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
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-subtle">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? 'Creando...' : 'Guardar Empleado'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
  if (!empleado) return null;

  const horasNum = parseFloat(horasTrabajadas) || 0;
  const tarifaActual = empleado.tarifaPorHora ?? 0;
  const totalCalculado = Math.round(horasNum * tarifaActual * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="rounded-xl border border-subtle bg-surface w-full max-w-lg p-6 space-y-5 shadow-floating">
        <div className="flex items-center justify-between pb-3 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-500">
              <Calculator size={18} weight="duotone" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-muted block">
                Liquidación Diaria
              </span>
              <h2 className="font-heading font-bold text-lg text-primary">
                Liquidar Jornada de Trabajo
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-fast p-1 rounded-md cursor-pointer"
            title="Cerrar modal [ESC]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-xl border border-subtle bg-elevated/50 p-4 flex items-center justify-between">
          <div>
            <span className="font-heading font-bold text-base text-primary block">
              {empleado.nombre}
            </span>
            <span className="text-xs text-secondary font-sans">
              Turno: {empleado.turnoAsignado} · {empleado.email}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-medium text-muted block">
              Tarifa Personalizada
            </span>
            <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {formatearDinero(empleado.tarifaPorHora)} / h
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="font-heading font-bold text-sm text-primary block">
            ¿Cuántas horas trabajó hoy?
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
                className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-fast cursor-pointer ${
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
              className="w-full bg-surface border border-subtle focus:border-emerald-500 rounded-lg text-primary text-base font-mono tabular-nums pl-4 pr-16 py-3 outline-none transition-fast font-bold"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">
              Horas
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center space-y-2">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
            Total a Pagar por la Jornada
          </span>
          <div className="font-mono tabular-nums font-bold text-4xl text-emerald-600 dark:text-emerald-300 tracking-tight">
            {formatearDinero(totalCalculado)}
          </div>
          <div className="text-xs font-mono tabular-nums text-secondary pt-2 border-t border-emerald-500/20 mt-2 flex items-center justify-center gap-2">
            <span>{horasNum} horas</span>
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
      </div>
    </div>
  );
};
