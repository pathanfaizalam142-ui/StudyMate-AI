import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Award,
  Bookmark,
  MessageSquare,
  Flame,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Languages,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Edit2,
  Check,
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { AppLanguage, AppTheme, QuizResult, SavedItem } from '../types';
import { translations } from '../services/i18n';

interface ProfileViewProps {
  language: AppLanguage;
  onLanguageToggle: () => void;
  theme: AppTheme;
  onThemeToggle: () => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  savedItemsCount: number;
  quizHistory: QuizResult[];
  streakDays: number;
  onResetAllData: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  language,
  onLanguageToggle,
  theme,
  onThemeToggle,
  soundEnabled,
  onSoundToggle,
  savedItemsCount,
  quizHistory,
  streakDays,
  onResetAllData,
}) => {
  const t = translations[language];

  // Editable student profile info
  const [name, setName] = useState('Faizan Ali');
  const [course, setCourse] = useState('B.Tech - Computer Science & Engineering');
  const [college, setCollege] = useState('Institute of Technology');
  const [isEditing, setIsEditing] = useState(false);

  // Compute stats
  const totalQuizzes = quizHistory.length;
  const avgScore =
    totalQuizzes > 0
      ? Math.round(
          quizHistory.reduce((acc, curr) => acc + curr.percentage, 0) / totalQuizzes
        )
      : 84;

  const handleSaveProfile = () => {
    soundManager.play('save');
    setIsEditing(false);
  };

  return (
    <div id="profile-view" className="space-y-5 sm:space-y-6 max-w-4xl mx-auto pb-20 md:pb-8 w-full min-w-0">
      {/* Header */}
      <div className="border-b border-black/10 dark:border-white/10 pb-3 sm:pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#004741] text-[#F0EDE4] shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-display font-black text-black dark:text-[#F0EDE4] tracking-tight leading-tight">
              {t.profileHeader}
            </h1>
            <p className="text-xs sm:text-sm text-black/70 dark:text-[#F0EDE4]/70">
              {t.profileSub}
            </p>
          </div>
        </div>
      </div>

      {/* Student Identity Card */}
      <div className="p-4 sm:p-7 rounded-3xl bg-white/90 dark:bg-[#0c1412] border border-black/10 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#004741] text-[#F0EDE4] font-black text-base sm:text-xl flex items-center justify-center shadow-md shrink-0">
              {name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>

            <div className="space-y-0.5 sm:space-y-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="py-1 px-2 text-sm sm:text-base font-bold rounded-lg border border-black/20 dark:border-white/20 bg-white dark:bg-black/50 w-full"
                />
              ) : (
                <h2 className="text-base sm:text-xl font-bold text-black dark:text-[#F0EDE4] truncate">
                  {name}
                </h2>
              )}

              {isEditing ? (
                <div className="space-y-1 pt-1">
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full text-xs py-1 px-2 rounded-lg border border-black/20 dark:border-white/20 bg-white dark:bg-black/50"
                  />
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full text-xs py-1 px-2 rounded-lg border border-black/20 dark:border-white/20 bg-white dark:bg-black/50"
                  />
                </div>
              ) : (
                <>
                  <p className="text-xs text-black/70 dark:text-[#F0EDE4]/70 flex items-center gap-1.5 font-medium truncate">
                    <GraduationCap className="w-3.5 h-3.5 text-[#004741] dark:text-[#6ee7b7] shrink-0" />
                    <span className="truncate">{course}</span>
                  </p>
                  <p className="text-[11px] sm:text-xs text-black/50 dark:text-[#F0EDE4]/50 truncate">
                    {college}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="self-end sm:self-auto shrink-0">
            {isEditing ? (
              <button
                onClick={handleSaveProfile}
                className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold hover:bg-black transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  soundManager.play('button_click');
                  setIsEditing(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/15 dark:border-white/15 text-black dark:text-[#F0EDE4] text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Info</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Study Stats Matrix */}
      <div className="space-y-3">
        <h2 className="text-xs sm:text-sm font-bold text-black dark:text-[#F0EDE4] uppercase tracking-wider">
          {t.statsHeading}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#0c1412] border border-black/10 dark:border-white/10 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-[#004741] dark:text-[#6ee7b7]">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-black dark:text-[#F0EDE4]">
              {streakDays} {t.daysStreak}
            </div>
            <p className="text-[10px] sm:text-[11px] text-black/50 dark:text-[#F0EDE4]/50 truncate">
              {language === 'hi' ? 'दैनिक अध्ययन लक्ष्य' : 'Consistent daily study'}
            </p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#0c1412] border border-black/10 dark:border-white/10 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-[#004741] dark:text-[#6ee7b7]">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Tests</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-black dark:text-[#F0EDE4]">
              {totalQuizzes || 4}
            </div>
            <p className="text-[10px] sm:text-[11px] text-black/50 dark:text-[#F0EDE4]/50 truncate">
              {t.quizzesCompleted}
            </p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#0c1412] border border-black/10 dark:border-white/10 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-[#004741] dark:text-[#6ee7b7]">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Average</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-black dark:text-[#F0EDE4]">
              {avgScore}%
            </div>
            <p className="text-[10px] sm:text-[11px] text-black/50 dark:text-[#F0EDE4]/50 truncate">
              {t.avgScore}
            </p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#0c1412] border border-black/10 dark:border-white/10 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-[#004741] dark:text-[#6ee7b7]">
              <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Saved</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-black dark:text-[#F0EDE4]">
              {savedItemsCount}
            </div>
            <p className="text-[10px] sm:text-[11px] text-black/50 dark:text-[#F0EDE4]/50 truncate">
              {t.savedAnswersCount}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Options */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-black dark:text-[#F0EDE4] uppercase tracking-wider">
          {t.settingsHeading}
        </h2>

        <div className="p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-[#0c1412] border border-black/10 dark:border-white/10 shadow-sm divide-y divide-black/5 dark:divide-white/5 space-y-2">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-black dark:text-[#F0EDE4]">
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-black dark:text-[#F0EDE4]">
                  {t.soundSetting}
                </h3>
                <p className="text-[11px] text-black/50 dark:text-[#F0EDE4]/50">
                  {soundEnabled
                    ? language === 'hi'
                      ? 'बटन, प्रश्नोत्तरी व संदेशों पर ऑडियो प्रभाव सक्षम हैं'
                      : 'Synthesized Web Audio sounds for buttons, quiz and messages'
                    : language === 'hi'
                    ? 'ध्वनि प्रभाव बंद हैं'
                    : 'Sound effects are muted'}
                </p>
              </div>
            </div>

            <button
              onClick={onSoundToggle}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                soundEnabled
                  ? 'bg-[#004741] text-[#F0EDE4] border-[#004741]'
                  : 'bg-black/5 dark:bg-white/5 text-black dark:text-[#F0EDE4] border-black/10 dark:border-white/10'
              }`}
            >
              {soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-black dark:text-[#F0EDE4]">
                <Languages className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-black dark:text-[#F0EDE4]">
                  {t.languageSetting}
                </h3>
                <p className="text-[11px] text-black/50 dark:text-[#F0EDE4]/50">
                  {language === 'hi' ? 'हिंदी (Hindi) सक्रिय है' : 'English is active'}
                </p>
              </div>
            </div>

            <button
              onClick={onLanguageToggle}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-black/40 border border-black/15 dark:border-white/15 text-black dark:text-[#F0EDE4] uppercase hover:border-[#004741]"
            >
              {language === 'hi' ? 'हिंदी' : 'English'}
            </button>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-black dark:text-[#F0EDE4]">
                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-black dark:text-[#F0EDE4]">
                  {t.themeSetting}
                </h3>
                <p className="text-[11px] text-black/50 dark:text-[#F0EDE4]/50">
                  {theme === 'dark' ? 'Cyprus Dark mode' : 'Sand & Cyprus Light mode'}
                </p>
              </div>
            </div>

            <button
              onClick={onThemeToggle}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-black/40 border border-black/15 dark:border-white/15 text-black dark:text-[#F0EDE4] capitalize hover:border-[#004741]"
            >
              {theme}
            </button>
          </div>

          {/* Reset App Data */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
                  {t.resetAllData}
                </h3>
                <p className="text-[11px] text-black/50 dark:text-[#F0EDE4]/50">
                  {language === 'hi'
                    ? 'सभी चैट, सहेजे गए उत्तर और इतिहास को साफ़ करें'
                    : 'Clear local chat history, saved solutions and quiz records'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.play('delete');
                if (
                  window.confirm(
                    'Are you sure you want to reset all data and clear stored solutions?'
                  )
                ) {
                  onResetAllData();
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
