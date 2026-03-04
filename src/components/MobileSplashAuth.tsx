import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const slides = [
  { emoji: '🧊', titleKey: 'slide1Title' as const, subKey: 'slide1Sub' as const },
  { emoji: '🍽', titleKey: 'slide2Title' as const, subKey: 'slide2Sub' as const },
  { emoji: '💰', titleKey: 'slide3Title' as const, subKey: 'slide3Sub' as const },
];

const langs = [
  { code: 'en' as const, label: 'EN' },
  { code: 'ru' as const, label: 'RU' },
  { code: 'lv' as const, label: 'LV' },
];

const MobileSplashAuth: React.FC = () => {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const emailSchema = z.string().email();
  const passwordSchema = z.string().min(6);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Auto-scroll slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) toast.error(t.common.error);
    } catch {
      toast.error(t.common.error);
    } finally {
      setIsGoogleLoading(false);
    }
  }, [signInWithGoogle, t]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};
    if (!emailSchema.safeParse(email).success) newErrors.email = t.common.error;
    if (!passwordSchema.safeParse(password).success) newErrors.password = t.common.error;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName);
        if (error) toast.error(t.common.error);
        else toast.success('✓');
      } else {
        const { error } = await signIn(email, password);
        if (error) toast.error(t.common.error);
        else toast.success('✓');
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, displayName, isSignUp, signIn, signUp, t]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Splash area with gradient */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-4 relative"
        style={{ background: 'linear-gradient(180deg, #7C3AED 0%, #A78BFA 100%)' }}
      >
        {/* Slides */}
        <div className="w-full overflow-hidden relative" style={{ height: 220 }}>
          <div
            className="flex transition-transform duration-[400ms] ease-out"
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
              width: `${slides.length * 100}%`,
            }}
          >
            {slides.map((slide, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center text-center px-6"
                style={{ width: `${100 / slides.length}%` }}
              >
                <span className="text-6xl mb-4">{slide.emoji}</span>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {t.auth[slide.titleKey]}
                </h2>
                <p className="text-white/80 text-base leading-relaxed max-w-[300px]">
                  {t.auth[slide.subKey]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex gap-2 mt-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="w-2.5 h-2.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i === currentSlide ? '#fff' : 'rgba(255,255,255,0.4)',
                transform: i === currentSlide ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom Sheet */}
      <div
        className="bg-white px-6 pt-5 pb-6 flex-shrink-0"
        style={{ borderRadius: '24px 24px 0 0', marginTop: -24, position: 'relative', zIndex: 10 }}
      >
        {/* Language switcher */}
        <div className="flex justify-end mb-3">
          <div className="flex gap-1.5">
            {langs.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className="text-xs font-medium transition-colors"
                style={{ color: language === l.code ? '#7C3AED' : '#9CA3AF' }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Brand */}
        <h1
          className="text-center text-xl font-bold mb-4"
          style={{ color: '#7C3AED' }}
        >
          TYANA
        </h1>

        {/* Google button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-3 h-[52px] rounded-xl bg-white border-[1.5px] hover:bg-gray-50 transition-colors mb-2"
          style={{ borderColor: '#DDD6FE' }}
        >
          <GoogleIcon />
          <span className="text-sm font-medium text-foreground">
            {isGoogleLoading ? t.common.loading : t.auth.google}
          </span>
        </button>

        {/* Email sign in button */}
        {!isSignUp && (
          <button
            onClick={() => {
              const el = document.getElementById('mobile-email-input');
              el?.focus();
            }}
            className="w-full flex items-center justify-center gap-3 h-[52px] rounded-xl bg-white border-[1.5px] hover:bg-gray-50 transition-colors mb-3"
            style={{ borderColor: '#DDD6FE' }}
          >
            <Mail className="w-5 h-5" style={{ color: '#9CA3AF' }} />
            <span className="text-sm font-medium text-foreground">{t.auth.email}</span>
          </button>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 my-3">
          <div className="flex-1 h-px" style={{ backgroundColor: '#DDD6FE' }} />
          <span className="text-xs" style={{ color: '#9CA3AF' }}>{t.common.or}</span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#DDD6FE' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="pl-10 h-[48px] rounded-xl border-[1px]"
                style={{ backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }}
                placeholder={t.auth.yourName}
              />
            </div>
          )}

          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
              <Input
                id="mobile-email-input"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
                className={`pl-10 h-[48px] rounded-xl border-[1px] ${errors.email ? 'border-red-500' : ''}`}
                style={{ backgroundColor: '#F5F3FF', borderColor: errors.email ? undefined : '#DDD6FE' }}
                placeholder="your@email.com"
                required
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
                className={`pl-10 pr-10 h-[48px] rounded-xl border-[1px] ${errors.password ? 'border-red-500' : ''}`}
                style={{ backgroundColor: '#F5F3FF', borderColor: errors.password ? undefined : '#DDD6FE' }}
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[52px] rounded-xl text-white font-semibold text-base hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#7C3AED' }}
          >
            {isSubmitting ? t.common.loading : isSignUp ? t.auth.createAccount : t.auth.signIn}
          </Button>
        </form>

        {/* Toggle sign up / sign in */}
        <p className="text-center text-sm mt-3" style={{ color: '#6B7280' }}>
          {isSignUp ? t.auth.alreadyHaveAccount : t.auth.noAccount}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setErrors({}); }}
            className="font-medium"
            style={{ color: '#7C3AED' }}
          >
            {isSignUp ? t.auth.signIn : t.auth.signUp}
          </button>
        </p>

        {/* Terms */}
        <p className="text-center mt-3" style={{ fontSize: 11, color: '#9CA3AF' }}>
          {t.auth.terms}
        </p>
      </div>
    </div>
  );
};

export default MobileSplashAuth;
