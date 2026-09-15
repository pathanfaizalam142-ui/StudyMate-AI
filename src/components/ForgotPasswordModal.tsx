import React, { useState } from 'react';
import { X, Mail, CheckCircle2, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { authService } from '../services/authService';
import { soundManager } from '../services/soundManager';
import { AppLanguage } from '../types';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: AppLanguage;
  initialEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  language,
  initialEmail = '',
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError(language === 'hi' ? 'कृपया अपना ईमेल दर्ज करें।' : 'Please enter your email address.');
      return;
    }

    setLoading(true);
    soundManager.play('button_click');

    try {
      const res = await authService.sendPasswordReset(email);
      if (res.success) {
        soundManager.play('save');
        setSuccessMessage(res.message);
      } else {
        setError(res.message);
      }
    } catch {
      setError(
        language === 'hi'
          ? 'पासवर्ड रीसेट अनुरोध विफल रहा। कृपया पुन: प्रयास करें।'
          : 'Failed to process password reset request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-[#F0EDE4] dark:bg-[#0c1412] border border-black/20 dark:border-white/20 shadow-2xl p-5 sm:p-7 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-black dark:text-[#F0EDE4]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#004741] text-[#F0EDE4]">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black dark:text-[#F0EDE4]">
                {language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
              </h2>
              <p className="text-[11px] text-black/60 dark:text-[#F0EDE4]/60">
                {language === 'hi' ? 'अपना पंजीकृत ईमेल दर्ज करें' : 'Reset your student account credentials'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.play('button_click');
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-[#F0EDE4] transition-all"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'hi' ? 'रीसेट लिंक भेजा गया' : 'Reset Instructions Sent'}</span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">{successMessage}</p>
            </div>

            <button
              onClick={() => {
                soundManager.play('button_click');
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold shadow-sm hover:bg-[#003833] transition-all"
            >
              {language === 'hi' ? 'लॉगिन पर लौटें' : 'Back to Login'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-black/70 dark:text-[#F0EDE4]/70 leading-relaxed">
              {language === 'hi'
                ? 'अपना पंजीकृत ईमेल पता दर्ज करें। हम आपको अपना पासवर्ड सुरक्षित रूप से रीसेट करने के निर्देश भेजेंगे।'
                : 'Enter the email address associated with your GTU student account. We will send you verification instructions to reset your password.'}
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 dark:text-[#F0EDE4]/70">
                {language === 'hi' ? 'ईमेल पता' : 'Registered Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-[#F0EDE4]/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@gtu.ac.in"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-[#070b09] border border-black/15 dark:border-white/15 text-xs text-black dark:text-[#F0EDE4] focus:outline-none focus:ring-2 focus:ring-[#004741]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  soundManager.play('button_click');
                  onClose();
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold hover:bg-[#003833] transition-all disabled:opacity-50 active:scale-95 shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{language === 'hi' ? 'भेजा जा रहा है...' : 'Sending...'}</span>
                  </>
                ) : (
                  <>
                    <span>{language === 'hi' ? 'रीसेट लिंक भेजें' : 'Send Reset Link'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
