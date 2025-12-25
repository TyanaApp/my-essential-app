import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-twin-chat`;

export const useAIChat = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const getInitialMessage = useCallback((): Message => {
    const greetings: Record<string, string> = {
      en: "Hello! I'm your AI Health Twin. I'm here to help you optimize your sleep, manage stress, and boost your energy levels. How can I help you today?",
      ru: "Привет! Я твой ИИ-близнец здоровья. Я здесь, чтобы помочь тебе оптимизировать сон, управлять стрессом и повысить уровень энергии. Чем могу помочь сегодня?",
      lv: "Sveiki! Es esmu jūsu AI Veselības Dvīnis. Es esmu šeit, lai palīdzētu optimizēt miegu, pārvaldīt stresu un palielināt enerģijas līmeni. Kā es varu jums palīdzēt šodien?"
    };
    
    return {
      id: 'initial',
      role: 'assistant',
      content: greetings[language] || greetings.ru
    };
  }, [language]);

  // Load chat history from database
  const loadChatHistory = useCallback(async () => {
    if (!user) {
      setMessages([getInitialMessage()]);
      setIsInitialized(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        setMessages(data.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content
        })));
      } else {
        setMessages([getInitialMessage()]);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setMessages([getInitialMessage()]);
    } finally {
      setIsInitialized(true);
    }
  }, [user, getInitialMessage]);

  // Save message to database
  const saveMessage = useCallback(async (role: 'user' | 'assistant', content: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          role,
          content
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Failed to save message:', error);
      return null;
    }
  }, [user]);

  // Delete all messages from database
  const deleteAllMessages = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete messages:', error);
    }
  }, [user]);

  const initializeChat = useCallback(() => {
    if (!isInitialized) {
      loadChatHistory();
    }
  }, [isInitialized, loadChatHistory]);

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Save user message to database
    const savedUserId = await saveMessage('user', input);
    if (savedUserId) {
      setMessages(prev => prev.map(m => m.id === userMessage.id ? { ...m, id: savedUserId } : m));
    }

    let assistantContent = '';
    const assistantId = (Date.now() + 1).toString();

    try {
      const apiMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error(language === 'ru' ? 'Слишком много запросов. Попробуйте позже.' : 'Rate limit exceeded. Please try again later.');
        } else if (response.status === 402) {
          toast.error(language === 'ru' ? 'Требуется пополнение кредитов.' : 'Payment required. Please add credits.');
        } else {
          toast.error(errorData.error || 'Failed to get AI response');
        }
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      // Add empty assistant message to start
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => 
                prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                )
              );
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Save assistant response to database
      if (assistantContent) {
        const savedAssistantId = await saveMessage('assistant', assistantContent);
        if (savedAssistantId) {
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, id: savedAssistantId } : m));
        }
      }
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error(language === 'ru' ? 'Ошибка подключения к AI' : 'Failed to connect to AI');
      // Remove empty assistant message if error occurred before content
      if (!assistantContent) {
        setMessages(prev => prev.filter(m => m.id !== assistantId));
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, language, isLoading, saveMessage]);

  const clearChat = useCallback(async () => {
    await deleteAllMessages();
    setMessages([getInitialMessage()]);
  }, [getInitialMessage, deleteAllMessages]);

  // Reload when user changes
  useEffect(() => {
    setIsInitialized(false);
  }, [user?.id]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    initializeChat
  };
};
