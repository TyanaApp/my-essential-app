import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, RotateCcw, Bot, User, Mic, Loader2, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAIChat } from '@/hooks/useAIChat';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

const Twin = () => {
  const { t } = useLanguage();
  const { messages, isLoading, sendMessage, clearChat, initializeChat } = useAIChat();
  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isSpeaking, speakingMessageId, speak, stop } = useTextToSpeech();

  const handleTranscription = (text: string) => {
    setInput(text);
  };

  const { isRecording, isProcessing, toggleRecording } = useVoiceInput(handleTranscription);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleSpeak = (messageId: string, content: string) => {
    speak(content, messageId);
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
            <p className="text-xs text-muted-foreground font-exo">{t('healthAssistant')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <Button
              variant="ghost"
              size="icon"
              onClick={stop}
              className="text-primary"
            >
              <VolumeX className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
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
                  <p className="text-sm font-exo whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Speaker button for assistant messages */}
                  {message.role === 'assistant' && message.content && message.id !== 'initial' && (
                    <button
                      onClick={() => handleSpeak(message.id, message.content)}
                      className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${speakingMessageId === message.id ? 'text-primary animate-pulse' : ''}`} />
                      <span>{speakingMessageId === message.id ? t('stop') : t('listen')}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
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
          <Button
            type="button"
            size="icon"
            variant={isRecording ? "default" : "secondary"}
            onClick={toggleRecording}
            disabled={isProcessing || isLoading}
            className={`flex-shrink-0 ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}`}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRecording ? `🎙️ ${t('speaking')}` : t('askAI')}
            className="flex-1 bg-secondary border-border text-foreground font-exo"
            disabled={isLoading || isRecording}
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
