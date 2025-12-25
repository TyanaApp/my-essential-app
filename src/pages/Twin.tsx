import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, RotateCcw, Bot, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const Twin = () => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: language === 'ru' 
        ? 'Привет! Я ваш ИИ-близнец для здоровья. Как я могу помочь вам сегодня?'
        : language === 'lv'
        ? 'Sveiki! Es esmu jūsu veselības AI dvīnis. Kā es varu jums palīdzēt šodien?'
        : 'Hello! I\'m your AI Health Twin. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = {
        en: [
          "Based on your sleep data, I recommend going to bed 30 minutes earlier tonight.",
          "Your stress levels have been elevated. Consider a 10-minute meditation session.",
          "Great question! Your energy patterns suggest morning workouts would be optimal for you.",
          "I've analyzed your health metrics. Your recovery is progressing well!"
        ],
        ru: [
          "На основе ваших данных о сне, рекомендую лечь спать на 30 минут раньше сегодня.",
          "Ваш уровень стресса повышен. Рассмотрите 10-минутную медитацию.",
          "Отличный вопрос! Ваши паттерны энергии показывают, что утренние тренировки оптимальны.",
          "Я проанализировал ваши метрики здоровья. Восстановление идёт хорошо!"
        ],
        lv: [
          "Balstoties uz jūsu miega datiem, iesaku doties gulēt 30 minūtes agrāk šovakar.",
          "Jūsu stresa līmenis ir paaugstināts. Apsveriet 10 minūšu meditāciju.",
          "Lielisks jautājums! Jūsu enerģijas modeļi liecina, ka rīta treniņi būtu optimāli.",
          "Esmu analizējis jūsu veselības rādītājus. Atjaunošanās norit labi!"
        ]
      };

      const langResponses = responses[language] || responses.en;
      const randomResponse = langResponses[Math.floor(Math.random() * langResponses.length)];

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: randomResponse
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: language === 'ru' 
        ? 'Привет! Я ваш ИИ-близнец для здоровья. Как я могу помочь вам сегодня?'
        : language === 'lv'
        ? 'Sveiki! Es esmu jūsu veselības AI dvīnis. Kā es varu jums palīdzēt šodien?'
        : 'Hello! I\'m your AI Health Twin. How can I help you today?'
    }]);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-orbitron font-bold text-foreground">AI {t('twin')}</h1>
            <p className="text-xs text-muted-foreground font-exo">Health Assistant</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearChat}
          className="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' ? 'bg-primary' : 'bg-secondary'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-primary-foreground" />
                  ) : (
                    <Bot className="w-4 h-4 text-foreground" />
                  )}
                </div>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-foreground'
                }`}>
                  <p className="text-sm font-exo">{message.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <Bot className="w-4 h-4 text-foreground" />
              </div>
              <div className="bg-secondary rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border pb-24">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('askAI')}
            className="flex-1 bg-secondary border-border text-foreground font-exo"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!input.trim() || isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Twin;
