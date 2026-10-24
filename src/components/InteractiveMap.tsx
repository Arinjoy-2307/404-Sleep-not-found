import React, { useState } from 'react';
import { 
  FusedIncident, 
  CredibilityState, 
  DistrictName 
} from '../types/disaster';
import { 
  Layers, 
  Eye, 
  CheckCircle2, 
  Users, 
  HelpCircle, 
  AlertTriangle, 
  Navigation, 
  BellRing, 
  MessageSquare, 
  PhoneForwarded, 
  Volume2, 
  FileImage,
  ShieldCheck,
  Send
} from 'lucide-react';
import { LanguageCode } from '../services/i18n';

interface InteractiveMapProps {
  incidents: FusedIncident[];
  selectedIncident: FusedIncident | null;
  onSelectIncident: (inc: FusedIncident) => void;
  language: LanguageCode;
  onOpenProvenance: (inc: FusedIncident) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  language: _language,
  onOpenProvenance
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictName | 'all'>('all');
  const [showFloodLayer, setShowFloodLayer] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showBypassRoute, setShowBypassRoute] = useState(true);
  const [alertTargetingOpen, setAlertTargetingOpen] = useState(false);
  const [alertFormat, setAlertFormat] = useState<'sms' | 'ivr' | 'pictograph' | 'audio'>('pictograph');
  const [alertBroadcastSent, setAlertBroadcastSent] = useState(false);
  const [fatiguePrevented, setFatiguePrevented] = useState(false);

  // Curveball 1: Agency Contradiction Simulation State
  const [isContradictionActive, setIsContradictionActive] = useState<boolean>(true);
  const [showContradictionDetails, setShowContradictionDetails] = useState<boolean>(false);

  // Filtered incidents
  const visibleIncidents = incidents.filter(inc => {
    if (selectedDistrict !== 'all' && inc.district !== selectedDistrict) return false;
    return true;
  });

  // Coordinates mapping to SVG viewport (800x520)
  // Real Assam district rough bounding: lat ~ 24.5 to 26.8, lng ~ 90.5 to 93.5
  const projectCoords = (lat: number, lng: number) => {
    const minLat = 24.4, maxLat = 26.9;
    const minLng = 90.4, maxLng = 93.4;

    const x = ((lng - minLng) / (maxLng - minLng)) * 760 + 20;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 460 + 30;
    return { x, y };
  };

  const getMarkerColor = (state: CredibilityState) => {
    switch (state) {
      case 'verified':
        return { bg: '#10b981', border: '#047857', ring: 'rgba(16, 185, 129, 0.4)' };
      case 'corroborated':
        return { bg: '#f59e0b', border: '#b45309', ring: 'rgba(245, 158, 11, 0.4)' };
      case 'unconfirmed':
        return { bg: '#0284c7', border: '#0369a1', ring: 'rgba(2, 132, 199, 0.4)' };
      case 'disputed':
        return { bg: '#e11d48', border: '#be123c', ring: 'rgba(225, 29, 72, 0.5)' };
    }
  };

  const handleBroadcastAlert = () => {
    setAlertBroadcastSent(true);
    setFatiguePrevented(true);
    setTimeout(() => {
      setAlertBroadcastSent(false);
    }, 4000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Map Control Toolbar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-600" />
            Operations Map
          </span>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedDistrict('all')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${selectedDistrict === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              All Districts
            </button>
            <button
              onClick={() => setSelectedDistrict('Kamrup')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${selectedDistrict === 'Kamrup' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              Kamrup
            </button>
            <button
              onClick={() => setSelectedDistrict('Barpeta')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${selectedDistrict === 'Barpeta' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              Barpeta
            </button>
            <button
              onClick={() => setSelectedDistrict('Morigaon')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${selectedDistrict === 'Morigaon' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              Morigaon
            </button>
            <button
              onClick={() => setSelectedDistrict('Cachar')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${selectedDistrict === 'Cachar' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              Cachar (Silchar)
            </button>
          </div>
        </div>

        {/* Layer Toggles & Targeted Alert CTA */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
            <input
              type="checkbox"
              checked={showFloodLayer}
              onChange={(e) => setShowFloodLayer(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>Flood Zones</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
            <input
              type="checkbox"
              checked={showBypassRoute}
              onChange={(e) => setShowBypassRoute(e.target.checked)}
              className="rounded border-slate-300 text-amber-600 focus:ring-0"
            />
            <span>Detour Route</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
            <input
              type="checkbox"
              checked={showShelters}
              onChange={(e) => setShowShelters(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-0"
            />
            <span>Shelters</span>
          </label>

          <button
            onClick={() => setAlertTargetingOpen(!alertTargetingOpen)}
            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-semibold rounded-lg flex items-center gap-1 transition-colors"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-700" />
            <span>Broadcast Area Alert</span>
          </button>
        </div>
      </div>

      {/* Discrepancy Notification Banner */}
      <div className={`px-4 py-2 border-b text-xs flex flex-wrap items-center justify-between gap-3 transition-colors ${
        isContradictionActive 
          ? 'bg-rose-900 text-rose-100 border-rose-800' 
          : 'bg-slate-900 text-slate-200 border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
            isContradictionActive 
              ? 'bg-rose-700 text-white' 
              : 'bg-slate-700 text-slate-300'
          }`}>
            {isContradictionActive ? 'Conflicting Reports' : 'Single Source Verified'}
          </span>
          <span className="font-semibold text-white">
            NH-27 Puthimari Bridge:
          </span>
          <span className="text-slate-300">
            {isContradictionActive 
              ? 'PWD reported road passable, but SDRF field patrol reported flood overflow. Diverting via SH-12.' 
              : 'Bridge verified clear and safe for emergency transit.'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowContradictionDetails(!showContradictionDetails)}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-medium border border-white/20 transition-colors"
          >
            {showContradictionDetails ? 'Hide Comparison' : 'Compare PWD vs SDRF'}
          </button>

          <button
            onClick={() => setIsContradictionActive(!isContradictionActive)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              isContradictionActive
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            {isContradictionActive ? 'Mark Resolved' : 'Test Discrepancy'}
          </button>
        </div>
      </div>

      {/* Expandable Side-by-Side Opposing Agency Feeds & Routing Directive */}
      {showContradictionDetails && (
        <div className="bg-slate-950 p-4 border-b border-slate-800 text-xs animate-in slide-in-from-top-1 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <strong className="text-amber-400 font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              Live Agency Telemetry Contradiction: Asset NH-27 Puthimari Bridge
            </strong>
            <span className="text-[10px] text-slate-400 font-mono">
              Engine Action: Dynamic State Flagging & Conservative Safe-Path Enforcement
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Feed 1: PWD Official */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-400">Official Feed 1: State PWD Highway Division</span>
                <span className="text-[10px] bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800 font-mono">pwd_official</span>
              </div>
              <div className="text-white font-medium">Reporter: Er. R. Sharma (Executive Engineer PWD)</div>
              <div className="p-2 bg-slate-950 rounded text-emerald-400 font-mono text-[11px] border border-emerald-900/50">
                Claim: "NH-27 Puthimari Bridge inspected. Approach slab intact. PASSABLE for emergency relief trucks."
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Payload: status: PASSABLE_LIGHT_HEAVY_RESTRICTED</div>
            </div>

            {/* Feed 2: SDRF Patrol */}
            <div className="p-3 rounded-lg bg-slate-900 border border-rose-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400">Official Feed 2: SDRF Quick Response Unit 03</span>
                <span className="text-[10px] bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800 font-mono">sdrf_radio</span>
              </div>
              <div className="text-white font-medium">Reporter: Insp. T. Gogoi (Field Rescue Commander)</div>
              <div className="p-2 bg-slate-950 rounded text-rose-400 font-mono text-[11px] border border-rose-900/50">
                Claim: "Pier 3 foundation undermined by Kapili river crest. High collapse risk. ORDER TOTAL ROAD CLOSURE."
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Payload: action: ORDER_TOTAL_CLOSURE</div>
            </div>
          </div>

          {/* Conservative Routing Engine Directive */}
          <div className="p-3 bg-amber-950/60 border border-amber-500/60 rounded-lg text-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-[11px]">
            <div>
              <strong className="text-amber-400 block font-sans text-xs">
                MANDATORY CONSERVATIVE ROUTING DIRECTIVE ENFORCED:
              </strong>
              <span>
                Road segment flagged as <strong className="text-rose-400">DISPUTED</strong>. Engine automatically treats NH-27 bridge as <strong className="text-white">CLOSED</strong> to avoid trapping rescue convoys. All boat dispatches and heavy logistics rerouted via <strong>State Highway 12 Bypass (+18 km, +24m ETA)</strong>.
              </span>
            </div>
            <div className="shrink-0 bg-slate-900 px-3 py-1.5 rounded border border-amber-600/40 text-right">
              <div className="text-[10px] text-slate-400">Rerouted Asset:</div>
              <div className="font-bold text-white">TRUCK-SDRF-01 & BOAT-RIB-02</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Map Canvas Area */}
      <div className="relative bg-[#0d1b2a] w-full overflow-hidden select-none" style={{ minHeight: '480px' }}>
        <svg
          viewBox="0 0 800 520"
          className="w-full h-auto block"
          style={{ maxHeight: '560px' }}
        >
          <defs>
            {/* Water gradient */}
            <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
            </linearGradient>

            {/* Flood Inundation pattern */}
            <pattern id="floodHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.3" />
            </pattern>

            {/* Glow filters */}
            <filter id="glowDisputed" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Map Grid */}
          <g opacity="0.15">
            {Array.from({ length: 16 }).map((_, i) => (
              <line key={`x-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="520" stroke="#94a3b8" strokeDasharray="2,2" />
            ))}
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`y-${i}`} x1="0" y1={i * 50} x2="800" y2={i * 50} stroke="#94a3b8" strokeDasharray="2,2" />
            ))}
          </g>

          {/* District Polygons */}
          {/* Barpeta District Zone */}
          <path
            d="M 60 70 L 220 80 L 240 220 L 140 280 L 40 220 Z"
            fill="#1e293b"
            fillOpacity={selectedDistrict === 'Barpeta' || selectedDistrict === 'all' ? 0.7 : 0.3}
            stroke="#475569"
            strokeWidth="1.5"
          />
          <text x="130" y="160" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle" opacity="0.6">
            BARPETA DISTRICT
          </text>

          {/* Kamrup District Zone */}
          <path
            d="M 230 85 L 430 90 L 410 240 L 250 225 Z"
            fill="#1e293b"
            fillOpacity={selectedDistrict === 'Kamrup' || selectedDistrict === 'all' ? 0.7 : 0.3}
            stroke="#475569"
            strokeWidth="1.5"
          />
          <text x="330" y="150" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle" opacity="0.6">
            KAMRUP (RURAL & METRO)
          </text>

          {/* Morigaon District Zone */}
            <path
              d="M 425 100 L 610 110 L 590 260 L 420 245 Z"
              fill="#1e293b"
              fillOpacity={selectedDistrict === 'Morigaon' || selectedDistrict === 'all' ? 0.7 : 0.3}
              stroke="#475569"
              strokeWidth="1.5"
            />
            <text x="510" y="170" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle" opacity="0.6">
              MORIGAON DISTRICT
            </text>

          {/* Cachar District Zone (Southern Barak Valley enclave) */}
          <path
            d="M 520 330 L 750 340 L 730 490 L 510 480 Z"
            fill="#1e293b"
            fillOpacity={selectedDistrict === 'Cachar' || selectedDistrict === 'all' ? 0.7 : 0.3}
            stroke="#475569"
            strokeWidth="1.5"
          />
          <text x="630" y="420" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle" opacity="0.6">
            CACHAR DISTRICT (BARAK)
          </text>

          {/* Major Rivers (Brahmaputra across upper districts & Barak in Cachar) */}
          <path
            d="M 30 140 Q 200 170 380 160 T 630 180 T 780 190"
            fill="none"
            stroke="url(#riverGrad)"
            strokeWidth="16"
            strokeLinecap="round"
            opacity="0.85"
          />
          <text x="380" y="155" fill="#60a5fa" fontSize="9" fontWeight="600" textAnchor="middle" letterSpacing="2">
            BRAHMAPUTRA RIVER (DANGER MARK +1.8M)
          </text>

          <path
            d="M 510 400 Q 620 390 740 430"
            fill="none"
            stroke="url(#riverGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.85"
          />
          <text x="630" y="390" fill="#60a5fa" fontSize="9" fontWeight="600" textAnchor="middle" letterSpacing="2">
            BARAK RIVER (FLOOD CREST)
          </text>

          {/* Inundated Flood Surge Polygons */}
          {showFloodLayer && (
            <g>
              {/* Barpeta Inundation */}
              <path
                d="M 80 120 C 140 110, 180 160, 190 210 C 140 240, 100 210, 80 170 Z"
                fill="url(#floodHatch)"
                stroke="#0284c7"
                strokeWidth="1.5"
                strokeDasharray="4,2"
              />
              <text x="135" y="210" fill="#38bdf8" fontSize="9" fontWeight="bold">
                Water Depth: 4.5ft
              </text>

              {/* Morigaon Kapili Flood Wave */}
              <path
                d="M 440 140 C 500 130, 560 170, 570 230 C 510 245, 450 230, 440 180 Z"
                fill="url(#floodHatch)"
                stroke="#0284c7"
                strokeWidth="1.5"
                strokeDasharray="4,2"
              />
              <text x="490" y="215" fill="#38bdf8" fontSize="9" fontWeight="bold">
                Water Depth: 3.8ft
              </text>

              {/* Cachar Sonai Bund Leakage Zone */}
              <path
                d="M 560 360 C 620 350, 680 390, 670 450 C 600 460, 560 420, 560 380 Z"
                fill="url(#floodHatch)"
                stroke="#0284c7"
                strokeWidth="1.5"
                strokeDasharray="4,2"
              />
            </g>
          )}

          {/* Disputed Highway Bridge (NH-27 Puthimari) & Conservative Routing Bypass */}
          {showBypassRoute && (
            <g>
              {isContradictionActive ? (
                <>
                  {/* Contradictory Bridge Location (Red cross mark & warning) */}
                  <line x1="285" y1="165" x2="315" y2="165" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
                  <line x1="290" y1="160" x2="310" y2="170" stroke="#ffffff" strokeWidth="2" />
                  <line x1="310" y1="160" x2="290" y2="170" stroke="#ffffff" strokeWidth="2" />

                  {/* Disputed Bridge Warning Banner */}
                  <g transform="translate(210, 120)">
                    <rect x="0" y="0" width="190" height="24" rx="4" fill="#881337" stroke="#f43f5e" strokeWidth="1.5" />
                    <text x="95" y="16" fill="#ffe4e6" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                      DISPUTED ASSET: ROAD CLOSED
                    </text>
                  </g>

                  {/* Conservative Safe Bypass Route (Golden dashed route diversion) */}
                  <path
                    d="M 230 195 Q 260 235 340 220 T 400 170"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3.5"
                    strokeDasharray="6,4"
                  />
                  <text x="315" y="240" fill="#fef08a" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                    Mandatory Conservative Route (SH-12 Bypass +18km)
                  </text>
                </>
              ) : (
                <>
                  {/* Resolved Bridge (Green open) */}
                  <line x1="285" y1="165" x2="315" y2="165" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
                  <g transform="translate(215, 125)">
                    <rect x="0" y="0" width="180" height="22" rx="4" fill="#064e3b" stroke="#34d399" strokeWidth="1" />
                    <text x="90" y="15" fill="#a7f3d0" fontSize="9" fontWeight="bold" textAnchor="middle">
                      VERIFIED OPEN: PASSABLE
                    </text>
                  </g>
                </>
              )}
            </g>
          )}

          {/* Shelters */}
          {showShelters && (
            <g>
              {/* Bhuragaon Relief Camp */}
              <g transform="translate(525, 135)" className="cursor-pointer">
                <circle r="10" fill="#065f46" stroke="#34d399" strokeWidth="2" />
                <text x="0" y="3.5" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                  S1
                </text>
                <text x="14" y="4" fill="#a7f3d0" fontSize="9" fontWeight="600">
                  Bhuragaon Camp (60% Cap)
                </text>
              </g>

              {/* Barpeta Relief Camp */}
              <g transform="translate(110, 110)" className="cursor-pointer">
                <circle r="10" fill="#065f46" stroke="#34d399" strokeWidth="2" />
                <text x="0" y="3.5" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                  S2
                </text>
                <text x="14" y="4" fill="#a7f3d0" fontSize="9" fontWeight="600">
                  Barpeta Vidyapith (84% Cap)
                </text>
              </g>
            </g>
          )}

          {/* Incident Markers */}
          {visibleIncidents.map((incident) => {
            const { x, y } = projectCoords(incident.coordinates.lat, incident.coordinates.lng);
            const isSelected = selectedIncident?.id === incident.id;
            const colors = getMarkerColor(incident.state);

            return (
              <g
                key={incident.id}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer group"
                onClick={() => onSelectIncident(incident)}
              >
                {/* Ripple ring for critical or disputed */}
                {(incident.state === 'disputed' || incident.severityLevel === 'critical') && (
                  <circle
                    r="20"
                    fill={colors.ring}
                    opacity="0.6"
                    className="animate-ping"
                    style={{ transformOrigin: 'center' }}
                  />
                )}

                {/* Selection halo */}
                {isSelected && (
                  <circle
                    r="18"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeDasharray="3,3"
                  />
                )}

                {/* Base Marker Circle */}
                <circle
                  r="12"
                  fill={colors.bg}
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter={incident.state === 'disputed' ? 'url(#glowDisputed)' : undefined}
                />

                {/* Icon inside marker */}
                {incident.state === 'verified' && (
                  <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                    ✓
                  </text>
                )}
                {incident.state === 'corroborated' && (
                  <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                    2+
                  </text>
                )}
                {incident.state === 'unconfirmed' && (
                  <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                    ?
                  </text>
                )}
                {incident.state === 'disputed' && (
                  <text x="0" y="4" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
                    !
                  </text>
                )}

                {/* Marker label pill */}
                <g transform="translate(16, -10)">
                  <rect
                    x="0"
                    y="0"
                    width={incident.title.length * 6 + 14}
                    height="18"
                    rx="3"
                    fill="#0f172a"
                    fillOpacity="0.85"
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  <text x="7" y="12" fill="#f8fafc" fontSize="9" fontWeight="600">
                    {incident.title.slice(0, 24)}...
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Floating Map Legend */}
        <div className="absolute bottom-3 left-3 bg-[#0a192f]/90 backdrop-blur-sm border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 shadow-lg">
          <div className="font-bold text-[11px] text-amber-400 uppercase tracking-wider mb-1.5 flex items-center justify-between gap-4">
            <span>Credibility Legend</span>
            <span className="font-mono text-slate-400 text-[10px]">4-TIER MODEL</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-950"></span>
              <span className="text-emerald-300 font-medium">Verified (Field Agent)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-950"></span>
              <span className="text-amber-300 font-medium">Corroborated (≥2 Reports)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 ring-2 ring-sky-950"></span>
              <span className="text-sky-300 font-medium">Unconfirmed (1 Citizen)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-950 animate-pulse"></span>
              <span className="text-rose-300 font-medium">Disputed (Official Conflict)</span>
            </div>
          </div>
        </div>

        {/* Selected Incident Floating Detail Card (if one is clicked) */}
        {selectedIncident && (
          <div className="absolute top-3 right-3 max-w-sm w-full bg-white text-slate-900 rounded-lg border border-slate-300 shadow-xl p-3 text-xs z-10 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                    selectedIncident.state === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                    selectedIncident.state === 'corroborated' ? 'bg-amber-100 text-amber-800' :
                    selectedIncident.state === 'disputed' ? 'bg-rose-100 text-rose-800 font-black' :
                    'bg-sky-100 text-sky-800'
                  }`}>
                    {selectedIncident.state}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">{selectedIncident.id}</span>
                </div>
                <h4 className="font-bold text-slate-900 leading-snug">
                  {selectedIncident.title}
                </h4>
              </div>
              <button
                onClick={() => onSelectIncident(null as any)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
                aria-label="Close detail card"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-slate-600">
              <p className="text-[11px]">
                <strong className="text-slate-800">Landmark:</strong> {selectedIncident.landmark} ({selectedIncident.district})
              </p>

              {/* Time Decay meter */}
              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="font-semibold text-slate-700">Reliability Score:</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {selectedIncident.currentReliability}% ({selectedIncident.freshnessStatus.toUpperCase()})
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      selectedIncident.currentReliability >= 70 ? 'bg-emerald-500' :
                      selectedIncident.currentReliability >= 45 ? 'bg-amber-500' :
                      'bg-rose-500'
                    }`}
                    style={{ width: `${selectedIncident.currentReliability}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>Age: {selectedIncident.ageMinutes}m</span>
                  <span>Base: {selectedIncident.baseReliability}%</span>
                  <span>T½: {selectedIncident.decayHalfLifeMin}m</span>
                </div>
              </div>

              {/* Disputed Warning Banner if state is disputed */}
              {selectedIncident.state === 'disputed' && selectedIncident.conflictingReports && (
                <div className="bg-rose-50 border border-rose-300 rounded p-2 text-rose-900">
                  <div className="flex items-center gap-1 font-bold text-[11px] text-rose-800 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    CONTRADICTORY OFFICIAL DATA DETECTED
                  </div>
                  <div className="text-[11px] space-y-1">
                    <p>• <strong>{selectedIncident.conflictingReports.sourceA}:</strong> {selectedIncident.conflictingReports.claimA}</p>
                    <p>• <strong>{selectedIncident.conflictingReports.sourceB}:</strong> {selectedIncident.conflictingReports.claimB}</p>
                  </div>
                  <div className="mt-1.5 p-1.5 bg-rose-100 rounded text-[10px] font-semibold text-rose-950">
                    {selectedIncident.conflictingReports.conservativeAction}
                  </div>
                </div>
              )}

              {/* Stale Fallback Warning if stale */}
              {selectedIncident.freshnessStatus === 'stale' && (
                <div className="bg-amber-50 border border-amber-300 rounded p-2 text-amber-900 text-[11px]">
                  <strong>Fallback Instruction:</strong> {selectedIncident.fallbackInstructions}
                </div>
              )}

              {/* Actions */}
              <div className="pt-1 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  {selectedIncident.provenanceTrail.length} Ingested Packets
                </span>
                <button
                  onClick={() => onOpenProvenance(selectedIncident)}
                  className="px-2.5 py-1.5 bg-[#0b2341] hover:bg-[#163963] text-white rounded font-medium text-xs flex items-center gap-1"
                >
                  <Eye className="w-3 h-3 text-amber-400" />
                  <span>Inspect Provenance</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Polygon-Based Multi-Format Targeted Alert Drawer */}
      {alertTargetingOpen && (
        <div className="bg-amber-50 border-t border-amber-200 p-4 md:p-5 animate-in slide-in-from-bottom-2 text-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">
                  CAP-AU-2026 PROTOCOL
                </span>
                <span className="font-mono text-slate-500 text-[11px]">
                  STRICT ANTI-FATIGUE SUPPRESSION ACTIVE (60-MIN WINDOW)
                </span>
              </div>
              <h4 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-amber-700" />
                Targeted Polygon Geofence & Multi-Modal Alert Engine
              </h4>
            </div>
            <button
              onClick={() => setAlertTargetingOpen(false)}
              className="text-amber-800 hover:text-amber-950 font-bold px-2 py-1 bg-white border border-amber-300 rounded"
            >
              ✕ Close Tool
            </button>
          </div>

          {/* Polygon Selector & Severity Mapping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-3.5 rounded-lg border border-amber-200">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                1. Target Flood Zone Polygon:
              </label>
              <select
                className="w-full p-2 border border-slate-300 rounded text-xs bg-slate-50 font-medium text-slate-800"
                defaultValue="barpeta_lowland"
              >
                <option value="barpeta_lowland">Sector 1: Barpeta Lowlands & Beki River Inundation (Ward 4-7)</option>
                <option value="kamrup_corridor">Sector 2: Kamrup Puthimari River Corridor (NH-27 Area)</option>
                <option value="morigaon_kapili">Sector 3: Morigaon Kapili Flood Wave Basin (Bhuragaon)</option>
                <option value="cachar_sonai">Sector 4: Cachar Sonai Embankment Breach Zone</option>
                <option value="custom_polygon">Custom User-Drawn Polygon (Current Map Selection)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                2. Alert Severity Tier:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  className="p-1.5 rounded border border-amber-300 bg-amber-50 text-amber-900 font-bold text-center text-xs"
                >
                  Advisory (Yellow)
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded border border-orange-400 bg-orange-100 text-orange-900 font-bold text-center text-xs"
                >
                  Warning (Orange)
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded border border-red-600 bg-red-600 text-white font-bold text-center text-xs shadow-xs"
                >
                  Red Alert (Critical)
                </button>
              </div>
            </div>
          </div>

          {/* The 4 Multimodal Native Formats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Format 1: Pictographic (low literacy / rural) */}
            <div
              onClick={() => setAlertFormat('pictograph')}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                alertFormat === 'pictograph' ? 'border-amber-600 bg-white ring-2 ring-amber-400/40 shadow-xs' : 'border-amber-200 bg-white/70 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between text-slate-900 font-bold mb-1.5">
                <span className="flex items-center gap-1.5">
                  <FileImage className="w-4 h-4 text-amber-600" />
                  Pictographic Visual
                </span>
                <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 rounded">Accessibility</span>
              </div>
              <div className="p-2.5 bg-slate-900 text-white rounded text-center my-2 space-y-1">
                <div className="text-xl">🌊 ⬆️ 4.5ft ➡️ 🏛️</div>
                <div className="text-[10px] font-bold text-amber-300">WATER RISING · MOVE TO CAMP</div>
              </div>
              <p className="text-[11px] text-slate-500">
                Delivered on lockscreens for low-literacy flood areas.
              </p>
            </div>

            {/* Format 2: SMS Text */}
            <div
              onClick={() => setAlertFormat('sms')}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                alertFormat === 'sms' ? 'border-amber-600 bg-white ring-2 ring-amber-400/40 shadow-xs' : 'border-amber-200 bg-white/70 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between text-slate-900 font-bold mb-1.5">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-sky-600" />
                  Cell-Broadcast SMS
                </span>
                <span className="text-[10px] text-sky-700 bg-sky-100 px-1.5 rounded">2G Compatible</span>
              </div>
              <div className="p-2 bg-slate-100 rounded text-[11px] font-mono text-slate-800 my-2 leading-relaxed">
                "[NDMA RED ALERT] Beki River overflowing in Ward 4-7. Evacuate to Barpeta Vidyapith immediately."
              </div>
              <p className="text-[11px] text-slate-500">
                Direct tower broadcast (operates without mobile data).
              </p>
            </div>

            {/* Format 3: IVR Voice */}
            <div
              onClick={() => setAlertFormat('ivr')}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                alertFormat === 'ivr' ? 'border-amber-600 bg-white ring-2 ring-amber-400/40 shadow-xs' : 'border-amber-200 bg-white/70 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between text-slate-900 font-bold mb-1.5">
                <span className="flex items-center gap-1.5">
                  <PhoneForwarded className="w-4 h-4 text-emerald-600" />
                  Automated IVR Call
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 rounded">Voice Vernacular</span>
              </div>
              <div className="p-2 bg-slate-100 rounded text-[11px] font-mono text-slate-800 my-2">
                "Dialing 2,840 registered village numbers with Assamese/Hindi audio voice."
              </div>
              <p className="text-[11px] text-slate-500">
                Automated phone ring with spoken safety directions.
              </p>
            </div>

            {/* Format 4: Audio Siren */}
            <div
              onClick={() => setAlertFormat('audio')}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                alertFormat === 'audio' ? 'border-amber-600 bg-white ring-2 ring-amber-400/40 shadow-xs' : 'border-amber-200 bg-white/70 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between text-slate-900 font-bold mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-rose-600" />
                  Tower Audio Siren
                </span>
                <span className="text-[10px] text-rose-700 bg-rose-100 px-1.5 rounded">Acoustic</span>
              </div>
              <div className="p-2 bg-slate-100 rounded text-[11px] font-mono text-slate-800 my-2">
                "Pulsed 440Hz high-decibel village mast acoustic horn."
              </div>
              <p className="text-[11px] text-slate-500">
                Physical loudspeaker sounding for immediate outdoor alarm.
              </p>
            </div>
          </div>

          {/* Strict Tracking Log & Anti-Fatigue Ledger with Logged Reference Numbers */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ANTI-ALERT FATIGUE SUPPRESSION LEDGER
              </span>
              <span className="text-[11px] text-emerald-400">
                Policy: Max 1 Siren / identical alert per 60m per individual
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-300">
              <div className="p-2 bg-slate-800 rounded">
                Citizens in Target Polygon: <strong className="text-white">4,210</strong>
              </div>
              <div className="p-2 bg-slate-800 rounded">
                Eligible for Delivery: <strong className="text-emerald-400">3,982</strong>
              </div>
              <div className="p-2 bg-slate-800 rounded">
                Suppressed to Prevent Fatigue: <strong className="text-amber-400">228 (Alerted &lt;40m ago)</strong>
              </div>
            </div>

            {/* Explicit Logged Numbers Routing Ledger */}
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-2">
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                Targeted Mobile Routing Verification (Logged Contacts):
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-900 rounded border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold">+91 7980190589</div>
                    <div className="text-[10px] text-emerald-400">Ref: REF-NDMA-798019</div>
                  </div>
                  <div className="text-right">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                      SMS · IVR · Pictograph Active
                    </span>
                    <div className="text-[9px] text-slate-400 mt-0.5">Fatigue: Passed (0 dups)</div>
                  </div>
                </div>

                <div className="p-2 bg-slate-900 rounded border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold">+91 9880182287</div>
                    <div className="text-[10px] text-emerald-400">Ref: REF-NDMA-988018</div>
                  </div>
                  <div className="text-right">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                      SMS · IVR · Pictograph Active
                    </span>
                    <div className="text-[9px] text-slate-400 mt-0.5">Fatigue: Passed (0 dups)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-sans">
              Recent Suppressed Trace: <code>+91 97061 89104 (Milan Nagar)</code> - Duplicate alert suppressed (received identical CAP warning 22 minutes ago).
            </div>
          </div>

          {/* Action Dispatch Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <span className="text-slate-600 text-[11px]">
              Geofence hash: <code className="text-slate-800 font-mono">0xPOLY_BAR_BEKI_9921</code>
            </span>

            <button
              onClick={handleBroadcastAlert}
              disabled={alertBroadcastSent}
              className={`px-5 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 shadow ${
                alertBroadcastSent
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {alertBroadcastSent 
                  ? 'Dispatched to +91 7980190589, +91 9880182287 & 3,980 others' 
                  : 'Transmit Targeted Polygon Alert'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

