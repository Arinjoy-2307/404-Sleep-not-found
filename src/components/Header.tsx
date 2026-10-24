import React from 'react';
import { 
  ShieldAlert, 
  Clock, 
  FastForward, 
  RotateCcw, 
  Wifi, 
  WifiOff, 
  PlusCircle, 
  Sparkles,
  PhoneCall,
  Languages,
  Lock,
  LogOut,
  UserCheck,
  SignalLow,
  Zap
} from 'lucide-react';
import { LanguageCode, translations } from '../services/i18n';

interface HeaderProps {
  currentSimulatedTime: number;
  simSpeed: number;
  setSimSpeed: (speed: number) => void;
  advanceMinutes: (min: number) => void;
  resetSimulation: () => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  isLowNetwork: boolean;
  setIsLowNetwork: (low: boolean) => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  portalMode: 'citizen' | 'official';
  onOpenOfficialLogin: () => void;
  onLogoutOfficial: () => void;
  authenticatedOfficer: { name: string; role: string; badgeId: string } | null;
  onOpenIngestModal: () => void;
  onOpenCurveballModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSimulatedTime,
  simSpeed,
  setSimSpeed,
  advanceMinutes,
  resetSimulation,
  isOffline,
  setIsOffline,
  isLowNetwork,
  setIsLowNetwork,
  language,
  setLanguage,
  portalMode,
  onOpenOfficialLogin,
  onLogoutOfficial,
  authenticatedOfficer,
  onOpenIngestModal,
  onOpenCurveballModal
}) => {
  const t = translations[language];
  const dateObj = new Date(currentSimulatedTime);
  const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <header className="bg-[#0b2341] text-white border-b border-[#1b3a60] sticky top-0 z-40 shadow-sm">
      {/* Top micro-bar: Government of India, Language, and Emergency Helpline */}
      <div className="bg-[#07172b] px-4 py-1.5 border-b border-[#132c4a] text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-amber-400 tracking-wide">
            GOVERNMENT OF INDIA
          </span>
          <span className="text-slate-500" aria-hidden="true">·</span>
          <span className="text-slate-300">
            NATIONAL DISASTER MANAGEMENT AUTHORITY
          </span>
          {portalMode === 'official' && (
            <>
              <span className="text-slate-500" aria-hidden="true">·</span>
              <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-500/30">
                OFFICIAL COMMAND DESK
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 text-slate-300">
          {/* Emergency Helpline for citizens */}
          <div className="flex items-center gap-1.5 text-amber-300">
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="font-mono font-bold">Helpline: 1070 / 112</span>
          </div>

          <span className="text-slate-600">|</span>

          {/* Low Network / 2G Data Saver Mode Toggle */}
          <button
            onClick={() => setIsLowNetwork(!isLowNetwork)}
            className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 border transition-colors ${
              isLowNetwork
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Toggle low network layout"
          >
            <SignalLow className="w-3.5 h-3.5" />
            <span>{isLowNetwork ? 'Low Network Mode' : 'Standard Network'}</span>
          </button>

          <span className="text-slate-600">|</span>

          {/* Language Switcher */}
          <div className="flex items-center gap-1">
            <Languages className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="bg-[#0f243d] border border-slate-700 text-slate-200 text-xs rounded px-1.5 py-0.5 outline-none focus:border-amber-400"
              aria-label="Select portal language"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="as">অসমীয়া</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-inner text-white font-black text-xl tracking-wider border border-amber-300/40 shrink-0">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base lg:text-lg font-bold tracking-tight text-white leading-tight">
                {portalMode === 'citizen'
                  ? 'National Disaster Relief Portal'
                  : 'NDMA Incident Command & Information Fusion Desk'}
              </h1>
              {portalMode === 'official' && (
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  OFFICER ACCESS
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-none mt-1">
              {portalMode === 'citizen'
                ? 'Emergency help, verified alerts, and relief shelter directory'
                : `Authenticated Officer: ${authenticatedOfficer?.name || 'Officer'} · ${authenticatedOfficer?.role || 'NDRF Triage Desk'}`}
            </p>
          </div>
        </div>

        {/* Right side controls: Mode dependent */}
        {portalMode === 'official' ? (
          /* Official Controls: Clock, Simulation, and Command Actions */
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#081b33] rounded-lg border border-slate-800 text-xs text-slate-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-200 font-bold tabular-nums text-sm">{timeStr}</span>
            </div>

            <div className="flex items-center bg-[#0d2645] rounded p-0.5 text-xs">
              <button
                onClick={() => setSimSpeed(1)}
                className={`px-2 py-1 rounded transition-colors ${simSpeed === 1 ? 'bg-amber-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white'}`}
                title="1x speed"
              >
                1x
              </button>
              <button
                onClick={() => setSimSpeed(5)}
                className={`px-2 py-1 rounded transition-colors ${simSpeed === 5 ? 'bg-amber-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white'}`}
                title="5x speed"
              >
                5x
              </button>
              <button
                onClick={() => setSimSpeed(30)}
                className={`px-2 py-1 rounded transition-colors ${simSpeed === 30 ? 'bg-amber-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white'}`}
                title="30x time decay"
              >
                30x
              </button>
            </div>

            <button
              onClick={() => advanceMinutes(15)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1 font-mono transition-colors"
              title="Fast forward 15 minutes"
            >
              <FastForward className="w-3 h-3 text-amber-400" />
              +15m
            </button>

            <button
              onClick={resetSimulation}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"
              title="Reset simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onOpenCurveballModal}
              className="px-2.5 py-1.5 bg-[#1b3d68] hover:bg-[#254f85] text-amber-300 text-xs font-semibold rounded-md border border-amber-400/30 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Curveballs</span>
            </button>

            <button
              onClick={onOpenIngestModal}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-md shadow flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-950" />
              <span>Simulate Packet</span>
            </button>

            {/* Logout / Switch back to Citizen Portal */}
            <button
              onClick={onLogoutOfficial}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ml-1"
              title="Logout official session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Command Desk</span>
            </button>
          </div>
        ) : (
          /* Citizen Portal Header Actions */
          <div className="flex items-center gap-2.5">
            {/* Quick test scenario launcher */}
            <button
              onClick={onOpenCurveballModal}
              className="px-3 py-2 bg-[#1b3d68] hover:bg-[#254f85] text-amber-300 hover:text-amber-200 border border-amber-400/30 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Scenarios</span>
            </button>

            {/* Direct Official Login Button */}
            <button
              onClick={onOpenOfficialLogin}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Officer Login</span>
            </button>
          </div>
        )}
      </div>

      {/* Offline notification banner if active */}
      {isOffline && (
        <div className="bg-amber-600 text-slate-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span>{t.offlineBanner}</span>
          </div>
          <span className="text-[11px] underline cursor-pointer" onClick={() => setIsOffline(false)}>
            Switch to Online Sync
          </span>
        </div>
      )}
    </header>
  );
};
