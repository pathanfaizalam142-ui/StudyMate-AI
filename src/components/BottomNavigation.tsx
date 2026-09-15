import React from 'react';
import { Home, GraduationCap, FileText, MessageSquare, Bookmark, User } from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { NavigationTab, AppLanguage } from '../types';
import { translations } from '../services/i18n';

interface BottomNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  language: AppLanguage;
}

export const BottomNavigation: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  language,
}) => {
  const t = translations[language];

  const items = [
    { id: 'home' as NavigationTab, label: t.navHome, icon: Home },
    { id: 'gtu_bca' as NavigationTab, label: t.navGtuBca, icon: GraduationCap },
    { id: 'question_papers' as NavigationTab, label: language === 'hi' ? 'पेपर' : 'Papers', icon: FileText },
    { id: 'ask_ai' as NavigationTab, label: t.navAskAI, icon: MessageSquare },
    { id: 'saved' as NavigationTab, label: t.navSaved, icon: Bookmark },
    { id: 'profile' as NavigationTab, label: t.navProfile, icon: User },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F0EDE4]/95 dark:bg-[#050807]/95 border-t border-black/10 dark:border-white/10 backdrop-blur-lg px-1 sm:px-2 pb-[env(safe-area-inset-bottom,0px)] w-full max-w-full"
    >
      <div className="flex items-center justify-around h-15 sm:h-16 max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => {
                soundManager.play('nav_tap');
                onTabChange(item.id);
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative ${
                isActive
                  ? 'text-[#004741] dark:text-[#6ee7b7] font-bold'
                  : 'text-black/60 dark:text-[#F0EDE4]/60 hover:text-black dark:hover:text-[#F0EDE4]'
              }`}
            >
              {isActive && (
                <span className="absolute top-1 w-5 h-0.5 rounded-full bg-[#004741] dark:bg-[#6ee7b7]" />
              )}
              <Icon
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                  isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                }`}
              />
              <span className="text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 tracking-tight truncate max-w-[56px] sm:max-w-[64px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
