import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import TyanaLogo from '@/components/TyanaLogo';
import { z } from 'zod';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileSplashAuth from '@/components/MobileSplashAuth';
import LegalFooterPill from '@/components/LegalFooterPill';
import QRInstallModal from '@/components/install/QRInstallModal';
import { useIsStandalone } from '@/hooks/useStandalone';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language } = useTranslation();
  const { signIn, signUp, signInWithGoogle, signInWithMagicLink, user, loading } = useAuth();
  const isMobile = useIsMobile();
  const isStandalone = useIsStandalone();
  const [showQRModal, setShowQRModal] = useState(false);

  const emailSchema = z.string().email();
  const passwordSchema = z.string().min(6);
  
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) newErrors.email = t.common.error;
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) newErrors.password = t.common.error;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getErrorMessage = (error: Error): string => {
    const msg = error.message.toLowerCase();
    console.log('Auth error:', error.message);
    if (msg.includes('user already registered') || msg.includes('user_already_exists'))
      return t.auth.userAlreadyRegistered || 'This email is already registered. Try signing in.';
    if (msg.includes('invalid login credentials'))
      return t.auth.invalidCredentials || 'Invalid email or password.';
    if (msg.includes('email not confirmed'))
      return t.auth.emailNotConfirmed || 'Please confirm your email before signing in.';
    if (msg.includes('rate limit'))
      return t.auth.rateLimited || 'Too many attempts. Please wait a moment.';
    if (msg.includes('provider') && msg.includes('not enabled'))
      return 'This sign-in method is not enabled.';
    return error.message;
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) { toast.error(getErrorMessage(error)); }
    } catch { toast.error(t.common.error); }
    finally { setIsGoogleLoading(false); }
  };

  const handleMagicLinkSignIn = async () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) { setErrors((prev) => ({ ...prev, email: t.common.error })); return; }
    setIsMagicLinkLoading(true);
    try {
      const { error } = await signInWithMagicLink(email);
      if (error) { toast.error(getErrorMessage(error)); return; }
      toast.success(t.common.save);
    } catch { toast.error(t.common.error); }
    finally { setIsMagicLinkLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (isSignUp && !termsAccepted) {
      const termsMessages: Record<string, string> = {
        en: 'Please accept the terms to continue',
        ru: 'Необходимо принять условия использования',
        uk: 'Необхідно прийняти умови використання',
        lv: 'Lūdzu apstipriniet noteikumus, lai turpinātu',
      };
      setTermsError(termsMessages[language] || termsMessages.en);
      return;
    }
    setTermsError('');
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName);
        console.log('SignUp result - error:', error);
        if (error) {
          console.error('SignUp error details:', error.message, error);
          toast.error(getErrorMessage(error));
        } else {
          toast.success(t.auth.checkEmail || 'Check your email to confirm your account');
        }
      } else {
        const { error } = await signIn(email, password);
        console.log('SignIn result - error:', error);
        if (error) {
          console.error('SignIn error details:', error.message, error);
          toast.error(getErrorMessage(error));
        } else {
          toast.success('✓');
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Auth catch block error:', err);
      toast.error(err?.message || t.common.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (isMobile) {
    return <MobileSplashAuth />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.common.back}
      </button>

      <motion.div
        className="w-full max-w-[420px] bg-card rounded-3xl p-10"
        style={{ boxShadow: '0 4px 32px rgba(124,58,237,0.12)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-8">
          <TyanaLogo size="lg" />
          <p className="text-base mt-1" style={{ color: '#A78BFA' }}>{t.auth.title}</p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-3 h-[52px] rounded-xl bg-card border-[1.5px] border-border hover:bg-secondary transition-colors"
        >
          <GoogleIcon />
          <span className="text-sm font-medium text-foreground">
            {isGoogleLoading ? t.common.loading : t.auth.google}
          </span>
        </button>

        {!isSignUp && (
          <button
            type="button"
            onClick={handleMagicLinkSignIn}
            disabled={isMagicLinkLoading}
            className="w-full flex items-center justify-center gap-3 h-[52px] mt-3 rounded-xl bg-card border-[1.5px] border-border hover:bg-secondary transition-colors"
          >
            <Mail className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {isMagicLinkLoading ? t.common.loading : t.auth.email}
            </span>
          </button>
        )}

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px" style={{ backgroundColor: '#DDD6FE' }} />
          <span className="text-xs text-muted-foreground">{t.common.or}</span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#DDD6FE' }} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-sm font-medium text-foreground">{t.auth.displayName}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 h-[52px] rounded-xl border-[1px] focus:ring-0 bg-secondary border-border text-foreground"
                  placeholder={t.auth.yourName} />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">{t.auth.emailLabel}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="email" type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })); }}
                className={`pl-10 h-[52px] rounded-xl border-[1px] focus:ring-0 bg-secondary border-border text-foreground ${errors.email ? 'border-red-500' : ''}`}
                placeholder="your@email.com" required />
            </div>
            {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">{t.auth.password}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="password" type={showPassword ? 'text' : 'password'} value={password}
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })); }}
                className={`pl-10 pr-10 h-[52px] rounded-xl border-[1px] focus:ring-0 bg-secondary border-border text-foreground ${errors.password ? 'border-red-500' : ''}`}
                placeholder="••••••••" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
          </div>

          {isSignUp && (
            <div className="space-y-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => { setTermsAccepted(e.target.checked); setTermsError(''); }}
                  className="mt-1 h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Я принимаю ' : language === 'uk' ? 'Я приймаю ' : language === 'lv' ? 'Es piekrītu ' : 'I accept the '}
                  <Link to="/terms" target="_blank" className="underline text-primary">
                    {language === 'ru' ? 'Условия использования' : language === 'uk' ? 'Умови використання' : language === 'lv' ? 'Lietošanas noteikumiem' : 'Terms of Service'}
                  </Link>
                  {language === 'ru' ? ' и ' : language === 'uk' ? ' та ' : language === 'lv' ? ' un ' : ' and '}
                  <Link to="/privacy" target="_blank" className="underline text-primary">
                    {language === 'ru' ? 'Политику конфиденциальности' : language === 'uk' ? 'Політику конфіденційності' : language === 'lv' ? 'Privātuma politiku' : 'Privacy Policy'}
                  </Link>
                </span>
              </label>
              {termsError && <p className="text-red-500 text-xs">{termsError}</p>}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting || (isSignUp && !termsAccepted)}
            className="w-full h-[52px] rounded-xl text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity bg-primary">
            {isSubmitting ? t.common.loading : isSignUp ? t.auth.createAccount : t.auth.signIn}
          </Button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-muted-foreground text-sm">
            {isSignUp ? t.auth.alreadyHaveAccount : t.auth.noAccount}{' '}
            <button onClick={() => { setIsSignUp(!isSignUp); setErrors({}); }} className="font-medium hover:underline" style={{ color: '#7C3AED' }}>
              {isSignUp ? t.auth.signIn : t.auth.signUp}
            </button>
          </p>
        </div>

        {/* Get the App button - desktop only, not standalone */}
        {!isStandalone && (
          <>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex-1 h-px" style={{ backgroundColor: '#DDD6FE' }} />
              <span className="text-xs text-muted-foreground">{t.common.or}</span>
              <div className="flex-1 h-px" style={{ backgroundColor: '#DDD6FE' }} />
            </div>
            <button
              onClick={() => setShowQRModal(true)}
              className="w-full flex items-center justify-center gap-2 h-[52px] mt-4 rounded-xl border-[1.5px] transition-colors hover:bg-secondary border-border text-primary"
              style={{ color: '#7C3AED', borderColor: '#DDD6FE' }}
            >
              <span className="text-sm font-semibold">{t.install.getTheApp}</span>
            </button>
          </>
        )}

        <div className="mt-6">
          <LegalFooterPill />
        </div>
      </motion.div>

      <QRInstallModal open={showQRModal} onClose={() => setShowQRModal(false)} />
    </div>
  );
};

export default Auth;
