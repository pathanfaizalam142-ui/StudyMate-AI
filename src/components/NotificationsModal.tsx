import React from 'react';
import { X, Bell, Flame, Award, Calendar, BookOpen, Check } from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { AppLanguage } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: AppLanguage;
  streakDays: number;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  language,
  streakDays,
}) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      title: language === 'hi' ? 'दैनिक अध्ययन स्ट्रीक सक्रिय!' : 'Study Streak Active!',
      desc: language === 'hi' ? `बधाई! आपकी ${streakDays} दिन की स्ट्रीक चल रही है।` : `Awesome! You have kept your ${streakDays}-day streak burning strong.`,
      icon: Flame,
      time: '2h ago',
    },
    {
      id: 2,
      title: language === 'hi' ? 'आगामी परीक्षा अनुस्मारक' : 'Semester Exam Readiness Reminder',
      desc: language === 'hi' ? 'ऑपरेटिंग सिस्टम का 10-अंक वाला उत्तर अभ्यास करें।' : 'Recommended: Generate a 10-mark structured answer for OS Deadlocks.',
      icon: Calendar,
      time: '5h ago',
    },
    {
      id: 3,
      title: language === 'hi' ? 'प्रश्नोत्तरी उपलब्धि' : 'Quiz Mastery Achievement',
      desc: language === 'hi' ? 'आपने कंप्यूटर नेटवर्क्स में 100% स्कोर प्राप्त किया!' : 'You scored 100% in the Computer Networks protocol quiz!',
      icon: Award,
      time: 'Yesterday',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#F0EDE4] dark:bg-[#0c1412] border border-black/20 dark:border-white/20 shadow-2xl p-4 sm:p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#004741] text-[#F0EDE4]">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-black dark:text-[#F0EDE4]">
              {language === 'hi' ? 'अधिसूचनाएं' : 'Study Alerts'}
            </h2>
          </div>
          <button
            onClick={() => {
              soundManager.play('button_click');
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-[#F0EDE4]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto">
          {notifications.map((notif) => {
            const Icon = notif.icon;
            return (
              <div
                key={notif.id}
                className="p-3.5 rounded-2xl bg-white/80 dark:bg-black/40 border border-black/10 dark:border-white/10 flex items-start gap-3"
              >
                <div className="p-2 rounded-xl bg-[#004741]/10 dark:bg-[#004741]/30 text-[#004741] dark:text-[#6ee7b7] shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-xs font-bold text-black dark:text-[#F0EDE4]">
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-black/50 dark:text-[#F0EDE4]/50">
                      {notif.time}
                    </span>
                  </div>
                  <p className="text-xs text-black/70 dark:text-[#F0EDE4]/70 mt-0.5 leading-relaxed">
                    {notif.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
