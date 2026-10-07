import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  FileText,
  Layers,
  HelpCircle,
  ShieldCheck,
  ArrowLeft,
  X,
} from 'lucide-react';
import { soundManager } from '../../services/soundManager';

export type AdminSectionTab =
  | 'dashboard'
  | 'subjects'
  | 'materials'
  | 'papers'
  | 'paper_questions'
  | 'mcqs'
  | 'security';

interface AdminSidebarProps {
  activeTab: AdminSectionTab;
  onSelectTab: (tab: AdminSectionTab) => void;
  onExitAdmin: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  stats?: {
    totalSubjects?: number;
    availablePapers?: number;
    totalPaperQuestions?: number;
    totalActiveMcqs?: number;
  } | null;
}

interface NavGroup {
  groupTitle: string;
  items: Array<{
    id: AdminSectionTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
  }>;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  onExitAdmin,
  isOpenMobile,
  onCloseMobile,
  stats,
}) => {
  const navGroups: NavGroup[] = [
    {
      groupTitle: 'OVERVIEW',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      groupTitle: 'CURRICULUM',
      items: [
        {
          id: 'subjects',
          label: 'Subjects & Syllabus',
          icon: BookOpen,
          badge: stats?.totalSubjects,
        },
        {
          id: 'materials',
          label: 'Study Materials',
          icon: FolderKanban,
        },
      ],
    },
    {
      groupTitle: 'EXAMINATION',
      items: [
        {
          id: 'papers',
          label: 'GTU Papers',
          icon: FileText,
          badge: stats?.availablePapers ? `${stats.availablePapers} Available` : undefined,
        },
        {
          id: 'paper_questions',
          label: 'Paper Questions',
          icon: Layers,
          badge: stats?.totalPaperQuestions,
        },
      ],
    },
    {
      groupTitle: 'QUESTION BANK',
      items: [
        {
          id: 'mcqs',
          label: 'MCQ Question Bank',
          icon: HelpCircle,
          badge: stats?.totalActiveMcqs,
        },
      ],
    },
    {
      groupTitle: 'SECURITY',
      items: [
        {
          id: 'security',
          label: 'Account / Security',
          icon: ShieldCheck,
        },
      ],
    },
  ];

  const handleItemClick = (tab: AdminSectionTab) => {
    soundManager.play('nav_tap');
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const content = (
    <div className="flex flex-col h-full justify-between p-4 space-y-6 select-none">
      <div className="space-y-5">
        {/* Admin Brand / Portal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-[#263449]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#004741] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <ShieldCheck className="w-4.5 h-4.5 text-[#6ee7b7]" />
            </div>
            <div>
              <div className="font-display font-black text-sm tracking-tight text-black dark:text-[#F1F5F9]">
                Admin Console
              </div>
              <div className="text-[10px] font-semibold text-black/55 dark:text-[#94A3B8]">
                SQLite Authority Governance
              </div>
            </div>
          </div>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-black/60 dark:text-[#94A3B8] hover:bg-black/5 dark:hover:bg-[#1E293B]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Grouped Navigation */}
        <nav aria-label="Admin Portal Sections" className="space-y-4">
          {navGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              <p className="px-2.5 text-[10px] font-bold text-black/45 dark:text-[#94A3B8]/80 tracking-wider uppercase mb-1">
                {group.groupTitle}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`admin-sidebar-nav-${item.id}`}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-[#004741] text-[#F0EDE4] shadow-xs'
                        : 'text-black/80 dark:text-[#F1F5F9]/90 hover:bg-black/5 dark:hover:bg-[#1E293B] hover:text-black dark:hover:text-[#F1F5F9]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isActive ? 'text-[#F0EDE4]' : 'text-[#004741] dark:text-[#38BDF8]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-md ${
                          isActive
                            ? 'bg-white/20 text-[#F0EDE4]'
                            : 'bg-black/5 dark:bg-white/10 text-black/60 dark:text-[#94A3B8]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Return Button */}
      <div className="pt-3 border-t border-black/10 dark:border-[#263449]">
        <button
          type="button"
          onClick={() => {
            soundManager.play('nav_tap');
            onExitAdmin();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-black/15 dark:border-[#263449] bg-white/60 dark:bg-[#172033] hover:bg-black/5 dark:hover:bg-[#1E293B] text-xs font-bold text-black/75 dark:text-[#F1F5F9]/80 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#004741] dark:text-[#38BDF8]" />
          <span>Return to Student Portal</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        id="admin-desktop-sidebar"
        className="hidden lg:flex flex-col w-64 xl:w-68 shrink-0 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-xs min-h-[calc(100vh-8rem)]"
      >
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div
          id="admin-mobile-drawer"
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex"
          onClick={onCloseMobile}
        >
          <div
            className="w-72 max-w-[85vw] h-full bg-[#F0EDE4] dark:bg-[#172033] border-r border-black/15 dark:border-[#263449] shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
};
