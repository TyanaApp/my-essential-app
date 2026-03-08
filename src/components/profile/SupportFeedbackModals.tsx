import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

const T = {
  en: {
    supportTitle: 'Write to support',
    subjectTech: 'Technical issue', subjectBilling: 'Billing question', subjectOther: 'Other',
    messagePlaceholder: 'Describe your issue... (min 20 characters)',
    send: 'Send', sent: 'Message sent! We\'ll reply within 24 hours ✓',
    minChars: 'Minimum 20 characters',
    ideasTitle: 'Ideas & Suggestions',
    ideasPlaceholder: 'What should we improve in TYANA?',
    importance: 'Importance',
    ideaSent: 'Thank you! We read every suggestion 💜',
    ratingTitle: 'Rate the app',
    ratingPlaceholder: 'Any comments? (optional)',
    ratingSent: 'Thank you for your feedback! 💜',
    subject: 'Subject',
  },
  ru: {
    supportTitle: 'Написать в поддержку',
    subjectTech: 'Технический вопрос', subjectBilling: 'Вопрос об оплате', subjectOther: 'Другое',
    messagePlaceholder: 'Опишите проблему... (мин. 20 символов)',
    send: 'Отправить', sent: 'Сообщение отправлено! Ответим в течение 24 часов ✓',
    minChars: 'Минимум 20 символов',
    ideasTitle: 'Идеи и предложения',
    ideasPlaceholder: 'Что улучшить в TYANA?',
    importance: 'Важность',
    ideaSent: 'Спасибо! Мы читаем каждое предложение 💜',
    ratingTitle: 'Оценить приложение',
    ratingPlaceholder: 'Комментарий (необязательно)',
    ratingSent: 'Спасибо за отзыв! 💜',
    subject: 'Тема',
  },
  lv: {
    supportTitle: 'Rakstīt atbalstam',
    subjectTech: 'Tehnisks jautājums', subjectBilling: 'Maksājumu jautājums', subjectOther: 'Cits',
    messagePlaceholder: 'Aprakstiet problēmu... (min 20 rakstzīmes)',
    send: 'Nosūtīt', sent: 'Ziņa nosūtīta! Atbildēsim 24 stundu laikā ✓',
    minChars: 'Minimums 20 rakstzīmes',
    ideasTitle: 'Idejas un priekšlikumi',
    ideasPlaceholder: 'Ko uzlabot TYANA?',
    importance: 'Svarīgums',
    ideaSent: 'Paldies! Mēs lasām katru priekšlikumu 💜',
    ratingTitle: 'Novērtēt lietotni',
    ratingPlaceholder: 'Komentārs (neobligāti)',
    ratingSent: 'Paldies par atsauksmi! 💜',
    subject: 'Temats',
  },
  uk: {
    supportTitle: 'Написати в підтримку',
    subjectTech: 'Технічне питання', subjectBilling: 'Питання оплати', subjectOther: 'Інше',
    messagePlaceholder: 'Опишіть проблему... (мін. 20 символів)',
    send: 'Надіслати', sent: 'Повідомлення надіслано! Відповімо протягом 24 годин ✓',
    minChars: 'Мінімум 20 символів',
    ideasTitle: 'Ідеї та пропозиції',
    ideasPlaceholder: 'Що покращити в TYANA?',
    importance: 'Важливість',
    ideaSent: 'Дякуємо! Ми читаємо кожну пропозицію 💜',
    ratingTitle: 'Оцінити додаток',
    ratingPlaceholder: 'Коментар (необов\'язково)',
    ratingSent: 'Дякуємо за відгук! 💜',
    subject: 'Тема',
  },
};

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SupportModal: React.FC<ModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = T[language as keyof typeof T] || T.en;
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!user || message.length < 20) return;
    setSending(true);
    await supabase.from('support_tickets' as any).insert({
      user_id: user.id,
      email: user.email,
      subject: subject || 'Other',
      message,
    } as any);
    setSending(false);
    toast.success(t.sent);
    setMessage('');
    setSubject('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-bold text-foreground">💬 {t.supportTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t.subject}</label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue placeholder={t.subjectOther} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">{t.subjectTech}</SelectItem>
                <SelectItem value="billing">{t.subjectBilling}</SelectItem>
                <SelectItem value="other">{t.subjectOther}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.messagePlaceholder}
            className="min-h-[120px]"
          />
          {message.length > 0 && message.length < 20 && (
            <p className="text-xs text-destructive">{t.minChars}</p>
          )}
          <Button onClick={handleSend} disabled={sending || message.length < 20} className="w-full" style={{ backgroundColor: '#7C3AED' }}>
            {t.send}
          </Button>
        </div>
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

  const handleSend = async () => {
    if (!user || suggestion.length < 5) return;
    setSending(true);
    await supabase.from('feedback' as any).insert({
      user_id: user.id,
      type: 'suggestion',
      suggestion,
      importance_rating: importance,
    } as any);
    setSending(false);
    toast.success(t.ideaSent);
    setSuggestion('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
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
          <Button onClick={handleSend} disabled={sending || suggestion.length < 5} className="w-full" style={{ backgroundColor: '#7C3AED' }}>
            {t.send}
          </Button>
        </div>
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
    toast.success(t.ratingSent);
    setRating(0);
    setComment('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
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
          <Button onClick={handleSend} disabled={sending || rating === 0} className="w-full" style={{ backgroundColor: '#7C3AED' }}>
            {t.send}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
