import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Volume2, 
  VolumeX,
  Send,
  Bot,
  User,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLunaraVoice } from '@/hooks/useLunaraVoice';
import { useLanguage } from '@/contexts/LanguageContext';

const VoiceAssistant: React.FC = () => {
  const { t } = useLanguage();
  const {
    isConnected,
    isListening,
    isProcessing,
    isSpeaking,
    messages,
    connect,
    disconnect,
    toggleListening,
    sendTextMessage,
    stopSpeaking
  } = useLunaraVoice();
  
  const [textInput, setTextInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendText = () => {
    if (textInput.trim()) {
      sendTextMessage(textInput);
      setTextInput('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status Bar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
          <span className="text-sm text-muted-foreground font-exo">
            {isConnected ? 'Голосовой режим активен' : 'Нажмите для подключения'}
          </span>
        </div>
        
        <Button
          variant={isConnected ? "destructive" : "default"}
          size="sm"
          onClick={isConnected ? disconnect : connect}
          disabled={isProcessing}
          className="gap-2"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isConnected ? (
            <>
              <PhoneOff className="w-4 h-4" />
              Отключить
            </>
          ) : (
            <>
              <Phone className="w-4 h-4" />
              Подключить
            </>
          )}
        </Button>
      </div>

      {/* Messages Area */}
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
              <div className={`flex items-start gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' ? 'bg-primary' : 'bg-gradient-to-br from-violet-500 to-purple-600'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-primary-foreground" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-foreground'
                }`}>
                  <p className="text-sm font-exo whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Processing indicator */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
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

      {/* Voice Controls */}
      {isConnected && (
        <div className="p-4 border-t border-border">
          {/* Large Mic Button */}
          <div className="flex justify-center mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleListening}
              disabled={isProcessing}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening 
                  ? 'bg-red-500 shadow-lg shadow-red-500/50 animate-pulse' 
                  : 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </motion.button>
          </div>

          {/* Status text */}
          <p className="text-center text-sm text-muted-foreground mb-4 font-exo">
            {isListening ? '🎙️ Слушаю...' : isProcessing ? '⏳ Обрабатываю...' : isSpeaking ? '🔊 Говорю...' : 'Нажмите для записи'}
          </p>

          {/* Speaking control */}
          {isSpeaking && (
            <div className="flex justify-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={stopSpeaking}
                className="text-muted-foreground"
              >
                <VolumeX className="w-4 h-4 mr-2" />
                Остановить
              </Button>
            </div>
          )}

          {/* Text input fallback */}
          <div className="flex gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
              placeholder="Или напишите сообщение..."
              className="flex-1 bg-secondary border-border text-foreground font-exo"
              disabled={isProcessing}
            />
            <Button 
              onClick={handleSendText}
              disabled={!textInput.trim() || isProcessing}
              size="icon"
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Connect prompt when disconnected */}
      {!isConnected && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mb-6"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/40 to-purple-600/40 flex items-center justify-center">
              <Mic className="w-12 h-12 text-primary" />
            </div>
          </motion.div>
          
          <h2 className="text-xl font-orbitron font-bold text-foreground mb-2">
            Голосовой AI Twin
          </h2>
          <p className="text-muted-foreground text-center font-exo max-w-xs mb-6">
            Поговорите с вашим персональным health-ассистентом голосом
          </p>
          
          <Button
            onClick={connect}
            disabled={isProcessing}
            className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Phone className="w-5 h-5" />
            )}
            Начать разговор
          </Button>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;
