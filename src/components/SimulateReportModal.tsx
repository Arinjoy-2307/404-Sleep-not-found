import React, { useState } from 'react';
import { 
  SourceChannel, 
  DistrictName, 
  IncidentCategory, 
  FusedIncident, 
  ReportPacket 
} from '../types/disaster';
import { generateProvenanceHash } from '../services/fusionEngine';
import { 
  X, 
  Send, 
  Radio, 
  PlusCircle, 
  Sparkles, 
  AlertTriangle 
} from 'lucide-react';

interface SimulateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingIncidents: FusedIncident[];
  onIngestNewPacket: (packet: ReportPacket, targetIncidentId?: string, isConflicting?: boolean, conflictClaim?: string) => void;
}

export const SimulateReportModal: React.FC<SimulateReportModalProps> = ({
  isOpen,
  onClose,
  existingIncidents,
  onIngestNewPacket
}) => {
  const [channel, setChannel] = useState<SourceChannel>('citizen_sms');
  const [district, setDistrict] = useState<DistrictName>('Barpeta');
  const [category, setCategory] = useState<IncidentCategory>('flood_surge');
  const [reporterName, setReporterName] = useState('Anand Das');
  const [reporterRole, setReporterRole] = useState('Local Resident');
  const [landmark, setLandmark] = useState('Beki River Embankment, Ward 2');
  const [headline, setHeadline] = useState('Water level breaching village bund over 15 meter width');
  const [details, setDetails] = useState('Water rushing towards primary school grounds. Approximately 30 families trapped on raised platform.');
  const [targetClusterOption, setTargetClusterOption] = useState<'new' | 'corroborate' | 'conflict'>('new');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(existingIncidents[0]?.id || '');
  const [conflictClaimText, setConflictClaimText] = useState('Counter-report: Embankment is secure, flood water receding rapidly.');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const packetId = `REP-${channel.toUpperCase().slice(0, 3)}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const now = Date.now();
    const isOfficial = channel === 'pwd_official' || channel === 'district_magistrate' || channel === 'cwc_gauge' || channel === 'imd_feed';
    const isAuthorized = channel === 'ndrf_agent' || channel === 'sdrf_radio';

    const packet: ReportPacket = {
      id: packetId,
      incidentClusterId: targetClusterOption === 'new' ? `INC-${Math.floor(Math.random() * 900 + 100)}` : selectedIncidentId,
      timestamp: now,
      channel,
      reporterName,
      reporterRole,
      isOfficial,
      isAuthorizedFieldAgent: isAuthorized,
      district,
      landmark,
      coordinates: { lat: 26.32 + Math.random() * 0.05, lng: 91.02 + Math.random() * 0.05 },
      category,
      headline,
      details,
      rawPayload: JSON.stringify({
        packet_id: packetId,
        source: channel,
        reporter: reporterName,
        district,
        landmark,
        text: headline,
        ingested_at: new Date(now).toISOString()
      }),
      provenanceHash: generateProvenanceHash(packetId, now, channel),
      contactMasked: '+91 98640 *****',
      exactAddress: `${landmark}, ${district} District`
    };

    onIngestNewPacket(
      packet,
      targetClusterOption === 'new' ? undefined : selectedIncidentId,
      targetClusterOption === 'conflict',
      conflictClaimText
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0b2341] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#1b3a60]">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm">
              Simulate Ingestion Packet (Multi-Source Fusion Engine)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Fusion Strategy */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Fusion Intent & Credibility Target:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetClusterOption('new')}
                className={`p-2 rounded border text-left transition-colors ${
                  targetClusterOption === 'new' ? 'border-sky-500 bg-sky-50 font-bold text-sky-900' : 'border-slate-200 text-slate-600'
                }`}
              >
                <div className="font-semibold text-xs">Isolated Incident</div>
                <div className="text-[10px] text-slate-500">Flags as 'unconfirmed'</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetClusterOption('corroborate')}
                className={`p-2 rounded border text-left transition-colors ${
                  targetClusterOption === 'corroborate' ? 'border-amber-500 bg-amber-50 font-bold text-amber-900' : 'border-slate-200 text-slate-600'
                }`}
              >
                <div className="font-semibold text-xs">Corroborate Report</div>
                <div className="text-[10px] text-slate-500">Links ≥2 reports</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetClusterOption('conflict')}
                className={`p-2 rounded border text-left transition-colors ${
                  targetClusterOption === 'conflict' ? 'border-rose-500 bg-rose-50 font-bold text-rose-900' : 'border-slate-200 text-slate-600'
                }`}
              >
                <div className="font-semibold text-xs">Inject Dispute</div>
                <div className="text-[10px] text-slate-500">Official contradiction</div>
              </button>
            </div>
          </div>

          {/* Target existing incident if corroborating or disputing */}
          {targetClusterOption !== 'new' && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <label className="block font-semibold text-slate-700">
                Select Existing Incident to {targetClusterOption === 'corroborate' ? 'Corroborate' : 'Dispute'}:
              </label>
              <select
                value={selectedIncidentId}
                onChange={(e) => setSelectedIncidentId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-xs bg-white text-slate-800"
              >
                {existingIncidents.map(inc => (
                  <option key={inc.id} value={inc.id}>
                    [{inc.state.toUpperCase()}] {inc.id}: {inc.title.slice(0, 48)}...
                  </option>
                ))}
              </select>

              {targetClusterOption === 'conflict' && (
                <div>
                  <label className="block font-semibold text-rose-800 mt-2 mb-1">
                    Contradictory Claim Text (from Second Official Agency):
                  </label>
                  <input
                    type="text"
                    value={conflictClaimText}
                    onChange={(e) => setConflictClaimText(e.target.value)}
                    className="w-full p-2 border border-rose-300 rounded text-xs bg-rose-50/50"
                  />
                </div>
              )}
            </div>
          )}

          {/* Channel and District */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Source Channel:</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as SourceChannel)}
                className="w-full p-2 border border-slate-300 rounded text-xs bg-white text-slate-800"
              >
                <option value="citizen_sms">Citizen SMS</option>
                <option value="citizen_ussd">Citizen USSD (*1070#)</option>
                <option value="citizen_web">Citizen Web Portal</option>
                <option value="sdrf_radio">SDRF Patrol Radio</option>
                <option value="ndrf_agent">Authorized NDRF Agent</option>
                <option value="pwd_official">State PWD Official</option>
                <option value="cwc_gauge">CWC River Gauge Sensor</option>
                <option value="district_magistrate">District Control Room</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">District:</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value as DistrictName)}
                className="w-full p-2 border border-slate-300 rounded text-xs bg-white text-slate-800"
              >
                <option value="Barpeta">Barpeta</option>
                <option value="Kamrup">Kamrup</option>
                <option value="Morigaon">Morigaon</option>
                <option value="Cachar">Cachar (Silchar)</option>
              </select>
            </div>
          </div>

          {/* Category & Landmark */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full p-2 border border-slate-300 rounded text-xs bg-white text-slate-800"
              >
                <option value="flood_surge">Flood Surge / Water Level</option>
                <option value="bridge_collapse">Bridge / Culvert Condition</option>
                <option value="road_cut">Road Breach / Logistics Cut</option>
                <option value="medical_oxygen">Medical / Oxygen / Vulnerable</option>
                <option value="shelter_capacity">Relief Camp / Shelter</option>
                <option value="evacuation_order">Evacuation Alert</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Landmark / Location:</label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
          </div>

          {/* Reporter metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reporter Name:</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reporter Role / Agency:</label>
              <input
                type="text"
                value={reporterRole}
                onChange={(e) => setReporterRole(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
          </div>

          {/* Headline & Details */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Report Headline:</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Detailed Observation:</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              className="w-full p-2 border border-slate-300 rounded text-xs"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded flex items-center gap-1.5 shadow"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>Ingest & Compute State</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
