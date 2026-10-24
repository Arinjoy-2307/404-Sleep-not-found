import React, { useState } from 'react';
import { FusedIncident, ReportPacket } from '../types/disaster';
import { 
  X, 
  Hash, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Users, 
  AlertTriangle, 
  HelpCircle, 
  Code2, 
  Copy, 
  Check, 
  ArrowDownCircle,
  FileCheck
} from 'lucide-react';

interface ProvenanceInspectorModalProps {
  incident: FusedIncident | null;
  onClose: () => void;
}

export const ProvenanceInspectorModal: React.FC<ProvenanceInspectorModalProps> = ({
  incident,
  onClose
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trail' | 'raw' | 'decay'>('trail');

  if (!incident) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0b2341] text-white px-6 py-4 flex items-center justify-between border-b border-[#1b3a60]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                PROVENANCE AUDIT LEDGER
              </span>
              <span className="text-slate-400 font-mono text-xs">{incident.id}</span>
              <span className="text-slate-400">·</span>
              <span className="font-mono text-xs text-slate-300">Cluster: {incident.clusterCode}</span>
            </div>
            <h2 className="text-base font-bold text-white leading-tight">
              {incident.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status & Subheader Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-medium">Credibility State:</span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border flex items-center gap-1.5 ${
              incident.state === 'verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
              incident.state === 'corroborated' ? 'bg-amber-100 text-amber-800 border-amber-300' :
              incident.state === 'disputed' ? 'bg-rose-100 text-rose-800 border-rose-300' :
              'bg-sky-100 text-sky-800 border-sky-300'
            }`}>
              {incident.state === 'verified' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {incident.state === 'corroborated' && <Users className="w-3.5 h-3.5" />}
              {incident.state === 'disputed' && <AlertTriangle className="w-3.5 h-3.5" />}
              {incident.state === 'unconfirmed' && <HelpCircle className="w-3.5 h-3.5" />}
              <span className="uppercase">{incident.state}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-600 font-mono text-xs">
            <span>District: <strong className="text-slate-900">{incident.district}</strong></span>
            <span>·</span>
            <span>Coords: <strong className="text-slate-900">{incident.coordinates.lat.toFixed(4)}, {incident.coordinates.lng.toFixed(4)}</strong></span>
            <span>·</span>
            <span>Age: <strong className="text-slate-900">{incident.ageMinutes}m</strong></span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('trail')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'trail'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Chronological Provenance Trail ({incident.provenanceTrail.length} Packets)
          </button>
          <button
            onClick={() => setActiveTab('decay')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'decay'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Time-Decay Filter & Reliability Math
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'raw'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Raw Ingested JSON Payloads
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Provenance Trail */}
          {activeTab === 'trail' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                <FileCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Provenance Verification Trail:</strong> Each packet is timestamped, origin-authenticated, and cryptographically fingerprinted upon arrival at the NDMA gateway. Reports within spatial/temporal clusters are linked automatically to evaluate credibility.
                </div>
              </div>

              {/* Chronological Packet List */}
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                {incident.provenanceTrail.map((packet: ReportPacket, index: number) => {
                  const dateStr = new Date(packet.timestamp).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <div key={packet.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-700 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
                        {/* Packet meta */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                              Packet #{index + 1}: {packet.id}
                            </span>
                            <span className="font-medium text-slate-700 capitalize">
                              Channel: {packet.channel.replace('_', ' ')}
                            </span>
                            {packet.isAuthorizedFieldAgent && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                AUTHORIZED FIELD AGENT
                              </span>
                            )}
                            {packet.isOfficial && !packet.isAuthorizedFieldAgent && (
                              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                OFFICIAL AGENCY
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                            <Clock className="w-3 h-3" />
                            <span>{dateStr}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 mb-1">
                            {packet.headline}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {packet.details}
                          </p>
                        </div>

                        {/* Reporter & Contact Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded border border-slate-100">
                          <div>
                            <span className="text-slate-500">Reporter:</span>{' '}
                            <strong className="text-slate-800">{packet.reporterName}</strong> ({packet.reporterRole})
                          </div>
                          <div>
                            <span className="text-slate-500">Contact:</span>{' '}
                            <span className="font-mono text-slate-700">{packet.contactMasked}</span>
                          </div>
                          <div className="col-span-1 md:col-span-2">
                            <span className="text-slate-500">Location Reported:</span>{' '}
                            <span className="text-slate-800">{packet.landmark}</span>
                          </div>
                        </div>

                        {/* Cryptographic Hash */}
                        <div className="flex items-center justify-between bg-slate-900 text-slate-200 px-3 py-1.5 rounded font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5 text-amber-400" />
                            <span>HMAC SHA-256 Fingerprint:</span>
                            <span className="text-amber-300 font-bold">{packet.provenanceHash}</span>
                          </div>
                          <button
                            onClick={() => handleCopy(packet.provenanceHash)}
                            className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                            title="Copy fingerprint"
                          >
                            {copiedHash === packet.provenanceHash ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedHash === packet.provenanceHash ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Time-Decay Math */}
          {activeTab === 'decay' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-900 text-slate-100 rounded-lg space-y-3 font-mono">
                <div className="text-amber-400 font-bold text-sm">
                  MATHEMATICAL TIME-DECAY FORMULATION
                </div>
                <div className="p-3 bg-black/40 rounded border border-slate-700 text-center text-sm">
                  R(t) = R₀ · (0.5)^(Δt / T_half)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="p-2 bg-slate-800 rounded">
                    <span className="text-slate-400 text-[10px] block">Base Reliability (R₀):</span>
                    <strong className="text-amber-300 text-base">{incident.baseReliability}%</strong>
                  </div>
                  <div className="p-2 bg-slate-800 rounded">
                    <span className="text-slate-400 text-[10px] block">Half-Life (T_half):</span>
                    <strong className="text-amber-300 text-base">{incident.decayHalfLifeMin} mins</strong>
                  </div>
                  <div className="p-2 bg-slate-800 rounded">
                    <span className="text-slate-400 text-[10px] block">Age Elapsed (Δt):</span>
                    <strong className="text-amber-300 text-base">{incident.ageMinutes} mins</strong>
                  </div>
                  <div className="p-2 bg-slate-800 rounded">
                    <span className="text-slate-400 text-[10px] block">Current Score R(t):</span>
                    <strong className="text-emerald-400 text-base">{incident.currentReliability}%</strong>
                  </div>
                </div>
              </div>

              {/* Decay Curves Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Time Interval</th>
                      <th className="p-2.5">Decay Factor</th>
                      <th className="p-2.5">Calculated Score</th>
                      <th className="p-2.5">Operational Freshness State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-mono">
                    <tr className="bg-emerald-50/40">
                      <td className="p-2.5">0m (Instant Ingest)</td>
                      <td className="p-2.5">1.000</td>
                      <td className="p-2.5 font-bold text-slate-900">{incident.baseReliability}%</td>
                      <td className="p-2.5 text-emerald-700 font-semibold">FRESH (Standard Ops)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">{incident.decayHalfLifeMin * 0.5}m (Half T½)</td>
                      <td className="p-2.5">0.707</td>
                      <td className="p-2.5">{Math.round(incident.baseReliability * 0.707)}%</td>
                      <td className="p-2.5 text-emerald-700">FRESH</td>
                    </tr>
                    <tr className="bg-amber-50/40">
                      <td className="p-2.5">{incident.decayHalfLifeMin}m (1 Half-life)</td>
                      <td className="p-2.5">0.500</td>
                      <td className="p-2.5">{Math.round(incident.baseReliability * 0.5)}%</td>
                      <td className="p-2.5 text-amber-700 font-semibold">AGING (Re-verification recommended)</td>
                    </tr>
                    <tr className="bg-rose-50/40">
                      <td className="p-2.5">{incident.decayHalfLifeMin * 1.5}m (1.5 Half-lives)</td>
                      <td className="p-2.5">0.354</td>
                      <td className="p-2.5 font-bold text-rose-700">{Math.round(incident.baseReliability * 0.354)}%</td>
                      <td className="p-2.5 text-rose-700 font-bold">STALE (Fallback Instructions Active)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Fallback instruction display */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                <span className="font-bold text-slate-900 block mb-1">
                  Active Operational Fallback Directive:
                </span>
                <p className="text-slate-600 leading-relaxed font-sans">
                  {incident.fallbackInstructions}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Raw Payloads */}
          {activeTab === 'raw' && (
            <div className="space-y-4">
              {incident.provenanceTrail.map((packet: ReportPacket, index: number) => (
                <div key={packet.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-slate-700">
                      Packet #{index + 1}: {packet.id} ({packet.channel})
                    </span>
                    <button
                      onClick={() => handleCopy(packet.rawPayload)}
                      className="text-slate-500 hover:text-slate-900 flex items-center gap-1 text-[11px]"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Payload</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 text-amber-300 font-mono text-xs overflow-x-auto leading-relaxed">
                    {packet.rawPayload}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            Signed by NDMA Cryptographic Verifier node 0x88f2
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg text-xs"
          >
            Close Audit Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
