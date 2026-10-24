/**
 * NDMA Disaster Relief Information Fusion Portal
 * Reference: NDMA / State Disaster Management Portals
 * Implements Multi-Source Fusion, 4 Credibility Tiers, Exponential Time-Decay Filter,
 * Vulnerability Triage, Misinformation Quarantine, and Tiered Data Privacy.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  FusedIncident, 
  ReportPacket, 
  StoreForwardMessage 
} from './types/disaster';
import { 
  createInitialDisasterScenario, 
  calculateDecayedReliability, 
  evaluateCredibilityState, 
  computeVulnerabilityScore, 
  computeTriagePriority,
  buildFusedIncident 
} from './services/fusionEngine';
import { LanguageCode, translations } from './services/i18n';
import { Header } from './components/Header';
import { KPIStrip } from './components/KPIStrip';
import { InteractiveMap } from './components/InteractiveMap';
import { FusionFeed } from './components/FusionFeed';
import { TriageConsole } from './components/TriageConsole';
import { MisinformationQuarantine } from './components/MisinformationQuarantine';
import { StoreForwardConsole } from './components/StoreForwardConsole';
import { PrivacyScopeConsole } from './components/PrivacyScopeConsole';
import { ProvenanceInspectorModal } from './components/ProvenanceInspectorModal';
import { SimulateReportModal } from './components/SimulateReportModal';
import { CurveballModal } from './components/CurveballModal';
import { CitizenPortal } from './components/CitizenPortal';
import { OfficialAuthModal } from './components/OfficialAuthModal';

import { 
  Map, 
  Radio, 
  HeartHandshake, 
  ShieldAlert, 
  Layers, 
  Lock,
  Sparkles,
  Info
} from 'lucide-react';

export default function App() {
  const [portalMode, setPortalMode] = useState<'citizen' | 'official'>('citizen');
  const [isOfficialAuthOpen, setIsOfficialAuthOpen] = useState<boolean>(false);
  const [authenticatedOfficer, setAuthenticatedOfficer] = useState<{ name: string; role: string; badgeId: string } | null>(null);
  const [isLowNetwork, setIsLowNetwork] = useState<boolean>(false);

  const [simulatedTime, setSimulatedTime] = useState<number>(() => Date.now());
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [activeTab, setActiveTab] = useState<'map' | 'feed' | 'triage' | 'misinfo' | 'storeforward' | 'privacy'>('map');

  const [incidents, setIncidents] = useState<FusedIncident[]>(() => {
    return createInitialDisasterScenario(Date.now());
  });

  const [selectedIncident, setSelectedIncident] = useState<FusedIncident | null>(null);
  const [inspectedIncidentForProvenance, setInspectedIncidentForProvenance] = useState<FusedIncident | null>(null);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState<boolean>(false);
  const [isCurveballModalOpen, setIsCurveballModalOpen] = useState<boolean>(false);
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');

  const t = translations[language];

  // Tick simulation clock and dynamically recalculate time decay for all incidents
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedTime(prev => {
        const nextTime = prev + 1000 * simSpeed;
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [simSpeed]);

  // Recalculate time decay when simulatedTime changes
  useEffect(() => {
    setIncidents(prevIncidents => {
      return prevIncidents.map(inc => {
        const latestTime = inc.provenanceTrail.reduce(
          (max, p) => (p.timestamp > max ? p.timestamp : max),
          inc.lastUpdatedAt
        );

        const { currentReliability, ageMinutes, freshnessStatus, fallbackInstructions } =
          calculateDecayedReliability(
            inc.baseReliability,
            latestTime,
            simulatedTime,
            inc.decayHalfLifeMin
          );

        // Recompute priority with decayed reliability
        const triagePriorityScore = inc.responderOverride
          ? inc.responderOverride.overriddenScore
          : computeTriagePriority(inc.severityLevel, inc.vulnerabilityScore, currentReliability);

        return {
          ...inc,
          currentReliability,
          ageMinutes,
          freshnessStatus,
          fallbackInstructions,
          triagePriorityScore
        };
      });
    });
  }, [simulatedTime]);

  // Advance time by arbitrary minutes
  const advanceMinutes = (minutes: number) => {
    setSimulatedTime(prev => prev + minutes * 60 * 1000);
  };

  // Reset simulation to baseline
  const resetSimulation = () => {
    const now = Date.now();
    setSimulatedTime(now);
    setSimSpeed(1);
    setIncidents(createInitialDisasterScenario(now));
    setSelectedIncident(null);
  };

  // Handle fresh telemetry ping (resets decay)
  const handleRefreshIncidentPing = (incidentId: string) => {
    setIncidents(prev =>
      prev.map(inc => {
        if (inc.id === incidentId) {
          const freshTime = simulatedTime;
          const updatedPackets = inc.provenanceTrail.map((p, idx) => {
            if (idx === inc.provenanceTrail.length - 1) {
              return { ...p, timestamp: freshTime };
            }
            return p;
          });

          const { currentReliability, ageMinutes, freshnessStatus, fallbackInstructions } =
            calculateDecayedReliability(
              inc.baseReliability,
              freshTime,
              simulatedTime,
              inc.decayHalfLifeMin
            );

          return {
            ...inc,
            lastUpdatedAt: freshTime,
            provenanceTrail: updatedPackets,
            currentReliability,
            ageMinutes,
            freshnessStatus,
            fallbackInstructions
          };
        }
        return inc;
      })
    );
  };

  // Ingest a simulated packet
  const handleIngestNewPacket = (
    packet: ReportPacket,
    targetIncidentId?: string,
    isConflicting?: boolean,
    conflictClaim?: string
  ) => {
    if (targetIncidentId) {
      // Merge into existing cluster
      setIncidents(prev =>
        prev.map(inc => {
          if (inc.id === targetIncidentId) {
            const updatedTrail = [packet, ...inc.provenanceTrail];
            const conflictData = isConflicting
              ? {
                  sourceA: `${inc.provenanceTrail[0]?.reporterName} (${inc.provenanceTrail[0]?.channel})`,
                  claimA: inc.provenanceTrail[0]?.headline || 'Road safe',
                  channelA: inc.provenanceTrail[0]?.channel || 'pwd_official',
                  timestampA: inc.provenanceTrail[0]?.timestamp || simulatedTime,
                  sourceB: `${packet.reporterName} (${packet.channel})`,
                  claimB: conflictClaim || packet.headline,
                  channelB: packet.channel,
                  timestampB: packet.timestamp,
                  conflictDescription: `Disputed field data between ${inc.provenanceTrail[0]?.channel} and ${packet.channel}`,
                  conservativeAction: 'MANDATORY CONSERVATIVE DIRECTIVE: Assume highest hazard state until on-site joint verification.'
                }
              : inc.conflictingReports;

            const { state, baseReliability, corroborationCount } = evaluateCredibilityState(
              updatedTrail,
              conflictData
            );

            const { currentReliability, ageMinutes, freshnessStatus, fallbackInstructions } =
              calculateDecayedReliability(
                baseReliability,
                packet.timestamp,
                simulatedTime,
                inc.decayHalfLifeMin
              );

            const updatedIncident: FusedIncident = {
              ...inc,
              state,
              baseReliability,
              currentReliability,
              lastUpdatedAt: packet.timestamp,
              ageMinutes,
              freshnessStatus,
              fallbackInstructions,
              provenanceTrail: updatedTrail,
              corroborationCount,
              conflictingReports: conflictData
            };

            return updatedIncident;
          }
          return inc;
        })
      );
    } else {
      // Create new isolated incident (starts as unconfirmed unless authorized agent)
      const newInc = buildFusedIncident(
        packet.incidentClusterId,
        `CLUST-${packet.district.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 90 + 10)}`,
        packet.headline,
        packet.category,
        packet.district,
        packet.landmark,
        packet.coordinates,
        [packet],
        null,
        'medium',
        simulatedTime,
        45,
        false
      );

      setIncidents(prev => [newInc, ...prev]);
    }
  };

  // Responder manual override handler
  const handleUpdateIncidentOverride = (
    incidentId: string,
    newScore: number,
    reason: string,
    responderName: string
  ) => {
    setIncidents(prev =>
      prev.map(inc => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            triagePriorityScore: newScore,
            responderOverride: {
              responderId: 'NDRF-OPS-LEAD-01',
              responderName,
              role: 'Field Rescue Commander',
              originalScore: inc.triagePriorityScore,
              overriddenScore: newScore,
              reason,
              timestamp: simulatedTime
            }
          };
        }
        return inc;
      })
    );
  };

  // Misinformation debunk handler
  const handleDebunkAndBroadcast = (incidentId: string, debunkNotice: string) => {
    setIncidents(prev =>
      prev.map(inc => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            isDebunked: true,
            debunkNotice,
            broadcastReachCount: 1420
          };
        }
        return inc;
      })
    );
  };

  // Store-and-forward sync handler
  const handleSyncPacketToIncidents = (msg: StoreForwardMessage) => {
    const packetId = `REP-SYNC-${Math.floor(Math.random() * 9000 + 1000)}`;
    const packet: ReportPacket = {
      id: packetId,
      incidentClusterId: `INC-SF-${Math.floor(Math.random() * 900 + 100)}`,
      timestamp: msg.timestamp,
      channel: msg.channel === 'USSD' ? 'citizen_ussd' : 'citizen_sms',
      reporterName: `Citizen ${msg.phoneNumber.slice(-4)}`,
      reporterRole: 'Stranded Resident',
      isOfficial: false,
      isAuthorizedFieldAgent: false,
      district: 'Morigaon',
      landmark: msg.locationText,
      coordinates: { lat: 26.35, lng: 92.38 },
      category: msg.lastKnownSafeStatus === 'OXYGEN_NEEDED' ? 'medical_oxygen' : 'flood_surge',
      headline: `Store-Forward Sync: ${msg.lastKnownSafeStatus} reported via ${msg.channel}`,
      details: msg.payload,
      rawPayload: JSON.stringify(msg),
      provenanceHash: `0xSF${Math.floor(Math.random() * 90000).toString(16)}`,
      vulnerabilityFactors: {
        needsOxygen: msg.lastKnownSafeStatus === 'OXYGEN_NEEDED',
        isBedridden: msg.lastKnownSafeStatus === 'NEED_RESCUE',
        householdId: msg.householdId
      },
      contactMasked: msg.phoneNumber,
      exactAddress: msg.locationText
    };

    handleIngestNewPacket(packet);
  };

  // Global Supervisor Audit Alert State (Curveball 4: Security Breach Attempt)
  const [globalSupervisorAlert, setGlobalSupervisorAlert] = useState<{
    id: string;
    timestamp: number;
    userId: string;
    userName: string;
    role: string;
    requestedScope: string;
    ipAddress: string;
  } | null>(null);

  // Trigger curveballs from PDF
  const handleTriggerCurveball = (curveballId: string) => {
    // If triggered from citizen view, auto-authenticate officer to inspect the official result
    if (portalMode === 'citizen') {
      setAuthenticatedOfficer({
        name: 'Dr. S. K. Mahanta (Simulation Director)',
        role: 'NDMA Incident Command Lead',
        badgeId: 'NDMA-OPS-SIM-01'
      });
      setPortalMode('official');
    }

    switch (curveballId) {
      case 'bridge_dispute':
        setActiveTab('map');
        const bridgeInc = incidents.find(i => i.id === 'INC-BRIDGE-01');
        if (bridgeInc) setSelectedIncident(bridgeInc);
        break;

      case 'viral_hoax':
        setActiveTab('misinfo');
        break;

      case 'shelter_staleness':
        setActiveTab('feed');
        setSelectedStateFilter('all');
        advanceMinutes(94); // Accelerate time by 94 mins to demonstrate exact 94m freshness decay warning & fallback swap!
        const shelterInc = incidents.find(i => i.id === 'INC-SHELTER-04');
        if (shelterInc) setSelectedIncident(shelterInc);
        break;

      case 'unauthorized_breach':
        setActiveTab('privacy');
        setGlobalSupervisorAlert({
          id: `AUD-SEC-${Math.floor(Math.random() * 9000 + 1000)}`,
          timestamp: Date.now(),
          userId: 'CONTRACTOR-TEMP-88',
          userName: 'Unverified External Contractor',
          role: 'Public Logistics Vendor (Low Auth)',
          requestedScope: 'VULNERABLE_RESIDENTS_FULL_ROSTER_DOWNLOAD',
          ipAddress: '192.168.4.102 (Unsecured WiFi Node)'
        });
        break;

      case 'household_dedup':
        setActiveTab('triage');
        break;

      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col antialiased">
      {/* 1. NDMA Header with Simulation Clock, Speed, and Localization */}
      <Header
        currentSimulatedTime={simulatedTime}
        simSpeed={simSpeed}
        setSimSpeed={setSimSpeed}
        advanceMinutes={advanceMinutes}
        resetSimulation={resetSimulation}
        isOffline={isOffline}
        setIsOffline={setIsOffline}
        isLowNetwork={isLowNetwork}
        setIsLowNetwork={setIsLowNetwork}
        language={language}
        setLanguage={setLanguage}
        portalMode={portalMode}
        onOpenOfficialLogin={() => setIsOfficialAuthOpen(true)}
        onLogoutOfficial={() => {
          setPortalMode('citizen');
          setAuthenticatedOfficer(null);
        }}
        authenticatedOfficer={authenticatedOfficer}
        onOpenIngestModal={() => setIsIngestModalOpen(true)}
        onOpenCurveballModal={() => setIsCurveballModalOpen(true)}
      />

      {/* 2. CITIZEN INTERFACE (Default View) */}
      {portalMode === 'citizen' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
          <CitizenPortal
            incidents={incidents}
            onIngestCitizenReport={(packet) => handleIngestNewPacket(packet)}
            language={language}
            isLowNetwork={isLowNetwork}
            onOpenOfficialLogin={() => setIsOfficialAuthOpen(true)}
          />
        </main>
      ) : (
        /* 3. GOVERNMENT OFFICIAL INTERFACE (Password Protected) */
        <>
          {/* Top Metric KPI Strip with Credibility States & Time-Decay status */}
          <KPIStrip
            incidents={incidents}
            language={language}
            onFilterState={(state) => {
              setSelectedStateFilter(state);
              setActiveTab('feed');
            }}
            selectedStateFilter={selectedStateFilter}
          />

          {/* Security Alert Banner (Curveball 4) */}
          {globalSupervisorAlert && (
            <div className="bg-slate-900 text-white border-b border-rose-500/50 px-4 lg:px-6 py-2.5">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <div>
                    <strong className="text-white">Security Notice: </strong>
                    <span className="text-slate-300">
                      Unauthorized resident roster download attempt was blocked (User: <span className="font-mono text-amber-300">{globalSupervisorAlert.userId}</span>).
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('privacy')}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors"
                  >
                    View in Privacy Console
                  </button>
                  <button
                    onClick={() => setGlobalSupervisorAlert(null)}
                    className="px-3 py-1 bg-white text-slate-900 hover:bg-slate-100 rounded text-xs font-medium transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Official Workspace Navigation Bar */}
          <nav className="bg-white border-b border-slate-200 px-4 lg:px-6 sticky top-[95px] z-30 shadow-2xs">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto py-1.5">
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setActiveTab('map')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    activeTab === 'map'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Map className="w-4 h-4 text-amber-400" />
                  <span>Operations Map</span>
                </button>

                <button
                  onClick={() => setActiveTab('feed')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    activeTab === 'feed'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>Field Reports</span>
                  <span className="text-[11px] font-mono opacity-70">
                    ({incidents.length})
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('triage')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    activeTab === 'triage'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4 text-rose-400" />
                  <span>Rescue Triage</span>
                </button>

                <button
                  onClick={() => setActiveTab('misinfo')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    activeTab === 'misinfo'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  <span>Rumor Control</span>
                  <span className="text-[11px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded font-bold">
                    1
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('storeforward')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    activeTab === 'storeforward'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>Offline Queue</span>
                </button>

                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    activeTab === 'privacy'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Data Privacy</span>
                </button>
              </div>

              {/* Quick Curveball launcher shortcut */}
              <button
                onClick={() => setIsCurveballModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 font-semibold px-2.5 py-1.5 rounded-md transition-colors shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test 5 Scenarios</span>
              </button>
            </div>
          </nav>

          {/* Active Main Content Viewport */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
            {activeTab === 'map' && (
              <InteractiveMap
                incidents={incidents}
                selectedIncident={selectedIncident}
                onSelectIncident={setSelectedIncident}
                language={language}
                onOpenProvenance={(inc) => setInspectedIncidentForProvenance(inc)}
              />
            )}

            {activeTab === 'feed' && (
              <FusionFeed
                incidents={incidents}
                onOpenProvenance={(inc) => setInspectedIncidentForProvenance(inc)}
                onRefreshIncidentPing={handleRefreshIncidentPing}
                language={language}
                selectedStateFilter={selectedStateFilter}
                setSelectedStateFilter={setSelectedStateFilter}
              />
            )}

            {activeTab === 'triage' && (
              <TriageConsole
                incidents={incidents}
                onUpdateIncidentOverride={handleUpdateIncidentOverride}
                language={language}
                onOpenProvenance={(inc) => setInspectedIncidentForProvenance(inc)}
              />
            )}

            {activeTab === 'misinfo' && (
              <MisinformationQuarantine
                incidents={incidents}
                onDebunkAndBroadcast={handleDebunkAndBroadcast}
                language={language}
              />
            )}

            {activeTab === 'storeforward' && (
              <StoreForwardConsole
                language={language}
                onSyncPacketToIncidents={handleSyncPacketToIncidents}
              />
            )}

            {activeTab === 'privacy' && (
              <PrivacyScopeConsole
                incidents={incidents}
                language={language}
              />
            )}
          </main>
        </>
      )}

      {/* 5. Provenance Inspector Modal */}
      <ProvenanceInspectorModal
        incident={inspectedIncidentForProvenance}
        onClose={() => setInspectedIncidentForProvenance(null)}
      />

      {/* 6. Simulate Ingestion Packet Modal */}
      <SimulateReportModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        existingIncidents={incidents}
        onIngestNewPacket={handleIngestNewPacket}
      />

      {/* 7. Challenge 16 Curveball Scenarios Modal */}
      <CurveballModal
        isOpen={isCurveballModalOpen}
        onClose={() => setIsCurveballModalOpen(false)}
        onTriggerCurveball={handleTriggerCurveball}
      />

      {/* 8. Password Protected Government Official Login Modal */}
      <OfficialAuthModal
        isOpen={isOfficialAuthOpen}
        onClose={() => setIsOfficialAuthOpen(false)}
        onSuccessfulLogin={(officerName, role, badgeId) => {
          setAuthenticatedOfficer({ name: officerName, role, badgeId });
          setPortalMode('official');
        }}
        onFailedAttempt={(attemptedId) => {
          console.warn(`Unauthorized login attempt logged for ${attemptedId}`);
        }}
      />

      {/* 8. Official NDMA Footer */}
      <footer className="bg-[#0b2341] text-white border-t border-[#1b3a60] py-6 px-4 lg:px-6 text-xs mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-bold text-amber-400">
              National Disaster Management Authority (NDMA) · NDMA Bhawan, A-1, Safdarjung Enclave, New Delhi
            </div>
            <div className="text-slate-400 text-[11px]">
              Multi-Source Data Fusion Engine compliant with Common Alerting Protocol (CAP) & NDMA SOP 2026.
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px] font-mono">
            <span>Server: AS-EAST-01</span>
            <span>·</span>
            <span>Latency: Realtime Node</span>
            <span>·</span>
            <span className="text-emerald-400 font-semibold">Triage Algorithm Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
