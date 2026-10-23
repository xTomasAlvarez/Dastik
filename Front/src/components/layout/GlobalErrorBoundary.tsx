import { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  WarningOctagon,
  ArrowsClockwise,
  Storefront,
  CaretDown,
  CaretUp,
  Copy,
  Check,
} from '@phosphor-icons/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('GlobalErrorBoundary capturó una excepción de renderizado:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoToPos = (): void => {
    window.location.href = '/pos';
  };

  private toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  private handleCopyError = (): void => {
    const { error, errorInfo } = this.state;
    const text = `Error: ${error?.name ?? 'Error'}: ${error?.message ?? ''}\n\nStack:\n${error?.stack ?? ''}\n\nComponent Stack:\n${errorInfo?.componentStack ?? ''}`;
    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      const { error, showDetails, copied } = this.state;

      return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-canvas text-primary select-none overflow-y-auto">
          <div className="relative w-full max-w-lg bg-surface border border-subtle rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center overflow-hidden my-auto">
            {/* Header / Badge Superior */}
            <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/25 text-rose-500 text-[10px] sm:text-[11px] font-mono font-medium tracking-wider rounded-full uppercase flex items-center gap-1.5 mb-4">
              <WarningOctagon size={14} weight="bold" />
              <span>FALLO DE EJECUCIÓN // RUNTIME EXCEPTION</span>
            </div>

            {/* Icono de advertencia */}
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-4 shadow-inner">
              <WarningOctagon size={36} weight="duotone" />
            </div>

            {/* Título Principal */}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
              Interrupción Inesperada en la Interfaz
            </h1>

            {/* Descripción sobria */}
            <p className="text-xs sm:text-sm text-secondary mt-2 max-w-md leading-relaxed">
              Ocurrió una excepción durante el renderizado del componente. Los datos de base de datos y transacciones permanecen íntegros y a salvo.
            </p>

            {/* Bloque desplegable de diagnóstico técnico */}
            {error && (
              <div className="w-full mt-4 text-left">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="w-full py-1.5 px-3 bg-elevated hover:bg-hover border border-subtle rounded-lg text-[11px] font-mono text-secondary flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="truncate pr-2">
                    {error.name}: {error.message}
                  </span>
                  <span className="flex items-center gap-1 text-muted shrink-0">
                    {showDetails ? <CaretUp size={12} /> : <CaretDown size={12} />}
                  </span>
                </button>

                {showDetails && (
                  <div className="mt-2 p-3 bg-elevated/80 border border-subtle rounded-xl max-h-40 overflow-y-auto font-mono text-[10px] text-muted space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-subtle">
                      <span className="text-rose-400 font-semibold truncate">
                        {error.name}: {error.message}
                      </span>
                      <button
                        type="button"
                        onClick={this.handleCopyError}
                        className="p-1 hover:text-primary transition-colors cursor-pointer text-muted"
                        title="Copiar traza técnica"
                      >
                        {copied ? (
                          <Check size={12} className="text-emerald-400" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                    {error.stack && (
                      <pre className="whitespace-pre-wrap text-[9px] leading-tight text-secondary/80">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Botones de acción */}
            <div className="mt-6 w-full flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:flex-1 py-3 px-4 bg-btn-primary-bg text-btn-primary-text font-medium text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-btn-primary-hover active:scale-[0.98] transition-all shadow-md cursor-pointer"
              >
                <ArrowsClockwise size={18} weight="bold" />
                <span>Recargar Sistema</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoToPos}
                className="w-full sm:flex-1 py-3 px-4 bg-surface hover:bg-hover border border-subtle text-primary font-medium text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Storefront size={18} weight="duotone" className="text-amber-500" />
                <span>Volver al POS</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
