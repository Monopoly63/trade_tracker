import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, BarChart3, Shield, Brain, Target, LineChart,
  ChevronDown, ChevronRight, Star, ArrowRight, Menu, X,
  CheckCircle2, Zap, Lock, PieChart,
} from 'lucide-react';

/* ─── image URLs ─── */
const IMAGES = {
  dashboardPreview: 'https://mgx-backend-cdn.metadl.com/generate/images/1128319/2026-04-18/m34l4iyaafbq/dashboard-preview.png',
  heroBg: 'https://mgx-backend-cdn.metadl.com/generate/images/1128319/2026-04-18/m34l4vyaafaa/hero-bg-gradient.png',
  trader1: 'https://mgx-backend-cdn.metadl.com/generate/images/1128319/2026-04-18/m34lyxaaafaq/testimonial-trader-1.png',
  trader2: 'https://mgx-backend-cdn.metadl.com/generate/images/1128319/2026-04-18/m34ly4yaafba/testimonial-trader-2.png',
  avatar: '/assets/avatar.jpg',
};

/* ─── animated counter hook ─── */
function useCounter(end: number, duration = 2000, suffix = '') {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            setValue(Math.floor(progress * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return { ref, display: `${value.toLocaleString()}${suffix}` };
}

/* ─── FAQ item ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
      >
        <span className="font-medium text-white pr-4">{q}</span>
        <ChevronDown className={`w-5 h-5 text-indigo-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-60 pb-5 px-5' : 'max-h-0'}`}>
        <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goLogin = () => navigate('/login');

  /* counters */
  const c1 = useCounter(12500, 2200, '+');
  const c2 = useCounter(850000, 2400, '+');
  const c3 = useCounter(98, 1800, '%');
  const c4 = useCounter(4.9, 1600, '');

  /* features */
  const features = [
    { icon: <BarChart3 className="w-6 h-6" />, title: 'Advanced Analytics', desc: 'Deep performance insights with win-rate, R-multiples, drawdown analysis and equity curves.' },
    { icon: <Shield className="w-6 h-6" />, title: 'Risk Management', desc: 'Set custom risk rules, daily loss limits, and get real-time alerts before you break your plan.' },
    { icon: <Brain className="w-6 h-6" />, title: 'Psychology Tracking', desc: 'Log emotional states, track discipline patterns, and identify psychological trading pitfalls.' },
    { icon: <Target className="w-6 h-6" />, title: 'Strategy Builder', desc: 'Define, test and refine your trading strategies with detailed rule-based frameworks.' },
    { icon: <LineChart className="w-6 h-6" />, title: 'Trade Journaling', desc: 'Log every trade with screenshots, notes, tags, and comprehensive entry/exit analysis.' },
    { icon: <PieChart className="w-6 h-6" />, title: 'Performance Reviews', desc: 'Weekly and monthly reviews with actionable insights to continuously improve your edge.' },
  ];

  /* steps */
  const steps = [
    { num: '01', title: 'Log Your Trades', desc: 'Quickly add trades with all the details — instrument, entry/exit, risk, and notes.' },
    { num: '02', title: 'Analyze Performance', desc: 'Get instant analytics on your win rate, R-multiples, best setups, and weak spots.' },
    { num: '03', title: 'Improve & Grow', desc: 'Use data-driven insights to refine your strategy and build consistent profitability.' },
  ];

  /* testimonials */
  const testimonials = [
    { name: 'Ahmed K.', role: 'Forex Trader', img: IMAGES.avatar, text: 'TradeJournal completely transformed my trading. I finally see my patterns clearly and my win rate jumped from 42% to 67% in 3 months.' },
    { name: 'Sarah M.', role: 'Crypto Trader', img: IMAGES.trader2, text: 'The risk management tools are incredible. I used to over-leverage constantly — now I have clear rules and my account is growing steadily.' },
    { name: 'James R.', role: 'Day Trader', img: IMAGES.trader1, text: 'Best trading journal I\'ve used. The psychology tracking helped me realize I was revenge trading after losses. Game changer.' },
  ];

  /* FAQ */
  const faqs = [
    { q: 'Is TradeJournal free to use?', a: 'Yes! TradeJournal offers a generous free tier with all core features. Premium plans unlock advanced analytics and unlimited trade storage.' },
    { q: 'Which markets does it support?', a: 'TradeJournal works with any market — Forex, Stocks, Crypto, Futures, Options, and Commodities. Simply enter your instrument and go.' },
    { q: 'Is my trading data secure?', a: 'Absolutely. All data is encrypted at rest and in transit. We use Supabase with Row Level Security so only you can access your trades.' },
    { q: 'Can I import trades from my broker?', a: 'We support CSV import from most major brokers. Manual entry is also quick and easy with our streamlined trade form.' },
    { q: 'Does it work on mobile?', a: 'Yes! TradeJournal is fully responsive and works beautifully on phones, tablets, and desktops. Log trades on the go.' },
  ];

  return (
    <div className="min-h-screen bg-[#06060e] text-white overflow-x-hidden">
      {/* ─── NAVBAR ─── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#06060e]/90 backdrop-blur-xl border-b border-white/5 shadow-lg' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                TradeJournal
              </span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How It Works</a>
              <a href="#testimonials" className="text-sm text-gray-400 hover:text-white transition-colors">Testimonials</a>
              <a href="#faq" className="text-sm text-gray-400 hover:text-white transition-colors">FAQ</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10" onClick={goLogin}>
                Sign In
              </Button>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25" onClick={goLogin}>
                Get Started Free
              </Button>
            </div>

            {/* Mobile menu toggle */}
            <button className="md:hidden p-2 text-gray-400 hover:text-white" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-[#06060e]/95 backdrop-blur-xl border-t border-white/5 px-4 pb-6 pt-2 space-y-3">
            <a href="#features" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMobileMenu(false)}>Features</a>
            <a href="#how-it-works" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMobileMenu(false)}>How It Works</a>
            <a href="#testimonials" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMobileMenu(false)}>Testimonials</a>
            <a href="#faq" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMobileMenu(false)}>FAQ</a>
            <div className="pt-3 flex flex-col gap-2">
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" onClick={goLogin}>Sign In</Button>
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white" onClick={goLogin}>Get Started Free</Button>
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-32">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <img src={IMAGES.heroBg} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#06060e]/60 via-[#06060e]/80 to-[#06060e]" />
        </div>
        {/* Glow effects */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm mb-8">
              <Zap className="w-4 h-4" />
              <span>Trusted by 12,500+ traders worldwide</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Master Your Trading
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                With Data-Driven Insights
              </span>
            </h1>

            <p className="mt-6 sm:mt-8 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              The professional trading journal that helps you track, analyze, and improve your trading performance.
              Turn your trades into actionable insights.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-lg px-8 py-6 shadow-2xl shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 hover:scale-[1.02]"
                onClick={goLogin}
              >
                Start Journaling Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                See Features
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Free forever plan</span>
              <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-green-500" /> Bank-level security</span>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="mt-16 sm:mt-20 relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl blur-xl" />
            <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
              <img
                src={IMAGES.dashboardPreview}
                alt="TradeJournal Dashboard"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06060e] via-transparent to-transparent opacity-40" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 sm:py-32 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">Features</span>
            <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Trade Better</span>
            </h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto text-lg">
              Powerful tools designed by traders, for traders. Track every aspect of your trading journey.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 sm:py-32 relative bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">How It Works</span>
            <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold">
              Three Simple Steps to{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Trading Mastery</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-indigo-500/50" />

            {steps.map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-lg mb-6 shadow-lg shadow-indigo-500/30 relative z-10">
                  {s.num}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{s.title}</h3>
                <p className="text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATISTICS ─── */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-purple-600/5 to-indigo-600/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { ref: c1.ref, val: c1.display, label: 'Active Traders' },
              { ref: c2.ref, val: c2.display, label: 'Trades Logged' },
              { ref: c3.ref, val: c3.display, label: 'Uptime' },
              { ref: c4.ref, val: c4.display, label: 'User Rating' },
            ].map((s, i) => (
              <div key={i} ref={s.ref} className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {s.val}
                </div>
                <p className="mt-2 text-gray-400 text-sm sm:text-base">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="py-20 sm:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">Testimonials</span>
            <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold">
              Loved by{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Traders Worldwide</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/20 transition-all duration-300"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                  <div>
                    <p className="text-white font-medium text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 sm:py-32 relative bg-white/[0.01]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">FAQ</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 sm:py-32 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Your Trading?</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of traders who are already using TradeJournal to build consistency and grow their accounts.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-lg px-10 py-6 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all"
            onClick={goLogin}
          >
            Get Started — It's Free
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">TradeJournal</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                The professional trading journal for serious traders. Track, analyze, and improve.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#features" className="hover:text-gray-300 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-gray-300 transition-colors">How It Works</a></li>
                <li><a href="#testimonials" className="hover:text-gray-300 transition-colors">Testimonials</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#faq" className="hover:text-gray-300 transition-colors">FAQ</a></li>
                <li><span className="hover:text-gray-300 transition-colors cursor-pointer">Contact Us</span></li>
                <li><span className="hover:text-gray-300 transition-colors cursor-pointer">Documentation</span></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><span className="hover:text-gray-300 transition-colors cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-gray-300 transition-colors cursor-pointer">Terms of Service</span></li>
                <li><span className="hover:text-gray-300 transition-colors cursor-pointer">Cookie Policy</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">© 2025 TradeJournal. All rights reserved.</p>
            <div className="flex items-center gap-4 text-gray-600 text-sm">
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Twitter</span>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Discord</span>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">GitHub</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}