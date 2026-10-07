import React from 'react';
import {
  Volume2,
  VolumeX,
  Languages,
  Moon,
  Sun,
  Flame,
  Bell,
  Sparkles,
  BookOpen,
  LogIn,
  MessageSquare,
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { AppLanguage, AppTheme, NavigationTab, User } from '../types';

interface NavbarProps {
  language: AppLanguage;
  onLanguageToggle: () => void;
  theme: AppTheme;
  onThemeToggle: () => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  streakDays: number;
  onNotificationClick: () => void;
  onProfileClick: () => void;
  onOpenAuth?: () => void;
  onHomeClick?: () => void;
  onAskAIClick?: () => void;
  activeTab: NavigationTab | string;
  currentUser?: User | null;
}

const TAB_LABELS_EN: Record<string, string> = {
  home: 'Dashboard',
  gtu_bca: 'GTU BCA',
  question_papers: 'Question Papers',
  study_materials: 'Study Materials',
  quiz: 'MCQ Practice',
  exam_mode: 'Exam Answer Generator',
  ask_ai: 'Ask AI',
  notes_upload: 'Document Analyzer',
  study_plan: 'Study Planner',
  saved: 'Saved Library',
  profile: 'Profile',
};

const TAB_LABELS_HI: Record<string, string> = {
  home: 'डैशबोर्ड',
  gtu_bca: 'GTU BCA',
  question_papers: 'प्रश्न पत्र',
  study_materials: 'अध्ययन सामग्री',
  quiz: 'MCQ अभ्यास',
  exam_mode: 'परीक्षा उत्तर जनरेटर',
  ask_ai: 'AI से पूछें',
  notes_upload: 'दस्तावेज़ विश्लेषक',
  study_plan: 'अध्ययन योजनाकार',
  saved: 'सहेजा गया पुस्तकालय',
  profile: 'प्रोफ़ाइल',
};

const TAB_GROUPS_EN: Record<string, string> = {
  home: 'Overview',
  gtu_bca: 'Academics',
  question_papers: 'Academics',
  study_materials: 'Academics',
  quiz: 'Practice & Exam',
  exam_mode: 'Practice & Exam',
  ask_ai: 'AI Study',
  notes_upload: 'AI Study',
  study_plan: 'AI Study',
  saved: 'Library',
  profile: 'Account',
};

const TAB_GROUPS_HI: Record<string, string> = {
  home: 'अवलोकन',
  gtu_bca: 'शैक्षणिक',
  question_papers: 'शैक्षणिक',
  study_materials: 'शैक्षणिक',
  quiz: 'अभ्यास और परीक्षा',
  exam_mode: 'अभ्यास और परीक्षा',
  ask_ai: 'AI अध्ययन',
  notes_upload: 'AI अध्ययन',
  study_plan: 'AI अध्ययन',
  saved: 'पुस्तकालय',
  profile: 'खाता',
};

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageToggle,
  theme,
  onThemeToggle,
  soundEnabled,
  onSoundToggle,
  streakDays,
  onNotificationClick,
  onProfileClick,
  onOpenAuth,
  onHomeClick,
  onAskAIClick,
  activeTab,
  currentUser,
}) => {
  const isHi = language === 'hi';
  const activeGroupLabel =
    (isHi ? TAB_GROUPS_HI[activeTab] : TAB_GROUPS_EN[activeTab]) ||
    (isHi ? 'अवलोकन' : 'Overview');
  const activeSectionLabel =
    (isHi ? TAB_LABELS_HI[activeTab] : TAB_LABELS_EN[activeTab]) || 'Dashboard';

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-40 w-full border-b border-black/10 dark:border-[#263449] bg-[#F0EDE4]/95 dark:bg-[#0B1120]/95 backdrop-blur-md transition-colors"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: StudentMate-AI Branding + Current Section Indicator */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (onHomeClick) {
                soundManager.play('nav_tap');
                onHomeClick();
              }
            }}
            className="flex items-center gap-2 sm:gap-2.5 text-left group min-w-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#004741] flex items-center justify-center text-[#F0EDE4] shadow-xs shrink-0">
              <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#F0EDE4]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-sm sm:text-lg tracking-tight text-black dark:text-[#F1F5F9] truncate">
                  StudentMate
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-[#004741] text-[#F0EDE4] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                  AI
                </span>
              </div>
              <p className="text-[10px] text-black/55 dark:text-[#94A3B8] hidden lg:block truncate">
                {isHi ? 'GTU BCA शैक्षणिक अध्ययन पोर्टल' : 'GTU BCA Academic Learning Platform'}
              </p>
            </div>
          </button>

          {/* Active Section Indicator */}
          <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-black/10 dark:border-[#263449] text-xs text-black/60 dark:text-[#94A3B8]">
            <span>{activeGroupLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-black dark:text-[#F1F5F9]">
              {activeSectionLabel}
            </span>
          </div>
        </div>

        {/* Right: Quick Ask AI Entry + Controls + Notifications + Profile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick Ask AI Entry Point */}
          {onAskAIClick && activeTab !== 'ask_ai' && (
            <button
              id="navbar-ask-ai-btn"
              type="button"
              onClick={() => {
                soundManager.play('nav_tap');
                onAskAIClick();
              }}
              title="Ask AI Study Assistant"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#004741]/10 dark:bg-[#004741]/30 hover:bg-[#004741] text-[#004741] dark:text-[#38BDF8] hover:text-[#F0EDE4] border border-[#004741]/20 text-xs font-bold transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isHi ? 'AI से पूछें' : 'Ask AI'}</span>
            </button>
          )}

          {/* Study Streak Badge */}
          <div
            id="streak-badge"
            title={`${streakDays} Day Study Streak`}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#004741]/10 dark:bg-[#004741]/30 border border-[#004741]/20 text-[#004741] dark:text-[#38BDF8] text-xs font-bold"
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{streakDays}d</span>
          </div>

          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            type="button"
            onClick={onSoundToggle}
            title={soundEnabled ? 'Sound Effects: ON' : 'Sound Effects: OFF'}
            className={`p-1.5 sm:p-2 rounded-xl transition-all border ${
              soundEnabled
                ? 'bg-[#004741] text-[#F0EDE4] border-[#004741]'
                : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-[#94A3B8] border-black/10 dark:border-[#263449]'
            } active:scale-95`}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>

          {/* Language Selector */}
          <button
            id="language-toggle-btn"
            type="button"
            onClick={() => {
              soundManager.play('button_click');
              onLanguageToggle();
            }}
            title="Switch Language (EN / HI)"
            className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-black/15 dark:border-[#263449] bg-white/70 dark:bg-[#111827] text-black dark:text-[#F1F5F9] text-[11px] sm:text-xs font-bold active:scale-95 hover:border-[#004741]"
          >
            <Languages className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#004741] dark:text-[#38BDF8]" />
            <span className="uppercase">{language}</span>
          </button>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={() => {
              soundManager.play('toggle');
              onThemeToggle();
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 sm:p-2 rounded-xl border border-black/15 dark:border-[#263449] bg-white/70 dark:bg-[#111827] text-black dark:text-[#F1F5F9] active:scale-95 hover:border-[#004741]"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
            )}
          </button>

          {/* Notification Button */}
          <button
            id="notifications-btn"
            type="button"
            onClick={() => {
              soundManager.play('button_click');
              onNotificationClick();
            }}
            title="Notifications"
            className="p-1.5 sm:p-2 rounded-xl border border-black/15 dark:border-[#263449] bg-white/70 dark:bg-[#111827] text-black dark:text-[#F1F5F9] active:scale-95 hover:border-[#004741] relative"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#004741]" />
          </button>

          {/* User Profile Avatar Link / Sign In */}
          {currentUser ? (
            <button
              id="user-avatar-btn"
              type="button"
              onClick={() => {
                soundManager.play('nav_tap');
                onProfileClick();
              }}
              title={`${currentUser.name || 'Student'} - Profile`}
              className={`flex items-center gap-1.5 p-0.5 sm:px-2 sm:py-1 rounded-xl border transition-all active:scale-95 ${
                activeTab === 'profile'
                  ? 'border-[#004741] bg-[#004741]/10 dark:bg-[#004741]/30'
                  : 'border-black/10 dark:border-[#263449] hover:border-[#004741]'
              }`}
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#004741] text-[#F0EDE4] font-bold text-[10px] sm:text-xs flex items-center justify-center shadow-xs shrink-0">
                {(currentUser.name || 'ST')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'ST'}
              </div>
              <span className="hidden sm:inline text-xs font-bold text-black dark:text-[#F1F5F9] truncate max-w-[110px]">
                {currentUser.name || 'Profile'}
              </span>
            </button>
          ) : (
            <button
              id="user-login-btn"
              type="button"
              onClick={() => {
                soundManager.play('button_click');
                if (onOpenAuth) {
                  onOpenAuth();
                } else {
                  onProfileClick();
                }
              }}
              title="Sign In to StudentMate-AI"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#004741] hover:bg-[#003833] text-[#F0EDE4] text-xs font-bold transition-all shadow-xs active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isHi ? 'लॉग इन' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
