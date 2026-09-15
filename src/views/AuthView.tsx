import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Moon,
  Sun,
  Languages,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { authService } from '../services/authService';
import { soundManager } from '../services/soundManager';
import { AppLanguage, AppTheme, User } from '../types';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';

interface AuthViewProps {
  language: AppLanguage;
  onLanguageToggle?: () => void;
  theme: AppTheme;
  onThemeToggle?: () => void;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  initialMode?: 'login' | 'register';
  onAuthSuccess: (user: User) => void;
  onCancel?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  language,
  onLanguageToggle,
  theme,
  onThemeToggle,
  soundEnabled,
  onSoundToggle,
  initialMode = 'login',
  onAuthSuccess,
  onCancel,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [semester, setSemester] = useState<number>(4);
  const [college, setCollege] = useState('Gujarat Technological University (GTU)');

  // Form Field Validation States
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessBanner(null);

    const newErrors: { [key: string]: string } = {};
    if (!email.trim()) {
      newErrors.email = language === 'hi' ? 'ईमेल आवश्यक है।' : 'Email address is required.';
    } else if (!validateEmail(email)) {
      newErrors.email = language === 'hi' ? 'मान्य ईमेल दर्ज करें।' : 'Enter a valid email address.';
    }

    if (!password) {
      newErrors.password = language === 'hi' ? 'पासवर्ड आवश्यक है।' : 'Password is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      soundManager.play('error');
      return;
    }

    setErrors({});
    setLoading(true);
    soundManager.play('button_click');

    try {
      const result = await authService.login(email, password, rememberMe);
      if (result.success && result.user) {
        soundManager.play('save');
        setSuccessBanner(
          language === 'hi'
            ? `स्वागत है, ${result.user.name}!`
            : `Welcome back, ${result.user.name}!`
        );
        setTimeout(() => {
          onAuthSuccess(result.user!);
        }, 400);
      } else {
        setErrorMessage(result.error || 'Login failed. Please verify credentials.');
        soundManager.play('error');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error.');
      soundManager.play('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessBanner(null);

    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) {
      newErrors.name = language === 'hi' ? 'पूरा नाम आवश्यक है।' : 'Full name is required.';
    }

    if (!email.trim()) {
      newErrors.email = language === 'hi' ? 'ईमेल आवश्यक है।' : 'Email address is required.';
    } else if (!validateEmail(email)) {
      newErrors.email = language === 'hi' ? 'मान्य ईमेल दर्ज करें।' : 'Enter a valid email address.';
    }

    if (!password) {
      newErrors.password = language === 'hi' ? 'पासवर्ड आवश्यक है।' : 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password =
        language === 'hi' ? 'कम से कम 6 अक्षर होने चाहिए।' : 'Must be at least 6 characters.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword =
        language === 'hi' ? 'पासवर्ड मेल नहीं खाते हैं।' : 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      soundManager.play('error');
      return;
    }

    setErrors({});
    setLoading(true);
    soundManager.play('button_click');

    try {
      const result = await authService.register(
        name,
        email,
        password,
        college,
        semester,
        'Bachelor of Computer Applications (BCA)'
      );
      if (result.success && result.user) {
        soundManager.play('save');
        setSuccessBanner(
          language === 'hi'
            ? `खाता सफलतापूर्वक बनाया गया! स्वागत है ${result.user.name}!`
            : `Account created successfully! Welcome, ${result.user.name}!`
        );
        setTimeout(() => {
          onAuthSuccess(result.user!);
        }, 400);
      } else {
        setErrorMessage(result.error || 'Registration failed.');
        soundManager.play('error');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration error.');
      soundManager.play('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoStudentLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    soundManager.play('button_click');
    try {
      const res = await authService.loginAsDemo();
      if (res.success) {
        soundManager.play('save');
        setSuccessBanner(
          language === 'hi' ? 'डेमो छात्र के रूप में लॉग इन!' : 'Logged in as Demo GTU Student!'
        );
        setTimeout(() => {
          onAuthSuccess(res.user);
        }, 300);
      }
    } catch {
      setErrorMessage('Could not load demo student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-container"
      className="min-h-screen flex flex-col justify-between px-3 py-4 sm:py-8 animate-fade-in w-full min-w-0"
    >
      {/* Top Utility Bar (Theme, Language, Sound) */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#004741] text-[#F0EDE4] flex items-center justify-center font-bold text-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold font-display tracking-tight text-black dark:text-[#F0EDE4]">
            StudyMate AI
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {onSoundToggle && (
            <button
              onClick={() => {
                soundManager.play('toggle');
                onSoundToggle();
              }}
              title={soundEnabled ? 'Sound Enabled' : 'Sound Muted'}
              className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:border-[#004741] text-black dark:text-[#F0EDE4] transition-all"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          )}

          {onLanguageToggle && (
            <button
              onClick={() => {
                soundManager.play('toggle');
                onLanguageToggle();
              }}
              title="Change Language"
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-black/10 dark:border-white/10 hover:border-[#004741] text-[11px] font-bold text-black dark:text-[#F0EDE4] transition-all"
            >
              <Languages className="w-3.5 h-3.5 text-[#004741] dark:text-[#6ee7b7]" />
              <span>{language === 'en' ? 'HI' : 'EN'}</span>
            </button>
          )}

          {onThemeToggle && (
            <button
              onClick={() => {
                soundManager.play('toggle');
                onThemeToggle();
              }}
              title="Toggle Dark/Light Mode"
              className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:border-[#004741] text-black dark:text-[#F0EDE4] transition-all"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-black" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-md mx-auto space-y-5 my-auto">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#004741] text-[#F0EDE4] shadow-md shadow-[#004741]/20">
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-black dark:text-[#F0EDE4]">
              StudyMate
            </h1>
            <span className="px-1.5 py-0.5 rounded-md bg-[#004741] text-[#F0EDE4] text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" />
              AI
            </span>
          </div>

          <p className="text-xs sm:text-sm text-black/60 dark:text-[#F0EDE4]/60 max-w-xs mx-auto">
            {language === 'hi'
              ? 'गुजरात टेक्नोलॉजिकल यूनिवर्सिटी (GTU) BCA अध्ययन पोर्टल'
              : 'Gujarat Technological University (GTU) BCA Academic Portal'}
          </p>
        </div>

        {/* Auth Mode Tabs (Login / Register) */}
        <div className="p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              soundManager.play('nav_tap');
              setMode('login');
              setErrorMessage(null);
              setErrors({});
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-[#004741] text-[#F0EDE4] shadow-sm'
                : 'text-black/70 dark:text-[#F0EDE4]/70 hover:text-black dark:hover:text-[#F0EDE4]'
            }`}
          >
            {language === 'hi' ? 'लॉग इन' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              soundManager.play('nav_tap');
              setMode('register');
              setErrorMessage(null);
              setErrors({});
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-[#004741] text-[#F0EDE4] shadow-sm'
                : 'text-black/70 dark:text-[#F0EDE4]/70 hover:text-black dark:hover:text-[#F0EDE4]'
            }`}
          >
            {language === 'hi' ? 'खाता बनाएं' : 'Create Account'}
          </button>
        </div>

        {/* Card Box */}
        <div className="bg-white dark:bg-[#0c120f] border border-black/10 dark:border-white/10 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
          {/* Success Banner */}
          {successBanner && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successBanner}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ===================== LOGIN FORM ===================== */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 dark:text-[#F0EDE4]/70">
                  {language === 'hi' ? 'ईमेल पता' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-[#F0EDE4]/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="faizan@gtu.ac.in"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F0EDE4]/50 dark:bg-[#070b09] border ${
                      errors.email ? 'border-red-500' : 'border-black/15 dark:border-white/15'
                    } text-xs text-black dark:text-[#F0EDE4] focus:outline-none focus:ring-2 focus:ring-[#004741]`}
                  />
                </div>
                {errors.email && <p className="text-[10px] text-red-600">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 dark:text-[#F0EDE4]/70">
                    {language === 'hi' ? 'पासवर्ड' : 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('button_click');
                      setIsForgotOpen(true);
                    }}
                    className="text-[11px] font-semibold text-[#004741] dark:text-[#6ee7b7] hover:underline"
                  >
                    {language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-[#F0EDE4]/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#F0EDE4]/50 dark:bg-[#070b09] border ${
                      errors.password ? 'border-red-500' : 'border-black/15 dark:border-white/15'
                    } text-xs text-black dark:text-[#F0EDE4] focus:outline-none focus:ring-2 focus:ring-[#004741]`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-[#F0EDE4]/40 hover:text-black dark:hover:text-[#F0EDE4]"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-red-600">{errors.password}</p>}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#004741] focus:ring-[#004741] cursor-pointer"
                  />
                  <span className="text-black/70 dark:text-[#F0EDE4]/70">
                    {language === 'hi' ? 'मुझे याद रखें' : 'Remember me'}
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold hover:bg-[#003833] transition-all disabled:opacity-50 active:scale-95 shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{language === 'hi' ? 'सत्यापित हो रहा है...' : 'Authenticating...'}</span>
                  </>
                ) : (
                  <>
                    <span>{language === 'hi' ? 'लॉग इन करें' : 'Sign In to StudyMate'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Demo Access Button */}
              <div className="pt-2 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleDemoStudentLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-black/15 dark:border-white/15 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold text-black dark:text-[#F0EDE4] transition-all"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>
                    {language === 'hi'
                      ? 'डेमो छात्र के रूप में जारी रखें (फैज़ान आलम)'
                      : 'One-Click Demo Student Access (Faizan Alam)'}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            /* ===================== REGISTER FORM ===================== */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 dark:text-[#F0EDE4]/70">
                  {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-[#F0EDE4]/40" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder="Faizan Alam"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F0EDE4]/50 dark:bg-[#070b09] border ${
                      errors.name ? 'border-red-500' : 'border-black/15 dark:border-white/15'
                    } text-xs text-black dark:text-[#F0EDE4] focus:outline-none focus:ring-2 focus:ring-[#004741]`}
                  />
                </div>
                {errors.name && <p className="text-[10px] text-red-600">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 dark:text-[#F0EDE4]/70">
                  {language === 'hi' ? 'ईमेल पता' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-[#F0EDE4]/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="student@gtu.ac.in"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F0EDE4]/50 dark:bg-[#070b09] border ${
                      errors.email ? 'border-red-500' : 'border-black/15 dark:border-white/15'
                    } text-xs text-black dark:text-[#F0EDE4] focus:outline-none focus:ring-2 focus:ring-[#004741]`}
                  />
                </div>
                {errors.email && <p className="text-[10px] text-red-600">{errors.email}</p>}
              </div>

              {/* University & Semester Selectors */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 dark:text-[#F0EDE4]/70">
                    {language === 'hi' ? 'सेमेस्टर' : 'Semester'}
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F0EDE4]/50 dark:bg-[#070b09] border border-black/15 dark:border-white/15 text-xs text-black dark:text-[#F0EDE4] focus:outline-none focus:ring-2 focus:ring-[#004741]"
                  >
                    {[1, 2, 3, 4, 5, 6].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 dark:text-[#F0EDE4]/70">
                    {language === 'hi' ? 'पाठ्यक्रम' : 'Course'}
                  </label>
                  <input
                    type="text"
                    disabled
                    value="GTU BCA"
                    className="w-full px-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-bold text-[#004741] dark:text-[#6ee7b7]"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 dark:text-[#F0EDE4]/70">
                  {language === 'hi' ? 'पासवर्ड (कम से कम 6 अक्षर)' : 'Password (Min 6 chars)'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-[#F0EDE4]/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#F0EDE4]/50 dark:bg-[#070b09] border ${
                      errors.password ? 'border-red-500' : 'border-black/15 dark:border-white/15'
                    } text-xs text-black dark:text-[#F0EDE4] focus:outline-none focus:ring-2 focus:ring-[#004741]`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-[#F0EDE4]/40 hover:text-black dark:hover:text-[#F0EDE4]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-red-600">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 dark:text-[#F0EDE4]/70">
                  {language === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-[#F0EDE4]/40" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword)
                        setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#F0EDE4]/50 dark:bg-[#070b09] border ${
                      errors.confirmPassword ? 'border-red-500' : 'border-black/15 dark:border-white/15'
                    } text-xs text-black dark:text-[#F0EDE4] focus:outline-none focus:ring-2 focus:ring-[#004741]`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-[#F0EDE4]/40 hover:text-black dark:hover:text-[#F0EDE4]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[10px] text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Register */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold hover:bg-[#003833] transition-all disabled:opacity-50 active:scale-95 shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{language === 'hi' ? 'खाता बन रहा है...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    <span>{language === 'hi' ? 'खाता बनाएं' : 'Create Student Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Switch Prompt */}
          <div className="text-center text-xs text-black/60 dark:text-[#F0EDE4]/60 pt-2 border-t border-black/10 dark:border-white/10">
            {mode === 'login' ? (
              <p>
                {language === 'hi' ? 'खाता नहीं है?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('nav_tap');
                    setMode('register');
                    setErrorMessage(null);
                    setErrors({});
                  }}
                  className="font-bold text-[#004741] dark:text-[#6ee7b7] hover:underline"
                >
                  {language === 'hi' ? 'रजिस्टर करें' : 'Create Account'}
                </button>
              </p>
            ) : (
              <p>
                {language === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('nav_tap');
                    setMode('login');
                    setErrorMessage(null);
                    setErrors({});
                  }}
                  className="font-bold text-[#004741] dark:text-[#6ee7b7] hover:underline"
                >
                  {language === 'hi' ? 'लॉग इन करें' : 'Sign In'}
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security / Architecture Notice */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-black/50 dark:text-[#F0EDE4]/50">
          <ShieldCheck className="w-3.5 h-3.5 text-[#004741] dark:text-[#6ee7b7]" />
          <span>GTU Academic Security • Firebase Authentication Compatible</span>
        </div>

        {onCancel && (
          <div className="text-center">
            <button
              onClick={onCancel}
              className="text-xs text-black/60 dark:text-[#F0EDE4]/60 hover:underline"
            >
              {language === 'hi' ? 'डैशबोर्ड पर लौटें' : 'Return to Dashboard'}
            </button>
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        language={language}
        initialEmail={email}
      />
    </div>
  );
};
