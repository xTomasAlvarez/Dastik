import React, { useState, useMemo } from 'react';
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

export const EmpleadosPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Estados de Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroTurno, setFiltroTurno] = useState<'TODOS' | 'Mañana' | 'Tarde' | 'Completo'>('TODOS');

  // Estados de Modales
  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [empleadoParaLiquidar, setEmpleadoParaLiquidar] = useState<EmpleadoDto | null>(null);
  const [horasTrabajadas, setHorasTrabajadas] = useState<string>('12');

  // Estado del Formulario de Creación
  const [nuevoEmpleado, setNuevoEmpleado] = useState<CrearEmpleadoRequest>({
    nombre: '',
    email: '',
    password: '',
    turno: 'Completo',
    tarifaPorHora: 3500,
  });

  // Mensaje de notificación
  const [notificacion, setNotificacion] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Consulta de Empleados
  const {
    data: empleados = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-empleados'],
    queryFn: empleadosApi.obtenerEmpleados,
  });

  // Mutación para Crear Empleado
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

  // Formateador de Moneda
  const formatearDinero = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  // Filtrado de empleados
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

  // Métricas rápidas del staff
  const metrics = useMemo(() => {
    const total = empleados.length;
    const manana = empleados.filter((e) => e.turnoAsignado === 'Mañana').length;
    const tarde = empleados.filter((e) => e.turnoAsignado === 'Tarde').length;
    const completo = empleados.filter((e) => e.turnoAsignado === 'Completo').length;
    const tarifaPromedio = total > 0
      ? Math.round(empleados.reduce((acc, e) => acc + e.tarifaPorHora, 0) / total)
      : 0;

    return { total, manana, tarde, completo, tarifaPromedio };
  }, [empleados]);

  // Manejo de Creación
  const handleCrearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEmpleado.nombre.trim() || !nuevoEmpleado.email.trim() || !nuevoEmpleado.password.trim()) {
      setNotificacion({ tipo: 'error', texto: 'Por favor completa todos los campos requeridos.' });
      return;
    }
    crearMutation.mutate(nuevoEmpleado);
  };

  // Cálculo en vivo para el modal de liquidación
  const horasNum = parseFloat(horasTrabajadas) || 0;
  const tarifaActual = empleadoParaLiquidar?.tarifaPorHora ?? 0;
  const totalCalculado = Math.round(horasNum * tarifaActual * 100) / 100;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Notificación Feedback */}
      {notificacion && (
        <div
          className={`p-4 border text-xs font-mono uppercase tracking-wider flex items-center justify-between transition-all ${
            notificacion.tipo === 'exito'
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500 text-rose-300'
          }`}
        >
          <span>{notificacion.texto}</span>
          <button onClick={() => setNotificacion(null)} className="hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Avant-Garde */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#71717A]">
            EQUIPO & RECURSOS HUMANOS
          </span>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[#FAFAFA] tracking-tight uppercase">
            GESTIÓN DE EMPLEADOS Y SUELDOS
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="border border-[#333333] bg-[#0E0E0E] hover:bg-[#1A1A1A] text-[#FAFAFA] px-3.5 py-2.5 text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-fast disabled:opacity-50"
            title="Refrescar lista de empleados"
          >
            <ArrowClockwise
              size={15}
              weight="light"
              className={isRefetching ? 'animate-spin text-amber-400' : 'text-[#71717A]'}
            />
            <span>{isRefetching ? 'ACTUALIZANDO...' : 'REFRESCAR'}</span>
          </button>

          <button
            onClick={() => setIsModalCrearOpen(true)}
            className="border border-[#FAFAFA] bg-[#FAFAFA] hover:bg-[#D4D4D8] text-[#000000] px-4 py-2.5 text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 transition-fast"
          >
            <UserPlus size={16} weight="bold" />
            <span>NUEVO EMPLEADO</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Staff */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Empleados */}
        <div className="border border-[#222222] bg-[#090909] p-5">
          <div className="flex items-center justify-between text-[#71717A] mb-3">
            <span className="text-[10px] uppercase font-mono tracking-widest">PERSONAL TOTAL</span>
            <Users size={18} weight="light" />
          </div>
          <div className="font-heading font-bold text-3xl text-[#FAFAFA] tracking-tight">
            {metrics.total}
          </div>
          <p className="text-[11px] text-[#71717A] mt-1 font-sans">
            Usuarios con acceso de caja al POS
          </p>
        </div>

        {/* KPI 2: Turno Mañana */}
        <div className="border border-[#222222] bg-[#090909] p-5">
          <div className="flex items-center justify-between text-[#71717A] mb-3">
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400">TURNO MAÑANA</span>
            <Sun size={18} weight="light" className="text-amber-400" />
          </div>
          <div className="font-heading font-bold text-3xl text-amber-400 tracking-tight">
            {metrics.manana}
          </div>
          <p className="text-[11px] text-[#71717A] mt-1 font-sans">
            Horario apertura (10:00 a 16:00 aprox.)
          </p>
        </div>

        {/* KPI 3: Turno Tarde */}
        <div className="border border-[#222222] bg-[#090909] p-5">
          <div className="flex items-center justify-between text-[#71717A] mb-3">
            <span className="text-[10px] uppercase font-mono tracking-widest text-purple-400">TURNO TARDE</span>
            <Moon size={18} weight="light" className="text-purple-400" />
          </div>
          <div className="font-heading font-bold text-3xl text-purple-400 tracking-tight">
            {metrics.tarde}
          </div>
          <p className="text-[11px] text-[#71717A] mt-1 font-sans">
            Horario cierre (16:00 a 22:00 aprox.)
          </p>
        </div>

        {/* KPI 4: Tarifa Promedio */}
        <div className="border border-[#222222] bg-[#090909] p-5">
          <div className="flex items-center justify-between text-[#71717A] mb-3">
            <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400">TARIFA MEDIA / HORA</span>
            <Money size={18} weight="light" className="text-emerald-400" />
          </div>
          <div className="font-heading font-bold text-2xl text-emerald-400 tracking-tight font-mono">
            {formatearDinero(metrics.tarifaPromedio)}
          </div>
          <p className="text-[11px] text-[#71717A] mt-1 font-sans">
            Base salarial horaria promedio
          </p>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="border border-[#222222] bg-[#090909] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass
            size={16}
            weight="light"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]"
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full bg-[#000000] border border-[#333333] focus:border-[#FAFAFA] text-[#FAFAFA] text-xs font-mono pl-10 pr-4 py-2.5 placeholder:text-[#555555] outline-none transition-fast"
          />
        </div>

        {/* Filtro por Turno */}
        <div className="flex items-center gap-1 border border-[#333333] bg-[#000000] p-1">
          <span className="text-[10px] font-mono uppercase text-[#71717A] px-2">TURNO:</span>
          {(['TODOS', 'Mañana', 'Tarde', 'Completo'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFiltroTurno(t)}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-fast ${
                filtroTurno === t
                  ? 'bg-[#FAFAFA] text-[#000000] font-bold'
                  : 'text-[#71717A] hover:text-[#FAFAFA]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Data Grid de Empleados */}
      <div className="border border-[#222222] bg-[#090909] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <ArrowClockwise size={28} weight="light" className="animate-spin text-[#71717A] mx-auto" />
            <p className="text-xs font-mono uppercase tracking-widest text-[#71717A]">
              CARGANDO EQUIPO DE EMPLEADOS...
            </p>
          </div>
        ) : empleadosFiltrados.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users size={36} weight="light" className="text-[#333333] mx-auto" />
            <p className="text-xs font-mono uppercase tracking-widest text-[#71717A]">
              NO SE ENCONTRARON EMPLEADOS CON LOS FILTROS ACTUALES
            </p>
            {(busqueda || filtroTurno !== 'TODOS') && (
              <button
                onClick={() => {
                  setBusqueda('');
                  setFiltroTurno('TODOS');
                }}
                className="text-xs font-mono text-[#FAFAFA] underline hover:text-emerald-400 transition-fast"
              >
                Restablecer filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#222222] bg-[#050505] text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
                  <th className="py-3 px-4">EMPLEADO / OPERADOR</th>
                  <th className="py-3 px-4">TURNO ASIGNADO</th>
                  <th className="py-3 px-4 text-right">TARIFA X HORA</th>
                  <th className="py-3 px-4 text-right">JORNADA COMPLETA (12H)</th>
                  <th className="py-3 px-4 text-center">ESTADO</th>
                  <th className="py-3 px-4 text-center">ACCIÓN RÁPIDA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A] text-xs font-sans">
                {empleadosFiltrados.map((emp) => {
                  const jornada12h = emp.tarifaPorHora * 12;

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-[#111111] transition-fast group"
                    >
                      {/* Empleado (Nombre & Email) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 border border-[#333333] bg-[#141414] flex items-center justify-center font-heading font-bold text-xs text-[#FAFAFA]">
                            {emp.nombre.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-heading font-semibold text-sm text-[#FAFAFA] block">
                              {emp.nombre}
                            </span>
                            <span className="font-mono text-[11px] text-[#71717A]">
                              {emp.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Turno Asignado */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border ${
                            emp.turnoAsignado === 'Mañana'
                              ? 'bg-amber-950/30 border-amber-600/40 text-amber-400'
                              : emp.turnoAsignado === 'Tarde'
                              ? 'bg-purple-950/30 border-purple-600/40 text-purple-400'
                              : 'bg-blue-950/30 border-blue-600/40 text-blue-400'
                          }`}
                        >
                          {emp.turnoAsignado === 'Mañana' && <Sun size={12} weight="bold" />}
                          {emp.turnoAsignado === 'Tarde' && <Moon size={12} weight="bold" />}
                          {emp.turnoAsignado === 'Completo' && <ClockAfternoon size={12} weight="bold" />}
                          TURNO {emp.turnoAsignado.toUpperCase()}
                        </span>
                      </td>

                      {/* Tarifa x Hora */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {formatearDinero(emp.tarifaPorHora)}
                        </span>
                        <span className="text-[10px] text-[#71717A] font-mono block">/ hora</span>
                      </td>

                      {/* Estimación Jornada Completa (12h) */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono text-[#FAFAFA] font-medium">
                          {formatearDinero(jornada12h)}
                        </span>
                        <span className="text-[10px] text-[#71717A] font-sans block">12 horas continuas</span>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono border border-emerald-600/40 bg-emerald-950/30 text-emerald-400 uppercase">
                          <CheckCircle size={10} weight="bold" />
                          ACTIVO
                        </span>
                      </td>

                      {/* Acción Rápida: Liquidar Jornada */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setEmpleadoParaLiquidar(emp);
                            setHorasTrabajadas('12');
                          }}
                          className="border border-[#333333] hover:border-emerald-500 bg-[#141414] hover:bg-emerald-950/40 text-[#FAFAFA] hover:text-emerald-300 px-3 py-1.5 text-xs font-mono uppercase tracking-wider inline-flex items-center gap-2 transition-fast"
                          title={`Calcular pago diario para ${emp.nombre}`}
                        >
                          <Calculator size={15} weight="bold" className="text-emerald-400" />
                          <span>LIQUIDAR JORNADA</span>
                        </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="border border-[#333333] bg-[#0A0A0A] w-full max-w-lg p-6 space-y-6">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center gap-2.5">
                <div className="border border-[#333333] bg-[#141414] p-2 text-[#FAFAFA]">
                  <UserPlus size={18} weight="light" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] block">
                    ALTA DE PERSONAL
                  </span>
                  <h2 className="font-heading font-extrabold text-lg text-[#FAFAFA] uppercase">
                    REGISTRAR NUEVO EMPLEADO
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setIsModalCrearOpen(false)}
                className="text-[#71717A] hover:text-[#FAFAFA] transition-fast p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleCrearSubmit} className="space-y-4">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] block">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sofía Martínez"
                  value={nuevoEmpleado.nombre}
                  onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, nombre: e.target.value })}
                  className="w-full bg-[#000000] border border-[#333333] focus:border-[#FAFAFA] text-[#FAFAFA] text-xs font-sans px-3 py-2.5 outline-none transition-fast"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] block">
                  Correo Electrónico (Usuario POS) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="sofia@dastik.com"
                  value={nuevoEmpleado.email}
                  onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, email: e.target.value })}
                  className="w-full bg-[#000000] border border-[#333333] focus:border-[#FAFAFA] text-[#FAFAFA] text-xs font-mono px-3 py-2.5 outline-none transition-fast"
                />
              </div>

              {/* Password Temporal */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] block">
                  Contraseña Temporal * (mínimo 6 caracteres)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={nuevoEmpleado.password}
                  onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, password: e.target.value })}
                  className="w-full bg-[#000000] border border-[#333333] focus:border-[#FAFAFA] text-[#FAFAFA] text-xs font-mono px-3 py-2.5 outline-none transition-fast"
                />
                <span className="text-[10px] text-[#71717A] font-sans block">
                  El sistema le exigirá cambiar la contraseña en su primer inicio de sesión en el mostrador.
                </span>
              </div>

              {/* Grid: Turno & Tarifa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Turno */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] block">
                    Turno Asignado
                  </label>
                  <select
                    value={nuevoEmpleado.turno}
                    onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, turno: e.target.value })}
                    className="w-full bg-[#000000] border border-[#333333] focus:border-[#FAFAFA] text-[#FAFAFA] text-xs font-mono px-3 py-2.5 outline-none transition-fast"
                  >
                    <option value="Mañana">Mañana (10:00 - 16:00)</option>
                    <option value="Tarde">Tarde (16:00 - 22:00)</option>
                    <option value="Completo">Completo (10:00 - 22:00)</option>
                  </select>
                </div>

                {/* Tarifa x Hora */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] block">
                    Tarifa por Hora ($ ARS) *
                  </label>
                  <input
                    type="number"
                    step="50"
                    min="0"
                    required
                    value={nuevoEmpleado.tarifaPorHora}
                    onChange={(e) =>
                      setNuevoEmpleado({ ...nuevoEmpleado, tarifaPorHora: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#000000] border border-[#333333] focus:border-[#FAFAFA] text-emerald-400 font-bold text-xs font-mono px-3 py-2.5 outline-none transition-fast"
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsModalCrearOpen(false)}
                  className="border border-[#333333] hover:bg-[#1A1A1A] text-[#FAFAFA] px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-fast"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={crearMutation.isPending}
                  className="border border-[#FAFAFA] bg-[#FAFAFA] hover:bg-[#D4D4D8] text-[#000000] px-5 py-2.5 text-xs font-heading font-bold uppercase tracking-wider transition-fast disabled:opacity-50"
                >
                  {crearMutation.isPending ? 'CREANDO...' : 'GUARDAR EMPLEADO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LIQUIDAR JORNADA */}
      {empleadoParaLiquidar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="border border-[#333333] bg-[#0A0A0A] w-full max-w-lg p-6 space-y-6">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center gap-2.5">
                <div className="border border-emerald-600/50 bg-emerald-950/40 p-2 text-emerald-400">
                  <Calculator size={18} weight="bold" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] block">
                    LIQUIDACIÓN DIARIA
                  </span>
                  <h2 className="font-heading font-extrabold text-lg text-[#FAFAFA] uppercase">
                    LIQUIDAR JORNADA DE TRABAJO
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setEmpleadoParaLiquidar(null)}
                className="text-[#71717A] hover:text-[#FAFAFA] transition-fast p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tarjeta del Empleado */}
            <div className="border border-[#222222] bg-[#0E0E0E] p-4 flex items-center justify-between">
              <div>
                <span className="font-heading font-bold text-base text-[#FAFAFA] block">
                  {empleadoParaLiquidar.nombre}
                </span>
                <span className="text-xs text-[#71717A] font-mono">
                  Turno: {empleadoParaLiquidar.turnoAsignado} • {empleadoParaLiquidar.email}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] block">
                  TARIFA PERSONALIZADA
                </span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {formatearDinero(empleadoParaLiquidar.tarifaPorHora)} / h
                </span>
              </div>
            </div>

            {/* Input y Pregunta de Horas */}
            <div className="space-y-3">
              <label className="font-heading font-bold text-sm text-[#FAFAFA] block uppercase tracking-tight">
                ¿Cuántas horas trabajó hoy?
              </label>

              {/* Botones rápidos de preset */}
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
                    className={`border px-2 py-2 text-xs font-mono transition-fast ${
                      horasTrabajadas === preset.val
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold'
                        : 'border-[#333333] bg-[#111111] text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Input numérico exacto */}
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={horasTrabajadas}
                  onChange={(e) => setHorasTrabajadas(e.target.value)}
                  placeholder="Ingresa horas exactas (ej: 8.5)"
                  className="w-full bg-[#000000] border border-[#333333] focus:border-emerald-500 text-[#FAFAFA] text-base font-mono pl-4 pr-16 py-3 outline-none transition-fast font-bold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono uppercase tracking-widest text-[#71717A]">
                  HORAS
                </span>
              </div>
            </div>

            {/* RECUADRO GIGANTE AVANT-GARDE: TOTAL A PAGAR */}
            <div className="border border-emerald-500/80 bg-[#0A1A0F] p-6 text-center space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-emerald-400 block font-semibold">
                TOTAL A PAGAR POR LA JORNADA
              </span>
              <div className="font-heading font-extrabold text-4xl sm:text-5xl text-emerald-300 tracking-tight font-mono">
                {formatearDinero(totalCalculado)}
              </div>
              <div className="text-[11px] font-mono text-emerald-400/80 pt-1 border-t border-emerald-900/50 mt-2 flex items-center justify-center gap-2">
                <span>{horasNum} horas</span>
                <span>×</span>
                <span>{formatearDinero(tarifaActual)}/h</span>
                <span>=</span>
                <span className="font-bold text-emerald-200">{formatearDinero(totalCalculado)}</span>
              </div>
            </div>

            {/* Botones de Cierre */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setEmpleadoParaLiquidar(null)}
                className="w-full sm:w-auto border border-[#333333] hover:bg-[#1A1A1A] text-[#FAFAFA] px-5 py-2.5 text-xs font-mono uppercase tracking-wider transition-fast"
              >
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
