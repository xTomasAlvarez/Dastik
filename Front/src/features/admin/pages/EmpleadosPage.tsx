import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Calculator,
  Money,
  ArrowClockwise,
  MagnifyingGlass,
  CheckCircle,
  X,
  Sun,
  Moon,
  ClockAfternoon,
} from '@phosphor-icons/react';
import { empleadosApi, type EmpleadoDto, type CrearEmpleadoRequest } from '../api/empleadosApi';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export const EmpleadosPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [busqueda, setBusqueda] = useState('');
  const [filtroTurno, setFiltroTurno] = useState<'TODOS' | 'Mañana' | 'Tarde' | 'Completo'>('TODOS');

  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [empleadoParaLiquidar, setEmpleadoParaLiquidar] = useState<EmpleadoDto | null>(null);
  const [horasTrabajadas, setHorasTrabajadas] = useState<string>('12');

  const [nuevoEmpleado, setNuevoEmpleado] = useState<CrearEmpleadoRequest>({
    nombre: '',
    email: '',
    password: '',
    turno: 'Completo',
    tarifaPorHora: 3500,
  });

  const [notificacion, setNotificacion] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const {
    data: empleados = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-empleados'],
    queryFn: empleadosApi.obtenerEmpleados,
  });

  const crearMutation = useMutation({
    mutationFn: empleadosApi.crearEmpleado,
    onSuccess: (nuevo) => {
      queryClient.invalidateQueries({ queryKey: ['admin-empleados'] });
      setIsModalCrearOpen(false);
      setNuevoEmpleado({
        nombre: '',
        email: '',
        password: '',
        turno: 'Completo',
        tarifaPorHora: 3500,
      });
      setNotificacion({
        tipo: 'exito',
        texto: `Empleado "${nuevo.nombre}" dado de alta con éxito. Se le requerirá cambio de contraseña en su primer login.`,
      });
      setTimeout(() => setNotificacion(null), 6000);
    },
    onError: (err: any) => {
      const errorMsg =
        err?.response?.data?.error ||
        err?.message ||
        'Error desconocido al crear el empleado.';
      setNotificacion({
        tipo: 'error',
        texto: `No se pudo crear el empleado: ${errorMsg}`,
      });
      setTimeout(() => setNotificacion(null), 6000);
    },
  });

  const formatearDinero = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  const empleadosFiltrados = useMemo(() => {
    return empleados.filter((emp) => {
      if (filtroTurno !== 'TODOS' && emp.turnoAsignado !== filtroTurno) {
        return false;
      }
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim();
        const coincideNombre = emp.nombre.toLowerCase().includes(query);
        const coincideEmail = emp.email.toLowerCase().includes(query);
        return coincideNombre || coincideEmail;
      }
      return true;
    });
  }, [empleados, filtroTurno, busqueda]);

  const metrics = useMemo(() => {
    const total = empleados.length;
    const manana = empleados.filter((e) => e.turnoAsignado === 'Mañana').length;
    const tarde = empleados.filter((e) => e.turnoAsignado === 'Tarde').length;
    const completo = empleados.filter((e) => e.turnoAsignado === 'Completo').length;
    const tarifaPromedio =
      total > 0 ? Math.round(empleados.reduce((acc, e) => acc + e.tarifaPorHora, 0) / total) : 0;

    return { total, manana, tarde, completo, tarifaPromedio };
  }, [empleados]);

  const handleCrearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEmpleado.nombre.trim() || !nuevoEmpleado.email.trim() || !nuevoEmpleado.password.trim()) {
      setNotificacion({ tipo: 'error', texto: 'Por favor completa todos los campos requeridos.' });
      return;
    }
    crearMutation.mutate(nuevoEmpleado);
  };

  const horasNum = parseFloat(horasTrabajadas) || 0;
  const tarifaActual = empleadoParaLiquidar?.tarifaPorHora ?? 0;
  const totalCalculado = Math.round(horasNum * tarifaActual * 100) / 100;

  useEffect(() => {
    const algunModalAbierto = isModalCrearOpen || !!empleadoParaLiquidar;

    if (algunModalAbierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalCrearOpen && !crearMutation.isPending) {
          setIsModalCrearOpen(false);
        } else if (empleadoParaLiquidar) {
          setEmpleadoParaLiquidar(null);
        }
      }
    };

    if (algunModalAbierto) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isModalCrearOpen, empleadoParaLiquidar, crearMutation.isPending]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Notificación Feedback */}
      {notificacion && (
        <div
          className={`p-4 rounded-xl border text-xs font-sans flex items-center justify-between transition-all ${
            notificacion.tipo === 'exito'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
          }`}
        >
          <span className="font-medium">{notificacion.texto}</span>
          <button
            onClick={() => setNotificacion(null)}
            className="text-muted hover:text-primary cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-subtle">
        <div>
          <span className="text-xs font-medium text-amber-500 block">
            Equipo &amp; Recursos Humanos
          </span>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-primary tracking-tight">
            Gestión de Empleados y Sueldos
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => refetch()}
            disabled={isRefetching}
            title="Refrescar lista de empleados"
          >
            <ArrowClockwise
              size={15}
              weight="regular"
              className={isRefetching ? 'animate-spin text-amber-500' : 'text-secondary'}
            />
            <span>{isRefetching ? 'Actualizando...' : 'Refrescar'}</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsModalCrearOpen(true)}
          >
            <UserPlus size={16} weight="bold" />
            <span>Nuevo Empleado</span>
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI de Staff */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-subtle bg-surface p-5 shadow-surface">
          <div className="flex items-center justify-between text-secondary mb-3">
            <span className="text-xs font-semibold">Personal Total</span>
            <Users size={18} weight="duotone" className="text-sky-500" />
          </div>
          <div className="font-mono tabular-nums font-bold text-3xl text-primary tracking-tight">
            {metrics.total}
          </div>
          <p className="text-xs text-muted mt-1 font-sans">
            Usuarios con acceso de caja al POS
          </p>
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-5 shadow-surface">
          <div className="flex items-center justify-between text-secondary mb-3">
            <span className="text-xs font-semibold text-amber-500">Turno Mañana</span>
            <Sun size={18} weight="duotone" className="text-amber-500" />
          </div>
          <div className="font-mono tabular-nums font-bold text-3xl text-amber-500 tracking-tight">
            {metrics.manana}
          </div>
          <p className="text-xs text-muted mt-1 font-sans">
            Horario apertura (10:00 a 16:00 aprox.)
          </p>
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-5 shadow-surface">
          <div className="flex items-center justify-between text-secondary mb-3">
            <span className="text-xs font-semibold text-indigo-500">Turno Tarde</span>
            <Moon size={18} weight="duotone" className="text-indigo-500" />
          </div>
          <div className="font-mono tabular-nums font-bold text-3xl text-indigo-500 tracking-tight">
            {metrics.tarde}
          </div>
          <p className="text-xs text-muted mt-1 font-sans">
            Horario cierre (16:00 a 22:00 aprox.)
          </p>
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-5 shadow-surface">
          <div className="flex items-center justify-between text-secondary mb-3">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Tarifa Media / Hora
            </span>
            <Money size={18} weight="duotone" className="text-emerald-500" />
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatearDinero(metrics.tarifaPromedio)}
          </div>
          <p className="text-xs text-muted mt-1 font-sans">
            Base salarial horaria promedio
          </p>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="rounded-xl border border-subtle bg-surface p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-surface">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass
            size={16}
            weight="regular"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full bg-elevated focus:bg-surface border border-subtle focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 rounded-lg text-primary text-xs md:text-sm font-sans pl-10 pr-4 py-2 placeholder:text-muted outline-none transition-fast"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-subtle bg-elevated p-1">
          {(['TODOS', 'Mañana', 'Tarde', 'Completo'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFiltroTurno(t)}
              className={`px-3 py-1 text-xs font-sans font-semibold rounded-md transition-fast cursor-pointer ${
                filtroTurno === t
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {t === 'TODOS' ? 'Todos' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Data Grid de Empleados */}
      <div className="rounded-xl border border-subtle bg-surface overflow-hidden shadow-surface">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <ArrowClockwise size={28} weight="bold" className="animate-spin text-amber-500 mx-auto" />
            <p className="text-xs font-medium text-secondary">
              Cargando equipo de empleados...
            </p>
          </div>
        ) : empleadosFiltrados.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users size={36} weight="duotone" className="text-muted mx-auto" />
            <p className="text-xs font-medium text-secondary">
              No se encontraron empleados con los filtros actuales
            </p>
            {(busqueda || filtroTurno !== 'TODOS') && (
              <button
                onClick={() => {
                  setBusqueda('');
                  setFiltroTurno('TODOS');
                }}
                className="text-xs font-semibold text-amber-500 underline cursor-pointer"
              >
                Restablecer filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-subtle bg-elevated/60 text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  <th className="py-3.5 px-4">Empleado / Operador</th>
                  <th className="py-3.5 px-4">Turno Asignado</th>
                  <th className="py-3.5 px-4 text-right">Tarifa × Hora</th>
                  <th className="py-3.5 px-4 text-right">Jornada Completa (12h)</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-center">Acción Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle text-xs font-sans">
                {empleadosFiltrados.map((emp) => {
                  const jornada12h = emp.tarifaPorHora * 12;

                  return (
                    <tr key={emp.id} className="hover:bg-elevated/50 transition-fast group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg border border-subtle bg-elevated flex items-center justify-center font-heading font-bold text-xs text-primary">
                            {emp.nombre.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-heading font-bold text-sm text-primary block">
                              {emp.nombre}
                            </span>
                            <span className="font-mono text-xs text-secondary">{emp.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                            emp.turnoAsignado === 'Mañana'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                              : emp.turnoAsignado === 'Tarde'
                              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                              : 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400'
                          }`}
                        >
                          {emp.turnoAsignado === 'Mañana' && <Sun size={13} weight="duotone" />}
                          {emp.turnoAsignado === 'Tarde' && <Moon size={13} weight="duotone" />}
                          {emp.turnoAsignado === 'Completo' && (
                            <ClockAfternoon size={13} weight="duotone" />
                          )}
                          Turno {emp.turnoAsignado}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatearDinero(emp.tarifaPorHora)}
                        </span>
                        <span className="text-[11px] text-muted block">/ hora</span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono tabular-nums text-primary font-semibold">
                          {formatearDinero(jornada12h)}
                        </span>
                        <span className="text-[11px] text-muted block">12 horas continuas</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle size={12} weight="bold" />
                          Activo
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEmpleadoParaLiquidar(emp);
                            setHorasTrabajadas('12');
                          }}
                          title={`Calcular pago diario para ${emp.nombre}`}
                        >
                          <Calculator size={15} weight="duotone" className="text-emerald-500" />
                          <span>Liquidar Jornada</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: NUEVO EMPLEADO */}
      {isModalCrearOpen && (
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
                onClick={() => setIsModalCrearOpen(false)}
                className="text-muted hover:text-primary transition-fast p-1 rounded-md cursor-pointer"
                title="Cerrar modal [ESC]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCrearSubmit} className="space-y-4">
              <Input
                id="nombreEmpleado"
                label="Nombre Completo *"
                type="text"
                required
                placeholder="Ej: Sofía Martínez"
                value={nuevoEmpleado.nombre}
                onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, nombre: e.target.value })}
              />

              <Input
                id="emailEmpleado"
                label="Correo Electrónico (Usuario POS) *"
                type="email"
                required
                placeholder="sofia@dastik.com"
                value={nuevoEmpleado.email}
                onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, email: e.target.value })}
              />

              <div>
                <Input
                  id="passwordEmpleado"
                  label="Contraseña Temporal * (mínimo 6 caracteres)"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={nuevoEmpleado.password}
                  onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, password: e.target.value })}
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
                    onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, turno: e.target.value })}
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
                    setNuevoEmpleado({
                      ...nuevoEmpleado,
                      tarifaPorHora: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-subtle">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalCrearOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={crearMutation.isPending}
                >
                  {crearMutation.isPending ? 'Creando...' : 'Guardar Empleado'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LIQUIDAR JORNADA */}
      {empleadoParaLiquidar && (
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
                onClick={() => setEmpleadoParaLiquidar(null)}
                className="text-muted hover:text-primary transition-fast p-1 rounded-md cursor-pointer"
                title="Cerrar modal [ESC]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl border border-subtle bg-elevated/50 p-4 flex items-center justify-between">
              <div>
                <span className="font-heading font-bold text-base text-primary block">
                  {empleadoParaLiquidar.nombre}
                </span>
                <span className="text-xs text-secondary font-sans">
                  Turno: {empleadoParaLiquidar.turnoAsignado} · {empleadoParaLiquidar.email}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-medium text-muted block">
                  Tarifa Personalizada
                </span>
                <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatearDinero(empleadoParaLiquidar.tarifaPorHora)} / h
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
                    onClick={() => setHorasTrabajadas(preset.val)}
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
                  onChange={(e) => setHorasTrabajadas(e.target.value)}
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
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEmpleadoParaLiquidar(null)}
              >
                Cerrar [ESC]
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
