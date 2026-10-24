import React, { useState } from 'react';
import { FusedIncident } from '../types/disaster';
import { 
  HeartHandshake, 
  LifeBuoy, 
  CheckCircle, 
  AlertCircle, 
  Sliders, 
  History, 
  Activity,
  UserCheck
} from 'lucide-react';
import { LanguageCode } from '../services/i18n';

interface TriageConsoleProps {
  incidents: FusedIncident[];
  onUpdateIncidentOverride: (incidentId: string, newScore: number, reason: string, responderName: string) => void;
  language: LanguageCode;
  onOpenProvenance: (inc: FusedIncident) => void;
}

export const TriageConsole: React.FC<TriageConsoleProps> = ({
  incidents,
  onUpdateIncidentOverride,
  language: _language,
  onOpenProvenance
}) => {
  const [selectedIncidentForOverride, setSelectedIncidentForOverride] = useState<FusedIncident | null>(null);
  const [overrideScore, setOverrideScore] = useState<number>(90);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [responderName, setResponderName] = useState<string>('Commander S. Sarma (NDRF Ops Desk)');
  const [showAuditHistory, setShowAuditHistory] = useState<boolean>(false);
  const [dedupHousehold, setDedupHousehold] = useState<'HSH-BAR-892' | 'HSH-SAR-411'>('HSH-BAR-892');
  const [simulatedTimelineAppended, setSimulatedTimelineAppended] = useState<boolean>(false);

  // Filter incidents representing civilian rescue or medical needs, sorted by triage priority descending
  const triageQueue = [...incidents]
    .filter(i => i.category === 'medical_oxygen' || i.category === 'flood_surge' || i.category === 'road_cut')
    .sort((a, b) => b.triagePriorityScore - a.triagePriorityScore);

  const handleApplyOverride = () => {
    if (!selectedIncidentForOverride || !overrideReason.trim()) return;
    onUpdateIncidentOverride(
      selectedIncidentForOverride.id,
      overrideScore,
      overrideReason.trim(),
      responderName
    );
    setSelectedIncidentForOverride(null);
    setOverrideReason('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with clear fleet rationing & priority criteria */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Rescue Priority Triage
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Ranks incoming rescue calls by medical risk, flood height, and report freshness so available rescue boats reach those in critical danger first.
            </p>
          </div>

          {/* Simple Fleet Status */}
          <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 shrink-0">
            <LifeBuoy className="w-4 h-4 text-amber-600" />
            <div className="text-slate-700">
              <span>Active Fleet: <strong>4 Rescue Boats · 2 Response Trucks</strong></span>
              <span className="text-slate-400 block text-[11px]">RIB-01 en route to oxygen patient · RIB-02 en route to Sarthebari</span>
            </div>
          </div>
        </div>

        {/* 3 Plain Criteria Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-semibold text-slate-900 block">1. Medical Vulnerability (40%)</span>
            <span className="text-slate-600 text-[11px] mt-0.5 block">
              Bedridden citizens, patients needing oxygen/dialysis, and unaccompanied elderly.
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-semibold text-slate-900 block">2. Flood Hazard Severity (40%)</span>
            <span className="text-slate-600 text-[11px] mt-0.5 block">
              Rising water depth (&gt;4ft), submerged ground floors, and road isolation.
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-semibold text-slate-900 block">3. Report Freshness (20%)</span>
            <span className="text-slate-600 text-[11px] mt-0.5 block">
              Recency of verified field telemetry and corroborating eyewitness accounts.
            </span>
          </div>
        </div>
      </div>

      {/* 2. Household Deduplication: Clean & Simple */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Household Duplicate Filter
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Groups repeated calls from the same location while preserving the highest medical emergency.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setDedupHousehold('HSH-BAR-892')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                dedupHousehold === 'HSH-BAR-892' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Barpeta (Oxygen Patient)
            </button>
            <button
              onClick={() => setDedupHousehold('HSH-SAR-411')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                dedupHousehold === 'HSH-SAR-411' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sarthebari (Trapped Family)
            </button>
          </div>
        </div>

        {dedupHousehold === 'HSH-BAR-892' ? (
          <div className="space-y-2 text-xs">
            <p className="text-slate-700">
              Three separate calls were received for <strong>House #44B, Milan Nagar, Barpeta</strong>. Instead of creating 3 separate tickets, all reports were linked together. When the daughter reported her bedridden father needed oxygen, the ticket automatically rose to Priority #1.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-900 block">Report 1: Daughter SMS</span>
                <span className="text-slate-400 text-[11px] block">45m ago · +91 7980190589</span>
                <p className="text-slate-600 text-[11px] mt-1">"Father on oxygen concentrator, power cut 6 hrs, water rising."</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-900 block">Report 2: Neighbor Call</span>
                <span className="text-slate-400 text-[11px] block">40m ago · Pranab</span>
                <p className="text-slate-600 text-[11px] mt-1">"Water on veranda, bedridden neighbor cannot move."</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-900 block">Report 3: NDRF Agent</span>
                <span className="text-slate-400 text-[11px] block">18m ago · SI Roy</span>
                <p className="text-slate-600 text-[11px] mt-1">"Confirmed. Rescue boat RIB-01 dispatched with oxygen cylinder."</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <p className="text-slate-700">
              Initial reports noted road damage near Sarthebari. When report <code>+91 9880182287</code> arrived indicating an elderly grandmother was trapped near the bridge washout, the priority was automatically upgraded to dispatch Rescue Boat RIB-02.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-900 block">Report 1: Road Damage</span>
                <span className="text-slate-400 text-[11px] block">34m ago</span>
                <p className="text-slate-600 text-[11px] mt-1">"SH-9 culvert washed out at Sarthebari junction."</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-900 block">Report 2: Village Council</span>
                <span className="text-slate-400 text-[11px] block">28m ago</span>
                <p className="text-slate-600 text-[11px] mt-1">"Culvert washed out isolating 3 villages."</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-900 block">Report 3: Stranded Family</span>
                <span className="text-slate-400 text-[11px] block">24m ago · +91 9880182287</span>
                <p className="text-slate-600 text-[11px] mt-1">"Family with elderly grandmother stranded at washed-out culvert."</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Prioritized Queue */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Prioritized Rescue Dispatch Queue
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              ({triageQueue.length} Active Requests)
            </span>
          </div>

          <button
            onClick={() => setShowAuditHistory(!showAuditHistory)}
            className="text-xs text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1 bg-white border border-slate-300 px-2.5 py-1 rounded-lg"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>{showAuditHistory ? 'Hide Overrides' : 'View Overrides Log'}</span>
          </button>
        </div>

        {/* Overrides Audit Trail */}
        {showAuditHistory && (
          <div className="p-4 bg-slate-900 text-slate-200 text-xs border-b border-slate-800 space-y-2">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Officer Override Log</span>
            </div>
            <div className="divide-y divide-slate-800">
              {incidents.filter(i => i.responderOverride).length === 0 ? (
                <p className="text-slate-400 italic py-2">No manual overrides recorded. Click "Override Priority" on any item below to adjust ranking.</p>
              ) : (
                incidents.filter(i => i.responderOverride).map(i => (
                  <div key={i.id} className="py-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <strong className="text-white">{i.id}: {i.title}</strong>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Overridden by: {i.responderOverride?.responderName} · Reason: "{i.responderOverride?.reason}"
                      </div>
                    </div>
                    <div className="font-mono text-right text-[11px] shrink-0">
                      <span className="text-slate-400 line-through mr-2">Original: {i.responderOverride?.originalScore}</span>
                      <span className="text-emerald-400 font-bold">New: {i.responderOverride?.overriddenScore}/100</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {triageQueue.map((incident, index) => {
            const isTop = index === 0;
            const hasOverride = !!incident.responderOverride;
            const needsOxygen = incident.provenanceTrail.some(p => p.vulnerabilityFactors?.needsOxygen);
            const isBedridden = incident.provenanceTrail.some(p => p.vulnerabilityFactors?.isBedridden);
            const isElderly = incident.provenanceTrail.some(p => p.vulnerabilityFactors?.isElderlyAlone);

            return (
              <div
                key={incident.id}
                className={`p-5 transition-colors hover:bg-slate-50/80 ${
                  isTop ? 'bg-amber-50/20' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Rank, Details, Vulnerability */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold font-mono flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <strong className="text-sm text-slate-900">{incident.title}</strong>
                      <span className="text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{incident.landmark}, {incident.district}</span>
                      {hasOverride && (
                        <span className="text-[11px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                          Officer Override
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {needsOxygen && 'Critical oxygen dependency. Patient bedridden with power failure >6h.'}
                      {isElderly && !needsOxygen && 'Elderly citizen trapped by rising water near bridge washout.'}
                      {!needsOxygen && !isElderly && (incident.provenanceTrail[0]?.details || incident.title)}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-0.5">
                      <span>Assigned: <strong className="text-slate-800">
                        {needsOxygen ? 'NDRF Boat RIB-01 (Oxygen Rack)' : isElderly ? 'SDRF Boat RIB-02' : 'Rescue Squad 3'}
                      </strong></span>
                      <span className="text-slate-300">·</span>
                      <span>ETA: <strong className="text-slate-800">~18-25 mins</strong></span>
                    </div>
                  </div>

                  {/* Right: Score and Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-slate-400 block text-[11px]">Priority Score</span>
                      <strong className="text-lg font-mono text-slate-900 tabular-nums">
                        {incident.triagePriorityScore}/100
                      </strong>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedIncidentForOverride(incident);
                        setOverrideScore(incident.triagePriorityScore);
                      }}
                      className="px-3 py-1.5 border border-slate-300 hover:border-slate-400 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Adjust Priority</span>
                    </button>

                    <button
                      onClick={() => onOpenProvenance(incident)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Audit Trail
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Override Modal */}
      {selectedIncidentForOverride && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-lg space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Adjust Incident Priority
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedIncidentForOverride.title} ({selectedIncidentForOverride.id})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Priority Score: <strong className="text-slate-900">{overrideScore}/100</strong>
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={overrideScore}
                onChange={(e) => setOverrideScore(Number(e.target.value))}
                className="w-full accent-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Adjustment
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g., Direct verbal confirmation from local sarpanch that water is now receding..."
                rows={3}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Officer Name
              </label>
              <input
                type="text"
                value={responderName}
                onChange={(e) => setResponderName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedIncidentForOverride(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyOverride}
                disabled={!overrideReason.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
              >
                Save Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
