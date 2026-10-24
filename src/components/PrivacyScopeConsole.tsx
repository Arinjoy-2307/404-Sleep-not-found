import React, { useState, useEffect } from 'react';
import { FusedIncident, SecurityAuditLog } from '../types/disaster';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Clock, 
  Eye, 
  EyeOff, 
  AlertTriangle
} from 'lucide-react';
import { LanguageCode } from '../services/i18n';

interface PrivacyScopeConsoleProps {
  incidents: FusedIncident[];
  language: LanguageCode;
}

export const PrivacyScopeConsole: React.FC<PrivacyScopeConsoleProps> = ({
  incidents,
  language: _language
}) => {
  const [viewMode, setViewMode] = useState<'public' | 'authorized'>('public');
  const [responderBadge, setResponderBadge] = useState('NDRF-OFFICER-7102');
  const [accessPurpose, setAccessPurpose] = useState('Active Flood Rescue Mission - RIB 02');
  const [sessionExpirySeconds, setSessionExpirySeconds] = useState(900); // 15 mins
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Security Audit Logs
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([
    {
      id: 'AUD-SEC-01',
      timestamp: Date.now() - 48 * 60 * 1000,
      userId: 'NDRF-OFFICER-7102',
      userName: 'Sub-Inspector M. K. Roy',
      role: 'Authorized Field Officer',
      requestedScope: 'Citizen Exact Location Read',
      outcome: 'granted',
      reason: 'Direct field rescue deployment for oxygen patient',
      ipAddress: '10.24.8.19 (Rescue VHF Mesh)'
    },
    {
      id: 'AUD-SEC-8821',
      timestamp: Date.now() - 3 * 60 * 1000,
      userId: 'CONTRACTOR-TEMP-88',
      userName: 'Unverified External Contractor',
      role: 'Public Logistics Vendor',
      requestedScope: 'Full Resident Roster Download',
      outcome: 'denied_unauthorized',
      reason: 'Missing multi-factor supervisor authorization',
      ipAddress: '192.168.4.102'
    }
  ]);

  useEffect(() => {
    let timer: any;
    if (isSessionActive && sessionExpirySeconds > 0) {
      timer = setInterval(() => {
        setSessionExpirySeconds(prev => {
          if (prev <= 1) {
            setIsSessionActive(false);
            setViewMode('public');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSessionActive, sessionExpirySeconds]);

  const handleGrantAccess = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSessionActive(true);
    setViewMode('authorized');
    setSessionExpirySeconds(900);

    const log: SecurityAuditLog = {
      id: `AUD-SEC-${Math.floor(Math.random() * 9000 + 1000)}`,
      timestamp: Date.now(),
      userId: responderBadge,
      userName: 'Authorized Field Officer',
      role: 'Rescue Boat Commander',
      requestedScope: 'Field Unmasking Lease',
      outcome: 'granted',
      reason: accessPurpose,
      ipAddress: '10.24.8.22 (Operations Console)'
    };

    setAuditLogs(prev => [log, ...prev]);
  };

  const handleRevoke = () => {
    setIsSessionActive(false);
    setViewMode('public');
    setSessionExpirySeconds(0);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
        <h2 className="text-lg font-bold text-slate-900">
          Citizen Data Privacy & Access Control
        </h2>
        <p className="text-xs text-slate-600">
          Protects stranded citizens by masking exact home addresses and contact numbers on public feeds. Dispatched rescue boat officers receive time-limited 15-minute access to navigate to stranded families.
        </p>
      </div>

      {/* 2. Mode Selector & Active Lease Timer */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500 font-medium block">Active View Mode:</span>
          <strong className="text-base text-slate-900 mt-0.5 block">
            {viewMode === 'public' ? 'Public Redacted View (Protected)' : 'Authorized Rescue Officer View'}
          </strong>
          <span className="text-xs text-slate-500">
            {viewMode === 'public' 
              ? 'Phones masked (+91 98000 *****) · Exact street address hidden.' 
              : `Temporary lease active: ${Math.floor(sessionExpirySeconds / 60)}m ${sessionExpirySeconds % 60}s remaining.`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {viewMode === 'authorized' ? (
            <button
              type="button"
              onClick={handleRevoke}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock & Redact Now</span>
            </button>
          ) : (
            <form onSubmit={handleGrantAccess} className="flex items-center gap-2">
              <input
                type="text"
                value={responderBadge}
                onChange={(e) => setResponderBadge(e.target.value)}
                placeholder="Officer Badge ID"
                className="p-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-slate-900 w-40"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
                <span>Start 15m Rescue Lease</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 3. Incidents Preview comparing Redacted vs Unmasked */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>Active Rescue Incidents Preview ({incidents.slice(0, 4).length})</span>
          <span className="text-slate-500 font-normal">
            {viewMode === 'public' ? 'Currently Masked' : 'Currently Unmasked for Rescue'}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {incidents.slice(0, 4).map((inc) => (
            <div key={inc.id} className="p-4 space-y-1.5 text-xs hover:bg-slate-50/80 transition-colors">
              <div className="flex items-center justify-between">
                <strong className="text-slate-900">{inc.title}</strong>
                <span className="font-mono text-slate-500 text-[11px]">{inc.id}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Contact Number</span>
                  <span className="font-mono font-medium text-slate-800">
                    {viewMode === 'authorized' ? inc.provenanceTrail[0]?.contactMasked.replace(/\(Ref:.*\)/, '').trim() : '+91 98000 ***** (Masked)'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">House & Street Location</span>
                  <span className="font-medium text-slate-800">
                    {viewMode === 'authorized' 
                      ? inc.provenanceTrail[0]?.exactAddress 
                      : `${inc.landmark}, ${inc.district} (Street number hidden)`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Access Audit Logs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-700">
          Security Audit Log (Access History)
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-slate-900">{log.userName}</strong>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500 font-mono text-[11px]">{log.userId}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    log.outcome === 'granted' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                  }`}>
                    {log.outcome === 'granted' ? 'Access Granted' : 'Access Blocked'}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Requested: {log.requestedScope} · Reason: {log.reason}
                </p>
              </div>

              <div className="text-[11px] text-slate-400 font-mono shrink-0">
                IP: {log.ipAddress}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
