import { ShieldCheck, Storefront, TerminalWindow } from '@phosphor-icons/react';
import { Button } from './components/ui/Button';
import { useAuthStore } from './stores/useAuthStore';
import { useTenantStore } from './stores/useTenantStore';

export function App() {
  const { isSandboxMode, toggleSandboxMode } = useTenantStore();
  const { isAuthenticated, usuario } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#000000] text-[#FAFAFA] flex flex-col items-center justify-center p-8 selection:bg-[#FAFAFA] selection:text-[#000000]">
      {/* Marco Arquitectónico 1px */}
      <div className="w-full max-w-2xl border border-[#333333] p-8 md:p-12 bg-[#090909]">
        {/* Header / Brand */}
        <div className="flex items-center justify-between border-b border-[#333333] pb-6 mb-8">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-[#71717A] font-sans">
              POINT OF SALE // OMNICHANNEL ERP
            </span>
            <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight mt-1">
              DASTIK <span className="text-[#71717A] font-normal">//</span> HIDDEN SNEAKERS
            </h1>
          </div>
          <Storefront size={32} weight="light" className="text-[#FAFAFA]" />
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="border border-[#333333] p-4 bg-[#111111]">
            <span className="text-[10px] uppercase tracking-widest text-[#71717A]">MODO DE OPERACIÓN</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-heading font-bold text-sm tracking-wider">
                {isSandboxMode ? 'MODO SANDBOX (TEST)' : 'MODO PRODUCCIÓN'}
              </span>
              <button
                onClick={toggleSandboxMode}
                className="text-[10px] uppercase font-sans tracking-widest underline cursor-pointer text-[#FAFAFA] hover:text-[#71717A] transition-fast"
              >
                Alternar
              </button>
            </div>
          </div>

          <div className="border border-[#333333] p-4 bg-[#111111]">
            <span className="text-[10px] uppercase tracking-widest text-[#71717A]">ESTADO DE SESIÓN</span>
            <div className="flex items-center gap-2 mt-1">
              <ShieldCheck size={18} weight="light" className={isAuthenticated ? 'text-green-400' : 'text-[#71717A]'} />
              <span className="font-heading text-sm">
                {isAuthenticated ? `${usuario?.nombre} (${usuario?.rol})` : 'NO AUTENTICADO'}
              </span>
            </div>
          </div>
        </div>

        {/* Specs Box */}
        <div className="border border-[#333333] p-4 bg-[#0D0D0D] text-xs font-sans text-[#71717A] space-y-2 mb-8">
          <div className="flex items-center gap-2 text-[#FAFAFA] font-heading font-semibold uppercase tracking-wider">
            <TerminalWindow size={16} weight="light" />
            <span>ARQUITECTURA CLIENTE PWA</span>
          </div>
          <p>• Tipografía: Syne (Headings) + Space Grotesk (Data UI)</p>
          <p>• Estilo: 100% Flat Design, bordes 1px, cero sombras difuminadas</p>
          <p>• Red: Axios Interceptor con JWT Bearer y header X-Sandbox-Mode</p>
          <p>• Iconografía: Phosphor Icons con peso light</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="primary" className="w-full">
            ACCEDER AL POS
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => window.location.reload()}>
            RECARGAR SISTEMA
          </Button>
        </div>
      </div>

      <div className="mt-8 text-center text-[10px] tracking-widest text-[#444444] uppercase font-sans">
        HIGH-END CONTEMPORARY STREETWEAR // ENGINE V1.0
      </div>
    </div>
  );
}

export default App;
