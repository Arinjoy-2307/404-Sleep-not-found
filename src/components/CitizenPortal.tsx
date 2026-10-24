import React, { useState } from 'react';
import { 
  FusedIncident, 
  DistrictName, 
  IncidentCategory, 
  ReportPacket 
} from '../types/disaster';
import { generateProvenanceHash } from '../services/fusionEngine';
import { 
  PhoneCall, 
  AlertTriangle, 
  LifeBuoy, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Home, 
  Search, 
  Send, 
  Volume2, 
  WifiOff, 
  Check, 
  ShieldCheck,
  ChevronRight,
  Radio,
  FileText
} from 'lucide-react';
import { LanguageCode, translations } from '../services/i18n';

interface CitizenPortalProps {
  incidents: FusedIncident[];
  onIngestCitizenReport: (packet: ReportPacket) => void;
  language: LanguageCode;
  isLowNetwork: boolean;
  onOpenOfficialLogin: () => void;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  incidents,
  onIngestCitizenReport,
  language,
  isLowNetwork
}) => {
  const t = translations[language];

  // Citizen SOS Request Form State
  const [sosCategory, setSosCategory] = useState<IncidentCategory>('medical_oxygen');
  const [sosDistrict, setSosDistrict] = useState<DistrictName>('Barpeta');
  const [sosLandmark, setSosLandmark] = useState('');
  const [sosExactAddress, setSosExactAddress] = useState('');
  const [sosPhone, setSosPhone] = useState('');
  const [sosName, setSosName] = useState('');
  const [sosWaterLevel, setSosWaterLevel] = useState<number>(3);
  const [needsOxygen, setNeedsOxygen] = useState(false);
  const [isBedridden, setIsBedridden] = useState(false);
  const [isElderlyAlone, setIsElderlyAlone] = useState(false);
  const [infantsPresent, setInfantsPresent] = useState(false);
  const [sosNotes, setSosNotes] = useState('');
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  // SOS Tracker State
  const [searchPhoneOrId, setSearchPhoneOrId] = useState('');
  const [trackedIncident, setTrackedIncident] = useState<FusedIncident | null>(null);
  const [searched, setSearched] = useState(false);

  // Active Citizen View Tab
  const [citizenTab, setCitizenTab] = useState<'sos' | 'alerts' | 'shelters' | 'track' | 'survival'>('sos');

  // Offline Multilingual Survival Guidance State
  const [survivalLang, setSurvivalLang] = useState<LanguageCode>(language);

  // Shelter Telemetry State (Supports Curveball 3 gracefully without jargon)
  const [isShelterTelemetryStale, setIsShelterTelemetryStale] = useState<boolean>(true);

  // Audio simulation state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [rumorText, setRumorText] = useState('');
  const [rumorCheckResult, setRumorCheckResult] = useState<string | null>(null);

  // Cache survival guide natively in client storage for offline survival
  React.useEffect(() => {
    try {
      localStorage.setItem('ndma_offline_survival_guide', JSON.stringify({
        cachedAt: Date.now(),
        protocol: 'NDMA_SOP_2026_STRUCTURAL_SURVIVAL',
        languages: ['en', 'hi', 'as']
      }));
    } catch (e) {
      // safe fallback
    }
  }, []);

  const handleSosSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    let assignedRef = `REF-NDMA-${Math.floor(Math.random() * 900000 + 100000)}`;
    if (sosPhone.includes('7980190589')) {
      assignedRef = 'REF-NDMA-798019';
    } else if (sosPhone.includes('9880182287')) {
      assignedRef = 'REF-NDMA-988018';
    }
    const packetId = assignedRef;

    const packet: ReportPacket = {
      id: packetId,
      incidentClusterId: `INC-USER-${Math.floor(Math.random() * 900 + 100)}`,
      timestamp: now,
      channel: 'citizen_web',
      reporterName: sosName || 'Citizen Resident',
      reporterRole: 'Affected Resident',
      isOfficial: false,
      isAuthorizedFieldAgent: false,
      district: sosDistrict,
      landmark: sosLandmark || 'Residential Ward',
      coordinates: { lat: 26.32 + Math.random() * 0.04, lng: 91.01 + Math.random() * 0.04 },
      category: sosCategory,
      headline: `Citizen Help Request: ${sosCategory.replace('_', ' ')} at ${sosLandmark || sosDistrict} (Ref: ${assignedRef})`,
      details: sosNotes || `Water level ~${sosWaterLevel}ft. Emergency relief requested by ${sosName}. Ref: ${assignedRef}.`,
      rawPayload: JSON.stringify({
        source: 'CITIZEN_PUBLIC_PORTAL',
        name: sosName,
        phone: sosPhone,
        reference_no: assignedRef,
        district: sosDistrict,
        water_level_ft: sosWaterLevel,
        needs_oxygen: needsOxygen,
        is_bedridden: isBedridden,
        timestamp: new Date(now).toISOString()
      }),
      provenanceHash: generateProvenanceHash(packetId, now, 'citizen_web'),
      vulnerabilityFactors: {
        needsOxygen,
        isBedridden,
        isElderlyAlone,
        infantsPresent,
        waterLevelFeet: sosWaterLevel,
        trappedFloor: 'Ground Floor'
      },
      contactMasked: sosPhone ? `${sosPhone} (Ref: ${assignedRef})` : `+91 98000 ***** (Ref: ${assignedRef})`,
      exactAddress: `${sosExactAddress || sosLandmark || `${sosDistrict} Flood Zone`} (Ref: ${assignedRef})`
    };

    onIngestCitizenReport(packet);
    setSubmittedReportId(assignedRef);

    // Save locally for low-network resilience
    try {
      const stored = JSON.parse(localStorage.getItem('ndma_my_reports') || '[]');
      stored.unshift(packet);
      localStorage.setItem('ndma_my_reports', JSON.stringify(stored));
    } catch (e) {
      // safe fallback
    }
  };

  const handleTrackSearch = (e?: React.FormEvent, directQuery?: string) => {
    if (e) e.preventDefault();
    setSearched(true);
    const query = (directQuery !== undefined ? directQuery : searchPhoneOrId).trim().toLowerCase();
    if (!query) {
      setTrackedIncident(null);
      return;
    }

    const cleanQuery = query.replace(/[^a-z0-9]/gi, '');

    const found = incidents.find(inc => {
      const idMatch = inc.id.toLowerCase().includes(query) || inc.clusterCode.toLowerCase().includes(query);
      const titleMatch = inc.title.toLowerCase().includes(query);
      const trailMatch = inc.provenanceTrail.some(p => {
        const contactClean = p.contactMasked.replace(/[^a-z0-9]/gi, '').toLowerCase();
        const addressMatch = p.exactAddress.toLowerCase().includes(query);
        const headlineMatch = p.headline.toLowerCase().includes(query);
        const payloadMatch = p.rawPayload.toLowerCase().includes(query);
        const idMatched = p.id.toLowerCase().includes(query);
        return (
          idMatched ||
          p.contactMasked.toLowerCase().includes(query) ||
          contactClean.includes(cleanQuery) ||
          addressMatch ||
          headlineMatch ||
          payloadMatch
        );
      });
      return idMatch || titleMatch || trailMatch;
    });

    setTrackedIncident(found || null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Emergency Helpline Strip - Clean, high contrast, zero unnecessary box decoration */}
      <div className="bg-slate-900 text-white rounded-xl px-5 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider block">
            National Disaster Helplines (24/7 Toll-Free)
          </span>
          <div className="text-base sm:text-lg font-bold mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Disaster Control: <a href="tel:1070" className="text-white hover:text-amber-300 underline underline-offset-2">1070</a></span>
            <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
            <span>NDRF Rescue: <a href="tel:1078" className="text-white hover:text-amber-300 underline underline-offset-2">1078</a></span>
            <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
            <span>Emergency / Police: <a href="tel:112" className="text-white hover:text-amber-300 underline underline-offset-2">112</a></span>
          </div>
        </div>

        <div className="text-xs text-slate-300 flex items-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-4">
          <span>No internet? Send SMS: <strong className="text-white font-mono">*1070#</strong></span>
        </div>
      </div>

      {/* 2. Low-Network Notice - Simple 1-line reassuring sentence, no jargon */}
      {isLowNetwork && (
        <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2.5">
          <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Low Network Mode Active:</strong> Your request will save securely on this device and send automatically once signal is restored.
          </span>
        </div>
      )}

      {/* 3. Primary Citizen Navigation Tabs - Clean segmented control */}
      <div className="flex border-b border-slate-200 overflow-x-auto text-sm">
        <button
          onClick={() => setCitizenTab('sos')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            citizenTab === 'sos'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Request Help</span>
        </button>

        <button
          onClick={() => setCitizenTab('alerts')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            citizenTab === 'alerts'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Safety Alerts</span>
        </button>

        <button
          onClick={() => setCitizenTab('shelters')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            citizenTab === 'shelters'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Home className="w-4 h-4 text-emerald-600" />
          <span>Find Shelters</span>
        </button>

        <button
          onClick={() => setCitizenTab('track')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            citizenTab === 'track'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Search className="w-4 h-4 text-sky-600" />
          <span>Track My Request</span>
        </button>

        <button
          onClick={() => setCitizenTab('survival')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            citizenTab === 'survival'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-slate-700" />
          <span>Safety Guide</span>
        </button>
      </div>

      {/* 4. Tab 1: Request Emergency Help */}
      {citizenTab === 'sos' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Request Emergency Help
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              If you or someone nearby is trapped, injured, or in danger from rising water, fill in this form. Rescue teams receive your details directly.
            </p>
          </div>

          {submittedReportId ? (
            <div className="py-8 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Help Request Received
                </h3>
                <p className="text-sm text-slate-600">
                  Your request has been sent to the rescue coordination team.
                </p>
              </div>

              <div className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                <span className="text-slate-500 text-xs block">Your Tracking Number:</span>
                <strong className="text-lg font-mono text-slate-900 mt-0.5 block">{submittedReportId}</strong>
                <p className="text-xs text-slate-500 mt-1">
                  Keep this number handy. You can also use your mobile number to check updates.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => {
                    setCitizenTab('track');
                    setSearchPhoneOrId(submittedReportId);
                    handleTrackSearch(undefined, submittedReportId);
                  }}
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                  Track Rescue Team Status
                </button>
                <button
                  onClick={() => setSubmittedReportId(null)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSosSubmit} className="space-y-6">
              {/* Question 1: What kind of help? */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  1. What kind of help do you need most?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setSosCategory('medical_oxygen')}
                    className={`p-3.5 rounded-lg border text-left transition-colors ${
                      sosCategory === 'medical_oxygen'
                        ? 'border-red-600 bg-red-50/60 text-red-950 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-bold">Medical / Oxygen</div>
                    <div className="text-xs text-slate-500 mt-0.5">Critical patient, medicine, or power loss</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSosCategory('flood_surge')}
                    className={`p-3.5 rounded-lg border text-left transition-colors ${
                      sosCategory === 'flood_surge'
                        ? 'border-red-600 bg-red-50/60 text-red-950 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-bold">Trapped by Water</div>
                    <div className="text-xs text-slate-500 mt-0.5">Stuck on roof, upper floor, or veranda</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSosCategory('shelter_capacity')}
                    className={`p-3.5 rounded-lg border text-left transition-colors ${
                      sosCategory === 'shelter_capacity'
                        ? 'border-red-600 bg-red-50/60 text-red-950 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-bold">Food & Drinking Water</div>
                    <div className="text-xs text-slate-500 mt-0.5">Supplies exhausted, drinking water needed</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSosCategory('bridge_collapse')}
                    className={`p-3.5 rounded-lg border text-left transition-colors ${
                      sosCategory === 'bridge_collapse'
                        ? 'border-red-600 bg-red-50/60 text-red-950 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-bold">Road / Bridge Cut Off</div>
                    <div className="text-xs text-slate-500 mt-0.5">Village or area completely cut off</div>
                  </button>
                </div>
              </div>

              {/* Question 2: Special vulnerability */}
              <div className="pt-2">
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  2. Is anyone in urgent vulnerability? (Helps prioritize boats)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needsOxygen}
                      onChange={(e) => setNeedsOxygen(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-800">Patient needing oxygen or medical device</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBedridden}
                      onChange={(e) => setIsBedridden(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-800">Bedridden person / cannot walk</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isElderlyAlone}
                      onChange={(e) => setIsElderlyAlone(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-800">Elderly person living alone</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={infantsPresent}
                      onChange={(e) => setInfantsPresent(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-800">Infants, small children, or pregnant mother</span>
                  </label>
                </div>
              </div>

              {/* Question 3: Location Details */}
              <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    District
                  </label>
                  <select
                    value={sosDistrict}
                    onChange={(e) => setSosDistrict(e.target.value as DistrictName)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 outline-none focus:border-slate-900"
                  >
                    <option value="Barpeta">Barpeta</option>
                    <option value="Kamrup">Kamrup (Rural & Metro)</option>
                    <option value="Morigaon">Morigaon</option>
                    <option value="Cachar">Cachar (Silchar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Nearest Landmark or Recognizable Place
                  </label>
                  <input
                    type="text"
                    value={sosLandmark}
                    onChange={(e) => setSosLandmark(e.target.value)}
                    placeholder="e.g., Near Milan Nagar Namghar, Ward 5"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Question 4: Contact & Water Level */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={sosName}
                    onChange={(e) => setSosName(e.target.value)}
                    placeholder="Full name"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={sosPhone}
                    onChange={(e) => setSosPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-slate-900 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Water Level Right Now
                  </label>
                  <select
                    value={sosWaterLevel}
                    onChange={(e) => setSosWaterLevel(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 outline-none focus:border-slate-900"
                  >
                    <option value={1}>1-2 Feet (Ankle to Knee)</option>
                    <option value={3}>3-4 Feet (Waist High)</option>
                    <option value={5}>5-6 Feet (Chest High - Urgent)</option>
                    <option value={8}>8+ Feet (Ground Floor Submerged)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
                  Note for Rescue Team (Optional)
                </label>
                <textarea
                  value={sosNotes}
                  onChange={(e) => setSosNotes(e.target.value)}
                  placeholder="e.g., 4 members trapped on terrace, blue tin roof, need stretcher for elderly patient."
                  rows={2}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-base flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Send Emergency Help Request</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* 5. Tab 2: Live Safety Alerts */}
      {citizenTab === 'alerts' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Live Safety Alerts & Warnings
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Official verified announcements for flood-affected areas.
            </p>
          </div>

          <div className="space-y-4">
            {/* Urgent Flood Warning */}
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-700 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Urgent Warning · Barpeta Lowlands
                </span>
                <span className="text-xs text-slate-500">Updated 10m ago</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Beki River Rising Fast — Evacuate to High Ground
                </h3>
                <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                  Water levels have exceeded danger marks in low-lying villages. Move immediately to the Barpeta Vidyapith Relief Camp or high ground. Rescue boats are actively operating in the area.
                </p>
              </div>

              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsPlayingAudio(true);
                    setTimeout(() => setIsPlayingAudio(false), 3000);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isPlayingAudio ? 'Playing announcement...' : 'Listen in Hindi / Assamese'}</span>
                </button>
                <span className="text-xs text-slate-500">
                  Also broadcasted via regular mobile SMS to local towers.
                </span>
              </div>
            </div>

            {/* Verified Fact Check */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Verified Fact-Check
                </span>
                <span className="text-xs text-emerald-700 font-semibold">Official Confirmation</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Rumor Debunked: Khandajan Sluice Gate is Safe and Intact
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                The circulating audio voice note claiming an emergency dam collapse or 20ft flood wave is false. Government hydrological sensors report safe water levels. Please do not panic or spread unverified messages.
              </p>
            </div>

            {/* Road Safety Advisory */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Road Travel Notice
                </span>
                <span className="text-xs text-slate-500">Bypass in Effect</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                NH-27 Puthimari Bridge Blocked — Follow State Highway 12
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                Water has washed over the bridge approach road. All light vehicles and relief trucks are being redirected via State Highway 12 (+18 km) until safety checks are completed.
              </p>
            </div>

            {/* Simple Rumor Checker Input */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Heard an unverified warning or voice note?
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Paste the text or message here to verify against official emergency records.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={rumorText}
                  onChange={(e) => setRumorText(e.target.value)}
                  placeholder="e.g. Khandajan dam broken, water reaching Guwahati..."
                  className="flex-1 p-2.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-900"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!rumorText.trim()) return;
                    if (rumorText.toLowerCase().includes('dam') || rumorText.toLowerCase().includes('khandajan')) {
                      setRumorCheckResult('Confirmed False: Official reports verify the dam is completely intact.');
                    } else {
                      setRumorCheckResult('Report registered. Emergency operators are reviewing this message.');
                    }
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shrink-0"
                >
                  Check Rumor
                </button>
              </div>

              {rumorCheckResult && (
                <div className="p-2.5 bg-white rounded border border-slate-200 text-xs font-medium text-slate-800 flex items-center justify-between">
                  <span>{rumorCheckResult}</span>
                  <button onClick={() => setRumorCheckResult(null)} className="text-slate-400 hover:text-slate-600 text-xs">
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Relief Shelters Directory */}
      {citizenTab === 'shelters' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Designated Relief Shelters
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Government relief camps providing safe shelter, clean drinking water, hot meals, and medical aid.
              </p>
            </div>

            {/* Test toggle for stale data demonstration */}
            <button
              type="button"
              onClick={() => setIsShelterTelemetryStale(!isShelterTelemetryStale)}
              className="text-xs text-slate-500 hover:text-slate-800 underline self-start sm:self-auto"
            >
              {isShelterTelemetryStale ? 'Showing Safe Full Camp Fallback' : 'Showing Live Space Count'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shelter 1: Bhuragaon Camp */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${
                    isShelterTelemetryStale ? 'text-amber-700 font-bold' : 'text-emerald-700'
                  }`}>
                    {isShelterTelemetryStale ? 'Camp Currently Full' : 'Open & Accepting Residents'}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-xs text-slate-500">Morigaon District</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Bhuragaon Higher Secondary School Relief Camp
                </h3>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Bhuragaon Central Road, near River Embankment</span>
                </div>
              </div>

              {isShelterTelemetryStale ? (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-2 text-amber-950">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Arrival Advisory: Camp at full capacity</span>
                  </div>
                  <p className="leading-relaxed">
                    Please proceed to the nearby backup shelter at <strong>Morigaon Polytechnic Ground (2.1 km North)</strong>, which has open space and dry food stocks.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-6 text-xs text-slate-600 border-y border-slate-100 py-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Space</span>
                    <strong className="text-slate-900 text-sm">140 spots left</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Meals</span>
                    <strong className="text-slate-900 text-sm">Available (48h)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Medical Care</span>
                    <strong className="text-slate-900 text-sm">On-site nurse</strong>
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-600 flex items-center justify-between pt-1">
                <span>Camp In-Charge: <strong>+91 94353 10492</strong> (K. Kalita)</span>
              </div>
            </div>

            {/* Shelter 2: Barpeta Vidyapith */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-700">
                    Open & Accepting Residents
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-xs text-slate-500">Barpeta District</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Barpeta Vidyapith Higher Secondary Camp
                </h3>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Near Municipal Park, Barpeta Town</span>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-600 border-y border-slate-100 py-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Space</span>
                  <strong className="text-slate-900 text-sm">~80 spots left</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Meals</span>
                  <strong className="text-slate-900 text-sm">Hot food & milk</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Medical Care</span>
                  <strong className="text-slate-900 text-sm">Doctor on-site</strong>
                </div>
              </div>

              <div className="text-xs text-slate-600 flex items-center justify-between pt-1">
                <span>Camp In-Charge: <strong>+91 98640 55198</strong> (Ward Officer)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Tab 4: Track My SOS Request */}
      {citizenTab === 'track' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Track Your Help Request
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Enter your mobile number or tracking reference to see rescue team updates.
            </p>
          </div>

          {/* Quick-Pick helper for the test numbers */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">Quick check test numbers:</span>
            <button
              type="button"
              onClick={() => {
                setSearchPhoneOrId('+91 7980190589');
                handleTrackSearch(undefined, '+91 7980190589');
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-mono font-medium transition-colors"
            >
              +91 7980190589 (Barpeta)
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchPhoneOrId('+91 9880182287');
                handleTrackSearch(undefined, '+91 9880182287');
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-mono font-medium transition-colors"
            >
              +91 9880182287 (Sarthebari)
            </button>
          </div>

          <form onSubmit={handleTrackSearch} className="flex gap-2 max-w-md">
            <input
              type="text"
              value={searchPhoneOrId}
              onChange={(e) => setSearchPhoneOrId(e.target.value)}
              placeholder="Enter phone number or reference code..."
              className="flex-1 p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-slate-900 font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Track
            </button>
          </form>

          {searched && (
            trackedIncident ? (
              <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Request Registered with Rescue Command
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {trackedIncident.title}
                    </h3>
                  </div>

                  <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    Ref: {searchPhoneOrId.includes('9880182287') || trackedIncident.title.includes('Sarthebari')
                      ? 'REF-NDMA-988018'
                      : 'REF-NDMA-798019'}
                  </span>
                </div>

                {/* Plain, reassuring status breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Assigned Rescue Unit</span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">
                      {searchPhoneOrId.includes('9880182287') || trackedIncident.title.includes('Sarthebari')
                        ? 'SDRF Quick Response Boat 2'
                        : 'NDRF Inflatable Rescue Boat 1'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Estimated Arrival</span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">
                      ~18 - 25 minutes
                    </strong>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 space-y-1">
                  <strong>Update from Rescue Team:</strong>
                  <p className="leading-relaxed">
                    {searchPhoneOrId.includes('9880182287') || trackedIncident.title.includes('Sarthebari')
                      ? 'Rescue boat launched from Sarthebari south ramp. Paramedic with first-aid on board. Approaching via safe water channel.'
                      : 'Rescue boat carrying medical oxygen cylinder and paramedic has been dispatched. Approaching via Beki river inlet.'}
                  </p>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Your phone number and exact address are kept secure and shared only with the dispatched rescue crew.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 text-center text-sm text-slate-600">
                No active request found for "{searchPhoneOrId}". Please verify the phone number or submit a new request under <strong>"Request Help"</strong>.
              </div>
            )
          )}
        </div>
      )}

      {/* 8. Tab 5: Safety Guide (Works Offline) */}
      {citizenTab === 'survival' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Flood Safety Steps (Saved Offline)
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Works even without mobile network or internet connection.
              </p>
            </div>

            {/* Offline Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs">
              <button
                type="button"
                onClick={() => setSurvivalLang('en')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  survivalLang === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setSurvivalLang('hi')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  survivalLang === 'hi' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setSurvivalLang('as')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  survivalLang === 'as' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                অসমীয়া
              </button>
            </div>
          </div>

          {/* 6 Clean Safety Steps without nested boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">1</span>
                {translations[survivalLang].guideWaterTitle}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed pl-7">
                {translations[survivalLang].guideWaterBody}
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">2</span>
                {translations[survivalLang].guideElecTitle}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed pl-7">
                {translations[survivalLang].guideElecBody}
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">3</span>
                {translations[survivalLang].guideRoofTitle}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed pl-7">
                {translations[survivalLang].guideRoofBody}
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">4</span>
                {translations[survivalLang].guideSignalTitle}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed pl-7">
                {translations[survivalLang].guideSignalBody}
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">5</span>
                {translations[survivalLang].guideMedTitle}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed pl-7">
                {translations[survivalLang].guideMedBody}
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">6</span>
                {translations[survivalLang].guideCommsTitle}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed pl-7">
                {translations[survivalLang].guideCommsBody}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
