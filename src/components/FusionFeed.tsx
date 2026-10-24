import React, { useState } from 'react';
import { 
  FusedIncident, 
  CredibilityState, 
  SourceChannel 
} from '../types/disaster';
import { 
  Search, 
  Filter, 
  Eye, 
  RefreshCw, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  HelpCircle, 
  Radio, 
  FileText,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { LanguageCode, translations } from '../services/i18n';

interface FusionFeedProps {
  incidents: FusedIncident[];
  onOpenProvenance: (inc: FusedIncident) => void;
  onRefreshIncidentPing: (incidentId: string) => void;
  language: LanguageCode;
  selectedStateFilter: string;
  setSelectedStateFilter: (state: string) => void;
}

export const FusionFeed: React.FC<FusionFeedProps> = ({
  incidents,
  onOpenProvenance,
  onRefreshIncidentPing,
  language,
  selectedStateFilter,
  setSelectedStateFilter
}) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');

  const filteredIncidents = incidents.filter(inc => {
    // State filter
    if (selectedStateFilter !== 'all' && inc.state !== selectedStateFilter) return false;

    // Channel filter
    if (selectedChannel !== 'all') {
      const hasChannel = inc.provenanceTrail.some(p => p.channel === selectedChannel);
      if (!hasChannel) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = inc.title.toLowerCase().includes(q);
      const matchLandmark = inc.landmark.toLowerCase().includes(q);
      const matchDistrict = inc.district.toLowerCase().includes(q);
      const matchId = inc.id.toLowerCase().includes(q);
      const matchPacket = inc.provenanceTrail.some(p => 
        p.id.toLowerCase().includes(q) || 
        p.reporterName.toLowerCase().includes(q) || 
        p.headline.toLowerCase().includes(q)
      );
      if (!matchTitle && !matchLandmark && !matchDistrict && !matchId && !matchPacket) return false;
    }

    return true;
  });

  const getBadgeStyle = (state: CredibilityState) => {
    switch (state) {
      case 'verified':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'corroborated':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'unconfirmed':
        return 'bg-sky-50 text-sky-800 border-sky-300';
      case 'disputed':
        return 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
    }
  };

  const getReliabilityBarColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 45) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const formatChannelName = (ch: SourceChannel) => {
    switch (ch) {
      case 'citizen_sms': return 'Citizen SMS';
      case 'citizen_ussd': return 'Citizen USSD (*1070#)';
      case 'citizen_web': return 'Citizen Web Portal';
      case 'sdrf_radio': return 'SDRF Patrol Radio';
      case 'ndrf_agent': return 'Authorized NDRF Agent';
      case 'pwd_official': return 'PWD Official Division';
      case 'cwc_gauge': return 'CWC River Gauge Sensor';
      case 'imd_feed': return 'IMD Doppler Radar Feed';
      case 'district_magistrate': return 'District Control Room';
      default: return ch;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Controls: Search, Channel & State filter tabs */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[260px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-md px-2 py-1.5 text-slate-700 outline-none focus:border-amber-500"
              aria-label="Filter by Source Channel"
            >
              <option value="all">All Source Channels</option>
              <option value="citizen_sms">Citizen SMS</option>
              <option value="citizen_ussd">Citizen USSD</option>
              <option value="citizen_web">Citizen Web</option>
              <option value="sdrf_radio">SDRF Field Radio</option>
              <option value="ndrf_agent">Authorized NDRF Agent</option>
              <option value="pwd_official">State PWD Official</option>
              <option value="district_magistrate">District Magistrate</option>
            </select>
          </div>
        </div>

        {/* State Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 text-[11px] font-semibold mr-1">Credibility Tier:</span>
          <button
            onClick={() => setSelectedStateFilter('all')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              selectedStateFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.filterAll} ({incidents.length})
          </button>
          <button
            onClick={() => setSelectedStateFilter('verified')}
            className={`px-3 py-1 rounded-md font-medium flex items-center gap-1 transition-colors ${
              selectedStateFilter === 'verified'
                ? 'bg-emerald-700 text-white'
                : 'bg-white border border-slate-200 text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {t.statusVerified} ({incidents.filter(i => i.state === 'verified').length})
          </button>
          <button
            onClick={() => setSelectedStateFilter('corroborated')}
            className={`px-3 py-1 rounded-md font-medium flex items-center gap-1 transition-colors ${
              selectedStateFilter === 'corroborated'
                ? 'bg-amber-600 text-white'
                : 'bg-white border border-slate-200 text-amber-800 hover:bg-amber-50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-500" />
            {t.statusCorroborated} ({incidents.filter(i => i.state === 'corroborated').length})
          </button>
          <button
            onClick={() => setSelectedStateFilter('unconfirmed')}
            className={`px-3 py-1 rounded-md font-medium flex items-center gap-1 transition-colors ${
              selectedStateFilter === 'unconfirmed'
                ? 'bg-sky-700 text-white'
                : 'bg-white border border-slate-200 text-sky-800 hover:bg-sky-50'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-500" />
            {t.statusUnconfirmed} ({incidents.filter(i => i.state === 'unconfirmed').length})
          </button>
          <button
            onClick={() => setSelectedStateFilter('disputed')}
            className={`px-3 py-1 rounded-md font-medium flex items-center gap-1 transition-colors ${
              selectedStateFilter === 'disputed'
                ? 'bg-rose-700 text-white'
                : 'bg-white border border-slate-200 text-rose-800 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            {t.statusDisputed} ({incidents.filter(i => i.state === 'disputed').length})
          </button>
        </div>
      </div>

      {/* Feed List */}
      <div className="divide-y divide-slate-100">
        {filteredIncidents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No incidents found matching current filters.
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const hasConflict = incident.state === 'disputed';
            const isStale = incident.freshnessStatus === 'stale';

            return (
              <div
                key={incident.id}
                className={`p-4 transition-colors hover:bg-slate-50/80 ${
                  hasConflict ? 'bg-rose-50/40' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-2">
                  {/* Left: Code, State Badge, Title */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {incident.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold border flex items-center gap-1 ${getBadgeStyle(incident.state)}`}>
                        {incident.state === 'verified' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {incident.state === 'corroborated' && <Users className="w-3.5 h-3.5 text-amber-600" />}
                        {incident.state === 'unconfirmed' && <HelpCircle className="w-3.5 h-3.5 text-sky-600" />}
                        {incident.state === 'disputed' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />}
                        <span className="capitalize">{incident.state}</span>
                      </span>

                      <span className="text-xs text-slate-500 font-medium">
                        {incident.district} · {incident.landmark}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {incident.title}
                    </h3>
                  </div>

                  {/* Right: Time-Decay Score Meter & Age Indicator */}
                  <div className="flex items-center gap-4 bg-white p-2.5 rounded-lg border border-slate-200 shrink-0">
                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1 gap-3">
                        <span className="font-medium text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Age: <strong className="font-mono text-slate-800">{incident.ageMinutes}m</strong>
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {incident.currentReliability}% Reliable
                        </span>
                      </div>
                      {/* Reliability Progress Bar */}
                      <div className="w-36 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full transition-all duration-300 ${getReliabilityBarColor(incident.currentReliability)}`}
                          style={{ width: `${incident.currentReliability}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
                        <span>Base: {incident.baseReliability}%</span>
                        <span className={`font-semibold ${
                          incident.freshnessStatus === 'fresh' ? 'text-emerald-600' :
                          incident.freshnessStatus === 'aging' ? 'text-amber-600' :
                          'text-rose-600'
                        }`}>
                          {incident.freshnessStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Fresh ping refresh button */}
                    <button
                      onClick={() => onRefreshIncidentPing(incident.id)}
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                      title="Simulate incoming fresh telemetry ping (resets decay)"
                      aria-label="Refresh incident telemetry"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Source History */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-slate-400" />
                      Sources ({incident.provenanceTrail.length} incoming packets)
                    </span>
                    <span>Corroboration: <strong className="text-slate-900">{incident.corroborationCount} independent reports</strong></span>
                  </div>

                  {/* Clean unboxed source line */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
                    {incident.provenanceTrail.map((pkt, pIdx) => (
                      <span key={pkt.id} className="flex items-center gap-1">
                        {pIdx > 0 && <span className="text-slate-300" aria-hidden="true">·</span>}
                        <strong className="text-slate-800">{formatChannelName(pkt.channel)}</strong>
                        <span className="text-slate-400">({pkt.reporterRole})</span>
                        {pkt.isOfficial && <span className="text-emerald-700 font-semibold">[Official]</span>}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Disputed Contradiction Box */}
                {hasConflict && incident.conflictingReports && (
                  <div className="mt-2.5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-950">
                    <div className="flex items-center gap-1.5 font-bold text-rose-900 text-xs mb-1">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Conflicting Reports Between Official Agencies
                    </div>
                    <p className="text-[11px] text-rose-800 mb-2">
                      {incident.conflictingReports.conflictDescription}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-white rounded border border-rose-200">
                        <strong className="text-rose-900">{incident.conflictingReports.sourceA}:</strong>
                        <div className="text-slate-700 mt-0.5">"{incident.conflictingReports.claimA}"</div>
                      </div>
                      <div className="p-2 bg-white rounded border border-rose-200">
                        <strong className="text-rose-900">{incident.conflictingReports.sourceB}:</strong>
                        <div className="text-slate-700 mt-0.5">"{incident.conflictingReports.claimB}"</div>
                      </div>
                    </div>
                    <div className="mt-2 p-2 bg-rose-100 rounded text-[11px] text-rose-950 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>{incident.conflictingReports.conservativeAction}</span>
                    </div>
                  </div>
                )}

                {/* Stale Warning & Fallback Instructions */}
                {isStale && (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950">
                    <div className="font-semibold text-amber-900 text-xs flex items-center gap-1 mb-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Stale Telemetry Notice ({incident.ageMinutes} minutes old)
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      {incident.fallbackInstructions}
                    </p>
                  </div>
                )}

                {/* Bottom Footer Actions */}
                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <span>
                      Priority Score: <strong className="text-slate-900">{incident.triagePriorityScore}/100</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenProvenance(incident)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Audit Trail</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
