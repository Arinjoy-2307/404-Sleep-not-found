import React, { useState } from 'react';
import { FusedIncident, MisinformationItem } from '../types/disaster';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Send, 
  AlertTriangle, 
  Radio, 
  Check,
  PlusCircle,
  Volume2
} from 'lucide-react';
import { LanguageCode } from '../services/i18n';

interface MisinformationQuarantineProps {
  incidents: FusedIncident[];
  onDebunkAndBroadcast: (incidentId: string, debunkNotice: string) => void;
  language: LanguageCode;
}

export const MisinformationQuarantine: React.FC<MisinformationQuarantineProps> = ({
  incidents: _incidents,
  onDebunkAndBroadcast,
  language: _language
}) => {
  const [misinfoList, setMisinfoList] = useState<MisinformationItem[]>([
    {
      id: 'MISINFO-HOAX-01',
      timestamp: Date.now() - 22 * 60 * 1000,
      sourceText: 'URGENT: Khandajan sluice collapsed! 20ft flood wave incoming in 30 mins, evacuate all Morigaon town immediately!',
      originChannel: 'WhatsApp Voice Note Forward',
      viralityVelocityScore: 92,
      authorVerificationStatus: 'OFFICIAL_KEY_MISSING',
      isQuarantined: true,
      humanReviewDecision: 'CONFIRMED_HOAX',
      reviewerName: 'DDMA Duty Officer',
      reviewerNotes: 'CWC river gauge #0482 reports normal 0.24m flow. Zero embankment failure. Fraudulent audio note.',
      exposedCitizenCount: 1420,
      exposedCitizenList: [
        '+91 7980190589 (Ref: REF-NDMA-798019)',
        '+91 9880182287 (Ref: REF-NDMA-988018)',
        '+91 98540 10291',
        '+91 94350 49102',
        '+91 97061 88201',
        '+91 98642 77109',
        '...and 1,414 more'
      ],
      debunkBroadcast: {
        sentAt: Date.now() - 8 * 60 * 1000,
        smsDelivered: 1420,
        ivrCallsMade: 890,
        pictographsRendered: 1420,
        reachRatePercentage: 100
      }
    }
  ]);

  const [activeItem, setActiveItem] = useState<MisinformationItem>(misinfoList[0]);
  const [debunkSms, setDebunkSms] = useState(
    'OFFICIAL FACT-CHECK: Khandajan Sluice Gate is SAFE and intact. CWC water sensors confirm normal water levels. The circulating audio note is false. Do not panic or leave homes unnecessarily.'
  );
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [showInjectForm, setShowInjectForm] = useState(false);
  const [injectText, setInjectText] = useState('UNVERIFIED AUDIO: Brahmaputra mega-dyke breached at Sualkuchi! Evacuate now!');

  const handleReviewDecision = (decision: 'CONFIRMED_HOAX' | 'GENUINE_EMERGENCY') => {
    const updated = {
      ...activeItem,
      humanReviewDecision: decision,
      reviewerName: 'Disaster Magistrate on Duty',
      reviewerNotes: decision === 'CONFIRMED_HOAX' 
        ? 'Verified against field hydrological sensors. Confirmed false.'
        : 'Confirmed by ground SDRF patrol. Escalating to verified emergency queue.'
    };

    setActiveItem(updated);
    setMisinfoList(prev => prev.map(m => m.id === activeItem.id ? updated : m));
  };

  const handleTriggerDebunkBroadcast = () => {
    setIsBroadcasting(true);
    setTimeout(() => {
      const broadcastData = {
        sentAt: Date.now(),
        smsDelivered: activeItem.exposedCitizenCount,
        ivrCallsMade: Math.floor(activeItem.exposedCitizenCount * 0.85),
        pictographsRendered: activeItem.exposedCitizenCount,
        reachRatePercentage: 100
      };

      const updated = {
        ...activeItem,
        debunkBroadcast: broadcastData
      };

      setActiveItem(updated);
      setMisinfoList(prev => prev.map(m => m.id === activeItem.id ? updated : m));
      setIsBroadcasting(false);
      setBroadcastSuccess(true);
      setTimeout(() => setBroadcastSuccess(false), 4000);

      onDebunkAndBroadcast('INC-DAM-02', debunkSms);
    }, 1200);
  };

  const handleInjectNewRumor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!injectText.trim()) return;

    const newHoax: MisinformationItem = {
      id: `MISINFO-${Math.floor(Math.random() * 900 + 100)}`,
      timestamp: Date.now(),
      sourceText: injectText.trim(),
      originChannel: 'Social Media Forward',
      viralityVelocityScore: 84,
      authorVerificationStatus: 'OFFICIAL_KEY_MISSING',
      isQuarantined: true,
      humanReviewDecision: 'PENDING',
      reviewerName: 'Pending Officer Review',
      reviewerNotes: 'Awaiting comparison with field gauge data.',
      exposedCitizenCount: 840,
      exposedCitizenList: [
        '+91 7980190589 (Ref: REF-NDMA-798019)',
        '+91 9880182287 (Ref: REF-NDMA-988018)',
        '...and 838 more'
      ]
    };

    setMisinfoList(prev => [newHoax, ...prev]);
    setActiveItem(newHoax);
    setShowInjectForm(false);
    setInjectText('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Rumor & Misinformation Control
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Review unverified circulating rumors, verify against sensor data, and broadcast official fact-check corrections directly to citizen phones.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowInjectForm(!showInjectForm)}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 self-start md:self-auto transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Test New Rumor</span>
        </button>
      </div>

      {/* New Rumor Inject Form */}
      {showInjectForm && (
        <form onSubmit={handleInjectNewRumor} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
          <strong className="text-slate-900 text-sm block">Simulate Incoming Unverified Message</strong>
          <input
            type="text"
            value={injectText}
            onChange={(e) => setInjectText(e.target.value)}
            placeholder="e.g. Unverified rumor: Water level broken at dam..."
            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:border-slate-900"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowInjectForm(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-semibold"
            >
              Add to Queue
            </button>
          </div>
        </form>
      )}

      {/* 2. Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Queue of rumors */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-700">
            Flagged Rumor Queue ({misinfoList.length})
          </div>
          <div className="divide-y divide-slate-100">
            {misinfoList.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveItem(item)}
                className={`w-full text-left p-4 transition-colors ${
                  activeItem.id === item.id ? 'bg-amber-50/40 border-l-2 border-slate-900' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>{item.originChannel}</span>
                  <span className={`font-semibold ${
                    item.humanReviewDecision === 'CONFIRMED_HOAX' ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {item.humanReviewDecision === 'CONFIRMED_HOAX' ? 'Confirmed False' : 'Needs Review'}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-900 line-clamp-2">
                  {item.sourceText}
                </p>
                <div className="text-[11px] text-slate-400 mt-2">
                  Exposed Citizens: ~{item.exposedCitizenCount}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Detailed Investigation & Broadcast */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Origin: {activeItem.originChannel}</span>
              <span>·</span>
              <span>Ref ID: {activeItem.id}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              "{activeItem.sourceText}"
            </h3>
          </div>

          {/* Sensor Verification Evidence */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
            <strong className="text-slate-900 block text-xs">Official Field Sensor Verification</strong>
            <p className="text-slate-700 leading-relaxed">
              Central Water Commission (CWC) Hydrological River Gauge #0482 at Khandajan reports safe flow (0.24m). Sluice gates are operational with zero embankment failure.
            </p>
          </div>

          {/* Action Decision Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Official Decision:</span>
            <button
              type="button"
              onClick={() => handleReviewDecision('CONFIRMED_HOAX')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeItem.humanReviewDecision === 'CONFIRMED_HOAX'
                  ? 'bg-rose-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Confirm False (Hoax)
            </button>
            <button
              type="button"
              onClick={() => handleReviewDecision('GENUINE_EMERGENCY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeItem.humanReviewDecision === 'GENUINE_EMERGENCY'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Verify as Real Emergency
            </button>
          </div>

          {/* Broadcast Fact-Check Correction */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <strong className="text-xs font-semibold text-slate-900">
                Official Debunk SMS to Broadcast:
              </strong>
              <span className="text-xs text-slate-500">
                Targeted to {activeItem.exposedCitizenCount} exposed citizens
              </span>
            </div>

            <textarea
              value={debunkSms}
              onChange={(e) => setDebunkSms(e.target.value)}
              rows={3}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-900"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs text-slate-500">
                Will be delivered via Cell-Broadcast SMS and Automated Vernacular Voice Call.
              </span>

              <button
                type="button"
                onClick={handleTriggerDebunkBroadcast}
                disabled={isBroadcasting}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isBroadcasting ? 'Broadcasting...' : `Send Debunk to ${activeItem.exposedCitizenCount} Citizens`}</span>
              </button>
            </div>

            {broadcastSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Correction broadcast successfully sent to 1,420 registered citizen phones.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
