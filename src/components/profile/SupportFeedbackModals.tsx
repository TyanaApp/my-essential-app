import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, CheckCircle2, ArrowLeft, Send } from 'lucide-react';

const T = {
  en: {
    supportTitle: 'Contact us',
    placeholder: 'Describe in detail — we read every message',
    send: '📨 Send',
    successTitle: 'Got it! Thank you',
    successText: 'We usually respond within 24 hours',
    back: '← Back',
    minChars: 'Minimum 20 characters',
    topicBug: '🐛 Bug',
    topicIdea: '💡 Idea',
    topicQuestion: '❓ Question',
    topicBilling: '💳 Billing',
    topicOther: '🔧 Other',
    ideasTitle: 'Ideas & Suggestions',
    ideasPlaceholder: 'What feature is missing? What can be improved?',
    ideaSuccessTitle: 'Got it! Thank you',
    ideaSuccessText: 'We read every suggestion 💜',
    importance: 'Importance',
    ratingTitle: 'Rate the app',
    ratingPlaceholder: 'Any comments? (optional)',
    ratingSent: 'Thank you for your feedback! 💜',
  },
  ru: {
    supportTitle: 'Напиши нам',
    placeholder: 'Опиши подробно — мы читаем каждое сообщение',
    send: '📨 Отправить',
    successTitle: 'Получили! Спасибо',
    successText: 'Обычно отвечаем в течение 24 часов',
    back: '← Назад',
    minChars: 'Минимум 20 символов',
    topicBug: '🐛 Баг / ошибка',
    topicIdea: '💡 Идея',
    topicQuestion: '❓ Вопрос',
    topicBilling: '💳 Оплата',
    topicOther: '🔧 Другое',
    ideasTitle: 'Идеи и предложения',
    ideasPlaceholder: 'Какой функции не хватает? Что можно улучшить?',
    ideaSuccessTitle: 'Получили! Спасибо',
    ideaSuccessText: 'Мы читаем каждое предложение 💜',
    importance: 'Важность',
    ratingTitle: 'Оценить приложение',
    ratingPlaceholder: 'Комментарий (необязательно)',
    ratingSent: 'Спасибо за отзыв! 💜',
  },
  lv: {
    supportTitle: 'Raksti mums',
    placeholder: 'Apraksti detalizēti — mēs lasām katru ziņu',
    send: '📨 Nosūtīt',
    successTitle: 'Saņēmām! Paldies',
    successText: 'Parasti atbildam 24 stundu laikā',
    back: '← Atpakaļ',
    minChars: 'Minimums 20 rakstzīmes',
    topicBug: '🐛 Kļūda',
    topicIdea: '💡 Ideja',
    topicQuestion: '❓ Jautājums',
    topicBilling: '💳 Maksājums',
    topicOther: '🔧 Cits',
    ideasTitle: 'Idejas un priekšlikumi',
    ideasPlaceholder: 'Kādas funkcijas trūkst? Ko var uzlabot?',
    ideaSuccessTitle: 'Saņēmām! Paldies',
    ideaSuccessText: 'Mēs lasām katru priekšlikumu 💜',
    importance: 'Svarīgums',
    ratingTitle: 'Novērtēt lietotni',
    ratingPlaceholder: 'Komentārs (neobligāti)',
    ratingSent: 'Paldies par atsauksmi! 💜',
  },
  uk: {
    supportTitle: 'Напиши нам',
    placeholder: 'Опиши детально — ми читаємо кожне повідомлення',
    send: '📨 Надіслати',
    successTitle: 'Отримали! Дякуємо',
    successText: 'Зазвичай відповідаємо протягом 24 годин',
    back: '← Назад',
    minChars: 'Мінімум 20 символів',
    topicBug: '🐛 Баг / помилка',
    topicIdea: '💡 Ідея',
    topicQuestion: '❓ Питання',
    topicBilling: '💳 Оплата',
    topicOther: '🔧 Інше',
    ideasTitle: 'Ідеї та пропозиції',
    ideasPlaceholder: 'Якої функції не вистачає? Що можна покращити?',
    ideaSuccessTitle: 'Отримали! Дякуємо',
    ideaSuccessText: 'Ми читаємо кожну пропозицію 💜',
    importance: 'Важливість',
    ratingTitle: 'Оцінити додаток',
    ratingPlaceholder: 'Коментар (необов\'язково)',
    ratingSent: 'Дякуємо за відгук! 💜',
  },
};

const TOPICS = [
  { value: 'bug', key: 'topicBug' },
  { value: 'idea', key: 'topicIdea' },
  { value: 'question', key: 'topicQuestion' },
  { value: 'billing', key: 'topicBilling' },
  { value: 'other', key: 'topicOther' },
] as const;

function getDeviceType() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  return 'Desktop';
}

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SupportModal: React.FC<ModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = T[language as keyof typeof T] || T.en;
  const [topic, setTopic] = useState('other');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!user || message.length < 20) return;
    setSending(true);
    await supabase.from('support_tickets' as any).insert({
      user_id: user.id,
      email: user.email,
      subject: topic,
      message,
      language,
      device: getDeviceType(),
      app_version: '1.0.0',
    } as any);
    setSending(false);
    setSent(true);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setSent(false);
      setMessage('');
      setTopic('other');
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        {sent ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <h2 className="text-lg font-bold text-foreground">{t.successTitle}</h2>
            <p className="text-sm text-muted-foreground text-center">{t.successText}</p>
            <Button variant="ghost" onClick={() => handleClose(false)} className="mt-4 gap-2">
              <ArrowLeft className="w-4 h-4" /> {t.back}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-bold text-foreground">💬 {t.supportTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex flex-wrap gap-2">
                {TOPICS.map(tp => (
                  <button
                    key={tp.value}
                    onClick={() => setTopic(tp.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      topic === tp.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-secondary-foreground border-border hover:bg-accent'
                    }`}
                  >
                    {t[tp.key as keyof typeof t]}
                  </button>
                ))}
              </div>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.placeholder}
                className="min-h-[120px]"
              />
              {message.length > 0 && message.length < 20 && (
                <p className="text-xs text-destructive">{t.minChars}</p>
              )}
              <Button
                onClick={handleSend}
                disabled={sending || message.length < 20}
                className="w-full gap-2 bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4" /> {t.send}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const IdeasModal: React.FC<ModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = T[language as keyof typeof T] || T.en;
  const [suggestion, setSuggestion] = useState('');
  const [importance, setImportance] = useState(3);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!user || suggestion.length < 5) return;
    setSending(true);
    // Save to support_tickets with topic='idea'
    await supabase.from('support_tickets' as any).insert({
      user_id: user.id,
      email: user.email,
      subject: 'idea',
      message: suggestion,
      language,
      device: getDeviceType(),
      app_version: '1.0.0',
    } as any);
    // Also save to feedback for backwards compat
    await supabase.from('feedback' as any).insert({
      user_id: user.id,
      type: 'suggestion',
      suggestion,
      importance_rating: importance,
    } as any);
    setSending(false);
    setSent(true);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setSent(false);
      setSuggestion('');
      setImportance(3);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        {sent ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <h2 className="text-lg font-bold text-foreground">{t.ideaSuccessTitle}</h2>
            <p className="text-sm text-muted-foreground text-center">{t.ideaSuccessText}</p>
            <Button variant="ghost" onClick={() => handleClose(false)} className="mt-4 gap-2">
              <ArrowLeft className="w-4 h-4" /> {t.back}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-bold text-foreground">💡 {t.ideasTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder={t.ideasPlaceholder}
                className="min-h-[120px]"
              />
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">{t.importance}</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setImportance(n)} className="transition-transform hover:scale-110">
                      <Star className={`w-6 h-6 ${n <= importance ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleSend}
                disabled={sending || suggestion.length < 5}
                className="w-full gap-2 bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4" /> {t.send}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const RatingModal: React.FC<ModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = T[language as keyof typeof T] || T.en;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!user || rating === 0) return;
    setSending(true);
    await supabase.from('feedback' as any).insert({
      user_id: user.id,
      type: 'rating',
      rating,
      suggestion: comment || null,
    } as any);
    setSending(false);
    setSent(true);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setSent(false);
      setRating(0);
      setComment('');
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        {sent ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <h2 className="text-lg font-bold text-foreground">{t.ratingSent}</h2>
            <Button variant="ghost" onClick={() => handleClose(false)} className="mt-4 gap-2">
              <ArrowLeft className="w-4 h-4" /> {t.back}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-bold text-foreground">⭐️ {t.ratingTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRating(n)} className="transition-transform hover:scale-125">
                    <Star className={`w-10 h-10 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t.ratingPlaceholder}
                className="min-h-[80px]"
              />
              <Button
                onClick={handleSend}
                disabled={sending || rating === 0}
                className="w-full gap-2 bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4" /> {t.send}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
