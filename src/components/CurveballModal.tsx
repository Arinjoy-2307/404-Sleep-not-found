import React from 'react';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  Hourglass, 
  UserX, 
  Layers, 
  ArrowRight 
} from 'lucide-react';

interface CurveballModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerCurveball: (curveballId: string) => void;
}

export const CurveballModal: React.FC<CurveballModalProps> = ({
  isOpen,
  onClose,
  onTriggerCurveball
}) => {
  if (!isOpen) return null;

  const curveballs = [
    {
      id: 'bridge_dispute',
      title: 'Phase 2 Test 1: Agency Data Contradiction & Conservative Routing',
      category: 'Disputed Asset & Conservative Safe-Path',
      description: 'Two separate official feeds post opposing updates for the same road asset (State PWD claims NH-27 Puthimari Bridge passable vs SDRF Patrol reports Pier 3 severely undermined). The system dynamically flags the map segment as disputed and instantly forces the dispatch routing engine to calculate a conservative path (treating the road as closed to avoid routing rescue boats or trucks into traps).',
      icon: AlertTriangle,
      color: 'border-rose-300 bg-rose-50/50 text-rose-900',
      badge: 'CONSERVATIVE ROUTING (CLOSED)'
    },
    {
      id: 'viral_hoax',
      title: 'Phase 2 Test 2: Viral Rumor Attack & 100% Reach Debunk Loop',
      category: 'Anomaly Scanner & Targeted Broadcast',
      description: 'A fake evacuation notice hits the network claiming Khandajan sluice gate broke with a 20ft surge. Demonstrates real-time anomaly detection, instant quarantine (hidden from public), human approval against CWC sensor telemetry, and logs 100% reach percentage of resulting correction broadcast across SMS, IVR, and Pictographs.',
      icon: ShieldAlert,
      color: 'border-purple-300 bg-purple-50/50 text-purple-900',
      badge: 'QUARANTINE & 100% REACH'
    },
    {
      id: 'shelter_staleness',
      title: 'Phase 2 Test 3: Stale Data Decay & Offline Fallback Swap',
      category: 'Time-Decay Filter & Fail-Safe Swap',
      description: 'Shelter capacity updates stop coming in for Bhuragaon Relief Camp. The interface immediately displays a prominent freshness warning showing exactly how old the data point is ("Updated 94 minutes ago") and automatically swaps live tracking out for hardcoded, offline-capable safety fallback instructions.',
      icon: Hourglass,
      color: 'border-amber-300 bg-amber-50/50 text-amber-900',
      badge: '94M STALE WARNING & SWAP'
    },
    {
      id: 'unauthorized_breach',
      title: 'Phase 2 Test 4: Security Breach Attempt & Supervisor Audit Alert',
      category: 'RBAC Scope Block & Immediate Audit Alert',
      description: 'A simulated responder account with low authorization privileges (CONTRACTOR-TEMP-88) attempts to download the vulnerable-residents roster. The system blocks the access request (403 FORBIDDEN), logs metadata into the immutable audit ledger, and flags an immediate critical audit alert on the supervisor\'s dashboard.',
      icon: UserX,
      color: 'border-emerald-300 bg-emerald-50/50 text-emerald-900',
      badge: '403 BLOCKED & SUPERVISOR ALERT'
    },
    {
      id: 'household_dedup',
      title: 'Challenge 5: Spatial Deduplication & Urgent-Never-Lost Guarantee',
      category: 'Spatial-Temporal Engine (25m Radius)',
      description: 'The same household is reported via citizen web, SMS, and radio. The engine links them within 25m spatial radius and appends telemetry to a single master file without overwriting critical details or losing urgent oxygen rescue signals.',
      icon: Layers,
      color: 'border-sky-300 bg-sky-50/50 text-sky-900',
      badge: 'DEDUPLICATION GUARANTEE'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0b2341] text-white px-5 py-4 flex items-center justify-between border-b border-[#1b3a60]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">
                Challenge 16: Live Stress Tests & Curveball Scenarios
              </h3>
              <p className="text-[11px] text-slate-300">
                Directly grounded in the ImpactX 2026 Disaster Relief Problem Statement
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Curveballs */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
          {curveballs.map((cb) => {
            const Icon = cb.icon;
            return (
              <div
                key={cb.id}
                className={`p-3.5 rounded-lg border transition-all hover:shadow-md ${cb.color}`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 shrink-0" />
                    <h4 className="font-bold text-xs">
                      {cb.title}
                    </h4>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/80 border border-current shrink-0">
                    {cb.badge}
                  </span>
                </div>

                <p className="text-slate-700 leading-relaxed mb-3 text-[11px]">
                  {cb.description}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-500 font-medium">
                    Category: {cb.category}
                  </span>
                  <button
                    onClick={() => {
                      onTriggerCurveball(cb.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <span>Execute Curveball</span>
                    <ArrowRight className="w-3 h-3 text-amber-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            All 5 scenarios are pre-wired and testable against the live engine.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 rounded font-medium text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
