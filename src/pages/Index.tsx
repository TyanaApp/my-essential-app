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
            Simple, transparent pricing
          </motion.h2>
          <p className="text-center mb-14 text-base" style={{ color: '#6B7280' }}>
            Start free, upgrade when you're ready.
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
              <h3 className="text-lg font-bold mb-1" style={{ color: '#1E1B4B' }}>Free</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold" style={{ color: '#1E1B4B' }}>€0</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>/month</span>
              </div>
              <p className="text-[13px] mb-6" style={{ color: '#7C3AED' }}>7-day Pro trial included</p>
              <ul className="space-y-3 mb-8">
                {['1 scan/month', '3 recipes/month', '1 family member', 'Basic calorie counter'].map((f) => (
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
                Start Free
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
                For Families
              </p>
              <h3 className="text-lg font-bold mb-1" style={{ color: '#1E1B4B' }}>Lite</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold" style={{ color: '#1E1B4B' }}>€5.99</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '15 scans/month',
                  'Unlimited recipes',
                  '5 receipts/month',
                  '4 family members',
                  'Allergy profiles',
                  'Live discounts',
                  'Weekly savings report',
                ].map((f) => (
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
                Get Lite <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* PRO */}
            <motion.div
              className="bg-white rounded-2xl p-7 border-2 relative overflow-hidden"
              style={{ borderColor: '#7C3AED', boxShadow: '0 4px 30px rgba(124,58,237,0.15)' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              {/* Most Popular badge */}
              <div
                className="absolute top-4 right-4 text-[11px] font-bold px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: '#7C3AED' }}
              >
                Most Popular
              </div>

              <h3 className="text-lg font-bold mb-1" style={{ color: '#1E1B4B' }}>Pro</h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-lg line-through" style={{ color: '#9CA3AF' }}>€12.99</span>
                <span className="text-4xl font-bold" style={{ color: '#7C3AED' }}>€6.49</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>/mo</span>
              </div>

              {/* Founder badge */}
              <div
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-semibold mt-2 mb-1"
                style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
              >
                ✦ Founder's Price — 50% off for life
              </div>
              <p className="text-[13px] font-medium mb-5" style={{ color: '#EA580C' }}>
                First 1,000 users only
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited scans & recipes',
                  'Unlimited receipts',
                  '6 family members',
                  'Full AI meal planning',
                  'Wearable integration',
                  'Priority support',
                ].map((f) => (
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
                Get Pro — €6.49/month <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
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
            Frequently asked questions
          </motion.h2>

          <div className="space-y-3">
            {[
              { q: 'How does fridge scanning work?', a: 'Simply open the app, tap "Scan", and take a photo of your fridge. TYANA\'s AI identifies every item, estimates quantities and expiry dates, and adds them to your inventory automatically.' },
              { q: 'How does TYANA calculate savings?', a: 'We track the retail value of food you would have thrown away, discounts found for your shopping list, and cost optimizations from meal planning. Your savings dashboard shows a breakdown each week.' },
              { q: 'How are calories calculated?', a: 'Calories and macronutrients are calculated using verified food databases. When you log meals or scan ingredients, TYANA matches them to nutritional data and adjusts portions based on your entries.' },
              { q: 'Is my data safe?', a: 'Yes. All data is encrypted in transit and at rest. We never sell your data. You can export or delete your account and all associated data at any time from Settings.' },
              { q: 'Can I use it without scanning?', a: 'Absolutely. You can manually add items to your inventory, type in recipes, and use the meal planner without ever scanning. Scanning just makes it faster.' },
              { q: 'Which countries have store discounts?', a: 'We currently support major grocery chains in Latvia, Germany, and the Netherlands. We\'re expanding to more EU countries every month. Request your country in Settings!' },
            ].map((item, i) => (
              <FaqItem key={i} question={item.q} answer={item.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t" style={{ borderColor: '#EDE9FE' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div>
              <span
                className="text-2xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #C026D3)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                TYANA
              </span>
              <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Your Kitchen CFO</p>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-sm hover:underline" style={{ color: '#6B7280' }}>Terms</a>
              <a href="#" className="text-sm hover:underline" style={{ color: '#6B7280' }}>Privacy</a>
              <a href="mailto:support@tyana.app" className="text-sm hover:underline" style={{ color: '#6B7280' }}>support@tyana.app</a>
            </div>
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: '#9CA3AF' }}>
            TYANA is an AI-powered kitchen assistant. Nutritional recommendations are not medical advice. Always consult a healthcare professional for dietary concerns.
          </p>
          <p className="text-[12px] mt-2" style={{ color: '#9CA3AF' }}>
            © 2025 TYANA. All rights reserved.
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
