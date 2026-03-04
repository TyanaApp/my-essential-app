import React, { useState, useEffect, useCallback } from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
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

type AuthView = 'main' | 'email';

const MobileSplashAuth: React.FC = () => {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const emailSchema = z.string().email();
  const passwordSchema = z.string().min(6);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [view, setView] = useState<AuthView>('main');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #C084FC 0%, #A855F7 40%, #7C3AED 70%, #EC4899 100%)',
      }}
    >
      {/* Top branding */}
      <div className="text-center" style={{ marginTop: 60 }}>
        <h1 className="text-white font-bold" style={{ fontSize: 32 }}>
          TYANA
        </h1>
        <p className="text-white mt-1" style={{ fontSize: 16, opacity: 0.85 }}>
          {t.auth.subtitle || 'Your Kitchen CFO'}
        </p>
      </div>

      {/* Slides area - 45% of screen */}
      <div
        className="flex-1 flex flex-col items-center justify-center"
        style={{ minHeight: '45vh' }}
      >
        <div className="w-full overflow-hidden relative" style={{ height: 200 }}>
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
                className="flex flex-col items-center justify-center text-center px-8"
                style={{ width: `${100 / slides.length}%` }}
              >
                <span style={{ fontSize: 64, lineHeight: 1.2 }}>{slide.emoji}</span>
                <h2
                  className="text-white font-bold mt-4"
                  style={{ fontSize: 26 }}
                >
                  {t.auth[slide.titleKey]}
                </h2>
                <p
                  className="text-white mt-2"
                  style={{ fontSize: 16, opacity: 0.8, lineHeight: 1.5, maxWidth: 280 }}
                >
                  {t.auth[slide.subKey]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center gap-2 mt-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="rounded-full transition-all duration-300"
              style={{
                backgroundColor: 'white',
                opacity: i === currentSlide ? 1 : 0.4,
                width: i === currentSlide ? 24 : 8,
                height: 8,
              }}
            />
          ))}
        </div>
      </div>

      {/* Language switcher */}
      <div className="flex justify-center gap-3 mb-4">
        {langs.map((l, i) => (
          <React.Fragment key={l.code}>
            {i > 0 && (
              <span className="text-white" style={{ opacity: 0.4, fontSize: 14 }}>|</span>
            )}
            <button
              onClick={() => setLanguage(l.code)}
              className="text-white transition-opacity"
              style={{
                fontSize: 14,
                opacity: language === l.code ? 1 : 0.5,
                fontWeight: language === l.code ? 600 : 400,
              }}
            >
              {l.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Bottom buttons */}
      <div
        className="flex flex-col items-center px-6"
        style={{ paddingBottom: 40 }}
      >
        {view === 'main' ? (
          <div className="w-full flex flex-col items-center" style={{ maxWidth: 340 }}>
            {/* Google button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white transition-opacity hover:opacity-90"
              style={{
                height: 56,
                borderRadius: 16,
                fontWeight: 600,
                color: '#7C3AED',
                fontSize: 15,
              }}
            >
              <GoogleIcon />
              {isGoogleLoading ? t.common.loading : t.auth.google}
            </button>

            {/* Email button */}
            <button
              onClick={() => setView('email')}
              className="w-full flex items-center justify-center gap-3 text-white transition-opacity hover:opacity-90"
              style={{
                height: 56,
                borderRadius: 16,
                border: '1.5px solid rgba(255,255,255,0.6)',
                background: 'transparent',
                marginTop: 12,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <Mail className="w-5 h-5" />
              {t.auth.email}
            </button>

            {/* Sign up link */}
            <button
              onClick={() => { setIsSignUp(true); setView('email'); }}
              className="text-white mt-4 transition-opacity hover:opacity-90"
              style={{ fontSize: 14, textDecoration: 'underline', background: 'none', border: 'none' }}
            >
              {t.auth.signUp} {t.auth.free || 'free'} →
            </button>
          </div>
        ) : (
          <div className="w-full" style={{ maxWidth: 340 }}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {isSignUp && (
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t.auth.yourName}
                  className="h-14 rounded-2xl border-0 text-white placeholder:text-white/50 px-4"
                  style={{ background: 'rgba(255,255,255,0.15)', fontSize: 15 }}
                />
              )}
              <div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
                  placeholder="your@email.com"
                  className={`h-14 rounded-2xl border-0 text-white placeholder:text-white/50 px-4 ${errors.email ? 'ring-2 ring-red-400' : ''}`}
                  style={{ background: 'rgba(255,255,255,0.15)', fontSize: 15 }}
                  required
                />
                {errors.email && <p className="text-red-300 text-xs mt-1 ml-1">{errors.email}</p>}
              </div>
              <div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
                    placeholder="••••••••"
                    className={`h-14 rounded-2xl border-0 text-white placeholder:text-white/50 px-4 pr-12 ${errors.password ? 'ring-2 ring-red-400' : ''}`}
                    style={{ background: 'rgba(255,255,255,0.15)', fontSize: 15 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
                {errors.password && <p className="text-red-300 text-xs mt-1 ml-1">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white transition-opacity hover:opacity-90"
                style={{
                  height: 56,
                  borderRadius: 16,
                  fontWeight: 600,
                  color: '#7C3AED',
                  fontSize: 15,
                }}
              >
                {isSubmitting ? t.common.loading : isSignUp ? t.auth.createAccount : t.auth.signIn}
              </button>
            </form>

            <div className="flex justify-center gap-1 mt-4">
              <span className="text-white/70" style={{ fontSize: 14 }}>
                {isSignUp ? t.auth.alreadyHaveAccount : t.auth.noAccount}
              </span>
              <button
                onClick={() => { setIsSignUp(!isSignUp); setErrors({}); }}
                className="text-white font-semibold"
                style={{ fontSize: 14, textDecoration: 'underline', background: 'none', border: 'none' }}
              >
                {isSignUp ? t.auth.signIn : t.auth.signUp}
              </button>
            </div>

            <button
              onClick={() => { setView('main'); setIsSignUp(false); setErrors({}); }}
              className="text-white/60 mt-3 w-full text-center"
              style={{ fontSize: 13, background: 'none', border: 'none' }}
            >
              ← {t.common.back}
            </button>
          </div>
        )}

        {/* Terms */}
        <p
          className="text-white text-center mt-5"
          style={{ fontSize: 11, opacity: 0.5, maxWidth: 280 }}
        >
          {t.auth.terms}
        </p>
      </div>
    </div>
  );
};

export default MobileSplashAuth;
