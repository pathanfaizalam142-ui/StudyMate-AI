import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Share2,
  RotateCcw,
  Volume2,
  VolumeX,
  Trash2,
  Sparkles,
  Bot,
  User,
  AlertCircle,
  Cpu,
  HelpCircle,
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { api } from '../services/api';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { ChatMessage, SubjectItem, SavedItem, AppLanguage, AppTheme } from '../types';
import { translations } from '../services/i18n';

interface AskAIViewProps {
  language: AppLanguage;
  theme: AppTheme;
  subjects: SubjectItem[];
  initialQuery?: string;
  initialSubject?: string;
  onSaveItem: (item: Omit<SavedItem, 'id' | 'timestamp'>) => void;
  savedItemIds: string[];
}

export const AskAIView: React.FC<AskAIViewProps> = ({
  language,
  theme,
  subjects,
  initialQuery,
  initialSubject,
  onSaveItem,
}) => {
  const t = translations[language];

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem('studymate_chat_history');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        text:
          language === 'hi'
            ? 'नमस्ते! मैं StudyMate AI हूँ। आप किसी भी विषय का प्रश्न, परीक्षा में आने वाले महत्वपूर्ण टॉपिक, गणितीय सूत्र या कोड पूछ सकते हैं।'
            : "Hello! I'm StudyMate AI. Ask me any study question, difficult concept, mathematical equation, or exam topic. I'll provide crisp definitions, analogies, step-by-step math derivations, and scoring tips.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFallback: false,
      },
    ];
  });

  const [inputText, setInputText] = useState(initialQuery || '');
  const [selectedSubject, setSelectedSubject] = useState(initialSubject || '');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isGeminiConnected, setIsGeminiConnected] = useState<boolean | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check health and Gemini connection status
  useEffect(() => {
    let isMounted = true;
    api.checkHealth().then((health) => {
      if (isMounted) {
        setIsGeminiConnected(health.geminiConfigured);
      }
    }).catch(() => {
      if (isMounted) {
        setIsGeminiConnected(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Save chat to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('studymate_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle initialQuery if passed
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery.trim());
    }
  }, [initialQuery]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    soundManager.play('button_click');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: selectedSubject || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await api.askAI({
        prompt: query.trim(),
        subject: selectedSubject || undefined,
        history: messages.map((m) => ({ role: m.role, text: m.text })),
        language,
      });

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        subject: selectedSubject || undefined,
        isFallback: response.isFallback,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      soundManager.play('ai_response_ready');
    } catch (err: any) {
      const fallbackMessage: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        text:
          language === 'hi'
            ? `क्षमा करें, प्रतिक्रिया प्राप्त करने में समस्या हुई। कृपया पुनः प्रयास करें। (${err.message})`
            : `I encountered an issue generating that response. Please try again. (${err.message})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFallback: true,
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    soundManager.play('button_click');
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = (msg: ChatMessage) => {
    soundManager.play('save');
    onSaveItem({
      title: msg.text.slice(0, 60).replace(/[#*`$\\]/g, '').trim() + '...',
      type: 'ai_answer',
      content: msg.text,
      subject: msg.subject || 'General Study',
    });
    setSavedMessageIds((prev) => new Set(prev).add(msg.id));
  };

  const handleShare = (text: string) => {
    soundManager.play('button_click');
    if (navigator.share) {
      navigator
        .share({
          title: 'StudyMate AI Explanation',
          text,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      soundManager.play('save');
    }
  };

  const handleRegenerate = (lastUserPrompt?: string) => {
    soundManager.play('button_click');
    const prompt =
      lastUserPrompt ||
      [...messages].reverse().find((m) => m.role === 'user')?.text;
    if (prompt) {
      handleSendMessage(prompt);
    }
  };

  const handleToggleSpeech = (msgId: string, text: string) => {
    soundManager.play('button_click');
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting symbols and latex for speech clarity
    const cleanText = text
      .replace(/[#*`_~$\\]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/\\text\{([^}]*)\}/g, '$1')
      .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1 divided by $2');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 1.0;

    utterance.onend = () => {
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setSpeakingMsgId(null);
    };

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleClearChat = () => {
    soundManager.play('delete');
    const initialAssistantMessage: ChatMessage = {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      text:
        language === 'hi'
          ? 'चैट इतिहास साफ़ कर दिया गया है। नया प्रश्न पूछें!'
          : 'Chat history cleared. What would you like to study next?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isFallback: false,
    };
    setMessages([initialAssistantMessage]);
    localStorage.removeItem('studymate_chat_history');
  };

  const handleVoiceInput = () => {
    soundManager.play('button_click');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
        soundManager.play('save');
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div id="ask-ai-view" className="flex-1 flex flex-col max-w-4xl mx-auto w-full min-w-0 min-h-0">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-black/10 dark:border-[#263449] shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-display font-black text-black dark:text-[#F1F5F9] tracking-tight">
              {t.askHeader}
            </h1>
            
            {/* Connection Status: Gemini 3.8 Flash vs Demo Mode */}
            {isGeminiConnected === false ? (
              <span
                className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 shrink-0"
                title="API is not connected. Running in Demo Mode with local study bank."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Demo Mode
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-[#004741] dark:text-[#38BDF8] flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#004741] dark:bg-[#38BDF8]" />
                Gemini 3.8 Flash
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-black/60 dark:text-[#94A3B8] truncate">
            {t.askSub}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Subject selector */}
          <select
            value={selectedSubject}
            onChange={(e) => {
              soundManager.play('button_click');
              setSelectedSubject(e.target.value);
            }}
            className="text-xs font-semibold py-1.5 px-2.5 rounded-xl border border-black/15 dark:border-[#263449] bg-white/80 dark:bg-[#111827] text-black dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#004741] max-w-[200px]"
          >
            <option value="">{language === 'hi' ? 'सभी विषय' : 'All Subjects'}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Clear Chat */}
          <button
            onClick={handleClearChat}
            title={t.clearChat}
            className="p-1.5 sm:p-2 rounded-xl border border-black/15 dark:border-[#263449] hover:bg-black/5 dark:hover:bg-[#1E293B] text-black dark:text-[#F1F5F9] active:scale-95 transition-all shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Demo Mode Notice Banner if API is not connected */}
      {isGeminiConnected === false && (
        <div className="mt-2 p-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            {language === 'hi'
              ? 'डेमो मोड सक्रिय: एपीआई कनेक्टेड नहीं है। स्थानीय अध्ययन मॉडल से उत्तर दिए जा रहे हैं।'
              : 'Demo Mode Active: AI key is not connected. Responses are generated via our local educational study bank.'}
          </span>
        </div>
      )}

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1 min-h-0 flex flex-col">
        {messages.length === 1 && messages[0].id.startsWith('welcome') ? (
          <div className="my-auto py-6 sm:py-8 flex flex-col items-center justify-center text-center max-w-lg mx-auto px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#004741] text-[#F0EDE4] flex items-center justify-center shadow-xs">
              <Bot className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-black dark:text-[#F1F5F9] tracking-tight">
                {language === 'hi' ? 'StudyMate AI अध्ययन सहायक' : 'StudyMate AI Study Assistant'}
              </h2>
              <p className="text-xs sm:text-sm text-black/65 dark:text-[#94A3B8] leading-relaxed">
                {messages[0].text}
              </p>
            </div>
            <p className="text-[11px] font-semibold text-[#004741] dark:text-[#38BDF8] pt-1">
              {language === 'hi'
                ? 'नीचे दिए गए सुझावों में से चुनें या अपना अध्ययन प्रश्न टाइप करें:'
                : 'Select a suggested topic below or type your study question:'}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSaved = savedMessageIds.has(msg.id);
            const isCopied = copiedId === msg.id;
            const isSpeaking = speakingMsgId === msg.id;
            const isDemoMsg = msg.isFallback === true || (isGeminiConnected === false && !isUser);

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 sm:gap-3 ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#004741] text-[#F0EDE4] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 text-sm shadow-xs relative ${
                    isUser
                      ? 'bg-[#004741] text-[#F0EDE4] rounded-tr-none'
                      : 'bg-white/95 dark:bg-[#172033] text-black dark:text-[#F1F5F9] border border-black/10 dark:border-[#263449] rounded-tl-none'
                  }`}
                >
                  {/* Header tags: Subject & Model Origin */}
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      {msg.subject && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isUser
                              ? 'text-[#F0EDE4]/80'
                              : 'text-[#004741] dark:text-[#38BDF8]'
                          }`}
                        >
                          {msg.subject}
                        </span>
                      )}
                    </div>

                    {!isUser && (
                      <div className="text-[10px] font-medium">
                        {isDemoMsg ? (
                          <span className="text-amber-800 dark:text-amber-300 inline-flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-amber-500" />
                            Demo Mode
                          </span>
                        ) : (
                          <span className="text-black/50 dark:text-[#94A3B8]">
                            Gemini 3.8 Flash
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message Body with KaTeX Math, Tables, and Markdown */}
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  ) : (
                    <div className="study-ai-answer">
                      <MarkdownRenderer content={msg.text} theme={theme} />
                    </div>
                  )}

                  {/* Message Footer: Timestamp & Action Bar */}
                  <div
                    className={`mt-3 pt-2 flex items-center justify-between gap-2 border-t ${
                      isUser
                        ? 'border-white/15 text-[#F0EDE4]/70'
                        : 'border-black/5 dark:border-[#263449]/60 text-black/50 dark:text-[#94A3B8]'
                    }`}
                  >
                    <span className="text-[11px] font-mono">{msg.timestamp}</span>

                    {!isUser && (
                      <div className="flex items-center gap-1">
                        {/* Read Aloud / Stop */}
                        <button
                          onClick={() => handleToggleSpeech(msg.id, msg.text)}
                          title={isSpeaking ? t.stopReading : t.readAloud}
                          className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-[#1E293B] transition-colors ${
                            isSpeaking ? 'text-[#004741] dark:text-[#38BDF8] font-bold' : ''
                          }`}
                        >
                          {isSpeaking ? (
                            <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Copy */}
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          title={isCopied ? t.copied : t.copyAnswer}
                          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-[#1E293B] transition-colors"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Save to Bookmarks */}
                        <button
                          onClick={() => handleSave(msg)}
                          title={isSaved ? t.saved : t.saveAnswer}
                          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-[#1E293B] transition-colors"
                        >
                          {isSaved ? (
                            <BookmarkCheck className="w-3.5 h-3.5 text-[#004741] dark:text-[#38BDF8]" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Share */}
                        <button
                          onClick={() => handleShare(msg.text)}
                          title="Share Answer"
                          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-[#1E293B] transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-black text-[#F0EDE4] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#004741] text-[#F0EDE4] flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl rounded-tl-none bg-white/95 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#004741] animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[#004741] animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-[#004741] animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs font-semibold text-black/60 dark:text-[#94A3B8] ml-2">
                {language === 'hi' ? 'StudyMate AI उत्तर तैयार कर रहा है...' : 'StudyMate AI is drafting structured answer...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="pt-2 shrink-0">
        {/* Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs no-scrollbar">
          {[
            'Explain Bayes Theorem formula',
            'TCP vs UDP comparison table',
            'Time Complexity of Merge Sort with recurrence',
            'What is Page Replacement in OS?',
            'Polymorphism in Java with overriding',
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                soundManager.play('button_click');
                handleSendMessage(prompt);
              }}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-[#111827] border border-black/10 dark:border-[#263449] hover:border-[#004741] text-black dark:text-[#F1F5F9] text-xs font-medium active:scale-95 transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center w-full"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.askInputPlaceholder}
            disabled={isLoading}
            className="w-full pl-3.5 sm:pl-4 pr-24 sm:pr-28 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-[#172033] text-black dark:text-[#F1F5F9] border border-black/15 dark:border-[#263449] focus:outline-none focus:ring-2 focus:ring-[#004741] shadow-xs text-xs sm:text-sm"
          />

          <div className="absolute right-1.5 sm:right-2 flex items-center gap-1 sm:gap-1.5">
            {/* Voice Input */}
            <button
              type="button"
              onClick={handleVoiceInput}
              title={isListening ? t.listening : t.voiceInput}
              className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-black/5 dark:bg-white/5 text-black dark:text-[#F1F5F9] hover:bg-black/10'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            {/* Regenerate if messages exist */}
            {messages.length > 1 && (
              <button
                type="button"
                onClick={() => handleRegenerate()}
                title={t.regenerate}
                disabled={isLoading}
                className="p-1.5 sm:p-2 rounded-lg bg-black/5 dark:bg-white/5 text-black dark:text-[#F1F5F9] hover:bg-black/10 transition-all disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            {/* Send */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              title="Send Question"
              className="p-1.5 sm:p-2 rounded-lg bg-[#004741] text-[#F0EDE4] hover:bg-black transition-all disabled:opacity-40 disabled:hover:bg-[#004741] active:scale-95"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
