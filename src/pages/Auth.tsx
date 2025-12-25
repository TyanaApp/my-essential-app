import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowLeft, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Некорректный email адрес');
const passwordSchema = z.string().min(6, 'Пароль должен содержать минимум 6 символов');

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const { signIn, signUp, user, loading } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/today');
    }
  }, [user, loading, navigate]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = language === 'ru' ? 'Некорректный email адрес' : 'Invalid email address';
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = language === 'ru' ? 'Пароль должен содержать минимум 6 символов' : 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getErrorMessage = (error: Error): string => {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid login credentials')) {
      return language === 'ru' ? 'Неверный email или пароль' : 'Invalid email or password';
    }
    if (message.includes('user already registered')) {
      return language === 'ru' ? 'Пользователь уже зарегистрирован' : 'User already registered';
    }
    if (message.includes('email not confirmed')) {
      return language === 'ru' ? 'Email не подтверждён' : 'Email not confirmed';
    }
    if (message.includes('rate limit')) {
      return language === 'ru' ? 'Слишком много попыток. Попробуйте позже' : 'Too many attempts. Please try again later';
    }
    
    return language === 'ru' ? 'Произошла ошибка. Попробуйте снова' : 'An error occurred. Please try again';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          toast.error(getErrorMessage(error));
        } else {
          toast.success(language === 'ru' ? 'Аккаунт создан! Добро пожаловать!' : 'Account created! Welcome!');
          navigate('/today');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(getErrorMessage(error));
        } else {
          toast.success(language === 'ru' ? 'С возвращением!' : 'Welcome back!');
          navigate('/today');
        }
      }
    } catch (err) {
      toast.error(language === 'ru' ? 'Неожиданная ошибка' : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/20"
            initial={{ 
              x: Math.random() * 400, 
              y: Math.random() * 800,
              opacity: 0.2 
            }}
            animate={{ 
              y: [null, Math.random() * -150],
              opacity: [0.2, 0.6, 0.2]
            }}
            transition={{ 
              duration: 5 + Math.random() * 3, 
              repeat: Infinity,
              delay: Math.random() * 2 
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {language === 'ru' ? 'Назад' : 'Back'}
        </button>
      </div>

      {/* Main content */}
      <motion.div 
        className="relative z-10 flex flex-col items-center justify-center px-6 pb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 animate-glow-pulse" />
          <h1 className="text-3xl font-orbitron font-bold text-gradient-golden">
            {isSignUp ? t('signUp') : t('signIn')}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-foreground font-exo">
                {t('displayName')}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 h-12 bg-secondary border-border text-foreground"
                  placeholder={language === 'ru' ? 'Ваше имя' : 'Your name'}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-exo">
              {t('email')}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                }}
                className={`pl-10 h-12 bg-secondary border-border text-foreground ${errors.email ? 'border-red-500' : ''}`}
                placeholder="your@email.com"
                required
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs font-exo">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-exo">
              {t('password')}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                className={`pl-10 pr-10 h-12 bg-secondary border-border text-foreground ${errors.password ? 'border-red-500' : ''}`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs font-exo">{errors.password}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-primary text-primary-foreground font-orbitron text-lg hover:bg-primary/90 transition-all btn-press"
          >
            {isSubmitting 
              ? (language === 'ru' ? 'Загрузка...' : 'Loading...') 
              : isSignUp ? t('createAccount') : t('signIn')
            }
          </Button>
        </form>

        {/* Toggle mode */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground font-exo">
            {isSignUp ? t('alreadyHaveAccount') : t('noAccount')}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
              }}
              className="text-primary hover:underline font-medium"
            >
              {isSignUp ? t('signIn') : t('signUp')}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
