import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Database,
  ShieldCheck,
  FloppyDisk,
  SpinnerGap,
  ClockCounterClockwise,
  ArrowCounterClockwise,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import {
  configuracionApi,
  type BackupInfoDto,
} from '../api/configuracionApi';
import { Button } from '../../../components/ui/Button';

interface BackupsSectionProps {
  onFeedback: (tipo: 'exito' | 'error', mensaje: string) => void;
  itemVariants: any;
}

export const BackupsSection: React.FC<BackupsSectionProps> = ({
  onFeedback,
  itemVariants,
}) => {
  const queryClient = useQueryClient();
  const [motivoBackup, setMotivoBackup] = useState('');
  const [backupParaRestaurar, setBackupParaRestaurar] = useState<BackupInfoDto | null>(null);
  const [confirmPalabra, setConfirmPalabra] = useState('');

  const { data: backups = [], isLoading: loadingBackups } = useQuery({
    queryKey: ['config-backups'],
    queryFn: configuracionApi.obtenerBackups,
  });

  const crearBackupMutation = useMutation({
    mutationFn: (motivo?: string) =>
      configuracionApi.crearBackup({ motivo: motivo?.trim() || 'manual' }),
    onSuccess: (nuevo) => {
      queryClient.invalidateQueries({ queryKey: ['config-backups'] });
      setMotivoBackup('');
      onFeedback(
        'exito',
        `Punto de restauración "${nuevo.archivo}" creado correctamente (${nuevo.tamanoLegible}).`
      );
    },
    onError: (err: any) => {
      onFeedback(
        'error',
        err?.response?.data?.error || 'No se pudo crear el punto de restauración.'
      );
    },
  });

  const restaurarBackupMutation = useMutation({
    mutationFn: (fileName: string) => configuracionApi.restaurarBackup(fileName),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['config-backups'] });
      queryClient.invalidateQueries({ queryKey: ['productos-inventario'] });
      queryClient.invalidateQueries({ queryKey: ['catalogo-pos'] });
      queryClient.invalidateQueries({ queryKey: ['config-proveedores'] });
      queryClient.invalidateQueries({ queryKey: ['config-marcas'] });
      queryClient.invalidateQueries({ queryKey: ['config-categorias'] });
      setBackupParaRestaurar(null);
      setConfirmPalabra('');
      onFeedback(
        'exito',
        `${res.mensaje} (Snapshot preventivo guardado: ${res.snapshotPrevio})`
      );
    },
    onError: (err: any) => {
      onFeedback(
        'error',
        err?.response?.data?.error || 'Falló la restauración de la base de datos.'
      );
    },
  });

  return (
    <>
      <motion.section
        variants={itemVariants}
        className="lg:col-span-12 rounded-xl border border-subtle bg-surface flex flex-col overflow-hidden shadow-surface"
      >
        <div className="p-5 border-b border-subtle bg-elevated/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Database size={20} weight="duotone" className="text-amber-500" />
            <div>
              <h2 className="font-heading font-bold text-sm text-primary">
                Copias de Seguridad & Puntos de Restauración (Rollback BD)
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Snapshots atómicos para resguardar la base de datos antes de sincronizaciones masivas o restaurar versiones previas.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono tabular-nums text-secondary bg-elevated px-2.5 py-1 rounded-md border border-subtle flex items-center gap-1.5">
              <ShieldCheck size={14} weight="bold" className="text-emerald-500" />
              {backups.length} puntos guardados
            </span>
          </div>
        </div>

        {/* Formulario para Crear Punto de Restauración Inmediato */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            crearBackupMutation.mutate(motivoBackup);
          }}
          className="p-5 border-b border-subtle bg-surface/70 flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
        >
          <div className="flex-1">
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Motivo o Etiqueta del Punto de Restauración
            </label>
            <input
              type="text"
              value={motivoBackup}
              onChange={(e) => setMotivoBackup(e.target.value)}
              placeholder="Ej. antes-de-cambio-precios / revision-temporada"
              className="w-full bg-elevated focus:bg-surface border border-subtle rounded-lg px-3.5 py-2 text-xs font-sans text-primary placeholder:text-muted focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-fast"
            />
          </div>

          <Button
            type="submit"
            disabled={crearBackupMutation.isPending}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer active:scale-[0.98] transition-fast"
          >
            {crearBackupMutation.isPending ? (
              <>
                <SpinnerGap size={14} weight="bold" className="animate-spin" />
                Generando Snapshot...
              </>
            ) : (
              <>
                <FloppyDisk size={15} weight="bold" />
                Crear Punto de Restauración Ahora
              </>
            )}
          </Button>
        </form>

        {/* Tabla de Puntos de Restauración Disponibles */}
        <div className="overflow-x-auto">
          {loadingBackups ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted gap-2 text-xs">
              <SpinnerGap size={20} weight="bold" className="animate-spin text-amber-500" />
              Cargando puntos de restauración...
            </div>
          ) : backups.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted">
              No hay puntos de restauración guardados aún. Genera uno nuevo arriba.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-subtle bg-elevated/20 text-secondary font-medium">
                  <th className="px-5 py-3 font-semibold">Tipo / Motivo</th>
                  <th className="px-5 py-3 font-semibold">Archivo Snapshot</th>
                  <th className="px-5 py-3 font-semibold">Fecha y Hora</th>
                  <th className="px-5 py-3 font-semibold text-right">Tamaño</th>
                  <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {backups.map((b) => {
                  const esInicio = b.motivo.includes('inicio');
                  const esPreSync = b.motivo.includes('pre-sync');
                  const esPreRollback = b.motivo.includes('pre-rollback');

                  let badgeClass = 'border-subtle bg-elevated text-secondary';
                  let badgeLabel = b.motivo.toUpperCase();
                  if (esInicio) {
                    badgeClass = 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400';
                    badgeLabel = 'INICIO DIARIO';
                  } else if (esPreSync) {
                    badgeClass = 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
                    badgeLabel = 'PRE-SYNC TIENDANUBE';
                  } else if (esPreRollback) {
                    badgeClass = 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400';
                    badgeLabel = 'PRE-ROLLBACK';
                  } else {
                    badgeClass = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
                    badgeLabel = `MANUAL (${b.motivo.toUpperCase()})`;
                  }

                  return (
                    <tr key={b.archivo} className="hover:bg-elevated/30 transition-fast">
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-mono font-semibold tracking-wider ${badgeClass}`}>
                          <ClockCounterClockwise size={12} weight="bold" />
                          {badgeLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-primary">
                        {b.archivo}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-secondary text-[11px]">
                        {new Date(b.fecha).toLocaleString('es-AR', {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </td>
                      <td className="px-5 py-3.5 font-mono tabular-nums text-secondary text-right text-[11px]">
                        {b.tamanoLegible}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setBackupParaRestaurar(b);
                            setConfirmPalabra('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-subtle bg-elevated hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-500 text-secondary text-xs font-medium transition-fast cursor-pointer active:scale-[0.98]"
                          title="Restaurar base de datos a este punto"
                        >
                          <ArrowCounterClockwise size={13} weight="bold" />
                          Restaurar (Rollback)
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </motion.section>

      {/* MODAL DE CONFIRMACIÓN DE RESTAURACIÓN / ROLLBACK */}
      {backupParaRestaurar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg rounded-2xl border border-subtle bg-surface p-6 shadow-floating space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                  <WarningCircle size={24} weight="duotone" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-primary">
                    ¿Confirmar Restauración de Base de Datos?
                  </h3>
                  <p className="text-xs text-secondary mt-0.5">
                    Se reemplazará la base de datos activa con el snapshot seleccionado.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBackupParaRestaurar(null);
                  setConfirmPalabra('');
                }}
                className="p-1 rounded-lg text-secondary hover:text-primary transition-fast cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-lg border border-subtle bg-elevated/70 font-mono text-xs text-primary space-y-1.5">
              <div className="flex justify-between">
                <span className="text-secondary font-sans">Archivo:</span>
                <span className="font-bold truncate max-w-[280px]">{backupParaRestaurar.archivo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary font-sans">Fecha Snapshot:</span>
                <span>{new Date(backupParaRestaurar.fecha).toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary font-sans">Tamaño:</span>
                <span>{backupParaRestaurar.tamanoLegible}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldCheck size={16} weight="bold" />
                Protección Preventiva Activa:
              </p>
              <p>
                El sistema generará automáticamente un snapshot previo (<code className="font-mono">pre-rollback</code>) antes de sobreescribir la base de datos actual.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">
                Escribe <span className="font-bold text-primary font-mono">RESTAURAR</span> para desbloquear la confirmación:
              </label>
              <input
                type="text"
                value={confirmPalabra}
                onChange={(e) => setConfirmPalabra(e.target.value)}
                placeholder="RESTAURAR"
                className="w-full bg-elevated focus:bg-surface border border-subtle rounded-lg px-3.5 py-2 text-xs font-mono tracking-wider text-primary placeholder:text-muted focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-subtle">
              <button
                type="button"
                onClick={() => {
                  setBackupParaRestaurar(null);
                  setConfirmPalabra('');
                }}
                disabled={restaurarBackupMutation.isPending}
                className="px-4 py-2 rounded-lg border border-subtle bg-elevated hover:bg-surface text-secondary hover:text-primary text-xs font-medium transition-fast cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => restaurarBackupMutation.mutate(backupParaRestaurar.archivo)}
                disabled={confirmPalabra !== 'RESTAURAR' || restaurarBackupMutation.isPending}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-black text-xs font-bold transition-fast cursor-pointer flex items-center gap-2 active:scale-[0.98]"
              >
                {restaurarBackupMutation.isPending ? (
                  <>
                    <SpinnerGap size={14} weight="bold" className="animate-spin" />
                    Restaurando Base de Datos...
                  </>
                ) : (
                  <>
                    <ArrowCounterClockwise size={15} weight="bold" />
                    Ejecutar Rollback
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
