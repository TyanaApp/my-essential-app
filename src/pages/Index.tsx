import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LegalFooterPill from '@/components/LegalFooterPill';
import { motion } from 'framer-motion';
import { Camera, Target, Tag, PiggyBank, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useFoundingCounter } from '@/hooks/useFoundingCounter';
import TyanaLogo from '@/components/TyanaLogo';
import LanguageSelector from '@/components/LanguageSelector';

const Index = () => {
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslation();
  const { count: foundingCount, isFull } = useFoundingCounter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: <Camera className="w-6 h-6" />, emoji: '📸', title: t.landing.feat1Title, desc: t.landing.feat1Desc },
    { icon: <Target className="w-6 h-6" />, emoji: '🎯', title: t.landing.feat2Title, desc: t.landing.feat2Desc },
    { icon: <Tag className="w-6 h-6" />, emoji: '🏷', title: t.landing.feat3Title, desc: t.landing.feat3Desc },
    { icon: <PiggyBank className="w-6 h-6" />, emoji: '💰', title: t.landing.feat4Title, desc: t.landing.feat4Desc },
  ];

  const navItems = [t.landing.navFeatures, t.landing.navPricing, t.landing.navFaq];
  const navAnchors = ['features', 'pricing', 'faq'];

  const faqItems = [
    { q: t.landing.faq1Q, a: t.landing.faq1A },
    { q: t.landing.faq2Q, a: t.landing.faq2A },
    { q: t.landing.faq3Q, a: t.landing.faq3A },
    { q: t.landing.faq4Q, a: t.landing.faq4A },
    { q: t.landing.faq5Q, a: t.landing.faq5A },
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
          <TyanaLogo size="md" />

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item, i) => (
              <a
                key={item}
                href={`#${navAnchors[i]}`}
                className="text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: '#1E1B4B' }}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <LanguageSelector variant="compact" />
            <Link
              to="/auth?mode=signin"
              className="hidden sm:inline-flex text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:opacity-70"
              style={{ color: '#7C3AED' }}
            >
              {t.landing.signIn}
            </Link>
            <Link
              to="/auth?mode=signup"
              className="text-xs md:text-sm font-semibold px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-white transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{ backgroundColor: '#7C3AED' }}
            >
              {t.landing.startFree}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="min-h-screen flex items-center pt-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >

            <h1
              className="text-[28px] md:text-[44px] lg:text-[52px] font-bold leading-[1.1] mb-5"
              style={{
                background: 'linear-gradient(135deg, #1E1B4B 0%, #7C3AED 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t.landing.heroTitle}
            </h1>

            <p className="text-base md:text-lg lg:text-[22px] leading-relaxed mb-8" style={{ color: '#6B7280' }}>
              {t.landing.heroSubtitle}{' '}
              <strong style={{ color: '#7C3AED' }}>{t.landing.heroSavings}</strong>
            </p>

            <Link
              to="/auth?mode=signup"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 text-white text-base md:text-lg font-semibold rounded-2xl transition-opacity hover:opacity-90"
              style={{
                backgroundColor: '#7C3AED',
                height: '52px',
                minWidth: '260px',
              }}
            >
              {t.landing.ctaButton}
              <ArrowRight className="w-5 h-5" />
            </Link>

            <p className="mt-3 text-[13px] text-center md:text-left" style={{ color: '#6B7280' }}>
              {t.landing.ctaHint}
            </p>


            <div className="grid grid-cols-3 gap-3 md:flex md:flex-wrap md:gap-6 mt-6">
              {[
                { value: '€80', label: t.landing.statSaved },
                { value: t.landing.statPayoffValue, label: t.landing.statPayoff },
                { value: t.landing.statScanValue, label: t.landing.statScan },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-base md:text-xl font-bold" style={{ color: '#7C3AED' }}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] md:text-xs" style={{ color: '#6B7280' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

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
                  {t.landing.mockupTitle}
                </p>
                <div className="flex items-center justify-center gap-4 text-4xl">
                  <div className="flex flex-col items-center gap-1">
                    <span>🧊</span>
                    <span className="text-[11px] font-medium" style={{ color: '#7C3AED' }}>
                      {t.landing.mockupScan}
                    </span>
                  </div>
                  <span className="text-xl" style={{ color: '#C4B5FD' }}>→</span>
                  <div className="flex flex-col items-center gap-1">
                    <span>🍽</span>
                    <span className="text-[11px] font-medium" style={{ color: '#7C3AED' }}>
                      {t.landing.mockupCook}
                    </span>
                  </div>
                  <span className="text-xl" style={{ color: '#C4B5FD' }}>→</span>
                  <div className="flex flex-col items-center gap-1">
                    <span>💰</span>
                    <span className="text-[11px] font-medium" style={{ color: '#7C3AED' }}>
                      {t.landing.mockupSave}
                    </span>
                  </div>
                </div>
                <div
                  className="rounded-2xl p-4 space-y-3"
                  style={{ backgroundColor: '#F5F3FF' }}
                >
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#6B7280' }}>{t.landing.weekSaved}</span>
                    <span className="font-bold" style={{ color: '#059669' }}>€18.40</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#6B7280' }}>{t.landing.foodWaste}</span>
                    <span className="font-bold" style={{ color: '#7C3AED' }}>-62%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#6B7280' }}>{t.landing.mealsPlanned}</span>
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
            {t.landing.featuresTitle}
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

      {/* WHY TYANA */}
      <section className="py-24 px-6" style={{ backgroundColor: '#F5F3FF' }}>
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="text-3xl lg:text-4xl font-bold text-center mb-14"
            style={{ color: '#1E1B4B' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {(t.landing as any).whyTitle || 'Why TYANA works'}
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { emoji: '🧠', title: (t.landing as any).why1Title || 'Deeper than any app', desc: (t.landing as any).why1Desc || 'Analyzes your nutrition as deeply as a professional nutritionist — but available 24/7' },
              { emoji: '⚡️', title: (t.landing as any).why2Title || 'Saves time and money', desc: (t.landing as any).why2Desc || 'The average family throws away €80 of food per month. TYANA helps you use everything you buy.' },
              { emoji: '🎯', title: (t.landing as any).why3Title || 'Personalized for you', desc: (t.landing as any).why3Desc || 'Takes into account your goals, tastes, allergies and what you have at home right now.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="text-5xl mb-4">{item.emoji}</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#1E1B4B' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            className="text-2xl md:text-3xl font-bold mb-6"
            style={{ color: '#1E1B4B' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {(t.landing as any).ctaBannerTitle || 'Your nutrition, finally under control. Start today.'}
          </motion.h2>
          <Link
            to="/auth?mode=signup"
            className="inline-flex items-center gap-2 text-white text-base font-semibold rounded-2xl transition-opacity hover:opacity-90 px-8 py-3"
            style={{ backgroundColor: '#7C3AED' }}
          >
            {t.landing.ctaButton} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6" style={{ backgroundColor: '#F5F3FF' }}>
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="text-3xl lg:text-4xl font-bold text-center mb-4"
            style={{ color: '#1E1B4B' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {t.landing.pricingTitle}
          </motion.h2>
          <p className="text-center mb-14 text-base" style={{ color: '#6B7280' }}>
            {t.landing.pricingSubtitle}
          </p>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {/* FREE */}
            <motion.div
              className="bg-white rounded-2xl p-7"
              style={{ boxShadow: '0 2px 20px rgba(124,58,237,0.06)' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-bold mb-1" style={{ color: '#1E1B4B' }}>{t.landing.free}</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold" style={{ color: '#1E1B4B' }}>€0</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>{t.landing.month}</span>
              </div>
              <p className="text-[13px] mb-6" style={{ color: '#7C3AED' }}>{t.landing.freeTrial}</p>
              <ul className="space-y-3 mb-8">
                {t.landing.freeFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#6B7280' }}>
                    <span style={{ color: '#7C3AED' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth?mode=signup"
                className="block w-full text-center py-3 rounded-xl text-sm font-semibold border-[1.5px] transition-colors hover:bg-gray-50"
                style={{ color: '#7C3AED', borderColor: '#DDD6FE' }}
              >
                {t.landing.startFree}
              </Link>
            </motion.div>

            {/* LITE */}
            <motion.div
              className="bg-white rounded-2xl p-7 border"
              style={{ borderColor: '#C4B5FD', boxShadow: '0 2px 20px rgba(124,58,237,0.08)' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-[12px] font-semibold tracking-wider uppercase mb-2" style={{ color: '#7C3AED' }}>
                {t.landing.forFamilies}
              </p>
              <h3 className="text-lg font-bold mb-1" style={{ color: '#1E1B4B' }}>{t.landing.lite}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold" style={{ color: '#1E1B4B' }}>€5.99</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>{t.landing.month}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {t.landing.liteFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#6B7280' }}>
                    <span style={{ color: '#7C3AED' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth?mode=signup"
                className="flex items-center justify-center gap-1 w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#7C3AED' }}
              >
                {t.landing.getLite} <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* PRO */}
            {!isFull ? (
              <motion.div
                className="bg-white rounded-2xl border-2 relative overflow-hidden"
                style={{ borderColor: '#7C3AED', boxShadow: '0 4px 30px rgba(124,58,237,0.15)' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                {/* Urgency banner */}
                <div className="px-5 py-2.5 text-center text-sm font-semibold text-white" style={{ backgroundColor: '#DC2626' }}>
                  🔥 {(t.landing as any).founderSpotsLeft?.replace('{count}', String(1000 - foundingCount)) || `Only ${1000 - foundingCount} of 1,000 spots left at this price`}
                </div>

                <div className="p-7">
                  <div
                    className="absolute top-14 right-4 text-[11px] font-bold px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: '#7C3AED' }}
                  >
                    {t.landing.mostPopular}
                  </div>

                  <h3 className="text-lg font-bold mb-1" style={{ color: '#1E1B4B' }}>TYANA Pro</h3>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-lg line-through" style={{ color: '#9CA3AF' }}>€12.99</span>
                    <span className="text-4xl font-bold" style={{ color: '#7C3AED' }}>€6.49</span>
                    <span className="text-sm" style={{ color: '#6B7280' }}>{t.landing.mo}</span>
                  </div>

                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-semibold mt-1 mb-1" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
                    -50% {(t.landing as any).founderForever || 'forever'}
                  </div>
                  <p className="text-[13px] font-medium mb-5" style={{ color: '#16A34A' }}>
                    ✅ {(t.landing as any).founderYouAreFirst || "You're among the first 1,000 — this price is yours forever"}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {t.landing.proFeatures.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#6B7280' }}>
                        <span style={{ color: '#7C3AED' }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/auth?mode=signup"
                    className="flex items-center justify-center gap-1 w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#7C3AED' }}
                  >
                    {t.landing.getPro} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="bg-white rounded-2xl p-7 border-2 relative overflow-hidden"
                style={{ borderColor: '#7C3AED', boxShadow: '0 4px 30px rgba(124,58,237,0.15)' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <div
                  className="absolute top-4 right-4 text-[11px] font-bold px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: '#7C3AED' }}
                >
                  {t.landing.mostPopular}
                </div>
                <h3 className="text-lg font-bold mb-1" style={{ color: '#1E1B4B' }}>{t.landing.pro}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold" style={{ color: '#1E1B4B' }}>€12.99</span>
                  <span className="text-sm" style={{ color: '#6B7280' }}>{t.landing.mo}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {t.landing.proFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#6B7280' }}>
                      <span style={{ color: '#7C3AED' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth?mode=signup"
                  className="flex items-center justify-center gap-1 w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#7C3AED' }}
                >
                  {t.landing.getPro} <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            className="text-3xl lg:text-4xl font-bold text-center mb-14"
            style={{ color: '#1E1B4B' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {t.landing.faqTitle}
          </motion.h2>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <FaqItem key={i} question={item.q} answer={item.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t" style={{ borderColor: '#EDE9FE' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="text-center">
              <TyanaLogo size="md" />
              <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{t.landing.footerTagline}</p>
            </div>
            <LegalFooterPill />
          </div>
          <p className="text-[12px] leading-relaxed text-center" style={{ color: '#9CA3AF' }}>
            {t.landing.footerDisclaimer}
          </p>
          <p className="text-[12px] mt-2 text-center" style={{ color: '#9CA3AF' }}>
            {t.landing.footerCopyright}
          </p>
        </div>
      </footer>
    </div>
  );
};

/* FAQ Accordion Item */
const FaqItem = ({ question, answer, index }: { question: string; answer: string; index: number }) => {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      className="bg-white rounded-xl overflow-hidden"
      style={{ boxShadow: '0 1px 8px rgba(124,58,237,0.04)' }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <span className="text-sm font-semibold pr-4" style={{ color: '#1E1B4B' }}>{question}</span>
        <span
          className="text-lg shrink-0 transition-transform duration-200"
          style={{ color: '#7C3AED', transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <p className="px-6 pb-4 text-sm leading-relaxed" style={{ color: '#6B7280' }}>
          {answer}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default Index;
