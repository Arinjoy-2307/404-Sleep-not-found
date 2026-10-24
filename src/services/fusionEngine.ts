/**
 * NDMA Disaster Information Fusion Engine
 * Implements:
 * 1. Multi-source report ingestion & provenance tracking
 * 2. 4-tier credibility state machine (unconfirmed, corroborated, verified, disputed)
 * 3. Exponential time-decay filter for reliability scores
 * 4. Stale data detection & automated fallback instructions
 * 5. Vulnerability-weighted triage priority computation
 * 6. Multi-channel deduplication with "urgent is never lost" guarantee
 */

import {
  CredibilityState,
  FusedIncident,
  ReportPacket,
  SourceChannel,
  VulnerabilityFactors,
  ConflictingReportData,
  RescueAsset,
  MultimodalAlert,
  MisinformationItem
} from '../types/disaster';

/**
 * Calculates time-decayed reliability score.
 * Formula: R(t) = R_0 * (0.5) ^ (deltaMinutes / halfLifeMinutes)
 */
export function calculateDecayedReliability(
  baseReliability: number,
  lastUpdatedMs: number,
  currentSimulatedTimeMs: number,
  halfLifeMinutes: number = 45
): {
  currentReliability: number;
  ageMinutes: number;
  freshnessStatus: 'fresh' | 'aging' | 'stale';
  fallbackInstructions: string;
} {
  const deltaMs = Math.max(0, currentSimulatedTimeMs - lastUpdatedMs);
  const ageMinutes = Math.floor(deltaMs / (60 * 1000));
  
  // Exponential half-life decay
  const decayFactor = Math.pow(0.5, ageMinutes / Math.max(1, halfLifeMinutes));
  const currentReliability = Math.max(5, Math.round(baseReliability * decayFactor));

  let freshnessStatus: 'fresh' | 'aging' | 'stale' = 'fresh';
  let fallbackInstructions = 'Reliable real-time field data. Standard operational protocol applies.';

  if (ageMinutes >= halfLifeMinutes * 1.5 || currentReliability < 45) {
    freshnessStatus = 'stale';
    fallbackInstructions = `FRESHNESS WARNING: Updated ${ageMinutes} minutes ago — Telemetry Stale (Reliability degraded to ${currentReliability}%). LIVE TRACKING SWAPPED FOR OFFLINE SAFETY FALLBACK: 1. Assume shelter is at 100% full capacity; do not redirect large evacuation convoys without physical radio verification. 2. Direct stranded evacuees to fallback high ground at Morigaon Polytechnic (2.1 km North). 3. Hand-cranked emergency VHF frequency 144.250 MHz is open for spotters.`;
  } else if (ageMinutes >= halfLifeMinutes * 0.75 || currentReliability < 70) {
    freshnessStatus = 'aging';
    fallbackInstructions = `CAUTION: Report has aged ${ageMinutes}m without fresh update. Prepare secondary verification if conducting high-risk water rescue.`;
  }

  return {
    currentReliability,
    ageMinutes,
    freshnessStatus,
    fallbackInstructions
  };
}

/**
 * Evaluates the Credibility State based on incoming report packets and conflicts.
 */
export function evaluateCredibilityState(
  packets: ReportPacket[],
  conflictData?: ConflictingReportData | null
): {
  state: CredibilityState;
  baseReliability: number;
  corroborationCount: number;
} {
  // If contradictory reports from official/authoritative agencies exist -> Disputed
  if (conflictData) {
    return {
      state: 'disputed',
      baseReliability: 45, // Penalized due to contradiction
      corroborationCount: packets.length
    };
  }

  const hasOfficialOrAuthorized = packets.some(
    p => p.isAuthorizedFieldAgent || p.isOfficial
  );

  if (hasOfficialOrAuthorized) {
    return {
      state: 'verified',
      baseReliability: 96,
      corroborationCount: packets.length
    };
  }

  // Count distinct sources / reporter channels
  const distinctSources = new Set(packets.map(p => `${p.channel}_${p.reporterName}`)).size;
  if (packets.length >= 2 || distinctSources >= 2) {
    return {
      state: 'corroborated',
      baseReliability: 82,
      corroborationCount: packets.length
    };
  }

  // Single isolated citizen report
  return {
    state: 'unconfirmed',
    baseReliability: 58,
    corroborationCount: 1
  };
}

/**
 * Computes vulnerability-weighted score (0 to 100)
 */
export function computeVulnerabilityScore(factors?: VulnerabilityFactors): number {
  if (!factors) return 20;
  let score = 20;

  if (factors.needsOxygen) score += 40;
  if (factors.isBedridden) score += 25;
  if (factors.isElderlyAlone) score += 15;
  if (factors.infantsPresent) score += 15;
  if (factors.mobilityImpaired) score += 10;
  if (factors.trappedFloor === 'Ground Floor' || (factors.waterLevelFeet && factors.waterLevelFeet >= 5)) {
    score += 15;
  }

  return Math.min(100, score);
}

/**
 * Computes triage priority score with explainable formula:
 * Triage Priority = (Severity * 0.40) + (Vulnerability * 0.35) + (Reliability/Freshness * 0.25)
 */
export function computeTriagePriority(
  severityLevel: 'low' | 'medium' | 'high' | 'critical',
  vulnerabilityScore: number,
  reliabilityScore: number
): number {
  const severityMap = {
    low: 25,
    medium: 55,
    high: 80,
    critical: 100
  };

  const severityVal = severityMap[severityLevel];
  const calculated = Math.round(
    severityVal * 0.4 + vulnerabilityScore * 0.35 + reliabilityScore * 0.25
  );

  return Math.min(100, Math.max(10, calculated));
}

/**
 * Generates a mock cryptographic provenance hash for inspection
 */
export function generateProvenanceHash(packetId: string, timestamp: number, channel: SourceChannel): string {
  const raw = `${packetId}:${timestamp}:${channel}:NDMA_KEY_2026`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return `0x${Math.abs(hash).toString(16).padStart(8, '0').toUpperCase()}e4f7`;
}

/**
 * Initial Seeds simulating the flood scenario across 4 districts:
 * - Kamrup (Barpeta / Guwahati / Hajo)
 * - Barpeta (Beki river breach)
 * - Morigaon (Kapili river surge)
 * - Cachar (Silchar Barak valley)
 */
export function createInitialDisasterScenario(nowMs: number): FusedIncident[] {
  // Incident 1: Disputed Bridge Report (PWD vs SDRF Patrol)
  const inc1TimeA = nowMs - 22 * 60 * 1000;
  const inc1TimeB = nowMs - 14 * 60 * 1000;
  const inc1Packets: ReportPacket[] = [
    {
      id: 'REP-PWD-7701',
      incidentClusterId: 'INC-BRIDGE-01',
      timestamp: inc1TimeA,
      channel: 'pwd_official',
      reporterName: 'Er. R. Sharma',
      reporterRole: 'PWD Highway Div. Executive Engineer',
      isOfficial: true,
      isAuthorizedFieldAgent: false,
      district: 'Kamrup',
      landmark: 'NH-27 Hajo-Sualkuchi RCC Bridge over Puthimari River',
      coordinates: { lat: 26.2415, lng: 91.5302 },
      category: 'bridge_collapse',
      headline: 'PWD Notice: NH-27 Puthimari Bridge structurally sound, lane 1 open for emergency vehicles',
      details: 'Visual inspection conducted at 10:30 AM indicates minor abutment scour. Heavy trucks restricted; 2-axle relief trucks permitted.',
      rawPayload: '{"agency":"PWD_ASSAM","bridge_id":"NH27-BR-09","status":"PASSABLE_LIGHT_HEAVY_RESTRICTED"}',
      provenanceHash: generateProvenanceHash('REP-PWD-7701', inc1TimeA, 'pwd_official'),
      contactMasked: '+91 94350 *****',
      exactAddress: 'Milepost 42, NH-27 Corridor, Kamrup Rural'
    },
    {
      id: 'REP-SDRF-8820',
      incidentClusterId: 'INC-BRIDGE-01',
      timestamp: inc1TimeB,
      channel: 'sdrf_radio',
      reporterName: 'Insp. T. Gogoi',
      reporterRole: 'SDRF Quick Response Boat Unit 03',
      isOfficial: true,
      isAuthorizedFieldAgent: true,
      district: 'Kamrup',
      landmark: 'NH-27 Hajo-Sualkuchi RCC Bridge over Puthimari River',
      coordinates: { lat: 26.2415, lng: 91.5302 },
      category: 'bridge_collapse',
      headline: 'SDRF Alert: Pier 3 foundation eroded by turbulent surge, approach road crumbling',
      details: 'Water velocity exceeding 4.2 m/s. Approach slab sinking. Extreme collapse danger. All relief convoys must halt immediately.',
      rawPayload: '{"sdrf_patrol":"UNIT_03","gps":"26.2415,91.5302","action":"ORDER_TOTAL_CLOSURE"}',
      provenanceHash: generateProvenanceHash('REP-SDRF-8820', inc1TimeB, 'sdrf_radio'),
      contactMasked: '+91 98640 *****',
      exactAddress: 'Milepost 42, NH-27 Corridor, Kamrup Rural'
    }
  ];

  const conflict1: ConflictingReportData = {
    sourceA: 'State PWD Highway Division (Er. R. Sharma)',
    claimA: 'Bridge open for emergency convoys & light relief vehicles',
    channelA: 'pwd_official',
    timestampA: inc1TimeA,
    sourceB: 'SDRF Patrol Unit 03 (Insp. T. Gogoi)',
    claimB: 'Pier 3 undermined, immediate collapse risk, total closure required',
    channelB: 'sdrf_radio',
    timestampB: inc1TimeB,
    conflictDescription: 'Contradictory official safety declarations regarding key logistics artery NH-27 Puthimari River Bridge.',
    conservativeAction: 'MANDATORY CONSERVATIVE ROUTING: Classify as HIGH RISK DISPUTED. Divert all boat and truck relief traffic via State Highway 12 Bypass (+18 km). Field verification engineer dispatched.'
  };

  // Incident 2: High Vulnerability Household with multi-channel deduplication ("urgent is never lost")
  // Bedridden resident needing oxygen reported via Web, Neighbor SMS, and Field Agent
  const inc2TimeA = nowMs - 55 * 60 * 1000;
  const inc2TimeB = nowMs - 40 * 60 * 1000;
  const inc2TimeC = nowMs - 18 * 60 * 1000;
  const inc2Packets: ReportPacket[] = [
    {
      id: 'REP-CIT-1021',
      incidentClusterId: 'INC-OXYGEN-02',
      timestamp: inc2TimeA,
      channel: 'citizen_web',
      reporterName: 'Bikash Das (Son)',
      reporterRole: 'Family Member',
      isOfficial: false,
      isAuthorizedFieldAgent: false,
      district: 'Barpeta',
      landmark: 'Near Milan Nagar Namghar, Ward 5, Barpeta Town',
      coordinates: { lat: 26.3211, lng: 91.0065 },
      category: 'medical_oxygen',
      headline: 'Emergency Oxygen & High-Water Evacuation (Ref: REF-NDMA-798019)',
      details: 'Father (age 78) is COPD patient on continuous oxygen. Power cut 6 hours ago. Backup cylinder remaining: 1.5 hours. Ground floor submerged. Registered Contact: +91 7980190589 (Logged Ref: REF-NDMA-798019).',
      rawPayload: '{"household_id":"HSH-BAR-892","reference_no":"REF-NDMA-798019","phone":"+91 7980190589","patient":"Elderly COPD","urgency":"CRITICAL_OXYGEN","alerts_dispatched":["SMS_CELL_BROADCAST","IVR_VOICE_CALL","PICTOGRAPH_LOCKSCREEN","DEBUNK_VERIFIED"]}',
      provenanceHash: generateProvenanceHash('REP-CIT-1021', inc2TimeA, 'citizen_web'),
      vulnerabilityFactors: {
        isBedridden: true,
        needsOxygen: true,
        trappedFloor: 'Ground Floor',
        waterLevelFeet: 4.5,
        householdId: 'HSH-BAR-892'
      },
      contactMasked: '+91 7980190589 (Ref: REF-NDMA-798019)',
      exactAddress: 'House #44B, Namghar Path, Milan Nagar, Barpeta (Ref: REF-NDMA-798019)'
    },
    {
      id: 'REP-SMS-3092',
      incidentClusterId: 'INC-OXYGEN-02',
      timestamp: inc2TimeB,
      channel: 'citizen_sms',
      reporterName: 'Neighbor (Pranab Saikia)',
      reporterRole: 'Neighbor / Community Volunteer',
      isOfficial: false,
      isAuthorizedFieldAgent: false,
      district: 'Barpeta',
      landmark: 'Milan Nagar Namghar, Ward 5',
      coordinates: { lat: 26.3211, lng: 91.0065 },
      category: 'medical_oxygen',
      headline: 'SMS: Water reached veranda at Das residence, patient inside cannot move',
      details: 'We tried moving him to boat but he has heavy oxygen machine. Need NDRF rescue boat with medical support ASAP.',
      rawPayload: 'SMS +919401298***: "Water in Milan Nagar Das bari. Patient cannot walk oxygen ending. send boat fast"',
      provenanceHash: generateProvenanceHash('REP-SMS-3092', inc2TimeB, 'citizen_sms'),
      vulnerabilityFactors: {
        isBedridden: true,
        needsOxygen: true,
        householdId: 'HSH-BAR-892'
      },
      contactMasked: '+91 94012 *****',
      exactAddress: 'House #44B, Namghar Path, Milan Nagar, Barpeta'
    },
    {
      id: 'REP-NDRF-4109',
      incidentClusterId: 'INC-OXYGEN-02',
      timestamp: inc2TimeC,
      channel: 'ndrf_agent',
      reporterName: 'Sub-Inspector M. K. Roy',
      reporterRole: 'NDRF 1st Battalion Field Triage Officer',
      isOfficial: true,
      isAuthorizedFieldAgent: true,
      district: 'Barpeta',
      landmark: 'Milan Nagar Namghar, Ward 5',
      coordinates: { lat: 26.3211, lng: 91.0065 },
      category: 'medical_oxygen',
      headline: 'NDRF Field Check: Confirmed bedridden patient, 1x Type D cylinder required',
      details: 'Assigned Rescue Inflatable Boat (RIB-01) with paramedic. Current water depth 4.8ft with gentle current. Priority Alpha. Dispatch alerts transmitted to +91 7980190589.',
      rawPayload: '{"ndrf_team":"BN01_COY_B","status":"ON_ROUTE","eta_min":18,"target_phone":"+91 7980190589"}',
      provenanceHash: generateProvenanceHash('REP-NDRF-4109', inc2TimeC, 'ndrf_agent'),
      vulnerabilityFactors: {
        isBedridden: true,
        needsOxygen: true,
        isElderlyAlone: false,
        trappedFloor: 'Ground Floor',
        householdId: 'HSH-BAR-892'
      },
      contactMasked: '+91 94351 *****',
      exactAddress: 'House #44B, Namghar Path, Milan Nagar, Barpeta'
    }
  ];

  // Incident 3: Viral Fake Evacuation Order (Misinformation Detection & Quarantine)
  const inc3Time = nowMs - 12 * 60 * 1000;
  const inc3Packets: ReportPacket[] = [
    {
      id: 'REP-SOC-9901',
      incidentClusterId: 'INC-VIRAL-03',
      timestamp: inc3Time,
      channel: 'citizen_sms',
      reporterName: 'Forwarded SMS / Voice Note Burst',
      reporterRole: 'Unverified Citizen Network',
      isOfficial: false,
      isAuthorizedFieldAgent: false,
      district: 'Morigaon',
      landmark: 'Khandajan Sluice Gate & Brahmaputra Dyke',
      coordinates: { lat: 26.2592, lng: 92.3418 },
      category: 'evacuation_order',
      headline: 'VIRAL HOAX: "Khandajan sluice collapsed! 20ft flood wave incoming in 30 mins, evacuate all Morigaon town immediately!"',
      details: 'Audio recording falsely imitating District Disaster Management Authority (DDMA) officer voice circulating over WhatsApp/SMS, triggering panic stampedes at fuel stations.',
      rawPayload: 'AUDIO_TRANSCRIPT: "URGENT DDMA NOTICE dam gates broken 20ft wave coming move to hills now"',
      provenanceHash: generateProvenanceHash('REP-SOC-9901', inc3Time, 'citizen_sms'),
      contactMasked: '+91 98540 *****',
      exactAddress: 'Morigaon Town & Dyke Periphery'
    }
  ];

  // Incident 4: Shelter Capacity Data with Time Decay (Staleness testing)
  // Reported 75 minutes ago -> High time decay, demonstrates fallback instructions!
  const inc4Time = nowMs - 78 * 60 * 1000;
  const inc4Packets: ReportPacket[] = [
    {
      id: 'REP-ADM-5542',
      incidentClusterId: 'INC-SHELTER-04',
      timestamp: inc4Time,
      channel: 'district_magistrate',
      reporterName: 'Relief Camp In-charge K. Kalita',
      reporterRole: 'Block Development Office Staff',
      isOfficial: true,
      isAuthorizedFieldAgent: false,
      district: 'Morigaon',
      landmark: 'Bhuragaon Higher Secondary School Relief Camp',
      coordinates: { lat: 26.3541, lng: 92.4109 },
      category: 'shelter_capacity',
      headline: 'Bhuragaon Higher Secondary Camp reports 210/350 capacity utilized',
      details: 'Dry ration stocks remaining for 48 hours. Medical dispensary operational. Solar power inverter functioning.',
      rawPayload: '{"shelter_code":"SHELTER-MOR-04","capacity":350,"occupied":210,"food_hours":48}',
      provenanceHash: generateProvenanceHash('REP-ADM-5542', inc4Time, 'district_magistrate'),
      contactMasked: '+91 94353 *****',
      exactAddress: 'Bhuragaon Central Road, Morigaon District'
    }
  ];

  // Incident 5: Unconfirmed Isolated Citizen Report (Flood Breach)
  const inc5Time = nowMs - 5 * 60 * 1000;
  const inc5Packets: ReportPacket[] = [
    {
      id: 'REP-USSD-6019',
      incidentClusterId: 'INC-CIT-05',
      timestamp: inc5Time,
      channel: 'citizen_ussd',
      reporterName: 'Anil Boro',
      reporterRole: 'Farmer / Villager',
      isOfficial: false,
      isAuthorizedFieldAgent: false,
      district: 'Cachar',
      landmark: 'Sonai Block, Near Madhura River Bund',
      coordinates: { lat: 24.7891, lng: 92.8943 },
      category: 'flood_surge',
      headline: 'Isolated USSD: Seepage spotted at Madhura earthen bund embankment',
      details: 'Water seeping through base of mud bund over 20m stretch. No SDRF personnel present on embankment.',
      rawPayload: '*1070#_USSD_SUBMIT: "BUND_LEAK_SONAI_MADHURA_20M"',
      provenanceHash: generateProvenanceHash('REP-USSD-6019', inc5Time, 'citizen_ussd'),
      vulnerabilityFactors: {
        isElderlyAlone: false,
        trappedFloor: 'Ground Floor'
      },
      contactMasked: '+91 99541 *****',
      exactAddress: 'Vill. Madhuramukh, Sonai Circle, Cachar'
    }
  ];

  // Incident 6: Corroborated Road Cut (Multiple independent citizen & transporter reports)
  const inc6TimeA = nowMs - 34 * 60 * 1000;
  const inc6TimeB = nowMs - 28 * 60 * 1000;
  const inc6Packets: ReportPacket[] = [
    {
      id: 'REP-CIT-6101',
      incidentClusterId: 'INC-ROAD-06',
      timestamp: inc6TimeA,
      channel: 'citizen_sms',
      reporterName: 'Dipen Roy',
      reporterRole: 'Relief Truck Driver',
      isOfficial: false,
      isAuthorizedFieldAgent: false,
      district: 'Barpeta',
      landmark: 'State Highway 9 near Sarthebari Bell-Metal Cluster',
      coordinates: { lat: 26.3789, lng: 91.0821 },
      category: 'road_cut',
      headline: 'SH-9 severed by 30-meter culvert washout at Sarthebari junction',
      details: 'Fast water rushing over road. 12 trucks halted. Culvert pipes washed away completely.',
      rawPayload: '{"road":"SH9","km_stone":"18","depth_ft":3.5,"status":"SEVERED"}',
      provenanceHash: generateProvenanceHash('REP-CIT-6101', inc6TimeA, 'citizen_sms'),
      contactMasked: '+91 97063 *****',
      exactAddress: 'SH-9 KM 18, Sarthebari, Barpeta'
    },
    {
      id: 'REP-WEB-6102',
      incidentClusterId: 'INC-ROAD-06',
      timestamp: inc6TimeB,
      channel: 'citizen_web',
      reporterName: 'Meera Kalita',
      reporterRole: 'Local Panchayat Member',
      isOfficial: false,
      isAuthorizedFieldAgent: false,
      district: 'Barpeta',
      landmark: 'State Highway 9 near Sarthebari Bell-Metal Cluster',
      coordinates: { lat: 26.3789, lng: 91.0821 },
      category: 'road_cut',
      headline: 'Panchayat report: Culvert failure on Sarthebari highway isolating 3 villages',
      details: 'Villagers cannot reach health center. Needs temporary Bailey bridge or SDRF inflatable raft shuttle.',
      rawPayload: '{"ward":"GP_SARTHEBARI","culvert_damage":true,"stranded_villagers":450}',
      provenanceHash: generateProvenanceHash('REP-WEB-6102', inc6TimeB, 'citizen_web'),
      contactMasked: '+91 98642 *****',
      exactAddress: 'SH-9 KM 18, Sarthebari, Barpeta'
    },
    {
      id: 'REP-CIT-7822',
      incidentClusterId: 'INC-ROAD-06',
      timestamp: inc6TimeB + 4 * 60 * 1000,
      channel: 'citizen_web',
      reporterName: 'Sunita Sarma',
      reporterRole: 'Stranded Resident / Affected Family',
      isOfficial: false,
      isAuthorizedFieldAgent: false,
      district: 'Barpeta',
      landmark: 'State Highway 9 near Sarthebari Bell-Metal Cluster',
      coordinates: { lat: 26.3789, lng: 91.0821 },
      category: 'road_cut',
      headline: 'Elderly family stranded near severed culvert (Ref: REF-NDMA-988018)',
      details: 'Family with elderly grandmother stranded at Sarthebari bridge washout. Water approaching porch. Registered contact: +91 9880182287 (Logged Ref: REF-NDMA-988018). Inflatable rescue boat dispatched.',
      rawPayload: '{"household_id":"HSH-SAR-411","reference_no":"REF-NDMA-988018","phone":"+91 9880182287","elderly_present":true,"status":"STRANDED_HIGH_WATER","alerts_dispatched":["SMS_CELL_BROADCAST","IVR_VOICE_CALL","PICTOGRAPH_LOCKSCREEN","DEBUNK_VERIFIED"]}',
      provenanceHash: generateProvenanceHash('REP-CIT-7822', inc6TimeB + 4 * 60 * 1000, 'citizen_web'),
      vulnerabilityFactors: {
        isElderlyAlone: true,
        waterLevelFeet: 3.5,
        trappedFloor: 'Ground Floor',
        householdId: 'HSH-SAR-411'
      },
      contactMasked: '+91 9880182287 (Ref: REF-NDMA-988018)',
      exactAddress: 'Near Sarthebari SH-9 KM 18, Barpeta (Ref: REF-NDMA-988018)'
    }
  ];

  // Build the FusedIncidents array
  const incidents: FusedIncident[] = [
    // 1. Disputed Bridge
    buildFusedIncident(
      'INC-BRIDGE-01',
      'CLUST-KAM-01',
      'NH-27 Puthimari River Bridge Passability Contradiction',
      'bridge_collapse',
      'Kamrup',
      'NH-27 Hajo-Sualkuchi RCC Bridge over Puthimari River',
      { lat: 26.2415, lng: 91.5302 },
      inc1Packets,
      conflict1,
      'high',
      nowMs,
      45,
      false
    ),

    // 2. High Vulnerability Bedridden Oxygen Patient (Verified & Corroborated)
    buildFusedIncident(
      'INC-OXYGEN-02',
      'CLUST-BAR-02',
      'Emergency Oxygen & High-Water Evacuation (Das Residence)',
      'medical_oxygen',
      'Barpeta',
      'Near Milan Nagar Namghar, Ward 5, Barpeta Town',
      { lat: 26.3211, lng: 91.0065 },
      inc2Packets,
      null,
      'critical',
      nowMs,
      60,
      false
    ),

    // 3. Viral Evacuation Hoax (Misinformation & Quarantined)
    buildFusedIncident(
      'INC-VIRAL-03',
      'CLUST-MOR-03',
      'Dissemination of Fabricated Khandajan Sluice Collapse Evacuation Order',
      'evacuation_order',
      'Morigaon',
      'Khandajan Sluice Gate & Brahmaputra Dyke',
      { lat: 26.2592, lng: 92.3418 },
      inc3Packets,
      null,
      'high',
      nowMs,
      30,
      true, // isQuarantined
      'Automated NLP detector flagged unverified catastrophic claim claiming official status without HMAC signature or District Collectorate broadcast hash.',
      false, // isDebunked
      undefined,
      1420 // reach count
    ),

    // 4. Stale Shelter Capacity (Decayed reliability)
    buildFusedIncident(
      'INC-SHELTER-04',
      'CLUST-MOR-04',
      'Relief Camp Capacity & Ration Tracking (Bhuragaon HS School)',
      'shelter_capacity',
      'Morigaon',
      'Bhuragaon Higher Secondary School Relief Camp',
      { lat: 26.3541, lng: 92.4109 },
      inc4Packets,
      null,
      'medium',
      nowMs,
      40,
      false,
      undefined,
      false,
      undefined,
      undefined,
      {
        total: 350,
        occupied: 210,
        availableFoodHours: 48,
        cleanWaterAvailable: true
      }
    ),

    // 5. Unconfirmed Isolated USSD Citizen Report
    buildFusedIncident(
      'INC-CIT-05',
      'CLUST-CAC-05',
      'Potential Embankment Seepage Alert at Madhura Bund',
      'flood_surge',
      'Cachar',
      'Sonai Block, Near Madhura River Bund',
      { lat: 24.7891, lng: 92.8943 },
      inc5Packets,
      null,
      'medium',
      nowMs,
      60,
      false
    ),

    // 6. Corroborated Road Cut (2 reports)
    buildFusedIncident(
      'INC-ROAD-06',
      'CLUST-BAR-06',
      'State Highway 9 Culvert Breach at Sarthebari',
      'road_cut',
      'Barpeta',
      'State Highway 9 near Sarthebari Bell-Metal Cluster',
      { lat: 26.3789, lng: 91.0821 },
      inc6Packets,
      null,
      'high',
      nowMs,
      50,
      false
    )
  ];

  return incidents;
}

/**
 * Helper to build and compute FusedIncident fields
 */
export function buildFusedIncident(
  id: string,
  clusterCode: string,
  title: string,
  category: any,
  district: any,
  landmark: string,
  coordinates: { lat: number; lng: number },
  packets: ReportPacket[],
  conflictData: ConflictingReportData | null = null,
  severityLevel: 'low' | 'medium' | 'high' | 'critical',
  simulatedTimeMs: number,
  decayHalfLifeMin: number = 45,
  isQuarantined: boolean = false,
  quarantineReason?: string,
  isDebunked: boolean = false,
  debunkNotice?: string,
  broadcastReachCount?: number,
  shelterCapacity?: any
): FusedIncident {
  const latestTimestamp = packets.reduce(
    (max, p) => (p.timestamp > max ? p.timestamp : max),
    packets[0]?.timestamp || simulatedTimeMs
  );

  const { state, baseReliability, corroborationCount } = evaluateCredibilityState(packets, conflictData);

  const { currentReliability, ageMinutes, freshnessStatus, fallbackInstructions } =
    calculateDecayedReliability(baseReliability, latestTimestamp, simulatedTimeMs, decayHalfLifeMin);

  // Aggregate vulnerability factors
  const combinedFactors: VulnerabilityFactors = {};
  for (const p of packets) {
    if (p.vulnerabilityFactors) {
      if (p.vulnerabilityFactors.isBedridden) combinedFactors.isBedridden = true;
      if (p.vulnerabilityFactors.needsOxygen) combinedFactors.needsOxygen = true;
      if (p.vulnerabilityFactors.isElderlyAlone) combinedFactors.isElderlyAlone = true;
      if (p.vulnerabilityFactors.infantsPresent) combinedFactors.infantsPresent = true;
      if (p.vulnerabilityFactors.mobilityImpaired) combinedFactors.mobilityImpaired = true;
      if (p.vulnerabilityFactors.trappedFloor) combinedFactors.trappedFloor = p.vulnerabilityFactors.trappedFloor;
      if (p.vulnerabilityFactors.waterLevelFeet) {
        combinedFactors.waterLevelFeet = Math.max(
          combinedFactors.waterLevelFeet || 0,
          p.vulnerabilityFactors.waterLevelFeet
        );
      }
    }
  }

  const vulnerabilityScore = computeVulnerabilityScore(combinedFactors);
  const triagePriorityScore = computeTriagePriority(severityLevel, vulnerabilityScore, currentReliability);

  return {
    id,
    clusterCode,
    title,
    category,
    district,
    landmark,
    coordinates,
    state,
    baseReliability,
    currentReliability,
    decayHalfLifeMin,
    lastUpdatedAt: latestTimestamp,
    ageMinutes,
    freshnessStatus,
    fallbackInstructions,
    provenanceTrail: packets,
    corroborationCount,
    conflictingReports: conflictData,
    severityLevel,
    vulnerabilityScore,
    triagePriorityScore,
    isQuarantined,
    quarantineReason,
    isDebunked,
    debunkNotice,
    broadcastReachCount,
    shelterCapacity
  };
}

/**
 * Finite Rescue Assets (4 Inflatable Rescue Boats, 2 High-Clearance Amphibious Trucks)
 */
export const initialRescueAssets: RescueAsset[] = [
  {
    id: 'BOAT-RIB-01',
    name: 'NDRF Inflatable Rescue Boat 01 (RIB-Alpha)',
    type: 'rescue_boat',
    status: 'dispatched',
    capacityPersons: 8,
    hasOxygenSupply: true,
    assignedIncidentId: 'INC-OXYGEN-02',
    assignedIncidentTitle: 'Emergency Oxygen & High-Water Evacuation (Das Residence)',
    assignedDistrict: 'Barpeta',
    etaMinutes: 18,
    constrainedRouteNote: 'Direct water channel access via Beki river inlet'
  },
  {
    id: 'BOAT-RIB-02',
    name: 'SDRF Quick Response Boat 02 (RIB-Bravo)',
    type: 'rescue_boat',
    status: 'dispatched',
    capacityPersons: 6,
    hasOxygenSupply: false,
    assignedIncidentId: 'INC-ROAD-06',
    assignedIncidentTitle: 'SH-9 Culvert Breach at Sarthebari',
    assignedDistrict: 'Barpeta',
    etaMinutes: 24,
    constrainedRouteNote: 'Road severed; launching from Sarthebari south boat ramp'
  },
  {
    id: 'BOAT-RIB-03',
    name: 'NDRF Inflatable Rescue Boat 03 (RIB-Charlie)',
    type: 'rescue_boat',
    status: 'available',
    capacityPersons: 8,
    hasOxygenSupply: true,
    assignedIncidentId: null,
    assignedDistrict: 'Morigaon',
    etaMinutes: 0
  },
  {
    id: 'BOAT-RIB-04',
    name: 'District Flood Relief Boat 04 (RIB-Delta)',
    type: 'rescue_boat',
    status: 'available',
    capacityPersons: 6,
    hasOxygenSupply: false,
    assignedIncidentId: null,
    assignedDistrict: 'Cachar',
    etaMinutes: 0
  },
  {
    id: 'TRUCK-SDRF-01',
    name: 'SDRF 4x4 High-Clearance Amphibious Transport 01',
    type: 'amphibious_truck',
    status: 'dispatched',
    capacityPersons: 18,
    hasOxygenSupply: false,
    assignedIncidentId: 'INC-BRIDGE-01',
    assignedIncidentTitle: 'NH-27 Bridge Closure Recon',
    assignedDistrict: 'Kamrup',
    etaMinutes: 32,
    constrainedRouteNote: 'DIVERTED: NH-27 bridge blocked; routed via SH-12 bypass (+18 km)'
  },
  {
    id: 'TRUCK-SDRF-02',
    name: 'SDRF 4x4 High-Clearance Amphibious Transport 02',
    type: 'amphibious_truck',
    status: 'available',
    capacityPersons: 18,
    hasOxygenSupply: false,
    assignedIncidentId: null,
    assignedDistrict: 'Barpeta',
    etaMinutes: 0
  }
];

/**
 * Re-triages finite rescue assets deterministically whenever incident priorities or overrides change.
 */
export function reallocateRescueAssets(
  incidents: FusedIncident[],
  currentAssets: RescueAsset[]
): RescueAsset[] {
  // Sort incidents by priority descending
  const sortedIncidents = [...incidents]
    .filter(i => i.category === 'medical_oxygen' || i.category === 'flood_surge' || i.category === 'road_cut')
    .sort((a, b) => b.triagePriorityScore - a.triagePriorityScore);

  const updatedAssets = [...currentAssets];
  let incidentIndex = 0;

  for (let i = 0; i < updatedAssets.length; i++) {
    if (updatedAssets[i].status === 'maintenance') continue;

    if (incidentIndex < sortedIncidents.length) {
      const inc = sortedIncidents[incidentIndex];
      updatedAssets[i] = {
        ...updatedAssets[i],
        status: 'dispatched',
        assignedIncidentId: inc.id,
        assignedIncidentTitle: inc.title,
        assignedDistrict: inc.district,
        etaMinutes: Math.max(12, 10 + (incidentIndex * 6)),
        constrainedRouteNote: inc.district === 'Kamrup' 
          ? 'DIVERTED: NH-27 bridge disputed; routed via SH-12 bypass (+18 km)'
          : `Navigating via ${inc.landmark} access channel`
      };
      incidentIndex++;
    } else {
      updatedAssets[i] = {
        ...updatedAssets[i],
        status: 'available',
        assignedIncidentId: null,
        assignedIncidentTitle: undefined,
        etaMinutes: 0,
        constrainedRouteNote: undefined
      };
    }
  }

  return updatedAssets;
}

/**
 * Initial Seeds for Multimodal Polygon Alerts
 */
export const initialMultimodalAlerts: MultimodalAlert[] = [
  {
    id: 'CAP-POLY-BARPETA-01',
    polygonId: 'POLY-BAR-LOWLAND',
    polygonName: 'Barpeta Lowlands & Beki Basin (Ward 4-7)',
    polygonCoords: [
      { x: 75, y: 110 },
      { x: 190, y: 105 },
      { x: 210, y: 220 },
      { x: 90, y: 200 }
    ],
    severity: 'critical',
    headline: 'RED ALERT: Sudden Inundation Surge in Beki Basin',
    smsText: 'NDMA RED ALERT: Flood water rising rapidly in Ward 4-7. Evacuate to Barpeta Vidyapith Camp immediately. Help boat active.',
    ivrScript: 'Attention citizens of Barpeta. This is National Disaster Management Authority. Beki river is overflowing. Move immediately to high ground. If you have bedridden patients, call 1070 for emergency boat pickup.',
    audioSirenTriggered: true,
    pictographType: 'flood_rising',
    sentAt: Date.now() - 42 * 60 * 1000,
    totalRecipientsTargeted: 3840,
    fatigueSuppressedCount: 142,
    suppressionWindowMinutes: 60
  },
  {
    id: 'CAP-POLY-MORIGAON-02',
    polygonId: 'POLY-MOR-KAPILI',
    polygonName: 'Morigaon Kapili River Surge Zone (Bhuragaon)',
    polygonCoords: [
      { x: 430, y: 130 },
      { x: 580, y: 140 },
      { x: 570, y: 240 },
      { x: 420, y: 230 }
    ],
    severity: 'warning',
    headline: 'ORANGE WARNING: Kapili River Approaching Danger Mark +1.2m',
    smsText: 'NDMA ALERT: Move livestock and drinking water stocks to higher platforms. Bhuragaon Relief Camp open.',
    ivrScript: 'NDMA warning for Morigaon district. Kapili water level rising. Shelter available at Bhuragaon Higher Secondary School.',
    audioSirenTriggered: false,
    pictographType: 'evacuation_high_ground',
    sentAt: Date.now() - 25 * 60 * 1000,
    totalRecipientsTargeted: 2610,
    fatigueSuppressedCount: 89,
    suppressionWindowMinutes: 60
  }
];

/**
 * Initial Seeds for Rumor / Misinformation Anomaly Detection
 */
export const initialMisinformationItems: MisinformationItem[] = [
  {
    id: 'MISINFO-HOAX-01',
    timestamp: Date.now() - 15 * 60 * 1000,
    sourceText: 'URGENT DDMA NOTICE: Khandajan sluice collapsed! 20ft flood wave incoming in 30 mins, evacuate all Morigaon town immediately!',
    originChannel: 'WhatsApp / SMS Forward Burst',
    viralityVelocityScore: 92, // 92 forwards/min
    authorVerificationStatus: 'OFFICIAL_KEY_MISSING',
    isQuarantined: true,
    humanReviewDecision: 'CONFIRMED_HOAX',
    reviewerName: 'DDMA Morigaon Control Officer',
    reviewerNotes: 'Ground sensors at CWC show 0.24m normal flow. No dam breach. Fake order circulating.',
    exposedCitizenCount: 1420,
    exposedCitizenList: [
      '+91 7980190589 (Ref: REF-NDMA-798019)',
      '+91 9880182287 (Ref: REF-NDMA-988018)',
      '+91 98540 10291',
      '+91 94350 49102',
      '+91 97061 88201',
      '+91 98642 77109'
    ],
    debunkBroadcast: {
      sentAt: Date.now() - 5 * 60 * 1000,
      smsDelivered: 1420,
      ivrCallsMade: 890,
      pictographsRendered: 1420,
      reachRatePercentage: 100
    }
  }
];
