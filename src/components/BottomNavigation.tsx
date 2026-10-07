import React, { useState } from 'react';
import {
  Home,
  GraduationCap,
  Award,
  MessageSquare,
  MoreHorizontal,
  BookOpen,
  FileText,
  FileCheck2,
  UploadCloud,
  CalendarCheck,
  Bookmark,
  User,
  X,
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { NavigationTab, AppLanguage } from '../types';

interface BottomNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  language: AppLanguage;
  savedCount?: number;
}

export const BottomNavigation: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  language,
  savedCount = 0,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const isHi = language === 'hi';

  const isLearnActive =
    activeTab === 'gtu_bca' ||
    activeTab === 'question_papers' ||
    activeTab === 'study_materials';
  const isPracticeActive = activeTab === 'quiz' || activeTab === 'exam_mode';
  const isAiActive = activeTab === 'ask_ai' || activeTab === 'notes_upload';
  const isMoreActive =
    isMoreOpen ||
    activeTab === 'study_plan' ||
    activeTab === 'saved' ||
    activeTab === 'profile';

  const moreGroups: Array<{
    groupTitle: string;
    items: Array<{
      id: NavigationTab;
      label: string;
      sub: string;
      icon: React.ComponentType<{ className?: string }>;
      count?: number;
    }>;
  }> = [
    {
      groupTitle: isHi ? 'शैक्षणिक (Academics)' : 'ACADEMICS',
      items: [
        {
          id: 'gtu_bca',
          label: 'GTU BCA',
          sub: isHi ? 'सेमेस्टर 1–6 विषय और पाठ्यक्रम' : 'Sem 1–6 curriculum & subject workspace',
          icon: GraduationCap,
        },
        {
          id: 'question_papers',
          label: isHi ? 'प्रश्न पत्र' : 'Question Papers',
          sub: isHi ? 'सेमेस्टर 1–6 आधिकारिक GTU PDF' : 'Sem 1–6 verified GTU papers',
          icon: FileText,
        },
        {
          id: 'study_materials',
          label: isHi ? 'अध्ययन सामग्री' : 'Study Materials',
          sub: isHi ? 'इकाई सारांश व महत्वपूर्ण प्रश्न' : 'Unit notes & important questions',
          icon: BookOpen,
        },
      ],
    },
    {
      groupTitle: isHi ? 'अभ्यास और परीक्षा (Practice & Exam)' : 'PRACTICE & EXAM',
      items: [
        {
          id: 'quiz',
          label: isHi ? 'MCQ अभ्यास' : 'MCQ Practice',
          sub: isHi ? 'विषय-वार MCQ प्रश्नोत्तरी' : 'Subject-isolated MCQ practice',
          icon: Award,
        },
        {
          id: 'exam_mode',
          label: isHi ? 'परीक्षा उत्तर जनरेटर' : 'Exam Answer Generator',
          sub: isHi ? '2M, 3M, 5M, 7M, 10M, 15M उत्तर' : '2M to 15M university answers',
          icon: FileCheck2,
        },
      ],
    },
    {
      groupTitle: isHi ? 'AI अध्ययन (AI Study)' : 'AI STUDY',
      items: [
        {
          id: 'ask_ai',
          label: isHi ? 'AI से पूछें' : 'Ask AI',
          sub: isHi ? 'तुरंत अवधारणा और शंका समाधान' : 'Instant concept & doubt solver',
          icon: MessageSquare,
        },
        {
          id: 'notes_upload',
          label: isHi ? 'दस्तावेज़ विश्लेषक' : 'Document Analyzer',
          sub: isHi ? 'नोट्स अपलोड और सारांश' : 'Upload notes for AI summary & QA',
          icon: UploadCloud,
        },
        {
          id: 'study_plan',
          label: isHi ? 'अध्ययन योजनाकार' : 'Study Planner',
          sub: isHi ? 'दैनिक लक्ष्य और समय सारिणी' : 'Daily tasks & exam schedule',
          icon: CalendarCheck,
        },
      ],
    },
    {
      groupTitle: isHi ? 'पुस्तकालय और खाता (Library & Account)' : 'LIBRARY & ACCOUNT',
      items: [
        {
          id: 'saved',
          label: isHi ? 'सहेजा गया पुस्तकालय' : 'Saved Library',
          sub: isHi ? 'बुकमार्क किए गए उत्तर और नोट्स' : 'Bookmarked answers & notes',
          icon: Bookmark,
          count: savedCount,
        },
        {
          id: 'profile',
          label: isHi ? 'प्रोफ़ाइल' : 'Profile',
          sub: isHi ? 'खाता, भाषा, थीम और ध्वनि' : 'Account, language, theme & sound',
          icon: User,
        },
      ],
    },
  ];

  const handleSelectTab = (tab: NavigationTab) => {
    soundManager.play('nav_tap');
    setIsMoreOpen(false);
    onTabChange(tab);
  };

  return (
    <>
      {/* Mobile "More" Drawer Sheet */}
      {isMoreOpen && (
        <div
          id="mobile-more-drawer"
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setIsMoreOpen(false)}
        >
          <div
            className="bg-[#F0EDE4] dark:bg-[#172033] border-t border-black/15 dark:border-[#263449] rounded-t-2xl p-4 pb-20 space-y-4 max-h-[82vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-[#263449]">
              <span className="text-sm font-bold text-black dark:text-[#F1F5F9]">
                {isHi ? 'छात्र पोर्टल नेविगेशन' : 'Student Portal Directory'}
              </span>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-lg text-black/60 dark:text-[#94A3B8] hover:bg-black/5 dark:hover:bg-[#1E293B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {moreGroups.map((group) => (
                <div key={group.groupTitle} className="space-y-1.5">
                  <p className="px-1 text-[10px] font-semibold text-black/50 dark:text-[#94A3B8] tracking-wider uppercase">
                    {group.groupTitle}
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          id={`mobile-more-${item.id}`}
                          type="button"
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                            active
                              ? 'bg-[#004741] text-[#F0EDE4]'
                              : 'bg-white/70 dark:bg-white/5 text-black dark:text-[#F1F5F9] hover:bg-black/5 dark:hover:bg-[#1E293B]'
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              active ? 'text-[#F0EDE4]' : 'text-[#004741] dark:text-[#38BDF8]'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold truncate flex items-center justify-between gap-1">
                              <span className="truncate">{item.label}</span>
                              {item.count !== undefined && item.count > 0 && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono shrink-0 ${
                                    active
                                      ? 'bg-white/20 text-[#F0EDE4]'
                                      : 'bg-[#004741]/10 text-[#004741] dark:text-[#38BDF8]'
                                  }`}
                                >
                                  {item.count}
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-[11px] truncate ${
                                active
                                  ? 'text-[#F0EDE4]/75'
                                  : 'text-black/55 dark:text-[#94A3B8]'
                              }`}
                            >
                              {item.sub}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Primary 5-Item Mobile Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-nav"
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F0EDE4]/95 dark:bg-[#0B1120]/95 border-t border-black/10 dark:border-[#263449] backdrop-blur-lg px-2 pb-[env(safe-area-inset-bottom,0px)] w-full"
      >
        <div className="flex items-center justify-around h-15 max-w-md mx-auto">
          <button
            id="bottom-nav-home"
            type="button"
            onClick={() => handleSelectTab('home')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative ${
              activeTab === 'home'
                ? 'text-[#004741] dark:text-[#38BDF8] font-bold'
                : 'text-black/60 dark:text-[#94A3B8]'
            }`}
          >
            {activeTab === 'home' && (
              <span className="absolute top-1 w-5 h-0.5 rounded-full bg-[#004741] dark:bg-[#38BDF8]" />
            )}
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] mt-1 tracking-tight">
              {isHi ? 'होम' : 'Home'}
            </span>
          </button>

          <button
            id="bottom-nav-learn"
            type="button"
            onClick={() => handleSelectTab('gtu_bca')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative ${
              isLearnActive
                ? 'text-[#004741] dark:text-[#38BDF8] font-bold'
                : 'text-black/60 dark:text-[#94A3B8]'
            }`}
          >
            {isLearnActive && (
              <span className="absolute top-1 w-5 h-0.5 rounded-full bg-[#004741] dark:bg-[#38BDF8]" />
            )}
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] mt-1 tracking-tight">
              {isHi ? 'अध्ययन' : 'Learn'}
            </span>
          </button>

          <button
            id="bottom-nav-practice"
            type="button"
            onClick={() => handleSelectTab('quiz')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative ${
              isPracticeActive
                ? 'text-[#004741] dark:text-[#38BDF8] font-bold'
                : 'text-black/60 dark:text-[#94A3B8]'
            }`}
          >
            {isPracticeActive && (
              <span className="absolute top-1 w-5 h-0.5 rounded-full bg-[#004741] dark:bg-[#38BDF8]" />
            )}
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] mt-1 tracking-tight">
              {isHi ? 'अभ्यास' : 'Practice'}
            </span>
          </button>

          <button
            id="bottom-nav-ai"
            type="button"
            onClick={() => handleSelectTab('ask_ai')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative ${
              isAiActive
                ? 'text-[#004741] dark:text-[#38BDF8] font-bold'
                : 'text-black/60 dark:text-[#94A3B8]'
            }`}
          >
            {isAiActive && (
              <span className="absolute top-1 w-5 h-0.5 rounded-full bg-[#004741] dark:bg-[#38BDF8]" />
            )}
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] mt-1 tracking-tight">AI</span>
          </button>

          <button
            id="bottom-nav-more"
            type="button"
            onClick={() => {
              soundManager.play('nav_tap');
              setIsMoreOpen((prev) => !prev);
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative ${
              isMoreActive
                ? 'text-[#004741] dark:text-[#38BDF8] font-bold'
                : 'text-black/60 dark:text-[#94A3B8]'
            }`}
          >
            {isMoreActive && (
              <span className="absolute top-1 w-5 h-0.5 rounded-full bg-[#004741] dark:bg-[#38BDF8]" />
            )}
            <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] mt-1 tracking-tight">
              {isHi ? 'अधिक' : 'More'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
