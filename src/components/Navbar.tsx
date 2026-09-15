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
  User as UserIcon,
  LogIn,
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { AppLanguage, AppTheme, User } from '../types';

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
  activeTab: string;
  currentUser?: User | null;
}

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
  currentUser,
}) => {
  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-40 w-full border-b border-black/10 dark:border-white/10 bg-[#F0EDE4]/95 dark:bg-[#050807]/95 backdrop-blur-md transition-colors"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#004741] flex items-center justify-center text-[#F0EDE4] shadow-sm relative overflow-hidden group shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#F0EDE4] relative z-10" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-black/30" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-display font-black text-base sm:text-xl tracking-tight text-black dark:text-[#F0EDE4] truncate">
                StudyMate
              </span>
              <span className="px-1 sm:px-1.5 py-0.5 rounded-md bg-[#004741] text-[#F0EDE4] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                AI
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-black/60 dark:text-[#F0EDE4]/60 hidden md:block truncate">
              {language === 'hi' ? 'स्मार्ट अध्ययन साथी' : 'AI-Powered Study Companion'}
            </p>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Study Streak Badge (visible on tablets/desktops) */}
          <div
            id="streak-badge"
            title={`${streakDays} Day Study Streak`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#004741]/10 dark:bg-[#004741]/30 border border-[#004741]/20 text-[#004741] dark:text-[#6ee7b7] text-xs font-bold"
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{streakDays}d</span>
          </div>

          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={() => {
              onSoundToggle();
            }}
            title={soundEnabled ? 'Sound Effects: ON' : 'Sound Effects: OFF'}
            className={`p-1.5 sm:p-2 rounded-xl transition-all border ${
              soundEnabled
                ? 'bg-[#004741] text-[#F0EDE4] border-[#004741]'
                : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-[#F0EDE4]/70 border-black/10 dark:border-white/10'
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
            onClick={() => {
              soundManager.play('button_click');
              onLanguageToggle();
            }}
            title="Switch Language (EN / HI)"
            className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-black/15 dark:border-white/15 bg-white/70 dark:bg-black/40 text-black dark:text-[#F0EDE4] text-[11px] sm:text-xs font-bold active:scale-95 hover:border-[#004741]"
          >
            <Languages className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#004741] dark:text-[#6ee7b7]" />
            <span className="uppercase">{language}</span>
          </button>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={() => {
              soundManager.play('toggle');
              onThemeToggle();
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 sm:p-2 rounded-xl border border-black/15 dark:border-white/15 bg-white/70 dark:bg-black/40 text-black dark:text-[#F0EDE4] active:scale-95 hover:border-[#004741]"
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
            onClick={() => {
              soundManager.play('button_click');
              onNotificationClick();
            }}
            title="Notifications"
            className="p-1.5 sm:p-2 rounded-xl border border-black/15 dark:border-white/15 bg-white/70 dark:bg-black/40 text-black dark:text-[#F0EDE4] active:scale-95 hover:border-[#004741] relative"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#004741]" />
          </button>

          {/* User Profile Avatar Link / Sign In */}
          {currentUser ? (
            <button
              id="user-avatar-btn"
              onClick={() => {
                soundManager.play('nav_tap');
                onProfileClick();
              }}
              title={`${currentUser.name} - GTU BCA Student`}
              className="flex items-center gap-1.5 p-0.5 sm:p-1 rounded-xl border border-black/10 dark:border-white/10 hover:border-[#004741] active:scale-95 transition-all"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#004741] text-[#F0EDE4] font-bold text-[10px] sm:text-xs flex items-center justify-center shadow-sm">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'FA'}
              </div>
            </button>
          ) : (
            <button
              id="user-login-btn"
              onClick={() => {
                soundManager.play('button_click');
                if (onOpenAuth) {
                  onOpenAuth();
                } else {
                  onProfileClick();
                }
              }}
              title="Sign In to StudyMate AI"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#004741] hover:bg-[#003833] text-[#F0EDE4] text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'hi' ? 'लॉग इन' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
