import React from 'react';
import {
  ShieldCheck,
  Lock,
  LogOut,
  KeyRound,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { soundManager } from '../../services/soundManager';

interface AdminSecurityViewProps {
  adminUser: {
    id: string;
    email: string;
    name: string;
    role: 'admin';
  };
  onLogout: () => void;
}

export const AdminSecurityView: React.FC<AdminSecurityViewProps> = ({
  adminUser,
  onLogout,
}) => {
  return (
    <div id="admin-security-view" className="space-y-5">
      <div className="rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-xs p-6 space-y-6">
        {/* Account Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-black/10 dark:border-[#263449]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Administrator Account</span>
            </div>
            <h2 className="text-xl font-display font-black text-black dark:text-[#F1F5F9]">
              {adminUser.name}
            </h2>
            <p className="text-xs text-black/60 dark:text-[#94A3B8]">{adminUser.email}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              soundManager.play('button_click');
              onLogout();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Administrator Session</span>
          </button>
        </div>

        {/* Account & Session Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-[#172033] border border-black/8 dark:border-[#263449] space-y-1">
            <div className="text-[11px] font-semibold text-black/50 dark:text-[#94A3B8]">
              Account ID
            </div>
            <div className="font-mono font-bold text-black dark:text-[#F1F5F9] truncate">
              {adminUser.id}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-[#172033] border border-black/8 dark:border-[#263449] space-y-1">
            <div className="text-[11px] font-semibold text-black/50 dark:text-[#94A3B8]">
              Assigned Role
            </div>
            <div className="font-mono font-bold text-[#004741] dark:text-[#38BDF8] uppercase">
              {adminUser.role} (Role-Based Access Control)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-[#172033] border border-black/8 dark:border-[#263449] space-y-1">
            <div className="text-[11px] font-semibold text-black/50 dark:text-[#94A3B8]">
              Session Verification Status
            </div>
            <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Active (SHA-256 Token in SQLite)</span>
            </div>
          </div>
        </div>

        {/* Security Architecture & Hardening Overview */}
        <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-[#172033] border border-black/8 dark:border-[#263449] space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#004741] dark:text-[#38BDF8]" />
            <h3 className="font-bold text-sm text-black dark:text-[#F1F5F9]">
              Security & Access Control Enforcement
            </h3>
          </div>
          <p className="text-black/70 dark:text-[#94A3B8] leading-relaxed">
            All administrative API endpoints (<code className="font-mono font-bold">/api/admin/*</code>)
            enforce strict server-side session token verification against the SQLite{' '}
            <code className="font-mono">user_sessions</code> and <code className="font-mono">users</code>{' '}
            tables. Password verification uses Node.js native <code className="font-mono">scrypt</code>{' '}
            key derivation with cryptographically random salts. Plaintext passwords and session tokens
            are never returned in API payloads or printed in logs.
          </p>
        </div>
      </div>
    </div>
  );
};
