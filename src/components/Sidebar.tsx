import React from 'react';
import {
  Home,
  GraduationCap,
  FileText,
  BookOpen,
  MessageSquare,
  FileCheck2,
  Award,
  UploadCloud,
  CalendarCheck,
  Bookmark,
  User,
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { NavigationTab, AppLanguage } from '../types';
import { translations } from '../services/i18n';

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  language: AppLanguage;
  savedCount: number;
  quizCount: number;
  currentSemester?: number | string;
}

interface NavGroup {
  groupTitle: string;
  items: Array<{
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  language,
  savedCount,
  quizCount,
  currentSemester = 4,
}) => {
  const isHi = language === 'hi';

  const navGroups: NavGroup[] = [
    {
      groupTitle: isHi ? 'अवलोकन' : 'OVERVIEW',
      items: [
        {
          id: 'home',
          label: isHi ? 'डैशबोर्ड' : 'Dashboard',
          icon: Home,
        },
      ],
    },
    {
      groupTitle: isHi ? 'शैक्षणिक' : 'ACADEMICS',
      items: [
        {
          id: 'gtu_bca',
          label: isHi ? 'GTU BCA' : 'GTU BCA',
          icon: GraduationCap,
        },
        {
          id: 'question_papers',
          label: isHi ? 'प्रश्न पत्र' : 'Question Papers',
          icon: FileText,
        },
        {
          id: 'study_materials',
          label: isHi ? 'अध्ययन सामग्री' : 'Study Materials',
          icon: BookOpen,
        },
      ],
    },
    {
      groupTitle: isHi ? 'अभ्यास और परीक्षा' : 'PRACTICE & EXAM',
      items: [
        {
          id: 'quiz',
          label: isHi ? 'MCQ अभ्यास' : 'MCQ Practice',
          icon: Award,
          count: quizCount,
        },
        {
          id: 'exam_mode',
          label: isHi ? 'परीक्षा उत्तर जनरेटर' : 'Exam Answer Generator',
          icon: FileCheck2,
        },
      ],
    },
    {
      groupTitle: isHi ? 'AI अध्ययन' : 'AI STUDY',
      items: [
        {
          id: 'ask_ai',
          label: isHi ? 'AI से पूछें' : 'Ask AI',
          icon: MessageSquare,
        },
        {
          id: 'notes_upload',
          label: isHi ? 'दस्तावेज़ विश्लेषक' : 'Document Analyzer',
          icon: UploadCloud,
        },
        {
          id: 'study_plan',
          label: isHi ? 'अध्ययन योजनाकार' : 'Study Planner',
          icon: CalendarCheck,
        },
      ],
    },
    {
      groupTitle: isHi ? 'पुस्तकालय' : 'LIBRARY',
      items: [
        {
          id: 'saved',
          label: isHi ? 'सहेजा गया पुस्तकालय' : 'Saved Library',
          icon: Bookmark,
          count: savedCount,
        },
      ],
    },
    {
      groupTitle: isHi ? 'खाता' : 'ACCOUNT',
      items: [
        {
          id: 'profile',
          label: isHi ? 'प्रोफ़ाइल' : 'Profile',
          icon: User,
        },
      ],
    },
  ];

  return (
    <aside
      id="desktop-sidebar"
      className={`hidden md:flex flex-col w-64 lg:w-68 shrink-0 border-r border-black/10 dark:border-[#263449] bg-[#F0EDE4]/70 dark:bg-[#111827] px-3.5 py-5 justify-between select-none overflow-y-auto ${
        activeTab === 'ask_ai' ? 'h-full min-h-0' : 'min-h-[calc(100vh-4rem)]'
      }`}
    >
      <nav aria-label="Student Portal Navigation" className="space-y-5">
        {navGroups.map((group) => (
          <div key={group.groupTitle} className="space-y-1">
            <p className="px-3 text-[11px] font-semibold text-black/45 dark:text-[#94A3B8]/80 tracking-wide mb-1.5">
              {group.groupTitle}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => {
                    soundManager.play('nav_tap');
                    onTabChange(item.id);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all group ${
                    isActive
                      ? 'bg-[#004741] text-[#F0EDE4] shadow-sm'
                      : 'text-black/80 dark:text-[#F1F5F9]/90 hover:bg-black/5 dark:hover:bg-[#1E293B] hover:text-black dark:hover:text-[#F1F5F9]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive
                          ? 'text-[#F0EDE4]'
                          : 'text-[#004741] dark:text-[#38BDF8]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {typeof item.count === 'number' && item.count > 0 && (
                    <span
                      className={`text-[11px] font-mono tabular-nums ${
                        isActive
                          ? 'text-[#F0EDE4]/85'
                          : 'text-black/50 dark:text-[#94A3B8]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Academic Context Footer */}
      <div className="pt-4 mt-4 border-t border-black/10 dark:border-[#263449] px-3 py-2.5 flex items-center justify-between text-xs text-black/60 dark:text-[#94A3B8]">
        <span>GTU BCA Curriculum</span>
        <span className="font-mono font-semibold text-[#004741] dark:text-[#38BDF8]">
          Sem {currentSemester}
        </span>
      </div>
    </aside>
  );
};
