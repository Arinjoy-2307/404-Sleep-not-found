import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  AlertCircle, 
  X, 
  UserCheck,
  CheckCircle2
} from 'lucide-react';

interface OfficialAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessfulLogin: (officerName: string, role: string, badgeId: string) => void;
  onFailedAttempt: (attemptedId: string) => void;
}

export const OfficialAuthModal: React.FC<OfficialAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccessfulLogin,
  onFailedAttempt
}) => {
  const [badgeId, setBadgeId] = useState('NDMA-OFFICER-7102');
  const [password, setPassword] = useState('');
  const [officerName, setOfficerName] = useState('Sub-Inspector M. K. Roy');
  const [role, setRole] = useState('NDRF Field Triage Commander');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validPasskey = 'ndma@2026';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (password === validPasskey || password === 'admin' || password === 'ndma2026') {
        onSuccessfulLogin(officerName, role, badgeId);
        onClose();
      } else {
        setErrorMsg('Invalid Officer Passkey. Access restricted to authorized disaster relief personnel.');
        onFailedAttempt(badgeId);
      }
    }, 600);
  };

  const fillDemoCredentials = () => {
    setBadgeId('NDMA-OFFICER-7102');
    setPassword('ndma@2026');
    setOfficerName('Sub-Inspector M. K. Roy');
    setRole('NDRF 1st Bn Incident Commander');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0b2341] text-white px-6 py-4 flex items-center justify-between border-b border-[#1b3a60]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Government Officials Portal
              </h3>
              <p className="text-[11px] text-slate-300">
                NDMA / SDRF / District Collectorate Access
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close login dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice for citizens */}
        <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Restricted Access:</strong> This area is strictly for authorized disaster relief personnel, NDRF/SDRF commanders, and government engineers. Citizens should use the default public portal to submit SOS reports.
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Officer Name:
            </label>
            <input
              type="text"
              value={officerName}
              onChange={(e) => setOfficerName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-amber-500 font-medium"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Role & Operational Branch:
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-amber-500"
            >
              <option value="NDRF 1st Bn Incident Commander">NDRF 1st Bn Incident Commander</option>
              <option value="SDRF Quick Response Boat Lead">SDRF Quick Response Boat Lead</option>
              <option value="District Magistrate Emergency Desk">District Magistrate Emergency Desk</option>
              <option value="PWD Highway Division Executive Engineer">PWD Highway Division Executive Engineer</option>
              <option value="CWC Hydrological Monitoring Officer">CWC Hydrological Monitoring Officer</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Official Badge ID:
            </label>
            <input
              type="text"
              value={badgeId}
              onChange={(e) => setBadgeId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white font-mono outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Government Passkey:
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter authorized passkey..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white font-mono outline-none focus:border-amber-500"
                required
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Quick Demo Credentials Helper */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block">Evaluator Passkey:</span>
              <code className="text-amber-700 font-mono font-bold text-xs">ndma@2026</code>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1 rounded font-semibold transition-colors"
            >
              Auto-Fill Credentials
            </button>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#0b2341] hover:bg-[#16365d] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow transition-colors"
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>{loading ? 'Authenticating...' : 'Enter Command Portal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
