"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Fingerprint,
  Brain,
  Zap,
  Lock,
  Eye,
  ArrowRight,
  ChevronDown,
  Cpu,
  Layers,
  Clock,
  Sparkles,
} from "lucide-react";


function useCounter(target: number, duration = 2000) {
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
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}


const FEATURES = [
  { icon: Brain, title: "Synaptic Mapping", description: "Captures unique decision nodes through real-time psychometric dilemma loops focused on recent Indian news and trends." },
  { icon: Clock, title: "Temporal Fingerprint", description: "Sub-millisecond latency analysis with precision gates. Your hesitation is the new biometric identifier." },
  { icon: Shield, title: "Entropy Defense", description: "Detects synthetic agents by measuring latency variance. Robotic uniformity triggers instant bot rejection." },
  { icon: Cpu, title: "Adaptive Engine", description: "Gemini 2.0 Flash targets your weakest trait dimension, generating high-signal dilemmas via Google Search." },
  { icon: Layers, title: "10D Vector Space", description: "Your identity is a high-resolution 10D tensor: 5 personality traits fused with 5 temporal signatures." },
  { icon: Zap, title: "Verified Loops", description: "Validation completes in just three loops. Invisible, instant, and structurally unspooofable." },
];

function FeatureCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animFrame: number;
    // Start at 0
    let scrollPos = el.scrollLeft;

    const tick = () => {
      if (!isPaused && el) {
        scrollPos += 0.8; // Slightly faster for better feel
        
        // Seamless loop logic
        if (scrollPos >= el.scrollWidth / 2) {
          scrollPos = 0;
        }
        el.scrollLeft = scrollPos;
      }
      animFrame = requestAnimationFrame(tick);
    };
    
    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [isPaused]);

  // Triple items for ultra-seamless loop and to ensure width is always exceeded
  const items = [...FEATURES, ...FEATURES, ...FEATURES];

  return (
    <div
      ref={scrollRef}
      className="flex gap-10 overflow-x-hidden py-10 cursor-grab select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {items.map((feat, idx) => {
        const Icon = feat.icon;
        return (
          <div
            key={idx}
            className="glass-card shrink-0 w-[400px] flex flex-col p-10 group"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-8 group-hover:bg-white/15 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
              <Icon className="w-8 h-8 text-white/90" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 tracking-tight group-hover:text-[var(--color-pivotal-accent)] transition-colors">{feat.title}</h3>
            <p className="text-lg text-white/75 leading-relaxed">{feat.description}</p>
          </div>
        );
      })}
    </div>
  );
}


function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-6 items-start">
      <div className="shrink-0 w-14 h-14 rounded-full bg-[var(--color-pivotal-accent)] flex items-center justify-center text-white font-bold text-xl">
        {number}
      </div>
      <div>
        <h4 className="text-xl font-bold text-white mb-2">{title}</h4>
        <p className="text-lg text-white/75 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const stat1 = useCounter(10, 1800);
  const stat2 = useCounter(42, 1800);
  const stat3 = useCounter(99, 2200);

  return (
    <div className="relative overflow-x-hidden">

      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          backgroundColor: scrollY > 80 ? "rgba(42, 59, 76, 0.9)" : "transparent",
          backdropFilter: scrollY > 80 ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrollY > 80 ? "blur(20px)" : "none",
          borderBottom: scrollY > 80 ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
        }}
      >
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <Brain className="w-7 h-7 text-white" />
            <span className="text-xl font-bold text-white tracking-tight">cogni</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/80 font-medium">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
          </div>
          <Link
            href="/authenticate?mode=auth"
            className="btn-primary py-2.5 px-6 text-sm font-semibold flex items-center gap-2 no-underline"
          >
            Sign In
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>


      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-32 overflow-hidden">
        {/* Floating gradient orbs for depth */}
        <div
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 blur-[100px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(229,95,47,0.4) 0%, transparent 70%)",
            transform: `translate(${scrollY * 0.02}px, ${scrollY * 0.05}px)`,
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15 blur-[80px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(100,180,255,0.4) 0%, transparent 70%)",
            transform: `translate(${scrollY * -0.03}px, ${scrollY * -0.04}px)`,
          }}
        />

        <div className="relative z-10 max-w-[900px] text-center animate-fade-in">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-[var(--color-pivotal-accent)]" />
            <span className="text-sm font-semibold text-white/80">AI-Native Authentication</span>
          </div>

          <h1 className="h1-hero text-white mb-6">
            Your mind is the
            <br />
            <span className="text-gradient">password.</span>
          </h1>

          <p className="text-standard text-white/80 max-w-[620px] mx-auto mb-12 leading-relaxed" style={{ fontSize: "clamp(1.1rem, 1.5vw + 0.5rem, 1.3rem)" }}>
            Authentication based on how you think, not what you type. A biometric layer derived from cognitive friction and reaction signatures.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/authenticate?mode=init"
              className="btn-primary py-4 px-10 text-base font-bold flex items-center gap-3 no-underline w-full sm:w-auto justify-center"
            >
              <Fingerprint className="w-5 h-5" />
              Create Biometric
            </Link>
            <Link
              href="/authenticate?mode=auth"
              className="btn-ghost py-4 px-10 text-base font-bold flex items-center gap-3 no-underline w-full sm:w-auto justify-center"
            >
              <Shield className="w-5 h-5" />
              Verify Identity
            </Link>
          </div>

          {/* Scroll hint */}
          <div className="flex flex-col items-center gap-2 text-white/50 animate-bounce-slow">
            <span className="text-sm font-medium tracking-widest uppercase">Discover</span>
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </section>


      <section className="relative py-24 border-t border-white/5">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div ref={stat1.ref}>
              <p className="text-6xl font-extrabold text-white tracking-tight mb-3">{stat1.value}D</p>
              <p className="text-base text-white/70 font-medium uppercase tracking-wider">Biometric Vector</p>
            </div>
            <div ref={stat2.ref}>
              <p className="text-6xl font-extrabold text-white tracking-tight mb-3">{stat2.value}ms</p>
              <p className="text-base text-white/70 font-medium uppercase tracking-wider">Avg Latency Precision</p>
            </div>
            <div ref={stat3.ref}>
              <p className="text-6xl font-extrabold text-white tracking-tight mb-3">{stat3.value}%</p>
              <p className="text-base text-white/70 font-medium uppercase tracking-wider">Bot Detection Rate</p>
            </div>
          </div>
        </div>
      </section>


      <section id="features" className="relative py-32">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-label text-[var(--color-pivotal-accent)] mb-4">Capabilities</p>
            <h2 className="h2-section text-white mb-6">The Cognitive Layer.</h2>
            <p className="text-standard text-white/70 max-w-[560px] mx-auto">
              Passwords are obsolete. Your reaction to friction is your new identity.
            </p>
          </div>
        </div>

        {/* Full-width horizontal cascade with smooth edge fading */}
        <div className="relative w-full">
          <div 
            className="w-full overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 150px, black calc(100% - 150px), transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 150px, black calc(100% - 150px), transparent)',
            }}
          >
            <FeatureCarousel />
          </div>
        </div>
      </section>


      <section id="how-it-works" className="relative py-32 border-t border-white/5">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <p className="text-label text-[var(--color-pivotal-accent)] mb-4">Process</p>
              <h2 className="h2-section text-white mb-6">Three Loops. One Identity.</h2>
              <p className="text-standard text-white/70 mb-12">
                Derive your cognitive signature through pure instinct. No hardware, no scanners, just human friction.
              </p>

              <div className="space-y-10">
                <StepCard
                  number="1"
                  title="Identity Anchor"
                  description="Use your email address as the unique key to initialize the calibration sequence."
                />
                <StepCard
                  number="2"
                  title="Instinctive Response"
                  description="Read the dilemma, then click 'Answer' to reveal options. Your reaction time is captured at sub-millisecond precision."
                />
                <StepCard
                  number="3"
                  title="Tensor Generation"
                  description="A high-resolution 10D tensor is computed. Sequences end automatically once confidence reaches the safety threshold."
                />
              </div>
            </div>

            {/* Visual card mockup */}
            <div className="relative flex items-center justify-center">
              <div className="glass-card w-full max-w-[400px] p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-pivotal-accent)] flex items-center justify-center">
                    <Fingerprint className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Cognitive Fingerprint</p>
                    <p className="text-sm text-white/70">10-dimensional vector</p>
                  </div>
                </div>

                {/* Fake vector visualization */}
                <div className="space-y-3 mb-8">
                  {["Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Neuroticism"].map(
                    (trait, i) => {
                      const widths = [72, 85, 45, 68, 38];
                      return (
                        <div key={trait}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-white/70 font-medium">{trait}</span>
                            <span className="text-sm text-white/50 font-mono">0.{widths[i]}</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${widths[i]}%`,
                                background: `linear-gradient(90deg, var(--color-pivotal-accent), rgba(229,95,47,0.4))`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Encrypted & stored securely</span>
                </div>
              </div>

              {/* Decorative blur behind */}
              <div className="absolute inset-0 bg-[var(--color-pivotal-accent)]/5 rounded-3xl blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>


      <section id="security" className="relative py-32 border-t border-white/5">
        <div className="max-w-[900px] mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-8">
            <Eye className="w-8 h-8 text-white/80" />
          </div>
          <h2 className="h2-section text-white mb-6">Sovereign Identity.</h2>
          <p className="text-standard text-white/70 max-w-[560px] mx-auto mb-16">
            We never store raw data. Only abstract tensors are retained: mathematical signatures that cannot be reverse-engineered.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-card text-center py-10">
              <p className="text-3xl font-extrabold text-white mb-2">Zero</p>
              <p className="text-base text-white/70">Raw data stored</p>
            </div>
            <div className="glass-card text-center py-10">
              <p className="text-3xl font-extrabold text-white mb-2">AES-256</p>
              <p className="text-base text-white/70">Encryption standard</p>
            </div>
            <div className="glass-card text-center py-10">
              <p className="text-3xl font-extrabold text-white mb-2">SOC 2</p>
              <p className="text-base text-white/70">Compliance ready</p>
            </div>
          </div>
        </div>
      </section>


      <section className="relative py-32 border-t border-white/5">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <h2 className="h2-section text-white mb-6">Verify your Synaptic Match.</h2>
          <p className="text-standard text-white/70 max-w-[480px] mx-auto mb-12">
            Initialize your 10D tensor in 60 seconds. Zero friction. Total sovereignty.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/authenticate?mode=init"
              className="btn-primary py-4 px-10 text-base font-bold flex items-center gap-3 no-underline w-full sm:w-auto justify-center"
            >
              <Fingerprint className="w-5 h-5" />
              Create Biometric
            </Link>
            <Link
              href="/authenticate?mode=auth"
              className="btn-ghost py-4 px-10 text-base font-bold flex items-center gap-3 no-underline w-full sm:w-auto justify-center"
            >
              <Shield className="w-5 h-5" />
              Verify Identity
            </Link>
          </div>
        </div>
      </section>


      <footer className="border-t border-white/5 py-12">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-white/70" />
            <span className="text-sm font-semibold text-white/70 tracking-tight">cogni</span>
          </div>
          <p className="text-sm text-white/60">
            © 2026 Cogni. Psycho-Temporal Biometric Authentication.
          </p>
          <div className="flex items-center gap-6 text-sm text-white/60">
            <span className="hover:text-white/80 transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-white/80 transition-colors cursor-pointer">Terms</span>
            <span className="hover:text-white/80 transition-colors cursor-pointer">Docs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
