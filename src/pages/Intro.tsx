import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import LanguageSelector from '@/components/LanguageSelector';
import tyanaLogo from '@/assets/tyana-logo.png';

const Intro = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Set slow playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5;
    }
  }, []);

  // Redirect if already logged in
  React.useEffect(() => {
    if (!loading && user) {
      navigate('/today');
    }
  }, [user, loading, navigate]);

  const handleNavigate = (path: string) => {
    setIsTransitioning(true);
    setTimeout(() => navigate(path), 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Video background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute w-full h-full object-cover"
          style={{
            filter: 'brightness(0.4) saturate(1.2)',
          }}
        >
          <source src="https://res.cloudinary.com/dncljzzoe/video/upload/v1766704908/5453622-uhd_3840_2160_24fps_vvhvmh.mp4" type="video/mp4" />
        </video>
        
        {/* Neon purple overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(192, 38, 211, 0.2) 100%)',
            mixBlendMode: 'overlay',
          }}
        />
        
        {/* Dark vignette for readability */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0, 0, 0, 0.7) 100%)',
          }}
        />
      </div>

      {/* Language switcher */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSelector variant="compact" />
      </div>

      {/* Main content */}
      <motion.div 
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo and title */}
        <motion.div 
          className="text-center mb-12"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="mb-6"
            animate={{ 
              filter: ['drop-shadow(0 0 20px hsl(260 60% 50% / 0.3))', 'drop-shadow(0 0 40px hsl(260 60% 50% / 0.5))', 'drop-shadow(0 0 20px hsl(260 60% 50% / 0.3))']
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <img 
              src={tyanaLogo} 
              alt="TYANA" 
              className="h-12 mx-auto dark:invert dark:brightness-200"
            />
          </motion.div>
          <p className="text-sm font-exo text-muted-foreground tracking-[0.3em] mb-2">
            {t('tagline')}
          </p>
          <p className="text-lg font-exo text-foreground/80">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Auth buttons */}
        <motion.div 
          className="w-full max-w-sm space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={() => handleNavigate('/auth?mode=signin')}
            className="w-full h-14 bg-primary text-primary-foreground font-orbitron text-lg hover:bg-primary/90 transition-all btn-press"
          >
            <LogIn className="w-5 h-5 mr-2" />
            {t('signIn')}
          </Button>

          <Button
            onClick={() => handleNavigate('/auth?mode=signup')}
            variant="outline"
            className="w-full h-14 border-primary/50 text-foreground font-orbitron text-lg hover:bg-primary/10 transition-all btn-press"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            {t('signUp')}
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.p 
          className="absolute bottom-8 text-xs text-muted-foreground font-exo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          © 2024 TYANA. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Intro;
