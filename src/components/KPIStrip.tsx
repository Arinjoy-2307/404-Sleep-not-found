import React from 'react';
import { 
  CheckCircle2, 
  Users, 
  HelpCircle, 
  AlertTriangle, 
  Clock, 
  HeartHandshake
} from 'lucide-react';
import { FusedIncident } from '../types/disaster';
import { LanguageCode, translations } from '../services/i18n';

interface KPIStripProps {
  incidents: FusedIncident[];
  language: LanguageCode;
  onFilterState: (state: string) => void;
  selectedStateFilter: string;
}

export const KPIStrip: React.FC<KPIStripProps> = ({
  incidents,
  language,
  onFilterState,
  selectedStateFilter
}) => {
  const t = translations[language];

  const verifiedCount = incidents.filter(i => i.state === 'verified').length;
  const corroboratedCount = incidents.filter(i => i.state === 'corroborated').length;
  const unconfirmedCount = incidents.filter(i => i.state === 'unconfirmed').length;
  const disputedCount = incidents.filter(i => i.state === 'disputed').length;

  const staleCount = incidents.filter(i => i.freshnessStatus === 'stale').length;
  const vulnerableCount = incidents.filter(i => i.vulnerabilityScore >= 60).length;

  return (
    <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status filters in a clean, unified segmented strip */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs py-0.5">
          <span className="text-slate-400 font-medium mr-1 shrink-0">Filter:</span>
          
          <button
            onClick={() => onFilterState('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              selectedStateFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Reports ({incidents.length})
          </button>

          <button
            onClick={() => onFilterState(selectedStateFilter === 'verified' ? 'all' : 'verified')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
              selectedStateFilter === 'verified'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Official ({verifiedCount})</span>
          </button>

          <button
            onClick={() => onFilterState(selectedStateFilter === 'corroborated' ? 'all' : 'corroborated')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
              selectedStateFilter === 'corroborated'
                ? 'bg-amber-600 text-white'
                : 'text-slate-700 hover:bg-amber-50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>Corroborated ({corroboratedCount})</span>
          </button>

          <button
            onClick={() => onFilterState(selectedStateFilter === 'unconfirmed' ? 'all' : 'unconfirmed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
              selectedStateFilter === 'unconfirmed'
                ? 'bg-sky-600 text-white'
                : 'text-slate-700 hover:bg-sky-50'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>Unconfirmed ({unconfirmedCount})</span>
          </button>

          <button
            onClick={() => onFilterState(selectedStateFilter === 'disputed' ? 'all' : 'disputed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
              selectedStateFilter === 'disputed'
                ? 'bg-rose-700 text-white'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Disputed ({disputedCount})</span>
          </button>
        </div>

        {/* Quiet operational indicators without heavy boxes */}
        <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <HeartHandshake className="w-3.5 h-3.5 text-red-500" />
            <span>Urgent Medical/Rescue: <strong className="text-slate-900 font-mono">{vulnerableCount}</strong></span>
          </div>

          <span className="text-slate-300" aria-hidden="true">·</span>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Stale Reports (&gt;45m): <strong className={`font-mono ${staleCount > 0 ? 'text-amber-700' : 'text-slate-700'}`}>{staleCount}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
