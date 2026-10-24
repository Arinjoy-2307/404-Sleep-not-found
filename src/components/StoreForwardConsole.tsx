import React, { useState } from 'react';
import { StoreForwardMessage } from '../types/disaster';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  WifiOff,
  Signal
} from 'lucide-react';
import { LanguageCode } from '../services/i18n';

interface StoreForwardConsoleProps {
  language: LanguageCode;
  onSyncPacketToIncidents: (msg: StoreForwardMessage) => void;
}

export const StoreForwardConsole: React.FC<StoreForwardConsoleProps> = ({
  language: _language,
  onSyncPacketToIncidents
}) => {
  const [messages, setMessages] = useState<StoreForwardMessage[]>([
    {
      id: 'SF-SMS-7980',
      referenceNo: 'REF-NDMA-798019',
      channel: 'SMS',
      phoneNumber: '+91 7980190589',
      timestamp: Date.now() - 25 * 60 * 1000,
      payload: 'SMS to 1070: OXYGEN_NEEDED (Power out 6h, 1.5h oxygen remaining, water 4.5ft at Milan Nagar)',
      status: 'queued_locally',
      lastKnownSafeStatus: 'OXYGEN_NEEDED',
      householdId: 'HSH-BAR-892',
      locationText: 'House #44B, Milan Nagar Namghar, Barpeta'
    },
    {
      id: 'SF-USSD-9880',
      referenceNo: 'REF-NDMA-988018',
      channel: 'USSD',
      phoneNumber: '+91 9880182287',
      timestamp: Date.now() - 15 * 60 * 1000,
      payload: '*1070*4# (Ref: REF-NDMA-988018, NEED_RESCUE, ELDERLY_TRAPPED: 1, ROAD_SEVERED: SH9)',
      status: 'queued_locally',
      lastKnownSafeStatus: 'NEED_RESCUE',
      householdId: 'HSH-SAR-411',
      locationText: 'Near Sarthebari SH-9 KM 18, Barpeta'
    },
    {
      id: 'SF-SMS-0991',
      referenceNo: 'REF-NDMA-798019',
      channel: 'SMS',
      phoneNumber: '+91 7980190589',
      timestamp: Date.now() - 58 * 60 * 1000,
      payload: 'EARLIER BEACON: SAFE (Water knee level, patient stable on battery power).',
      status: 'conflict_resolved',
      lastKnownSafeStatus: 'SAFE',
      householdId: 'HSH-BAR-892',
      locationText: 'Milan Nagar Namghar, Barpeta'
    },
    {
      id: 'SF-USSD-902',
      channel: 'USSD',
      phoneNumber: '+91 98640 44102',
      timestamp: Date.now() - 14 * 60 * 1000,
      payload: '*1070*2# (STATUS: WATER_RISING, FLOOD_FT: 4.0, OXYGEN: NO)',
      status: 'queued_locally',
      lastKnownSafeStatus: 'WATER_RISING',
      householdId: 'HSH-MOR-331',
      locationText: 'Bhuragaon Ward 3, Morigaon'
    }
  ]);

  const [inputPhone, setInputPhone] = useState('+91 7980190589');
  const [inputLocation, setInputLocation] = useState('House #44B, Milan Nagar, Barpeta');
  const [inputStatus, setInputStatus] = useState<'SAFE' | 'NEED_RESCUE' | 'WATER_RISING' | 'OXYGEN_NEEDED'>('OXYGEN_NEEDED');
  const [inputChannel, setInputChannel] = useState<'SMS' | 'USSD'>('SMS');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncMessage = (msgId: string) => {
    const target = messages.find(m => m.id === msgId);
    if (!target) return;

    onSyncPacketToIncidents(target);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'synced' } : m));
  };

  const handleSimulateNewIncoming = (e: React.FormEvent) => {
    e.preventDefault();
    const newMsg: StoreForwardMessage = {
      id: `SF-${inputChannel}-${Math.floor(Math.random() * 9000 + 1000)}`,
      channel: inputChannel,
      phoneNumber: inputPhone,
      timestamp: Date.now(),
      payload: `${inputChannel} Beacon: Status ${inputStatus} at ${inputLocation}`,
      status: 'queued_locally',
      lastKnownSafeStatus: inputStatus,
      householdId: `HSH-${Math.floor(Math.random() * 900 + 100)}`,
      locationText: inputLocation
    };

    setMessages(prev => [newMsg, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
        <h2 className="text-lg font-bold text-slate-900">
          Offline Message Queue (SMS & USSD)
        </h2>
        <p className="text-xs text-slate-600">
          Messages sent by citizens in areas with low or intermittent cellular signal. When a citizen dials <code>*1070#</code> or sends a short SMS, it is held in this queue and synced directly to the rescue dispatch map.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Queue List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Incoming Cellular Beacons ({messages.length})</span>
            <span className="text-slate-500 font-normal">SMS / USSD *1070#</span>
          </div>

          <div className="divide-y divide-slate-100">
            {messages.map((msg) => (
              <div key={msg.id} className="p-4 space-y-2 hover:bg-slate-50/80 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 font-mono">{msg.phoneNumber}</strong>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {msg.channel}
                    </span>
                    {msg.referenceNo && (
                      <span className="text-[11px] font-mono text-slate-500">
                        {msg.referenceNo}
                      </span>
                    )}
                  </div>

                  <span className={`text-[11px] font-semibold ${
                    msg.status === 'synced' ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {msg.status === 'synced' ? '✓ Synced to Map' : 'Queued on Server'}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-mono">
                  {msg.payload}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-slate-50">
                  <span className="text-slate-400 text-[11px]">Location: {msg.locationText}</span>

                  {msg.status !== 'synced' && (
                    <button
                      type="button"
                      onClick={() => handleSyncMessage(msg.id)}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Sync to Operations Map
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Simulate New Incoming SMS */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Simulate Incoming SMS / USSD
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Test receiving an emergency beacon from a low-signal area.
            </p>
          </div>

          <form onSubmit={handleSimulateNewIncoming} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Channel</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInputChannel('SMS')}
                  className={`py-1.5 rounded-lg border text-center font-medium ${
                    inputChannel === 'SMS' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  SMS
                </button>
                <button
                  type="button"
                  onClick={() => setInputChannel('USSD')}
                  className={`py-1.5 rounded-lg border text-center font-medium ${
                    inputChannel === 'USSD' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  USSD (*1070#)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                value={inputPhone}
                onChange={(e) => setInputPhone(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono focus:border-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Reported Status</label>
              <select
                value={inputStatus}
                onChange={(e) => setInputStatus(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white text-slate-800 focus:border-slate-900"
              >
                <option value="OXYGEN_NEEDED">Medical Oxygen Needed</option>
                <option value="NEED_RESCUE">Trapped - Needs Evacuation</option>
                <option value="WATER_RISING">Water Rising Fast</option>
                <option value="SAFE">Family Safe on High Ground</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Location Details</label>
              <input
                type="text"
                value={inputLocation}
                onChange={(e) => setInputLocation(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-slate-900"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors"
            >
              Enqueue Incoming Beacon
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
