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
      
      // Generate a local session ID since we're using fallback mode
      const localSessionId = `session-${Date.now()}`;
      setSessionId(localSessionId);
      setIsConnected(true);
      
      // Add welcome message
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Привет! Я твой AI Health Twin. Нажми на микрофон и расскажи, как ты себя чувствуешь сегодня. 🎙️'
      }]);
      
      toast.success('Голосовой ассистент подключен');
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

  // Process voice input - first transcribe, then get AI response
  const processVoiceInput = async (base64Audio: string) => {
    setIsProcessing(true);
    
    try {
      // Step 1: Transcribe audio using existing voice-to-text service
      const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (transcriptError) throw transcriptError;

      const transcript = transcriptData?.text;
      
      if (!transcript) {
        toast.error('Не удалось распознать речь. Попробуйте ещё раз.');
        setIsProcessing(false);
        return;
      }

      // Add user message
      const userMessage: VoiceMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: transcript
      };
      setMessages(prev => [...prev, userMessage]);

      // Step 2: Get AI response
      const { data: aiData, error: aiError } = await supabase.functions.invoke('lunara-voice-chat', {
        body: { 
          action: 'text-chat',
          message: transcript,
          sessionId 
        }
      });

      if (aiError) throw aiError;

      if (aiData?.response) {
        const assistantMessage: VoiceMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: aiData.response.text || aiData.response
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Play audio response using TTS
        await speakResponse(aiData.response.text || aiData.response);
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      toast.error('Ошибка обработки голоса');
    } finally {
      setIsProcessing(false);
    }
  };

  // Speak response using text-to-speech
  const speakResponse = async (text: string) => {
    try {
      setIsSpeaking(true);
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'nova' }
      });

      if (error || !data?.audioContent) {
        console.error('TTS error:', error);
        setIsSpeaking(false);
        return;
      }

      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      await playAudioResponse(audioUrl);
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  // Send text message
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
        const responseText = data.response.text || data.response;
        const assistantMessage: VoiceMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: responseText
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Speak the response
        await speakResponse(responseText);
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
