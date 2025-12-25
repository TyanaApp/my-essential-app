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

// Google Icon Component
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const { signIn, signUp, signInWithGoogle, user, loading } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(getErrorMessage(error));
      }
    } catch (err) {
      toast.error(language === 'ru' ? 'Ошибка входа через Google' : 'Google sign in failed');
    } finally {
      setIsGoogleLoading(false);
    }
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
        <div className="text-center mb-6">
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-3 animate-glow-pulse" />
          <h1 className="text-2xl font-orbitron font-bold text-gradient-golden">
            {isSignUp ? t('signUp') : t('signIn')}
          </h1>
        </div>

        {/* Social Login Buttons */}
        <div className="w-full max-w-sm mb-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-secondary/80 border border-border hover:bg-secondary hover:border-primary/30 transition-all duration-200 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
          >
            <GoogleIcon />
            <span className="text-sm font-medium text-foreground">
              {isGoogleLoading 
                ? (language === 'ru' ? 'Загрузка...' : 'Loading...') 
                : (language === 'ru' ? 'Продолжить с Google' : 'Continue with Google')
              }
            </span>
          </button>

          {/* Apple - Coming Soon (disabled) */}
          <button
            disabled
            className="w-full flex items-center justify-center gap-3 h-12 mt-3 rounded-xl bg-secondary/40 border border-border/50 opacity-50 cursor-not-allowed"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-muted-foreground">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span className="text-sm text-muted-foreground">
              {language === 'ru' ? 'Apple (скоро)' : 'Apple (soon)'}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="w-full max-w-sm flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-exo">
            {language === 'ru' ? 'или' : 'or'}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-foreground font-exo text-sm">
                {t('displayName')}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 h-11 bg-secondary border-border text-foreground"
                  placeholder={language === 'ru' ? 'Ваше имя' : 'Your name'}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-foreground font-exo text-sm">
              {t('email')}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                }}
                className={`pl-10 h-11 bg-secondary border-border text-foreground ${errors.email ? 'border-red-500' : ''}`}
                placeholder="your@email.com"
                required
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs font-exo">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-foreground font-exo text-sm">
              {t('password')}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                className={`pl-10 pr-10 h-11 bg-secondary border-border text-foreground ${errors.password ? 'border-red-500' : ''}`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs font-exo">{errors.password}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-primary text-primary-foreground font-orbitron hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          >
            {isSubmitting 
              ? (language === 'ru' ? 'Загрузка...' : 'Loading...') 
              : isSignUp ? t('createAccount') : t('signIn')
            }
          </Button>
        </form>

        {/* Toggle mode */}
        <div className="mt-5 text-center">
          <p className="text-muted-foreground font-exo text-sm">
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
