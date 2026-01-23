import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
}

export const useLunaraVoice = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize session
  const connect = useCallback(async () => {
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('lunara-voice-chat', {
        body: { action: 'get-session' }
      });

      if (error) throw error;
      
      if (data?.session_id) {
        setSessionId(data.session_id);
        setIsConnected(true);
        
        // Add welcome message
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: 'Привет! Я твой AI Health Twin. Нажми на микрофон и расскажи, как ты себя чувствуешь сегодня.'
        }]);
        
        toast.success('Голосовой ассистент подключен');
      } else {
        throw new Error('No session ID received');
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Не удалось подключиться к голосовому ассистенту');
      setIsConnected(false);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsConnected(false);
    setSessionId(null);
    setMessages([]);
    setIsListening(false);
    setIsSpeaking(false);
  }, []);

  // Start listening
  const startListening = useCallback(async () => {
    if (!sessionId) {
      toast.error('Сначала подключитесь к ассистенту');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // Convert to base64 and send
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          await processVoiceInput(base64);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Не удалось получить доступ к микрофону');
    }
  }, [sessionId]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  // Process voice input
  const processVoiceInput = async (base64Audio: string) => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('lunara-voice-chat', {
        body: { 
          action: 'voice-chat',
          audio: base64Audio,
          sessionId 
        }
      });

      if (error) throw error;

      if (data?.transcript) {
        // Add user message
        const userMessage: VoiceMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: data.transcript
        };
        setMessages(prev => [...prev, userMessage]);
      }

      if (data?.response) {
        // Add assistant response
        const assistantMessage: VoiceMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response.text || data.response,
          audioUrl: data.response.audio_url
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Play audio response if available
        if (data.response.audio_url || data.response.audio_data) {
          await playAudioResponse(data.response.audio_url || `data:audio/mpeg;base64,${data.response.audio_data}`);
        }
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      toast.error('Ошибка обработки голоса');
    } finally {
      setIsProcessing(false);
    }
  };

  // Send text message (fallback)
  const sendTextMessage = useCallback(async (message: string) => {
    if (!sessionId || !message.trim()) return;

    setIsProcessing(true);
    
    // Add user message immediately
    const userMessage: VoiceMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('lunara-voice-chat', {
        body: { 
          action: 'text-chat',
          message,
          sessionId 
        }
      });

      if (error) throw error;

      if (data?.response) {
        const assistantMessage: VoiceMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response.text || data.response,
          audioUrl: data.response.audio_url
        };
        setMessages(prev => [...prev, assistantMessage]);

        if (data.response.audio_url || data.response.audio_data) {
          await playAudioResponse(data.response.audio_url || `data:audio/mpeg;base64,${data.response.audio_data}`);
        }
      }
    } catch (error) {
      console.error('Text chat error:', error);
      toast.error('Ошибка отправки сообщения');
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId]);

  // Play audio response
  const playAudioResponse = async (audioUrl: string) => {
    try {
      setIsSpeaking(true);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsSpeaking(false);
    }
  };

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return {
    isConnected,
    isListening,
    isProcessing,
    isSpeaking,
    messages,
    connect,
    disconnect,
    startListening,
    stopListening,
    toggleListening,
    sendTextMessage,
    stopSpeaking
  };
};
