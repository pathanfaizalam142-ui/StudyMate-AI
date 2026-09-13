import React, { useState } from 'react';
import { X, Plus, Layers, BookOpen } from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { SubjectItem, AppLanguage } from '../types';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSubject: (subject: SubjectItem) => void;
  language: AppLanguage;
}

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  isOpen,
  onClose,
  onAddSubject,
  language,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [iconName, setIconName] = useState('general');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    soundManager.play('save');
    onAddSubject({
      id: `subj-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase() || undefined,
      iconName,
    });

    setName('');
    setCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#F0EDE4] dark:bg-[#0c1412] border border-black/20 dark:border-white/20 shadow-2xl p-4 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#004741] text-[#F0EDE4]">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-black dark:text-[#F0EDE4]">
              {language === 'hi' ? 'नया विषय जोड़ें' : 'Add New Subject'}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-black dark:text-[#F0EDE4] uppercase tracking-wider mb-1.5">
              {language === 'hi' ? 'विषय का नाम' : 'Subject Name *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Database Management Systems"
              className="w-full py-2.5 px-3 rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#004741]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black dark:text-[#F0EDE4] uppercase tracking-wider mb-1.5">
              {language === 'hi' ? 'विषय कोड (वैकल्पिक)' : 'Course Code (Optional)'}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. CS-402 / IT-301"
              className="w-full py-2.5 px-3 rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#004741]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black dark:text-[#F0EDE4] uppercase tracking-wider mb-1.5">
              {language === 'hi' ? 'आइकन शैली' : 'Icon Style'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'general', label: 'General' },
                { id: 'java', label: 'Code' },
                { id: 'networks', label: 'Network' },
                { id: 'os', label: 'System' },
                { id: 'math', label: 'Math' },
                { id: 'web', label: 'Web' },
                { id: 'design', label: 'Design' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIconName(opt.id)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    iconName === opt.id
                      ? 'bg-[#004741] text-[#F0EDE4] border-[#004741]'
                      : 'bg-white dark:bg-black/40 border-black/10 dark:border-white/10 text-black dark:text-[#F0EDE4]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                soundManager.play('button_click');
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-black dark:text-[#F0EDE4] hover:bg-black/5 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'विषय जोड़ें' : 'Add Subject'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
