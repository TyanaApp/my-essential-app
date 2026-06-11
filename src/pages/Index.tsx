import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LegalFooterPill from '@/components/LegalFooterPill';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import TyanaLogo from '@/components/TyanaLogo';
import LanguageSelector from '@/components/LanguageSelector';

const Index = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: 'Features', anchor: 'features' },
    { label: 'How it works', anchor: 'how' },
    { label: 'Pricing', anchor: 'pricing' },
    { label: 'FAQ', anchor: 'faq' },
  ];

  const problems = [
    {
      icon: '🥵',
      title: 'I eat healthy but nothing changes',
      text: 'You follow the rules. You go to the gym. But the scale doesn\'t move and your energy is still low. Nobody explains why.',
    },
    {
      icon: '📲',
      title: 'I hate logging every bite',
      text: 'You open the app, spend 10 minutes searching for the food, give up, and close it. That was day 3.',
    },
    {
      icon: '🤷',
      title: 'The app just counts. It doesn\'t think.',
      text: 'Numbers go in. Numbers go out. But you still don\'t know why you feel tired or what to actually eat tomorrow.',
    },
  ];

  const steps = [
    {
      icon: '📸',
      title: 'Take a photo of your meal',
      text: 'Breakfast, lunch, dinner — just snap it. TYANA recognizes the food in 3 seconds.',
    },
    {
      icon: '🧠',
      title: 'TYANA tells you what\'s happening',
      text: 'Not just calories. It explains why this meal gives you energy for 2 hours — or 5. What\'s missing. What to add tomorrow.',
    },
    {
      icon: '💡',
      title: 'You get one tip for today',
      text: 'One clear, personal recommendation. Not a list of 20 rules — just one thing that actually matters for you right now.',
    },
  ];

  const features = [
    { emoji: '📸', title: 'Photo logging in 3 seconds', desc: 'Point your camera at any meal. TYANA identifies it instantly — no searching, no typing.' },
    { emoji: '💡', title: 'It tells you why, not just what', desc: 'Low iron this week — that\'s probably why you feel tired. Real explanations, in plain English.' },
    { emoji: '🔥', title: 'Calories and key nutrients — automatically', desc: 'See your daily totals without doing anything manually. Including iron, B12, and magnesium.' },
    { emoji: '🎯', title: 'Your personal daily calorie goal', desc: 'Calculated for your body, your goal, and your activity level.' },
    { emoji: '⌚', title: 'Connects to your Apple Watch', desc: 'TYANA sees your steps and sleep — and adjusts your tips based on how your day actually went. (Pro)' },
    { emoji: '🔕', title: 'One notification a day. Maximum.', desc: 'One smart alert when it actually matters: "Low energy predicted. Eat more protein at lunch."' },
  ];

  const freeFeatures = [
    'Photo logging (5 meals/day)',
    'Calorie & macro tracking',
    '1 daily insight',
    '7 days of history',
  ];

  const proFeatures = [
    'Unlimited photo logging',
    'Deep insights with explanations',
    'Full nutrition (iron, B12, magnesium+)',
    'Weekly patterns',
    'Apple Watch sync',
    'Unlimited history',
    'Priority support',
  ];

  const faqItems = [
    {
      q: 'Do I really not need to count calories?',
      a: 'Correct. You take a photo, TYANA identifies the food and calculates everything for you — calories, macros, key micronutrients. You just eat.',
    },
    {
      q: 'How accurate is photo recognition?',
      a: 'Very accurate for normal home meals and restaurant plates. If something looks off, you can tap to correct it in a couple of seconds.',
    },
    {
      q: 'Do I need an Apple Watch?',
      a: 'No. TYANA works great on its own. If you have one, Pro can sync your steps and sleep to make tips even more personal.',
    },
    {
      q: 'What happens after the 7-day trial?',
      a: 'You roll back to the Free plan automatically. No charge, no surprise renewal. You only pay if you choose to.',
    },
    {
      q: 'Is my data private?',
      a: 'Yes. Your photos and health data are yours. We are GDPR compliant and never sell your information.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes — one tap in settings. No questions, no fees.',
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3FF' }}>
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'backdrop-blur-xl border-b' : ''}`}
        style={{
          backgroundColor: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
          borderColor: scrolled ? '#EDE9FE' : 'transparent',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <TyanaLogo size="md" />

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.anchor}
                href={`#${item.anchor}`}
                className="text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: '#1E1B4B' }}
              >
                {item.label}
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
              Sign in
            </Link>
            <Link
              to="/auth?mode=signup"
              className="text-xs md:text-sm font-semibold px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-white transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{ backgroundColor: '#7C3AED' }}
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="min-h-screen flex items-center pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1
              className="text-[30px] md:text-[44px] lg:text-[52px] font-bold leading-[1.1] mb-5"
              style={{
                background: 'linear-gradient(135deg, #1E1B4B 0%, #7C3AED 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              You're doing everything right. So why isn't your body changing?
            </h1>

            <p className="text-base md:text-lg lg:text-[20px] leading-relaxed mb-8" style={{ color: '#6B7280' }}>
              TYANA looks at what you eat and tells you exactly what's happening — and what to do next. No calorie counting. No spreadsheets. Just take a photo.
            </p>

            <Link
              to="/auth?mode=signup"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 text-white text-base md:text-lg font-semibold rounded-2xl transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#7C3AED', height: '52px', minWidth: '260px' }}
            >
              Try Free for 7 Days
              <ArrowRight className="w-5 h-5" />
            </Link>

            <p className="mt-3 text-[13px] text-center md:text-left" style={{ color: '#6B7280' }}>
              No credit card needed. All features included.
            </p>

            <div className="grid grid-cols-3 gap-3 md:flex md:flex-wrap md:gap-6 mt-6">
              {[
                { emoji: '📸', label: '3 sec photo analysis' },
                { emoji: '🔥', label: 'No manual logging' },
                { emoji: '💡', label: 'Daily personal tips' },
              ].map((stat) => (
                <div key={stat.label} className="text-center md:text-left">
                  <div className="text-base md:text-lg font-bold" style={{ color: '#7C3AED' }}>
                    {stat.emoji} <span className="hidden md:inline" style={{ color: '#1E1B4B' }}>{stat.label}</span>
                  </div>
                  <div className="text-[10px] md:hidden" style={{ color: '#6B7280' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Phone mockup */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div
              className="relative rounded-[2.5rem] p-3 w-[280px] md:w-[320px]"
              style={{
                background: 'linear-gradient(180deg, #1E1B4B 0%, #312E81 100%)',
                boxShadow: '0 20px 60px rgba(124,58,237,0.25)',
              }}
              animate={{ y: [-8, 0, -8] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="bg-white rounded-[2rem] overflow-hidden">
                {/* Notch */}
                <div className="flex justify-center pt-2">
                  <div className="w-20 h-5 rounded-full" style={{ backgroundColor: '#1E1B4B' }} />
                </div>

                <div className="p-4 space-y-3">
                  {/* Meal photo */}
                  <div
                    className="relative w-full aspect-[4/3] rounded-2xl flex items-center justify-center text-6xl overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)',
                    }}
                  >
                    🍝
                    <div
                      className="absolute bottom-2 left-2 right-2 backdrop-blur-md rounded-lg px-2 py-1 flex items-center justify-between text-[10px] font-semibold"
                      style={{ backgroundColor: 'rgba(255,255,255,0.85)', color: '#1E1B4B' }}
                    >
                      <span>📸 Analyzing…</span>
                      <span style={{ color: '#7C3AED' }}>3s</span>
                    </div>
                  </div>

                  {/* Insight card */}
                  <div
                    className="rounded-2xl p-3"
                    style={{ backgroundColor: '#F5F3FF', border: '1px solid #EDE9FE' }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-base">💡</span>
                      <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#7C3AED' }}>
                        Today's insight
                      </span>
                    </div>
                    <p className="text-[12px] leading-snug font-medium" style={{ color: '#1E1B4B' }}>
                      High carbs, low protein. This explains the energy crash at 3pm. Add eggs or Greek yogurt to your next meal.
                    </p>
                  </div>

                  {/* Bottom bar */}
                  <div className="flex items-center justify-around pt-1 pb-1">
                    {['🏠', '📷', '📊', '⚙️'].map((e, i) => (
                      <div key={i} className="text-base opacity-60">{e}</div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.p
            className="text-center text-sm font-semibold tracking-wider uppercase mb-3"
            style={{ color: '#7C3AED' }}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Sound familiar?
          </motion.p>
          <motion.h2
            className="text-3xl lg:text-4xl font-bold text-center mb-14"
            style={{ color: '#1E1B4B' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            You've tried tracking before. It didn't stick.
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {problems.map((p, i) => (
              <motion.div
                key={p.title}
                className="rounded-2xl p-7"
                style={{ backgroundColor: '#F5F3FF', border: '1px solid #EDE9FE' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#1E1B4B' }}>{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{p.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            className="text-center mt-12 text-lg md:text-xl font-semibold"
            style={{ color: '#1E1B4B' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            TYANA works differently. <span style={{ color: '#7C3AED' }}>It doesn't just count — it thinks.</span>
          </motion.p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="text-3xl lg:text-4xl font-bold text-center mb-14"
            style={{ color: '#1E1B4B' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Three steps. That's it.
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                className="text-center relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div
                  className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4"
                  style={{ backgroundColor: '#EDE9FE' }}
                >
                  {s.icon}
                </div>
                <div className="text-xs font-bold tracking-wider mb-2" style={{ color: '#7C3AED' }}>
                  STEP {i + 1}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#1E1B4B' }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{s.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-3xl lg:text-4xl font-bold text-center mb-14"
            style={{ color: '#1E1B4B' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            What TYANA actually does for you
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="rounded-2xl p-7"
                style={{ backgroundColor: '#F5F3FF', border: '1px solid #EDE9FE' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 bg-white"
                >
                  {f.emoji}
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: '#1E1B4B' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6" style={{ backgroundColor: '#F5F3FF' }}>
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="text-3xl lg:text-4xl font-bold text-center mb-4"
            style={{ color: '#1E1B4B' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Simple pricing
          </motion.h2>
          <p className="text-center mb-14 text-base" style={{ color: '#6B7280' }}>
            Start free. Upgrade only if TYANA actually helps you.
          </p>

          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* FREE */}
            <motion.div
              className="bg-white rounded-2xl p-7"
              style={{ boxShadow: '0 2px 20px rgba(124,58,237,0.06)' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-bold mb-1" style={{ color: '#1E1B4B' }}>Free</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold" style={{ color: '#1E1B4B' }}>€0</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>/ forever</span>
              </div>
              <ul className="space-y-3 mb-8">
                {freeFeatures.map((f) => (
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
                Get started
              </Link>
            </motion.div>

            {/* PRO */}
            <motion.div
              className="bg-white rounded-2xl border-2 relative overflow-hidden p-7"
              style={{ borderColor: '#7C3AED', boxShadow: '0 4px 30px rgba(124,58,237,0.15)' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div
                className="absolute top-4 right-4 text-[11px] font-bold px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: '#7C3AED' }}
              >
                Most popular
              </div>

              <h3 className="text-lg font-bold mb-1" style={{ color: '#1E1B4B' }}>Pro</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold" style={{ color: '#7C3AED' }}>€9.99</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>/ month</span>
              </div>
              <p className="text-[13px] mb-3" style={{ color: '#6B7280' }}>
                or <strong style={{ color: '#1E1B4B' }}>€69.99/year</strong> — save 42%
              </p>

              <div
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full mb-5"
                style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
              >
                🔒 Founding Member: €6.49/month — first 500 users only
              </div>

              <ul className="space-y-3 mb-8">
                {proFeatures.map((f) => (
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
                Start Free for 7 Days <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          <p className="text-center mt-8 text-sm" style={{ color: '#6B7280' }}>
            After 7 days, free plan continues automatically. <strong style={{ color: '#1E1B4B' }}>No charge. No tricks.</strong>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            className="text-3xl lg:text-4xl font-bold text-center mb-14"
            style={{ color: '#1E1B4B' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Questions?
          </motion.h2>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <FaqItem key={i} question={item.q} answer={item.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-5 leading-tight"
            style={{
              background: 'linear-gradient(135deg, #1E1B4B 0%, #7C3AED 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Your body has been trying to tell you something. Let's figure out what.
          </motion.h2>
          <p className="text-base md:text-lg mb-8" style={{ color: '#6B7280' }}>
            Start with one photo. Find out what's really going on.
          </p>
          <Link
            to="/auth?mode=signup"
            className="inline-flex items-center gap-2 text-white text-base md:text-lg font-semibold rounded-2xl transition-opacity hover:opacity-90 px-8 py-4"
            style={{ backgroundColor: '#7C3AED' }}
          >
            Start Free — No Card Needed <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-6 text-[13px]" style={{ color: '#6B7280' }}>
            Used by 500+ people across Europe · GDPR compliant · Your data is yours
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t" style={{ borderColor: '#EDE9FE' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="text-center">
              <TyanaLogo size="md" />
              <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                Eat smart. Feel better. One photo at a time.
              </p>
            </div>
            <LegalFooterPill />
          </div>
          <p className="text-[12px] mt-2 text-center" style={{ color: '#9CA3AF' }}>
            © {new Date().getFullYear()} TYANA. All rights reserved.
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
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: '#F5F3FF', border: '1px solid #EDE9FE' }}
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
