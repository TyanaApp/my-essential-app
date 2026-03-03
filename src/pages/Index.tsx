import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Target, Tag, PiggyBank, ArrowRight } from 'lucide-react';

const Index = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: <Camera className="w-6 h-6" />, emoji: '📸', title: 'Scan in 10 seconds', desc: 'Snap a photo of your fridge and TYANA instantly catalogs everything with expiry dates and quantities.' },
    { icon: <Target className="w-6 h-6" />, emoji: '🎯', title: 'Goal-driven meals', desc: 'Get personalized meal plans that match your calorie goals, dietary preferences and what you already have.' },
    { icon: <Tag className="w-6 h-6" />, emoji: '🏷', title: 'Real-time discounts', desc: 'TYANA monitors local store deals and suggests recipes based on what\'s cheapest this week.' },
    { icon: <PiggyBank className="w-6 h-6" />, emoji: '💰', title: 'See your savings', desc: 'Track every euro saved from reduced waste, smart shopping and meal planning — watch it add up.' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3FF' }}>
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'backdrop-blur-xl border-b' : ''
        }`}
        style={{
          backgroundColor: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
          borderColor: scrolled ? '#EDE9FE' : 'transparent',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          {/* Logo */}
          <span
            className="text-[28px] font-bold"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #C026D3)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            TYANA
          </span>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'Pricing', 'FAQ'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: '#1E1B4B' }}
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Right buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/auth?mode=signin"
              className="hidden sm:inline-flex text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:opacity-70"
              style={{ color: '#7C3AED' }}
            >
              Sign In
            </Link>
            <Link
              to="/auth?mode=signup"
              className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#7C3AED' }}
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="min-h-screen flex items-center pt-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <span
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium mb-6"
              style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}
            >
              ✦ AI-Powered Kitchen Assistant
            </span>

            {/* H1 */}
            <h1
              className="text-[44px] lg:text-[52px] font-bold leading-[1.1] mb-5"
              style={{
                background: 'linear-gradient(135deg, #1E1B4B 0%, #7C3AED 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Stop throwing money away with your food
            </h1>

            {/* Subtitle */}
            <p className="text-lg lg:text-[22px] leading-relaxed mb-8" style={{ color: '#6B7280' }}>
              TYANA knows what's in your fridge, counts your calories, finds discounts and saves you{' '}
              <strong style={{ color: '#7C3AED' }}>€80+ per month</strong>
            </p>

            {/* CTA */}
            <Link
              to="/auth?mode=signup"
              className="inline-flex items-center justify-center gap-2 text-white text-lg font-semibold rounded-2xl transition-opacity hover:opacity-90"
              style={{
                backgroundColor: '#7C3AED',
                height: '56px',
                width: '260px',
              }}
            >
              Start Free — €0
              <ArrowRight className="w-5 h-5" />
            </Link>

            <p className="mt-3 text-[13px]" style={{ color: '#6B7280' }}>
              7 days all features free. No card required.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mt-8">
              {[
                { value: '€80', label: 'avg. saved/month' },
                { value: '5 days', label: 'to pay itself off' },
                { value: '10 sec', label: 'fridge scan' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-xl font-bold" style={{ color: '#7C3AED' }}>
                    {stat.value}
                  </div>
                  <div className="text-xs" style={{ color: '#6B7280' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right column — Mockup card */}
          <motion.div
            className="hidden md:flex justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 w-full max-w-sm"
              style={{ boxShadow: '0 8px 40px rgba(124,58,237,0.12)' }}
              animate={{ y: [-8, 0, -8] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="text-center space-y-6">
                <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
                  How TYANA works
                </p>
                <div className="flex items-center justify-center gap-4 text-4xl">
                  <div className="flex flex-col items-center gap-1">
                    <span>🧊</span>
                    <span className="text-[11px] font-medium" style={{ color: '#7C3AED' }}>
                      Scan
                    </span>
                  </div>
                  <span className="text-xl" style={{ color: '#C4B5FD' }}>→</span>
                  <div className="flex flex-col items-center gap-1">
                    <span>🍽</span>
                    <span className="text-[11px] font-medium" style={{ color: '#7C3AED' }}>
                      Cook
                    </span>
                  </div>
                  <span className="text-xl" style={{ color: '#C4B5FD' }}>→</span>
                  <div className="flex flex-col items-center gap-1">
                    <span>💰</span>
                    <span className="text-[11px] font-medium" style={{ color: '#7C3AED' }}>
                      Save
                    </span>
                  </div>
                </div>
                <div
                  className="rounded-2xl p-4 space-y-3"
                  style={{ backgroundColor: '#F5F3FF' }}
                >
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#6B7280' }}>This week saved</span>
                    <span className="font-bold" style={{ color: '#059669' }}>€18.40</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#6B7280' }}>Food waste reduced</span>
                    <span className="font-bold" style={{ color: '#7C3AED' }}>-62%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#6B7280' }}>Meals planned</span>
                    <span className="font-bold" style={{ color: '#1E1B4B' }}>14 / 14</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-3xl lg:text-4xl font-bold text-center mb-14"
            style={{ color: '#1E1B4B' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Everything your kitchen needs
          </motion.h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="bg-white rounded-2xl p-7"
                style={{ boxShadow: '0 2px 20px rgba(124,58,237,0.06)' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ backgroundColor: '#EDE9FE' }}
                >
                  {f.emoji}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#1E1B4B' }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 border-t" style={{ borderColor: '#EDE9FE' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm" style={{ color: '#6B7280' }}>
            © 2025 TYANA. All rights reserved.
          </span>
          <div className="flex gap-6">
            <a href="#" className="text-sm hover:underline" style={{ color: '#6B7280' }}>Terms</a>
            <a href="#" className="text-sm hover:underline" style={{ color: '#6B7280' }}>Privacy</a>
            <a href="#" className="text-sm hover:underline" style={{ color: '#6B7280' }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
