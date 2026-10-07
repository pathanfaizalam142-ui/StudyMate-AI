import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
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
  LogOut,
  LogIn,
  Mail,
  ShieldCheck,
  IdCard,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  FileCheck2,
  Hash,
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { AppLanguage, AppTheme, QuizResult, User, NavigationTab } from '../types';
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
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenAuth?: () => void;
  onUpdateProfile?: (updates: Partial<User>) => Promise<void> | void;
  onNavigate?: (tab: NavigationTab, query?: string, subject?: string) => void;
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
  currentUser,
  onLogout,
  onOpenAuth,
  onUpdateProfile,
  onNavigate,
}) => {
  const t = translations[language];
  const isHi = language === 'hi';

  // Editable student profile form state
  const [name, setName] = useState(currentUser?.name || 'Faiz Alam');
  const [course, setCourse] = useState(currentUser?.course || 'Bachelor of Computer Applications (BCA)');
  const [college, setCollege] = useState(currentUser?.college || 'Gujarat Technological University (GTU)');
  const [semester, setSemester] = useState<number>(Number(currentUser?.semester) || 4);
  const [enrollmentNo, setEnrollmentNo] = useState(currentUser?.enrollmentNo || '230020107001');
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  // Sync state whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || 'Faiz Alam');
      setCourse(currentUser.course || 'Bachelor of Computer Applications (BCA)');
      setCollege(currentUser.college || 'Gujarat Technological University (GTU)');
      setSemester(Number(currentUser.semester) || 4);
      setEnrollmentNo(currentUser.enrollmentNo || '230020107001');
    }
  }, [currentUser]);

  // Compute stats
  const totalQuizzes = quizHistory.length;
  const avgScore =
    totalQuizzes > 0
      ? Math.round(
          quizHistory.reduce((acc, curr) => acc + curr.percentage, 0) / totalQuizzes
        )
      : 84;

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    soundManager.play('save');

    try {
      if (onUpdateProfile) {
        await onUpdateProfile({
          name: name.trim(),
          course: course.trim(),
          college: college.trim(),
          semester: Number(semester),
          enrollmentNo: enrollmentNo.trim(),
        });
      }
      setIsEditing(false);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    soundManager.play('button_click');
    if (currentUser) {
      setName(currentUser.name || 'Faiz Alam');
      setCourse(currentUser.course || 'Bachelor of Computer Applications (BCA)');
      setCollege(currentUser.college || 'Gujarat Technological University (GTU)');
      setSemester(Number(currentUser.semester) || 4);
      setEnrollmentNo(currentUser.enrollmentNo || '230020107001');
    }
    setIsEditing(false);
  };

  return (
    <div id="profile-view" className="space-y-5 sm:space-y-6 max-w-4xl mx-auto pb-20 md:pb-8 w-full min-w-0">
      {/* Header */}
      <div className="border-b border-black/10 dark:border-[#263449] pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#004741] text-[#F0EDE4] shrink-0 shadow-xs">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-display font-black text-black dark:text-[#F1F5F9] tracking-tight leading-tight">
              {t.profileHeader || (isHi ? 'विद्यार्थी प्रोफ़ाइल और सेटिंग्स' : 'Student Profile & Settings')}
            </h1>
            <p className="text-xs sm:text-sm text-black/70 dark:text-[#94A3B8]">
              {t.profileSub || (isHi ? 'अपना शैक्षणिक विवरण, अध्ययन प्राथमिकताएं और सत्र प्रबंधित करें' : 'Manage your academic identity, study preferences, and session state')}
            </p>
          </div>
        </div>

        {currentUser && onLogout ? (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => {
                soundManager.play('button_click');
                onLogout();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 text-red-600 dark:text-red-400 bg-red-500/5 hover:bg-red-500/10 text-xs font-bold transition-all active:scale-95"
              title="Log Out of StudyMate"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isHi ? 'लॉग आउट' : 'Log Out'}</span>
            </button>
            <span className="text-[11px] sm:text-xs font-semibold text-black/75 dark:text-[#F1F5F9]/90 tracking-tight whitespace-nowrap bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-xl">
              Developer by Faiz Alam ✅
            </span>
          </div>
        ) : (
          onOpenAuth && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => {
                  soundManager.play('button_click');
                  onOpenAuth();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold shadow-xs hover:bg-[#003833] transition-all active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isHi ? 'साइन इन करें' : 'Sign In'}</span>
              </button>
              <span className="text-[11px] sm:text-xs font-semibold text-black/75 dark:text-[#F1F5F9]/90 tracking-tight whitespace-nowrap bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-xl">
                Developer by Faiz Alam ✅
              </span>
            </div>
          )
        )}
      </div>

      {/* Success Banner when profile updated */}
      {saveSuccessMsg && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{isHi ? 'प्रोफ़ाइल सफलतापूर्वक अपडेट की गई! ✅' : 'Student profile updated and saved to session! ✅'}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(false)} className="text-xs opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Student Identity Card */}
      <div className="p-4 sm:p-7 rounded-3xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
            {/* Avatar */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#004741] text-[#F0EDE4] font-black text-lg sm:text-xl flex items-center justify-center shadow-md shrink-0">
              {(currentUser?.name || name)
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'FA'}
            </div>

            {/* Profile Info or Edit Form */}
            <div className="space-y-1.5 min-w-0 flex-1">
              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-2.5 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-black/50 dark:text-[#94A3B8] uppercase tracking-wider block mb-1">
                      {isHi ? 'पूरा नाम' : 'Full Name'}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Student Name"
                      className="w-full py-1.5 px-3 text-xs sm:text-sm font-bold rounded-xl border border-black/20 dark:border-[#263449] bg-white dark:bg-[#111827] text-black dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#004741]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-black/50 dark:text-[#94A3B8] uppercase tracking-wider block mb-1">
                        {isHi ? 'पाठ्यक्रम' : 'Course'}
                      </label>
                      <input
                        type="text"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        placeholder="Course Name"
                        className="w-full text-xs py-1.5 px-3 rounded-xl border border-black/20 dark:border-[#263449] bg-white dark:bg-[#111827] text-black dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#004741]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-black/50 dark:text-[#94A3B8] uppercase tracking-wider block mb-1">
                        {isHi ? 'विश्वविद्यालय / कॉलेज' : 'University / College'}
                      </label>
                      <input
                        type="text"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder="University Name"
                        className="w-full text-xs py-1.5 px-3 rounded-xl border border-black/20 dark:border-[#263449] bg-white dark:bg-[#111827] text-black dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#004741]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-black/50 dark:text-[#94A3B8] uppercase tracking-wider block mb-1">
                        {isHi ? 'वर्तमान सेमेस्टर' : 'Current Semester'}
                      </label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(Number(e.target.value))}
                        className="w-full text-xs py-1.5 px-3 rounded-xl border border-black/20 dark:border-[#263449] bg-white dark:bg-[#111827] text-black dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#004741]"
                      >
                        {[1, 2, 3, 4, 5, 6].map((s) => (
                          <option key={s} value={s}>
                            Semester {s} (GTU BCA)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-black/50 dark:text-[#94A3B8] uppercase tracking-wider block mb-1">
                        {isHi ? 'नामांकन संख्या' : 'Enrollment No.'}
                      </label>
                      <input
                        type="text"
                        value={enrollmentNo}
                        onChange={(e) => setEnrollmentNo(e.target.value)}
                        placeholder="GTU Enrollment Number"
                        className="w-full text-xs py-1.5 px-3 rounded-xl border border-black/20 dark:border-[#263449] bg-white dark:bg-[#111827] text-black dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#004741]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold hover:bg-[#003833] transition-all shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving...' : isHi ? 'परिवर्तन सहेजें' : 'Save Changes'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3 py-2 rounded-xl border border-black/15 dark:border-[#263449] text-black dark:text-[#F1F5F9] text-xs font-bold hover:bg-black/5"
                    >
                      {isHi ? 'रद्द करें' : 'Cancel'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-xl font-bold text-black dark:text-[#F1F5F9] truncate">
                      {currentUser?.name || name}
                    </h2>

                    <span className="px-2 py-0.5 rounded-full bg-[#004741]/10 text-[#004741] dark:text-[#38BDF8] text-[11px] font-bold shrink-0">
                      Sem {semester}
                    </span>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold shrink-0 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>GTU BCA</span>
                    </span>
                  </div>

                  <p className="text-xs text-black/70 dark:text-[#94A3B8] flex items-center gap-1.5 font-medium truncate">
                    <GraduationCap className="w-3.5 h-3.5 text-[#004741] dark:text-[#38BDF8] shrink-0" />
                    <span className="truncate">{course}</span>
                  </p>

                  <p className="text-[11px] sm:text-xs text-black/55 dark:text-[#94A3B8] truncate">
                    {college}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-black/60 dark:text-[#94A3B8]">
                    {currentUser?.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 text-[#004741] dark:text-[#38BDF8]" />
                        <span>{currentUser.email}</span>
                      </span>
                    )}

                    {enrollmentNo && (
                      <span className="flex items-center gap-1 font-mono">
                        <IdCard className="w-3 h-3 text-[#004741] dark:text-[#38BDF8]" />
                        <span>{enrollmentNo}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2 self-start shrink-0">
              <button
                onClick={() => {
                  soundManager.play('button_click');
                  setIsEditing(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/15 dark:border-[#263449] text-black dark:text-[#F1F5F9] text-xs font-bold hover:border-[#004741] hover:bg-black/5 dark:hover:bg-[#1E293B] transition-all shadow-xs"
              >
                <Edit2 className="w-3 h-3 text-[#004741] dark:text-[#38BDF8]" />
                <span>{isHi ? 'संपादित करें' : 'Edit Info'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Between Library & Academics */}
      {onNavigate && (
        <div className="space-y-2.5">
          <h2 className="text-xs sm:text-sm font-bold text-black dark:text-[#F1F5F9] uppercase tracking-wider">
            {isHi ? 'त्वरित नेविगेशन और अध्ययन शॉर्टकट' : 'Quick Navigation & Shortcuts'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                soundManager.play('button_click');
                onNavigate('saved');
              }}
              className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] hover:border-[#004741] transition-all flex items-center justify-between group shadow-xs text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-[#004741] text-[#F0EDE4] shrink-0">
                  <Bookmark className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-black dark:text-[#F1F5F9] flex items-center gap-1.5">
                    <span>{isHi ? 'सहेजा गया पुस्तकालय' : 'Saved Library'}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#004741]/10 text-[#004741] dark:text-[#38BDF8]">
                      {savedItemsCount}
                    </span>
                  </div>
                  <div className="text-[10px] text-black/50 dark:text-[#94A3B8] truncate">
                    {isHi ? 'बुकमार्क किए गए उत्तर व नोट्स' : 'Review saved solutions'}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-black/30 group-hover:text-[#004741] dark:group-hover:text-[#38BDF8] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.play('button_click');
                onNavigate('gtu_bca');
              }}
              className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] hover:border-[#004741] transition-all flex items-center justify-between group shadow-xs text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-teal-600 text-white shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-black dark:text-[#F1F5F9]">
                    {isHi ? 'GTU BCA पाठ्यक्रम' : 'GTU BCA Syllabus'}
                  </div>
                  <div className="text-[10px] text-black/50 dark:text-[#94A3B8] truncate">
                    {isHi ? `सेमेस्टर ${semester} के विषय` : `Semester ${semester} Core Subjects`}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-black/30 group-hover:text-[#004741] dark:group-hover:text-[#38BDF8] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.play('button_click');
                onNavigate('study_plan');
              }}
              className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] hover:border-[#004741] transition-all flex items-center justify-between group shadow-xs text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-amber-600 text-white shrink-0">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-black dark:text-[#F1F5F9]">
                    {isHi ? 'अध्ययन योजना' : 'Study Planner'}
                  </div>
                  <div className="text-[10px] text-black/50 dark:text-[#94A3B8] truncate">
                    {isHi ? 'दैनिक लक्ष्य और कार्य' : 'Daily goals & revision'}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-black/30 group-hover:text-[#004741] dark:group-hover:text-[#38BDF8] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* Study Stats Matrix */}
      <div className="space-y-3">
        <h2 className="text-xs sm:text-sm font-bold text-black dark:text-[#F1F5F9] uppercase tracking-wider">
          {t.statsHeader || (isHi ? 'अध्ययन आंकड़े' : 'Study Analytics')}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Active Days Streak */}
          <div
            onClick={() => {
              if (onNavigate) {
                soundManager.play('button_click');
                onNavigate('study_plan');
              }
            }}
            className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] space-y-1 shadow-xs cursor-pointer hover:border-[#004741] transition-all"
          >
            <div className="flex items-center justify-between text-[#004741] dark:text-[#38BDF8]">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{isHi ? 'सक्रिय' : 'Active'}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-black dark:text-[#F1F5F9]">
              {streakDays} {t.daysStreak || (isHi ? 'दिन' : 'Days')}
            </div>
            <p className="text-[10px] sm:text-[11px] text-black/50 dark:text-[#94A3B8] truncate">
              {isHi ? 'दैनिक अध्ययन स्ट्रीक' : 'Consistent daily study'}
            </p>
          </div>

          {/* Quizzes Completed */}
          <div
            onClick={() => {
              if (onNavigate) {
                soundManager.play('button_click');
                onNavigate('quiz');
              }
            }}
            className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] space-y-1 shadow-xs cursor-pointer hover:border-[#004741] transition-all"
          >
            <div className="flex items-center justify-between text-[#004741] dark:text-[#38BDF8]">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{isHi ? 'टेस्ट' : 'Tests'}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-black dark:text-[#F1F5F9]">
              {totalQuizzes || 4}
            </div>
            <p className="text-[10px] sm:text-[11px] text-black/50 dark:text-[#94A3B8] truncate">
              {t.quizzesCompleted || (isHi ? 'पूर्ण क्विज' : 'Quizzes Completed')}
            </p>
          </div>

          {/* Average Score */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-[#004741] dark:text-[#38BDF8]">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{isHi ? 'औसत' : 'Average'}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-black dark:text-[#F1F5F9]">
              {avgScore}%
            </div>
            <p className="text-[10px] sm:text-[11px] text-black/50 dark:text-[#94A3B8] truncate">
              {t.avgScore || (isHi ? 'औसत स्कोर' : 'Average Score')}
            </p>
          </div>

          {/* Saved Items -> Clicking Navigates Directly to Saved Library */}
          <div
            onClick={() => {
              if (onNavigate) {
                soundManager.play('button_click');
                onNavigate('saved');
              }
            }}
            className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] space-y-1 shadow-xs cursor-pointer hover:border-[#004741] transition-all group"
            title="Open Saved Library"
          >
            <div className="flex items-center justify-between text-[#004741] dark:text-[#38BDF8]">
              <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5 text-[#004741] dark:text-[#38BDF8]">
                <span>{isHi ? 'पुस्तकालय' : 'Library'}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-black dark:text-[#F1F5F9]">
              {savedItemsCount}
            </div>
            <p className="text-[10px] sm:text-[11px] text-black/50 dark:text-[#94A3B8] truncate">
              {t.savedAnswersCount || (isHi ? 'सहेजी गई सामग्री' : 'Saved Items')}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Options */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-black dark:text-[#F1F5F9] uppercase tracking-wider">
          {t.settingsHeading || (isHi ? 'एप्लिकेशन सेटिंग्स' : 'App Preferences')}
        </h2>

        <div className="p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-xs divide-y divide-black/5 dark:divide-white/5 space-y-2">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-black dark:text-[#F1F5F9]">
                {soundEnabled ? <Volume2 className="w-4 h-4 text-[#004741] dark:text-[#38BDF8]" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-black dark:text-[#F1F5F9]">
                  {t.soundSetting || (isHi ? 'ध्वनि प्रभाव (Sound Effects)' : 'Sound Effects')}
                </h3>
                <p className="text-[11px] text-black/50 dark:text-[#94A3B8]">
                  {soundEnabled
                    ? isHi
                      ? 'बटन, प्रश्नोत्तरी व संदेशों पर ऑडियो प्रभाव सक्षम हैं'
                      : 'Synthesized Web Audio sounds for buttons, quiz and messages'
                    : isHi
                    ? 'ध्वनि प्रभाव बंद हैं'
                    : 'Sound effects are muted'}
                </p>
              </div>
            </div>

            <button
              onClick={onSoundToggle}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs ${
                soundEnabled
                  ? 'bg-[#004741] text-[#F0EDE4] border-[#004741]'
                  : 'bg-black/5 dark:bg-white/5 text-black dark:text-[#F1F5F9] border-black/10 dark:border-[#263449]'
              }`}
            >
              {soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-black dark:text-[#F1F5F9]">
                <Languages className="w-4 h-4 text-[#004741] dark:text-[#38BDF8]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-black dark:text-[#F1F5F9]">
                  {t.languageSetting || (isHi ? 'भाषा (Language)' : 'Language')}
                </h3>
                <p className="text-[11px] text-black/50 dark:text-[#94A3B8]">
                  {language === 'hi' ? 'हिंदी (Hindi) सक्रिय है' : 'English is active'}
                </p>
              </div>
            </div>

            <button
              onClick={onLanguageToggle}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#111827] border border-black/15 dark:border-[#263449] text-black dark:text-[#F1F5F9] uppercase hover:border-[#004741] shadow-xs"
            >
              {language === 'hi' ? 'हिंदी' : 'English'}
            </button>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-black/5 dark:bg-[#1E293B] text-black dark:text-[#F1F5F9]">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-[#38BDF8]" /> : <Sun className="w-4 h-4 text-amber-600" />}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-black dark:text-[#F1F5F9]">
                  {t.themeSetting || (isHi ? 'थीम मोड (Theme Mode)' : 'Theme Mode')}
                </h3>
                <p className="text-[11px] text-black/50 dark:text-[#94A3B8]">
                  {theme === 'dark' ? 'Modern Dark mode (#0B1120)' : 'Sand & Cyprus Light mode'}
                </p>
              </div>
            </div>

            <button
              onClick={onThemeToggle}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all capitalize shadow-xs ${
                theme === 'dark'
                  ? 'bg-[#172033] border-[#38BDF8] text-[#38BDF8]'
                  : 'bg-white border-black/15 text-black hover:border-[#004741]'
              }`}
            >
              {theme}
            </button>
          </div>

          {/* Reset App Data */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
                  {t.clearData || (isHi ? 'सभी स्थानीय डेटा रीसेट करें' : 'Reset All Local Data')}
                </h3>
                <p className="text-[11px] text-black/50 dark:text-[#94A3B8]">
                  {t.clearDataDesc ||
                    (isHi
                      ? 'स्थानीय चैट इतिहास, सहेजे गए उत्तर और क्विज परिणाम साफ़ करें'
                      : 'Clear local chat history, saved solutions, and study progress')}
                </p>
              </div>
            </div>

            {isConfirmingReset ? (
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-[11px] text-rose-700 dark:text-rose-300 font-bold px-1">
                  {isHi ? 'क्या आप निश्चित हैं?' : 'Reset everything?'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('delete');
                    setIsConfirmingReset(false);
                    onResetAllData();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition-colors shadow-xs"
                >
                  {isHi ? 'हाँ, रीसेट करें' : 'Confirm Reset'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(false)}
                  className="px-2 py-1 rounded-lg bg-black/10 dark:bg-white/10 text-black dark:text-[#F1F5F9] text-[11px] font-semibold hover:bg-black/15 transition-colors"
                >
                  {isHi ? 'रद्द' : 'Cancel'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingReset(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs"
              >
                {isHi ? 'रीसेट करें' : 'Reset'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
