import { type Variants, motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  ChevronRight,
  Code2,
  Globe,
  Lock,
  Menu,
  MonitorSmartphone,
  Search,
  Shield,
  Sparkles,
  Upload,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

/* ─── Animation variants ─── */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: EASE },
  }),
}

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.12, duration: 0.5, ease: EASE },
  }),
}

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section ref={ref} className={className} id={id}>
      <motion.div
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      >
        {children}
      </motion.div>
    </section>
  )
}

/* ─── Animated counter ─── */
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => Math.round(v))
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, value, { duration: 2, ease: EASE })
      return controls.stop
    }
  }, [isInView, motionValue, value])

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => setDisplay(v))
    return unsubscribe
  }, [rounded])

  return (
    <span ref={ref}>
      {display.toLocaleString()}{suffix}
    </span>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   LANDING PAGE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-white font-sans overflow-x-hidden landing-scroll">
      <Navbar />
      <Hero />
      <LogoCloud />
      <HowItWorks />
      <PipelineVisual />
      <Integrations />
      <Features />
      <DeveloperExperience />
      <Stats />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  )
}

/* ─── Navbar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-heavy border-b border-white/5 shadow-lg shadow-black/20' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <span className="font-mono font-bold text-lg tracking-tight">
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">mcp</span>
            <span className="text-zinc-500 font-light">/</span>
            <span className="bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">ify</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link
            to="/register"
            className="text-sm font-medium bg-brand-600 hover:bg-brand-500 px-4 py-2 rounded-lg transition-all shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30"
          >
            Get Started Free
          </Link>
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-zinc-400 hover:text-white">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass-heavy border-b border-white/5 px-6 pb-6 pt-2"
        >
          <div className="space-y-4">
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block text-sm text-zinc-400 hover:text-white">How it works</a>
            <a href="#features" onClick={() => setMobileOpen(false)} className="block text-sm text-zinc-400 hover:text-white">Features</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="block text-sm text-zinc-400 hover:text-white">Pricing</a>
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="text-sm text-zinc-400 hover:text-white">Sign in</Link>
              <Link to="/register" className="text-sm font-medium bg-brand-600 px-4 py-2 rounded-lg">Get Started Free</Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] bg-brand-600/8 rounded-full blur-[140px]" />
      <div className="absolute top-20 right-20 w-80 h-80 bg-purple-600/6 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-20 w-60 h-60 bg-emerald-600/5 rounded-full blur-[100px]" />

      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/5 text-brand-300 text-sm font-medium mb-8"
        >
          <Sparkles className="w-4 h-4" />
          Now in public beta
          <ChevronRight className="w-3.5 h-3.5" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-6"
        >
          Turn any REST API
          <br />
          <span className="text-gradient">into an MCP server</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Connect your existing API to ChatGPT, Claude, Cursor and every MCP&#8209;compatible
          AI client — <span className="text-white font-medium">zero MCP code required</span>.
          Import your OpenAPI spec and go live in minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/register"
            className="group flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all shadow-lg shadow-brand-600/25 hover:shadow-brand-500/40 hover:scale-[1.02]"
          >
            Start for free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 text-zinc-400 hover:text-white font-medium px-6 py-3.5 rounded-xl border border-zinc-800 hover:border-zinc-600 transition-all text-base"
          >
            See how it works
          </a>
        </motion.div>

        {/* Hero code preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 md:mt-20 max-w-3xl mx-auto"
        >
          <div className="relative rounded-2xl border border-zinc-800 bg-surface-card overflow-hidden glow-brand-sm">
            {/* Top shimmer line */}
            <div className="absolute top-0 left-0 right-0 h-px shimmer-border" />
            <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800/80">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-zinc-700" />
                <span className="w-3 h-3 rounded-full bg-zinc-700" />
                <span className="w-3 h-3 rounded-full bg-zinc-700" />
              </div>
              <span className="text-xs text-zinc-500 font-mono ml-2">MCP connection URL</span>
            </div>
            <div className="px-5 py-6 font-mono text-sm md:text-base">
              <div className="text-zinc-500">{'// Your AI clients connect here'}</div>
              <div className="mt-2">
                <span className="text-brand-400">https</span>
                <span className="text-zinc-500">://</span>
                <span className="text-white">mcpify.app</span>
                <span className="text-zinc-500">/mcp/</span>
                <span className="text-emerald-400">{'<your-token>'}</span>
                <span className="inline-block w-0.5 h-5 bg-brand-400 ml-1 align-middle" style={{ animation: 'blink 1.2s step-end infinite' }} />
              </div>
              <div className="mt-4 text-zinc-500">{"// That's it. No SDK, no server code, no infra."}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Logo cloud ─── */
function LogoCloud() {
  const clients = [
    { name: 'ChatGPT', icon: Bot },
    { name: 'Claude', icon: Sparkles },
    { name: 'Cursor', icon: Code2 },
    { name: 'Windsurf', icon: Globe },
    { name: 'Any MCP Client', icon: MonitorSmartphone },
  ]

  return (
    <Section className="py-16 border-y border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.p variants={fadeUp} custom={0} className="text-center text-sm text-zinc-500 uppercase tracking-wider font-medium mb-8">
          Works with every MCP-compatible AI client
        </motion.p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {clients.map((c, i) => (
            <motion.div
              key={c.name}
              variants={fadeUp}
              custom={i + 1}
              className="flex items-center gap-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <c.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{c.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HOW IT WORKS — n8n / Railway-style pipeline
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Import your API',
      desc: 'Paste an OpenAPI spec URL, upload a YAML file, or add endpoints manually. We support Swagger 2.0 and OpenAPI 3.x.',
      icon: Upload,
      gradient: 'from-blue-500 to-cyan-400',
      glowColor: 'rgba(59, 130, 246, 0.15)',
      accentColor: '#3b82f6',
      features: ['OpenAPI 3.x & Swagger 2.0', 'YAML / JSON upload', 'Manual endpoint builder'],
    },
    {
      num: '02',
      title: 'MCPify transforms it',
      desc: 'We auto-generate MCP tools from your endpoints, configure auth, set up rate limiting, and flag destructive operations.',
      icon: Zap,
      gradient: 'from-brand-500 to-purple-500',
      glowColor: 'rgba(99, 102, 241, 0.15)',
      accentColor: '#6366f1',
      features: ['Auto-generated MCP tools', 'Auth & rate limiting', 'Destructive op guards'],
    },
    {
      num: '03',
      title: 'AI clients connect',
      desc: 'Share one URL. ChatGPT, Claude, Cursor — any MCP client can now call your API with full type safety.',
      icon: Bot,
      gradient: 'from-emerald-500 to-teal-400',
      glowColor: 'rgba(16, 185, 129, 0.15)',
      accentColor: '#10b981',
      features: ['Single MCP endpoint', 'All clients supported', 'Real-time analytics'],
    },
  ]

  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: '-100px' })

  return (
    <section id="how-it-works" className="py-24 md:py-36 relative overflow-hidden">
      <div className="absolute inset-0 bg-dot-pattern opacity-20" />
      {/* Decorative blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-6" ref={containerRef}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-4 block">
            How it works
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-5">
            Three steps.{' '}
            <span className="text-gradient">Zero MCP code.</span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-lg">
            Go from REST API to AI-ready in under five minutes.
          </p>
        </motion.div>

        {/* ── Pipeline cards with animated connectors ── */}
        <div className="relative">
          {/* SVG connectors (desktop) */}
          <div className="hidden lg:block absolute inset-0 z-0 pointer-events-none">
            <svg width="100%" height="100%" className="absolute inset-0" preserveAspectRatio="none">
              <defs>
                <linearGradient id="connector1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="connector2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 relative z-10">
            {steps.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-center">
                {/* Animated connector line BEFORE card (between cards) */}
                {i > 0 && (
                  <div className="hidden lg:flex items-center absolute -left-4 top-1/2 -translate-y-1/2 -translate-x-full z-20">
                    <AnimatedConnector
                      color1={steps[i - 1].accentColor}
                      color2={step.accentColor}
                      delay={0.5 + i * 0.4}
                      isInView={isInView}
                    />
                  </div>
                )}

                {/* Mobile connector arrow */}
                {i > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={isInView ? { opacity: 1, scaleY: 1 } : {}}
                    transition={{ delay: 0.3 + i * 0.3, duration: 0.4 }}
                    className="lg:hidden flex flex-col items-center py-4"
                  >
                    <div className="w-px h-12 bg-gradient-to-b" style={{
                      backgroundImage: `linear-gradient(to bottom, ${steps[i - 1].accentColor}, ${step.accentColor})`
                    }} />
                    <svg width="12" height="8" viewBox="0 0 12 8" className="-mt-px">
                      <polygon points="6,8 0,0 12,0" fill={step.accentColor} />
                    </svg>
                    {/* Mobile data packets */}
                    <DataPacketVertical color={step.accentColor} delay={1.5 + i * 0.5} isInView={isInView} />
                  </motion.div>
                )}

                {/* Step card */}
                <motion.div
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ delay: 0.2 + i * 0.25, duration: 0.7, ease: EASE }}
                  className="group relative w-full max-w-sm mx-auto"
                >
                  {/* Card glow effect on hover */}
                  <div
                    className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
                    style={{ background: `linear-gradient(135deg, ${step.accentColor}33, transparent 60%)` }}
                  />

                  <div className="relative rounded-2xl border border-zinc-800 bg-surface-card p-8 hover:border-zinc-700/80 transition-all duration-300 h-full">
                    {/* Top accent bar */}
                    <div
                      className="absolute top-0 left-6 right-6 h-px"
                      style={{ background: `linear-gradient(90deg, transparent, ${step.accentColor}66, transparent)` }}
                    />

                    {/* Step number with pulse */}
                    <div className="relative mb-6">
                      <span className="text-xs font-mono text-zinc-600 tracking-widest">{step.num}</span>
                    </div>

                    {/* Icon with animated ring */}
                    <div className="relative w-14 h-14 mb-6">
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                        style={{ boxShadow: `0 8px 32px -8px ${step.accentColor}66` }}
                      >
                        <step.icon className="w-7 h-7 text-white" />
                      </div>
                      {/* Pulse ring */}
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={isInView ? {
                          scale: [0.8, 1.8],
                          opacity: [0.5, 0],
                        } : {}}
                        transition={{
                          delay: 1 + i * 0.3,
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 3,
                        }}
                        className="absolute inset-0 rounded-xl border-2"
                        style={{ borderColor: step.accentColor }}
                      />
                    </div>

                    <h3 className="text-xl font-bold mb-3 tracking-tight">{step.title}</h3>
                    <p className="text-zinc-400 leading-relaxed text-sm mb-6">{step.desc}</p>

                    {/* Feature chips */}
                    <div className="flex flex-wrap gap-2">
                      {step.features.map((f) => (
                        <span
                          key={f}
                          className="text-xs font-medium px-2.5 py-1 rounded-md border"
                          style={{
                            borderColor: `${step.accentColor}25`,
                            backgroundColor: `${step.accentColor}08`,
                            color: step.accentColor,
                          }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Animated connector between pipeline cards ─── */
function AnimatedConnector({ color1, color2, delay, isInView }: {
  color1: string; color2: string; delay: number; isInView: boolean
}) {
  return (
    <div className="relative w-16 h-8 flex items-center">
      {/* Base line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ delay, duration: 0.5, ease: 'easeOut' }}
        className="absolute inset-x-0 top-1/2 h-0.5 origin-left"
        style={{ background: `linear-gradient(90deg, ${color1}, ${color2})` }}
      />

      {/* Traveling data packet */}
      <motion.div
        initial={{ x: '-10%', opacity: 0 }}
        animate={isInView ? {
          x: ['0%', '100%'],
          opacity: [0, 1, 1, 0],
        } : {}}
        transition={{
          delay: delay + 0.5,
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 2,
          ease: 'easeInOut',
        }}
        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
        style={{
          background: `linear-gradient(135deg, ${color1}, ${color2})`,
          boxShadow: `0 0 12px 2px ${color1}88`,
        }}
      />

      {/* Arrow head */}
      <motion.svg
        initial={{ opacity: 0, x: -5 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: delay + 0.4, duration: 0.3 }}
        width="8" height="12" viewBox="0 0 8 12"
        className="absolute -right-1 top-1/2 -translate-y-1/2"
      >
        <polygon points="0,0 8,6 0,12" fill={color2} />
      </motion.svg>
    </div>
  )
}

/* ─── Vertical data packet for mobile ─── */
function DataPacketVertical({ color, delay, isInView }: {
  color: string; delay: number; isInView: boolean
}) {
  return (
    <motion.div
      initial={{ y: '0%', opacity: 0 }}
      animate={isInView ? {
        y: ['0%', '200%'],
        opacity: [0, 1, 1, 0],
      } : {}}
      transition={{
        delay,
        duration: 1.2,
        repeat: Infinity,
        repeatDelay: 3,
        ease: 'easeInOut',
      }}
      className="absolute w-2 h-2 rounded-full"
      style={{
        background: color,
        boxShadow: `0 0 10px 2px ${color}66`,
      }}
    />
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PIPELINE VISUAL — Full animated diagram
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function PipelineVisual() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  const frameworks = [
    { name: 'Laravel', color: '#FF2D20' },
    { name: 'Symfony', color: '#000000' },
    { name: 'Django', color: '#092E20' },
    { name: 'FastAPI', color: '#009688' },
    { name: 'Express', color: '#68A063' },
    { name: 'NestJS', color: '#E0234E' },
    { name: 'Rails', color: '#CC0000' },
    { name: 'Spring Boot', color: '#6DB33F' },
    { name: 'ASP.NET', color: '#512BD4' },
    { name: 'Go Fiber', color: '#00ADD8' },
  ]

  const apiEndpoints = [
    { method: 'GET', path: '/tickets', color: '#f59e0b' },
    { method: 'POST', path: '/orders', color: '#8b5cf6' },
    { method: 'GET', path: '/products', color: '#3b82f6' },
    { method: 'POST', path: '/reservations', color: '#10b981' },
  ]

  const mcpTools = [
    { name: 'search_tickets', status: 'active' },
    { name: 'create_order', status: 'active' },
    { name: 'list_products', status: 'active' },
    { name: 'book_table', status: 'active' },
  ]

  const aiClients = [
    { name: 'ChatGPT', color: '#10b981' },
    { name: 'Claude', color: '#a78bfa' },
    { name: 'Cursor', color: '#38bdf8' },
    { name: 'Windsurf', color: '#f472b6' },
  ]

  const useCases = [
    {
      query: 'Find me concert tickets in Miami this weekend',
      service: 'TicketMaster API',
      result: 'I found 12 concerts in Miami this weekend! Top pick: Bad Bunny at Kaseya Center, Saturday 8 PM — tickets from $85. Also: Karol G on Sunday, Tyler the Creator on Friday night.',
      client: 'ChatGPT',
      clientColor: '#10b981',
    },
    {
      query: 'What running shoes do you have under $120?',
      service: 'E-Commerce API',
      result: 'Here are 24 running shoes under $120: Nike Pegasus 41 — $109.99 (⭐ 4.8), Adidas Ultraboost Light — $119.00, New Balance Fresh Foam — $89.99. Want me to filter by brand?',
      client: 'Claude',
      clientColor: '#a78bfa',
    },
    {
      query: 'Book a table for 4 tonight at an Italian restaurant',
      service: 'Restaurant API',
      result: 'Done! Reserved a table for 4 at Osteria Morini, tonight at 8:30 PM. Confirmation #OM-4821. I also found La Pecora Bianca with availability at 9 PM if you prefer.',
      client: 'Cursor',
      clientColor: '#38bdf8',
    },
  ]

  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 space-y-8">

        {/* ── Framework cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-center text-sm text-zinc-500 uppercase tracking-wider font-medium mb-5">
            Works with any backend framework
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {frameworks.map((fw, i) => (
              <motion.div
                key={fw.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                whileHover={{ scale: 1.08, y: -2 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-surface-card hover:border-zinc-600 transition-all cursor-default"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: fw.color, boxShadow: `0 0 8px ${fw.color}44` }}
                />
                <span className="text-sm font-medium text-zinc-300">{fw.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Main pipeline diagram ── */}
        <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-surface-card/80 to-surface/40 p-6 md:p-10 overflow-hidden relative">
          {/* Background grid */}
          <div className="absolute inset-0 bg-grid-pattern opacity-50" />

          {/* Pipeline flow */}
          <div className="relative flex flex-col lg:flex-row items-stretch justify-between gap-6 lg:gap-0">

            {/* Column 1: Your REST API */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex-1 max-w-[220px] mx-auto lg:mx-0"
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Your API
              </div>
              <div className="space-y-2">
                {apiEndpoints.map((ep, i) => (
                  <motion.div
                    key={ep.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 transition-colors"
                  >
                    <span
                      className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${ep.color}15`, color: ep.color }}
                    >
                      {ep.method}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">{ep.path}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Connector 1 */}
            <div className="hidden lg:flex items-center justify-center flex-shrink-0 w-24 relative">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="w-full h-0.5 bg-gradient-to-r from-blue-500/60 to-brand-500/60 origin-left"
              />
              {[0, 1, 2].map((j) => (
                <motion.div
                  key={j}
                  initial={{ left: '0%', opacity: 0 }}
                  animate={isInView ? {
                    left: ['0%', '100%'],
                    opacity: [0, 1, 1, 0],
                  } : {}}
                  transition={{
                    delay: 1.2 + j * 0.6,
                    duration: 1,
                    repeat: Infinity,
                    repeatDelay: 1.2,
                    ease: 'easeInOut',
                  }}
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-400"
                  style={{ boxShadow: '0 0 8px 2px rgba(59,130,246,0.5)' }}
                />
              ))}
              <motion.svg
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1 }}
                width="6" height="10" viewBox="0 0 6 10" className="absolute -right-0.5"
              >
                <polygon points="0,0 6,5 0,10" fill="#6366f1" />
              </motion.svg>
            </div>

            <MobileVerticalConnector isInView={isInView} delay={0.6} color1="#3b82f6" color2="#6366f1" />

            {/* Column 2: MCPify Engine */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.7, duration: 0.6, type: 'spring', stiffness: 200 }}
              className="flex-1 max-w-[260px] mx-auto lg:mx-0"
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-glow" />
                MCPify Engine
              </div>
              <div className="rounded-xl border border-brand-500/25 bg-brand-600/5 p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
                <div
                  className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent, #6366f1, transparent)',
                    animation: 'spotlight 8s linear infinite',
                  }}
                />
                <div className="relative space-y-2">
                  {mcpTools.map((tool, i) => (
                    <motion.div
                      key={tool.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 1 + i * 0.1, duration: 0.3 }}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800/50"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-brand-400" />
                        <span className="text-xs font-mono text-zinc-300">{tool.name}</span>
                      </div>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        tool.status === 'guarded'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {tool.status === 'guarded' ? '🛡 guarded' : '● active'}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  {['Auth', 'Rate Limit', 'Logging'].map((label) => (
                    <span key={label} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/15">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Connector 2 */}
            <div className="hidden lg:flex items-center justify-center flex-shrink-0 w-24 relative">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="w-full h-0.5 bg-gradient-to-r from-brand-500/60 to-emerald-500/60 origin-left"
              />
              {[0, 1, 2].map((j) => (
                <motion.div
                  key={j}
                  initial={{ left: '0%', opacity: 0 }}
                  animate={isInView ? {
                    left: ['0%', '100%'],
                    opacity: [0, 1, 1, 0],
                  } : {}}
                  transition={{
                    delay: 1.8 + j * 0.6,
                    duration: 1,
                    repeat: Infinity,
                    repeatDelay: 1.2,
                    ease: 'easeInOut',
                  }}
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-400"
                  style={{ boxShadow: '0 0 8px 2px rgba(99,102,241,0.5)' }}
                />
              ))}
              <motion.svg
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1.6 }}
                width="6" height="10" viewBox="0 0 6 10" className="absolute -right-0.5"
              >
                <polygon points="0,0 6,5 0,10" fill="#10b981" />
              </motion.svg>
            </div>

            <MobileVerticalConnector isInView={isInView} delay={1.2} color1="#6366f1" color2="#10b981" />

            {/* Column 3: AI Clients */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="flex-1 max-w-[220px] mx-auto lg:mx-0"
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                AI Clients
              </div>
              <div className="space-y-2">
                {aiClients.map((client, i) => (
                  <motion.div
                    key={client.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 1.6 + i * 0.1, duration: 0.4 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 transition-colors"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: client.color, boxShadow: `0 0 8px ${client.color}66` }}
                    />
                    <span className="text-sm font-medium text-zinc-300">{client.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Animated arrow from AI Clients down ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 2, duration: 0.5 }}
          className="flex flex-col items-center py-2"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Users interact</div>
          <div className="relative h-12 w-px">
            <div className="w-px h-full bg-gradient-to-b from-emerald-500/60 to-amber-500/60" />
            {/* Traveling packet down */}
            <motion.div
              animate={isInView ? {
                top: ['0%', '100%'],
                opacity: [0, 1, 1, 0],
              } : {}}
              transition={{ delay: 2.3, duration: 1, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
              className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400"
              style={{ boxShadow: '0 0 10px 2px rgba(245,158,11,0.5)' }}
            />
          </div>
          <svg width="12" height="8" viewBox="0 0 12 8" className="-mt-px">
            <polygon points="6,8 0,0 12,0" fill="#f59e0b" />
          </svg>
        </motion.div>

        {/* ── Chat-style use cases ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 2.2, duration: 0.7 }}
        >
          <div className="text-center mb-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-2">
              See it in action
            </p>
            <p className="text-zinc-400 text-sm max-w-lg mx-auto">
              A user types a question — the AI calls your API through MCPify and returns real results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <motion.div
                key={uc.query}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 2.4 + i * 0.2, duration: 0.5 }}
                className="group"
              >
                <div className="rounded-2xl border border-zinc-800 bg-surface-card overflow-hidden hover:border-zinc-700 transition-all">
                  {/* AI client header bar */}
                  <div className="px-4 py-2.5 border-b border-zinc-800/60 flex items-center gap-2">
                    <motion.span
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: uc.clientColor, boxShadow: `0 0 6px ${uc.clientColor}66` }}
                    />
                    <span className="text-xs font-semibold text-zinc-300">{uc.client}</span>
                  </div>

                  {/* Chat input — styled like ChatGPT/Claude input */}
                  <div className="p-4">
                    <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-4 py-3 flex items-center gap-3">
                      <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      <span className="text-sm text-zinc-200 flex-1">{uc.query}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center">
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MCPify processing bar */}
                  <div className="mx-4 mb-3 rounded-lg bg-brand-600/5 border border-brand-500/15 px-3 py-2 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-brand-400" />
                    <span className="text-[10px] font-mono text-brand-300 flex-1">
                      MCP → {uc.service}
                    </span>
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                      className="flex gap-0.5"
                    >
                      <span className="w-1 h-1 rounded-full bg-brand-400" />
                      <span className="w-1 h-1 rounded-full bg-brand-400" />
                      <span className="w-1 h-1 rounded-full bg-brand-400" />
                    </motion.div>
                  </div>

                  {/* AI response bubble */}
                  <div className="px-4 pb-4">
                    <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/30 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${uc.clientColor}20` }}>
                          <Bot className="w-3 h-3" style={{ color: uc.clientColor }} />
                        </div>
                        <span className="text-[10px] font-semibold" style={{ color: uc.clientColor }}>{uc.client}</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{uc.result}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Mobile vertical connector with packets ─── */
function MobileVerticalConnector({ isInView, delay, color1, color2 }: {
  isInView: boolean; delay: number; color1: string; color2: string
}) {
  return (
    <div className="lg:hidden flex flex-col items-center py-2 relative h-12">
      <motion.div
        initial={{ scaleY: 0 }}
        animate={isInView ? { scaleY: 1 } : {}}
        transition={{ delay, duration: 0.4 }}
        className="w-0.5 h-full origin-top"
        style={{ background: `linear-gradient(to bottom, ${color1}, ${color2})` }}
      />
      <motion.div
        initial={{ top: '0%', opacity: 0 }}
        animate={isInView ? {
          top: ['0%', '90%'],
          opacity: [0, 1, 1, 0],
        } : {}}
        transition={{
          delay: delay + 0.5,
          duration: 0.8,
          repeat: Infinity,
          repeatDelay: 2,
          ease: 'easeInOut',
        }}
        className="absolute w-2 h-2 rounded-full"
        style={{
          background: color2,
          boxShadow: `0 0 8px 2px ${color2}66`,
        }}
      />
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   INTEGRATIONS — Works with your favorite tools
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function Integrations() {
  const categories = [
    {
      label: 'No-Code Platforms',
      color: '#f59e0b',
      items: [
        { name: 'Bubble', desc: 'Visual web apps' },
        { name: 'Base44', desc: 'AI app builder' },
        { name: 'Adalo', desc: 'Mobile apps' },
        { name: 'FlutterFlow', desc: 'Flutter apps' },
      ],
    },
    {
      label: 'Backend-as-a-Service',
      color: '#3b82f6',
      items: [
        { name: 'Supabase', desc: 'Postgres + Auth' },
        { name: 'Firebase', desc: 'Google BaaS' },
        { name: 'Xano', desc: 'No-code backend' },
        { name: 'Backendless', desc: 'Visual backend' },
      ],
    },
    {
      label: 'Headless CMS',
      color: '#a78bfa',
      items: [
        { name: 'Strapi', desc: 'Open-source CMS' },
        { name: 'Contentful', desc: 'Content platform' },
        { name: 'Sanity', desc: 'Structured content' },
        { name: 'Directus', desc: 'Data platform' },
      ],
    },
    {
      label: 'SaaS & APIs',
      color: '#10b981',
      items: [
        { name: 'Stripe', desc: 'Payments' },
        { name: 'Shopify', desc: 'E-commerce' },
        { name: 'Twilio', desc: 'Communications' },
        { name: 'HubSpot', desc: 'CRM & Marketing' },
      ],
    },
    {
      label: 'Databases with API',
      color: '#38bdf8',
      items: [
        { name: 'Airtable', desc: 'Spreadsheet DB' },
        { name: 'NocoDB', desc: 'Open-source Airtable' },
        { name: 'Baserow', desc: 'No-code database' },
        { name: 'Hasura', desc: 'GraphQL → REST' },
      ],
    },
    {
      label: 'Automation',
      color: '#f472b6',
      items: [
        { name: 'Zapier', desc: 'Workflow automation' },
        { name: 'Make', desc: 'Visual automation' },
        { name: 'n8n', desc: 'Open-source flows' },
        { name: 'Pipedream', desc: 'Dev-first workflows' },
      ],
    },
  ]

  return (
    <Section className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-dot-pattern opacity-15" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-brand-600/5 rounded-full blur-[140px]" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.p variants={fadeUp} custom={0} className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-4 text-center">
          Integrations
        </motion.p>
        <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-center mb-4 tracking-tight">
          Works with your favorite tools
        </motion.h2>
        <motion.p variants={fadeUp} custom={2} className="text-zinc-400 text-center max-w-2xl mx-auto mb-6 text-lg">
          Any service that exposes a REST API — from no-code platforms to enterprise SaaS — can become an MCP server with MCPify.
        </motion.p>
        <motion.p variants={fadeUp} custom={3} className="text-zinc-500 text-center text-sm mb-14">
          If it returns JSON over HTTP, MCPify can connect it to AI.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat, ci) => (
            <motion.div
              key={cat.label}
              variants={scaleIn}
              custom={ci + 4}
              className="group rounded-2xl border border-zinc-800 bg-surface-card p-6 hover:border-zinc-700 transition-all duration-300 relative overflow-hidden"
            >
              {/* Top accent */}
              <div
                className="absolute top-0 left-4 right-4 h-px opacity-60"
                style={{ background: `linear-gradient(90deg, transparent, ${cat.color}88, transparent)` }}
              />
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle at 50% 0%, ${cat.color}08, transparent 70%)` }}
              />

              <div className="relative">
                {/* Category label */}
                <div className="flex items-center gap-2 mb-5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}44` }}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: cat.color }}>
                    {cat.label}
                  </span>
                </div>

                {/* Service items */}
                <div className="space-y-2.5">
                  {cat.items.map((item, ii) => (
                    <motion.div
                      key={item.name}
                      variants={fadeUp}
                      custom={ci + ii * 0.3 + 5}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800/40 group-hover:border-zinc-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold"
                          style={{ backgroundColor: `${cat.color}12`, color: cat.color }}
                        >
                          {item.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-zinc-200">{item.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">{item.desc}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.div variants={fadeUp} custom={12} className="mt-10 text-center">
          <p className="text-zinc-500 text-sm">
            ...and <span className="text-zinc-300 font-medium">thousands more</span>. Any REST API works — custom-built or third-party.
          </p>
        </motion.div>
      </div>
    </Section>
  )
}

/* ─── Features ─── */
function Features() {
  const features = [
    {
      icon: Code2,
      title: 'OpenAPI Auto-Import',
      desc: 'Upload a spec URL or YAML file. MCPify parses every endpoint and creates MCP tools automatically.',
      gradient: 'from-blue-500/10 to-cyan-500/10',
      iconColor: 'text-blue-400',
      borderHover: 'hover:border-blue-500/30',
    },
    {
      icon: Shield,
      title: 'Built-in Auth',
      desc: 'Bearer tokens, API keys, Basic auth — configured once, applied to every tool call transparently.',
      gradient: 'from-brand-500/10 to-purple-500/10',
      iconColor: 'text-brand-400',
      borderHover: 'hover:border-brand-500/30',
    },
    {
      icon: Zap,
      title: 'Rate Limiting',
      desc: 'Token-bucket rate limiting per MCP token. Protect your API from runaway AI agents.',
      gradient: 'from-amber-500/10 to-orange-500/10',
      iconColor: 'text-amber-400',
      borderHover: 'hover:border-amber-500/30',
    },
    {
      icon: Lock,
      title: 'Destructive Tool Guards',
      desc: 'DELETE and PUT tools auto-detected and disabled. AI must explicitly confirm before executing.',
      gradient: 'from-red-500/10 to-pink-500/10',
      iconColor: 'text-red-400',
      borderHover: 'hover:border-red-500/30',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Monitoring',
      desc: 'Real-time dashboards with call volume, error rates, p50/p95/p99 latencies, and CSV exports.',
      gradient: 'from-emerald-500/10 to-teal-500/10',
      iconColor: 'text-emerald-400',
      borderHover: 'hover:border-emerald-500/30',
    },
    {
      icon: Globe,
      title: 'One URL, Every Client',
      desc: 'A single MCP endpoint works with ChatGPT, Claude, Cursor, and any MCP-compatible client.',
      gradient: 'from-violet-500/10 to-fuchsia-500/10',
      iconColor: 'text-violet-400',
      borderHover: 'hover:border-violet-500/30',
    },
  ]

  return (
    <Section id="features" className="py-24 md:py-32 bg-surface-light relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />
      <div className="max-w-7xl mx-auto px-6">
        <motion.p variants={fadeUp} custom={0} className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-4 text-center">
          Features
        </motion.p>
        <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-center mb-4 tracking-tight">
          Everything you need to go live
        </motion.h2>
        <motion.p variants={fadeUp} custom={2} className="text-zinc-400 text-center max-w-xl mx-auto mb-16 text-lg">
          Security, observability, and developer experience — built in from day one.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={scaleIn}
              custom={i + 3}
              className={`group rounded-2xl border border-zinc-800 bg-surface-card p-7 ${f.borderHover} transition-all duration-300 hover:glow-brand-sm relative overflow-hidden`}
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} border border-zinc-700/50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}

/* ─── Developer Experience code demo ─── */
function DeveloperExperience() {
  return (
    <Section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.p variants={fadeUp} custom={0} className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-4">
              Developer Experience
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
              From spec to MCP
              <br />
              <span className="text-gradient">in one API call</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-zinc-400 text-lg leading-relaxed mb-8">
              Import your OpenAPI spec, configure auth once, and get a ready-to-use
              MCP endpoint. Every tool call is logged, rate-limited, and monitored.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="space-y-4">
              {[
                'Auto-parses OpenAPI 3.x and Swagger 2.0',
                'YAML and JSON specs supported',
                'Path, query, and body parameters auto-mapped',
                'Destructive operations flagged and guarded',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-zinc-300 text-sm">{item}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Code block */}
          <motion.div variants={scaleIn} custom={2}>
            <div className="relative rounded-2xl border border-zinc-800 bg-surface-card overflow-hidden glow-brand-sm">
              <div className="absolute top-0 left-0 right-0 h-px shimmer-border" />
              <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800/80">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/60" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <span className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-zinc-500 font-mono ml-2">claude_desktop_config.json</span>
              </div>
              <pre className="px-5 py-6 text-sm font-mono overflow-x-auto">
                <code>
                  <span className="text-zinc-500">{'{\n'}</span>
                  <span className="text-zinc-500">{'  '}</span>
                  <span className="text-brand-300">{'"mcpServers"'}</span>
                  <span className="text-zinc-500">{': {\n'}</span>
                  <span className="text-zinc-500">{'    '}</span>
                  <span className="text-brand-300">{'"my-saas-api"'}</span>
                  <span className="text-zinc-500">{': {\n'}</span>
                  <span className="text-zinc-500">{'      '}</span>
                  <span className="text-brand-300">{'"url"'}</span>
                  <span className="text-zinc-500">{': '}</span>
                  <span className="text-emerald-400">{'"https://mcpify.app/mcp/abc...xyz"'}</span>
                  <span className="text-zinc-500">{'\n    }\n  }\n}'}</span>
                </code>
              </pre>
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  )
}

/* ─── Stats section ─── */
function Stats() {
  const stats = [
    { value: 500, suffix: '+', label: 'APIs connected' },
    { value: 2, suffix: 'M+', label: 'Tool calls processed' },
    { value: 99.9, suffix: '%', label: 'Uptime SLA' },
    { value: 5, suffix: ' min', label: 'Average setup time' },
  ]

  return (
    <Section className="py-20 border-y border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} variants={fadeUp} custom={i} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-gradient mb-2">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-zinc-400 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}

/* ─── Pricing ─── */
function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      desc: 'For side projects and testing',
      features: ['1 service (API connection)', '1,000 tool calls / month', 'Basic auth', 'Community support'],
      cta: 'Get Started',
      featured: false,
    },
    {
      name: 'Starter',
      price: '$49',
      period: '/month',
      desc: 'For small teams getting started',
      features: ['3 services (API connections)', '10,000 tool calls / month', 'All auth methods', 'Basic analytics', 'Email support'],
      cta: 'Start Free Trial',
      featured: false,
    },
    {
      name: 'Growth',
      price: '$149',
      period: '/month',
      desc: 'For teams scaling AI integrations',
      features: ['10 services (API connections)', '100,000 tool calls / month', 'Advanced analytics', 'CSV exports', 'Priority support', 'Webhook notifications', 'Custom auth configs'],
      cta: 'Start Free Trial',
      featured: true,
    },
    {
      name: 'Business',
      price: '$399',
      period: '/month',
      desc: 'For enterprises and high-volume APIs',
      features: ['Unlimited services', '1,000,000 tool calls / month', 'OAuth 2.0 support', 'White-label MCP endpoints', 'Audit logging', 'Dedicated support', 'SLA guarantee'],
      cta: 'Contact Sales',
      featured: false,
    },
  ]

  return (
    <Section id="pricing" className="py-24 md:py-32 bg-surface-light relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />
      <div className="max-w-7xl mx-auto px-6">
        <motion.p variants={fadeUp} custom={0} className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-4 text-center">
          Pricing
        </motion.p>
        <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-center mb-4 tracking-tight">
          Simple, transparent pricing
        </motion.h2>
        <motion.p variants={fadeUp} custom={2} className="text-zinc-400 text-center max-w-xl mx-auto mb-4 text-lg">
          Start free. Upgrade when you need more.
        </motion.p>
        <motion.div variants={fadeUp} custom={3} className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500 mb-16">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-blue-400" />
            <span><span className="text-zinc-300 font-medium">Service</span> = 1 API connection (e.g. your Orders API)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-brand-400" />
            <span><span className="text-zinc-300 font-medium">Tool call</span> = 1 MCP request from an AI client</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              variants={scaleIn}
              custom={i + 3}
              className={`group rounded-2xl border p-8 relative overflow-hidden transition-all duration-300 ${
                plan.featured
                  ? 'border-brand-500/40 bg-brand-600/5 glow-brand-sm scale-[1.02]'
                  : 'border-zinc-800 bg-surface-card hover:border-zinc-700'
              }`}
            >
              {plan.featured && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent" />
                </>
              )}
              <div className="relative">
                {plan.featured && (
                  <span className="inline-block text-xs font-semibold text-brand-300 bg-brand-500/10 px-3 py-1 rounded-full mb-4 border border-brand-500/20">
                    Most popular
                  </span>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-3 mb-1">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-zinc-500 text-sm ml-1">{plan.period}</span>
                </div>
                <p className="text-zinc-400 text-sm mb-6">{plan.desc}</p>
                <Link
                  to="/register"
                  className={`block text-center font-semibold text-sm py-3 rounded-xl transition-all ${
                    plan.featured
                      ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/25 hover:shadow-brand-500/40'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                >
                  {plan.cta}
                </Link>
                <div className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-zinc-300">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}

/* ─── Testimonials ─── */
function Testimonials() {
  const quotes = [
    {
      text: 'We connected our entire REST API to Claude in 10 minutes. MCPify is exactly what we needed.',
      author: 'Sarah K.',
      role: 'CTO at DataFlow',
      avatar: 'SK',
      color: '#3b82f6',
    },
    {
      text: 'Our support team uses ChatGPT to query our API directly. MCPify made it trivial to set up.',
      author: 'Marcus J.',
      role: 'VP Engineering at Tixly',
      avatar: 'MJ',
      color: '#6366f1',
    },
    {
      text: "The destructive tool guards saved us. AI can read our data freely but can't delete anything without confirmation.",
      author: 'Amira R.',
      role: 'Lead Developer at NovaPay',
      avatar: 'AR',
      color: '#10b981',
    },
  ]

  return (
    <Section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight">
          Loved by developers
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quotes.map((q, i) => (
            <motion.div
              key={q.author}
              variants={scaleIn}
              custom={i + 1}
              className="group rounded-2xl border border-zinc-800 bg-surface-card p-7 hover:border-zinc-700 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, transparent, ${q.color}66, transparent)` }} />
              <div className="text-2xl text-zinc-700 mb-4">&ldquo;</div>
              <p className="text-zinc-300 leading-relaxed mb-6 text-sm">{q.text}</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: `${q.color}33`, color: q.color }}
                >
                  {q.avatar}
                </div>
                <div>
                  <div className="font-semibold text-sm">{q.author}</div>
                  <div className="text-xs text-zinc-500">{q.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}

/* ─── Final CTA ─── */
function CTA() {
  return (
    <Section className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-brand-600/5 via-brand-600/10 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-brand-600/8 rounded-full blur-[140px]" />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
          Ready to MCPify
          <br />
          <span className="text-gradient">your API?</span>
        </motion.h2>
        <motion.p variants={fadeUp} custom={1} className="text-zinc-400 text-lg mb-10 max-w-lg mx-auto">
          Join developers who are making their APIs accessible to every AI client.
          Free to start, scales with you.
        </motion.p>
        <motion.div variants={fadeUp} custom={2}>
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-brand-600/25 hover:shadow-brand-500/40 hover:scale-[1.02]"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </Section>
  )
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 py-12 bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">MCPify</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Turn any REST API into an MCP server. Connect your product to every AI client.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Product</h4>
            <div className="space-y-2.5 text-sm text-zinc-400">
              <a href="#features" className="block hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="block hover:text-white transition-colors">Pricing</a>
              <a href="#how-it-works" className="block hover:text-white transition-colors">How it works</a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Developers</h4>
            <div className="space-y-2.5 text-sm text-zinc-400">
              <a href="#" className="block hover:text-white transition-colors">Documentation</a>
              <a href="#" className="block hover:text-white transition-colors">API Reference</a>
              <a href="#" className="block hover:text-white transition-colors">Status</a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Company</h4>
            <div className="space-y-2.5 text-sm text-zinc-400">
              <a href="#" className="block hover:text-white transition-colors">About</a>
              <a href="#" className="block hover:text-white transition-colors">Blog</a>
              <a href="#" className="block hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">&copy; {new Date().getFullYear()} MCPify. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-zinc-600">
            <a href="#" className="hover:text-zinc-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
