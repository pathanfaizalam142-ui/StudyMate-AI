import React from 'react';
import {
  Home,
  GraduationCap,
  MessageSquare,
  FileCheck2,
  Award,
  UploadCloud,
  CalendarCheck,
  Bookmark,
  User,
  Sparkles,
  Zap,
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  language,
  savedCount,
  quizCount,
}) => {
  const t = translations[language];

  const navItems = [
    { id: 'home' as NavigationTab, label: t.navHome, icon: Home },
    { id: 'gtu_bca' as NavigationTab, label: t.navGtuBca, icon: GraduationCap, badge: 'GTU' },
    { id: 'ask_ai' as NavigationTab, label: t.navAskAI, icon: MessageSquare, badge: 'AI' },
    { id: 'exam_mode' as NavigationTab, label: t.navExamMode, icon: FileCheck2, badge: 'Hot' },
    { id: 'quiz' as NavigationTab, label: t.navQuiz, icon: Award, count: quizCount },
    { id: 'notes_upload' as NavigationTab, label: t.navNotes, icon: UploadCloud },
    { id: 'study_plan' as NavigationTab, label: t.navPlan, icon: CalendarCheck },
    { id: 'saved' as NavigationTab, label: t.navSaved, icon: Bookmark, count: savedCount },
    { id: 'profile' as NavigationTab, label: t.navProfile, icon: User },
  ];

  return (
    <aside
      id="desktop-sidebar"
      className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 border-r border-black/10 dark:border-white/10 bg-[#F0EDE4]/60 dark:bg-[#080d0b]/80 p-4 space-y-6 min-h-[calc(100vh-4rem)]"
    >
      {/* Navigation Group */}
      <div className="space-y-1.5 flex-1">
        <p className="px-3 text-[11px] font-bold text-black/50 dark:text-[#F0EDE4]/50 uppercase tracking-wider mb-2">
          {language === 'hi' ? 'नेविगेशन' : 'Menu'}
        </p>

        {navItems.map((item) => {
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                isActive
                  ? 'bg-[#004741] text-[#F0EDE4] shadow-sm'
                  : 'text-black dark:text-[#F0EDE4] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-[#F0EDE4]' : 'text-[#004741] dark:text-[#6ee7b7]'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    isActive
                      ? 'bg-black/30 text-[#F0EDE4]'
                      : 'bg-[#004741]/10 dark:bg-[#004741]/40 text-[#004741] dark:text-[#6ee7b7]'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {typeof item.count === 'number' && item.count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-[#F0EDE4]/20 text-[#F0EDE4]'
                      : 'bg-black/5 dark:bg-white/10 text-black/70 dark:text-[#F0EDE4]/70'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mini Study Booster Card */}
      <div className="p-4 rounded-2xl bg-[#004741] text-[#F0EDE4] relative overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-black/20 text-[#F0EDE4]">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">Exam Readiness</span>
        </div>
        <p className="text-xs text-[#F0EDE4]/80 leading-relaxed mb-3">
          University exam answers structured with definitions, flow diagrams & examiner tips.
        </p>
        <button
          onClick={() => {
            soundManager.play('card_open');
            onTabChange('exam_mode');
          }}
          className="w-full py-2 px-3 rounded-xl bg-[#F0EDE4] text-[#004741] text-xs font-bold hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Launch Exam Generator</span>
        </button>
      </div>
    </aside>
  );
};
