import React from 'react';
import {
  Menu,
  ShieldCheck,
  RefreshCw,
  LogOut,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminSectionTab } from './AdminSidebar';
import { soundManager } from '../../services/soundManager';

interface AdminHeaderProps {
  activeTab: AdminSectionTab;
  adminUser: {
    id: string;
    email: string;
    name: string;
    role: 'admin';
  };
  isLoading?: boolean;
  onSyncDb: () => void;
  onExitAdmin: () => void;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
}

const SECTION_METADATA: Record<AdminSectionTab, { group: string; title: string }> = {
  dashboard: { group: 'OVERVIEW', title: 'Dashboard' },
  subjects: { group: 'CURRICULUM', title: 'Subjects & Syllabus' },
  materials: { group: 'CURRICULUM', title: 'Study Materials' },
  papers: { group: 'EXAMINATION', title: 'GTU Papers' },
  paper_questions: { group: 'EXAMINATION', title: 'Paper Questions' },
  mcqs: { group: 'QUESTION BANK', title: 'MCQ Question Bank' },
  security: { group: 'SECURITY', title: 'Account / Security' },
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  adminUser,
  isLoading,
  onSyncDb,
  onExitAdmin,
  onLogout,
  onOpenMobileMenu,
}) => {
  const meta = SECTION_METADATA[activeTab] || { group: 'ADMIN', title: 'Management' };

  return (
    <header className="rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
      {/* Left: Mobile Menu Toggle + Section Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => {
            soundManager.play('button_click');
            onOpenMobileMenu();
          }}
          className="lg:hidden p-2 rounded-xl bg-black/5 dark:bg-white/5 text-black dark:text-[#F1F5F9] border border-black/10 dark:border-[#263449]"
          title="Open Admin Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="min-w-0">
          <nav
            aria-label="Admin Breadcrumb"
            className="flex items-center gap-1.5 text-[11px] font-semibold text-black/50 dark:text-[#94A3B8]"
          >
            <span>Admin Portal</span>
            <ChevronRight className="w-3 h-3 opacity-60" />
            <span>{meta.group}</span>
          </nav>
          <h1 className="text-base sm:text-lg font-display font-black text-black dark:text-[#F1F5F9] truncate tracking-tight">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Right: Controls + Admin Identity + Logout */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Sync DB Button */}
        <button
          type="button"
          onClick={() => {
            soundManager.play('button_click');
            onSyncDb();
          }}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/15 dark:border-[#263449] bg-white/70 dark:bg-[#172033] hover:border-[#004741] text-xs font-semibold text-black dark:text-[#F1F5F9] transition disabled:opacity-50"
          title="Sync with SQLite Database"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Sync DB</span>
        </button>

        {/* Administrator Identity Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#004741]/10 dark:bg-[#004741]/25 border border-[#004741]/20 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#004741] dark:text-[#38BDF8] shrink-0" />
          <div className="min-w-0">
            <span className="font-bold text-black dark:text-[#F1F5F9] truncate max-w-[130px] inline-block align-bottom">
              {adminUser.name || 'Admin'}
            </span>
            <span className="text-[10px] text-black/50 dark:text-[#94A3B8] font-mono ml-1.5">
              (ADMIN)
            </span>
          </div>
        </div>

        {/* Return to Student View */}
        <button
          type="button"
          onClick={() => {
            soundManager.play('nav_tap');
            onExitAdmin();
          }}
          className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-semibold text-black dark:text-[#F1F5F9] transition border border-black/10 dark:border-[#263449]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Student View</span>
        </button>

        {/* Logout Button */}
        <button
          type="button"
          onClick={() => {
            soundManager.play('button_click');
            onLogout();
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/20 text-xs font-semibold transition"
          title="Logout Admin Session"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
