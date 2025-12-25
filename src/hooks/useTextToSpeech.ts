import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string, messageId: string) => {
    // If already speaking this message, stop it
    if (speakingMessageId === messageId && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }

    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsSpeaking(true);
    setSpeakingMessageId(messageId);

    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'nova' }
      });

      if (error) throw error;

      if (!data?.audioContent) {
        throw new Error('No audio content received');
      }

      // Use data URI for playback
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        toast.error('Ошибка воспроизведения');
      };

      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      toast.error('Не удалось озвучить сообщение');
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  }, [speakingMessageId]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  }, []);

  return {
    isSpeaking,
    speakingMessageId,
    speak,
    stop
  };
};
