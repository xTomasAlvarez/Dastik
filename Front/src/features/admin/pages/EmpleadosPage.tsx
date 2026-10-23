import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
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
  Key,
  PencilSimple,
  Pause,
  Play,
  WarningCircle,
} from '@phosphor-icons/react';
import {
  empleadosApi,
  type EmpleadoDto,
  type CrearEmpleadoRequest,
  type ActualizarEmpleadoRequest,
} from '../api/empleadosApi';
import { Button } from '../../../components/ui/Button';
import {
  ModalCrearEmpleado,
  ModalEditarEmpleado,
  ModalLiquidarJornada,
  ModalResetPasswordEmpleado,
} from '../components/EmpleadosModals';
import type { AxiosError } from 'axios';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 28,
    },
  },
};

export const EmpleadosPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [busqueda, setBusqueda] = useState('');
  const [filtroTurno, setFiltroTurno] = useState<'TODOS' | 'Mañana' | 'Tarde' | 'Completo'>('TODOS');

  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [empleadoParaEditar, setEmpleadoParaEditar] = useState<EmpleadoDto | null>(null);
  const [isModalEditarOpen, setIsModalEditarOpen] = useState(false);

  const [empleadoParaLiquidar, setEmpleadoParaLiquidar] = useState<EmpleadoDto | null>(null);
  const [empleadoParaResetPassword, setEmpleadoParaResetPassword] = useState<EmpleadoDto | null>(null);
  const [horasTrabajadas, setHorasTrabajadas] = useState<string>('12');
  const [isResetPending, setIsResetPending] = useState(false);

  const [nuevoEmpleado, setNuevoEmpleado] = useState<CrearEmpleadoRequest>({
    nombre: '',
    email: '',
    password: 'Dastik2026!',
    turno: 'Completo',
    tarifaPorHora: 4500,
    rol: 'Empleado',
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

  // Mutación: Crear Empleado
  const crearMutation = useMutation({
    mutationFn: empleadosApi.crearEmpleado,
    onSuccess: (nuevo) => {
      queryClient.invalidateQueries({ queryKey: ['admin-empleados'] });
      setIsModalCrearOpen(false);
      setNuevoEmpleado({
        nombre: '',
        email: '',
        password: 'Dastik2026!',
        turno: 'Completo',
        tarifaPorHora: 4500,
        rol: 'Empleado',
      });
      setNotificacion({
        tipo: 'exito',
        texto: `Empleado "${nuevo.nombre}" dado de alta con éxito. Se le requerirá cambio de contraseña en su primer login.`,
      });
      setTimeout(() => setNotificacion(null), 6000);
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ error?: string }>;
      const errorMsg =
        axiosErr.response?.data?.error ||
        axiosErr.message ||
        'Error desconocido al crear el empleado.';
      setNotificacion({
        tipo: 'error',
        texto: `No se pudo crear el empleado: ${errorMsg}`,
      });
      setTimeout(() => setNotificacion(null), 6000);
    },
  });

  // Mutación: Actualizar Empleado
  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActualizarEmpleadoRequest }) =>
      empleadosApi.actualizarEmpleado(id, data),
    onSuccess: (actualizado) => {
      queryClient.invalidateQueries({ queryKey: ['admin-empleados'] });
      setIsModalEditarOpen(false);
      setEmpleadoParaEditar(null);
      setNotificacion({
        tipo: 'exito',
        texto: `Ficha del empleado "${actualizado.nombre}" actualizada con éxito.`,
      });
      setTimeout(() => setNotificacion(null), 6000);
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ error?: string }>;
      const errorMsg =
        axiosErr.response?.data?.error ||
        axiosErr.message ||
        'Error al actualizar los datos del empleado.';
      setNotificacion({
        tipo: 'error',
        texto: errorMsg,
      });
      setTimeout(() => setNotificacion(null), 6000);
    },
  });

  // Mutación: Alternar Activo / Inactivo
  const toggleActivoMutation = useMutation({
    mutationFn: (id: number) => empleadosApi.toggleActivo(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-empleados'] });
      setNotificacion({
        tipo: 'exito',
        texto: res.message || 'Estado del empleado modificado con éxito.',
      });
      setTimeout(() => setNotificacion(null), 5000);
    },
    onError: () => {
      setNotificacion({
        tipo: 'error',
        texto: 'No se pudo alternar el estado del empleado.',
      });
      setTimeout(() => setNotificacion(null), 5000);
    },
  });

  const handleResetPasswordSubmit = async (
    empleadoId: number,
    nuevaPassword: string,
    debeCambiarPassword: boolean
  ) => {
    try {
      setIsResetPending(true);
      const res = await empleadosApi.resetPassword(empleadoId, nuevaPassword, debeCambiarPassword);
      setNotificacion({
        tipo: 'exito',
        texto: res.message || 'Contraseña del empleado actualizada exitosamente.',
      });
      setEmpleadoParaResetPassword(null);
      setTimeout(() => setNotificacion(null), 6000);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      const errorMsg =
        axiosErr.response?.data?.error ||
        axiosErr.message ||
        'No se pudo actualizar la contraseña.';
      setNotificacion({
        tipo: 'error',
        texto: errorMsg,
      });
      setTimeout(() => setNotificacion(null), 6000);
    } finally {
      setIsResetPending(false);
    }
  };

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
    const activos = empleados.filter((e) => e.activo).length;
    const manana = empleados.filter((e) => e.turnoAsignado === 'Mañana').length;
    const tarde = empleados.filter((e) => e.turnoAsignado === 'Tarde').length;
    const completo = empleados.filter((e) => e.turnoAsignado === 'Completo').length;
    const tarifaPromedio =
      total > 0 ? Math.round(empleados.reduce((acc, e) => acc + e.tarifaPorHora, 0) / total) : 0;

    return { total, activos, manana, tarde, completo, tarifaPromedio };
  }, [empleados]);

  const handleCrearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEmpleado.nombre.trim() || !nuevoEmpleado.email.trim()) {
      setNotificacion({ tipo: 'error', texto: 'Por favor completa todos los campos requeridos.' });
      return;
    }
    crearMutation.mutate(nuevoEmpleado);
  };

  const handleActualizarSubmit = async (data: ActualizarEmpleadoRequest) => {
    if (!empleadoParaEditar) return;
    await actualizarMutation.mutateAsync({ id: empleadoParaEditar.id, data });
  };

  useEffect(() => {
    const algunModalAbierto =
      isModalCrearOpen ||
      isModalEditarOpen ||
      !!empleadoParaLiquidar ||
      !!empleadoParaResetPassword;

    if (algunModalAbierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalCrearOpen && !crearMutation.isPending) {
          setIsModalCrearOpen(false);
        } else if (isModalEditarOpen && !actualizarMutation.isPending) {
          setIsModalEditarOpen(false);
        } else if (empleadoParaLiquidar) {
          setEmpleadoParaLiquidar(null);
        } else if (empleadoParaResetPassword && !isResetPending) {
          setEmpleadoParaResetPassword(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isModalCrearOpen,
    isModalEditarOpen,
    empleadoParaLiquidar,
    empleadoParaResetPassword,
    crearMutation.isPending,
    actualizarMutation.isPending,
    isResetPending,
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-wider mb-1">
            <span>OPERACIONES</span>
            <span>/</span>
            <span className="text-primary font-bold">GESTIÓN DE PERSONAL</span>
          </div>
          <h1 className="font-heading font-bold text-2xl text-primary tracking-tight">
            Equipo &amp; Jornales
          </h1>
          <p className="text-xs text-secondary mt-1 font-sans">
            Alta de cajeros, asignación de turnos, liquidación horaria y restablecimiento de claves.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            title="Refrescar listado"
          >
            <ArrowClockwise
              size={16}
              weight="bold"
              className={isRefetching ? 'animate-spin text-amber-500' : ''}
            />
            <span className="hidden sm:inline">Actualizar</span>
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

      {/* Banner de Notificaciones */}
      {notificacion && (
        <div
          className={`rounded-xl border p-3.5 flex items-start justify-between gap-3 text-xs font-sans animate-in slide-in-from-top-2 duration-150 ${
            notificacion.tipo === 'exito'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {notificacion.tipo === 'exito' ? (
              <CheckCircle size={17} weight="bold" className="shrink-0 mt-0.5" />
            ) : (
              <WarningCircle size={17} weight="bold" className="shrink-0 mt-0.5" />
            )}
            <span className="font-medium leading-relaxed">{notificacion.texto}</span>
          </div>
          <button
            onClick={() => setNotificacion(null)}
            className="hover:opacity-75 p-0.5 cursor-pointer shrink-0"
            title="Cerrar aviso"
          >
            <X size={15} weight="bold" />
          </button>
        </div>
      )}

      {/* Widgets de Métricas Rápidas */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants} className="rounded-xl border border-subtle bg-surface p-5 shadow-surface">
          <div className="flex items-center justify-between text-secondary mb-3">
            <span className="text-xs font-semibold text-primary">Equipo Activo</span>
            <Users size={18} weight="duotone" className="text-amber-500" />
          </div>
          <div className="font-mono tabular-nums font-bold text-3xl text-primary tracking-tight">
            {metrics.activos} <span className="text-xs text-muted font-normal">/ {metrics.total} total</span>
          </div>
          <p className="text-xs text-muted mt-1 font-sans">
            Personal operativo habilitado para POS
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-xl border border-subtle bg-surface p-5 shadow-surface">
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
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-xl border border-subtle bg-surface p-5 shadow-surface">
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
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-xl border border-subtle bg-surface p-5 shadow-surface">
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
        </motion.div>
      </motion.div>

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
            placeholder="Buscar por nombre o correo de empleado..."
            className="w-full bg-elevated border border-subtle focus:border-strong rounded-xl text-primary text-xs pl-9 pr-4 py-2.5 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 relative">
          {(['TODOS', 'Mañana', 'Tarde', 'Completo'] as const).map((turno) => {
            const activo = filtroTurno === turno;
            return (
              <button
                key={turno}
                type="button"
                onClick={() => setFiltroTurno(turno)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activo
                    ? 'text-amber-600 dark:text-amber-400 font-bold'
                    : 'border border-subtle bg-elevated text-secondary hover:text-primary'
                }`}
              >
                {activo && (
                  <motion.div
                    layoutId="empleados-filtro-turno-pill"
                    className="absolute inset-0 bg-amber-500/10 border border-amber-500 rounded-lg shadow-xs"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">
                  {turno === 'TODOS' ? 'Todos los Turnos' : `Turno ${turno}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabla de Empleados */}
      <div className="rounded-xl border border-subtle bg-surface shadow-surface overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <ArrowClockwise size={28} className="animate-spin text-amber-500 mx-auto" />
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
                  <th className="py-3.5 px-4 text-right">Jornada 12h</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle text-xs font-sans">
                {empleadosFiltrados.map((emp) => {
                  const jornada12h = emp.tarifaPorHora * 12;

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-elevated/50 transition-colors group ${
                        !emp.activo ? 'opacity-60 bg-elevated/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl border border-subtle bg-elevated flex items-center justify-center font-heading font-bold text-xs text-primary shrink-0">
                            {emp.nombre.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-heading font-bold text-sm text-primary block">
                                {emp.nombre}
                              </span>
                              {emp.rol === 'Admin' && (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-500">
                                  ADMIN
                                </span>
                              )}
                            </div>
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
                        <span className="text-[11px] text-muted block">12 horas</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {emp.activo ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle size={12} weight="bold" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border border-subtle bg-elevated text-muted">
                              <Pause size={12} weight="bold" />
                              Pausado
                            </span>
                          )}

                          {emp.debeCambiarPassword && (
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              Clave Temp.
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Botón Editar */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEmpleadoParaEditar(emp);
                              setIsModalEditarOpen(true);
                            }}
                            title={`Editar datos de ${emp.nombre}`}
                          >
                            <PencilSimple size={14} weight="bold" />
                            <span className="hidden xl:inline">Editar</span>
                          </Button>

                          {/* Botón Liquidar */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEmpleadoParaLiquidar(emp);
                              setHorasTrabajadas('12');
                            }}
                            title={`Calcular liquidación diaria para ${emp.nombre}`}
                          >
                            <Calculator size={14} weight="duotone" className="text-emerald-500" />
                            <span className="hidden xl:inline">Liquidar</span>
                          </Button>

                          {/* Botón Cambiar Clave */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEmpleadoParaResetPassword(emp)}
                            title={`Restablecer o blanquear contraseña para ${emp.nombre}`}
                          >
                            <Key size={14} weight="duotone" className="text-amber-500" />
                            <span className="hidden xl:inline">Clave</span>
                          </Button>

                          {/* Botón Activar / Pausar */}
                          <button
                            type="button"
                            onClick={() => toggleActivoMutation.mutate(emp.id)}
                            disabled={toggleActivoMutation.isPending}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer text-xs ${
                              emp.activo
                                ? 'border-subtle hover:border-red-500/40 hover:bg-red-500/10 text-muted hover:text-red-500'
                                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                            }`}
                            title={emp.activo ? `Pausar acceso para ${emp.nombre}` : `Reactivar acceso para ${emp.nombre}`}
                          >
                            {emp.activo ? <Pause size={14} weight="bold" /> : <Play size={14} weight="bold" />}
                          </button>
                        </div>
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
      <ModalCrearEmpleado
        isOpen={isModalCrearOpen}
        onClose={() => setIsModalCrearOpen(false)}
        nuevoEmpleado={nuevoEmpleado}
        onChangeNuevoEmpleado={setNuevoEmpleado}
        onSubmit={handleCrearSubmit}
        isPending={crearMutation.isPending}
      />

      {/* MODAL 2: EDITAR EMPLEADO */}
      <ModalEditarEmpleado
        isOpen={isModalEditarOpen}
        onClose={() => {
          setIsModalEditarOpen(false);
          setEmpleadoParaEditar(null);
        }}
        empleado={empleadoParaEditar}
        onActualizar={handleActualizarSubmit}
        isPending={actualizarMutation.isPending}
      />

      {/* MODAL 3: LIQUIDAR JORNADA */}
      <ModalLiquidarJornada
        empleado={empleadoParaLiquidar}
        onClose={() => setEmpleadoParaLiquidar(null)}
        horasTrabajadas={horasTrabajadas}
        onChangeHorasTrabajadas={setHorasTrabajadas}
        formatearDinero={formatearDinero}
      />

      {/* MODAL 4: CAMBIAR / RESETEAR CONTRASEÑA DE EMPLEADO */}
      <ModalResetPasswordEmpleado
        empleado={empleadoParaResetPassword}
        onClose={() => setEmpleadoParaResetPassword(null)}
        onSubmit={handleResetPasswordSubmit}
        isPending={isResetPending}
      />
    </div>
  );
};
