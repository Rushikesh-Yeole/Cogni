"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Fingerprint,
  Brain,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Terminal,
  Scan,
  ArrowLeft,
  Crosshair,
} from "lucide-react";
import type {
  AppMode,
  OceanScores,
  OceanTrait,
  QuestionResponse,
} from "@/types";
import { normalizeLatency } from "@/utils/math";
import { Suspense } from "react";

const OCEAN_TRAITS: OceanTrait[] = [
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "neuroticism",
];

const INIT_QUESTIONS = 10;
const AUTH_QUESTIONS = 5;

/** Check if we have enough samples for every trait to stop early */
function isConfidenceSufficient(counts: OceanScores, isInit: boolean): boolean {
  // Calibration: 2 samples per trait. Verification: 1 sample per trait.
  const targetSamplesPerTrait = isInit ? 2 : 1;
  return OCEAN_TRAITS.every((trait) => counts[trait] >= targetSamplesPerTrait);
}

function defaultScores(): OceanScores {
  return {
    openness: 0,
    conscientiousness: 0,
    extraversion: 0,
    agreeableness: 0,
    neuroticism: 0,
  };
}

function AuthenticateContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "auth" ? "AUTH" : "INIT";

  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<AppMode>("GATE");
  const [sessionType] = useState<"INIT" | "AUTH">(initialMode === "AUTH" ? "AUTH" : "INIT");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] =
    useState<QuestionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [answerRevealed, setAnswerRevealed] = useState(false);

  const [traitWeights, setTraitWeights] = useState<OceanScores>(defaultScores());
  const [traitCounts, setTraitCounts] = useState<OceanScores>(defaultScores());
  const [primaryHits, setPrimaryHits] = useState<OceanScores>(defaultScores());
  const [latencies, setLatencies] = useState<number[]>([]);
  const [traitLatencies, setTraitLatencies] = useState<
    Record<OceanTrait, number[]>
  >({
    openness: [],
    conscientiousness: [],
    extraversion: [],
    agreeableness: [],
    neuroticism: [],
  });

  const [finalVector, setFinalVector] = useState<number[] | null>(null);
  const [similarity, setSimilarity] = useState<number>(0);
  const [entropy, setEntropy] = useState<number>(0);

  const startTimeRef = useRef<number>(0);
  const questionReadyRef = useRef(false);

  const maxQuestions =
    mode === "INIT" ? INIT_QUESTIONS : mode === "AUTH" ? AUTH_QUESTIONS : 0;

  useEffect(() => {
    if (currentQuestion && !isLoading) {
      setAnswerRevealed(false);
      questionReadyRef.current = false;
    }
  }, [currentQuestion, isLoading]);

  const handleAnswerReveal = useCallback(() => {
    setAnswerRevealed(true);
    startTimeRef.current = performance.now();
    questionReadyRef.current = true;
  }, []);

  const fetchQuestion = useCallback(
    async (scores: OceanScores) => {
      setIsLoading(true);
      setError(null);
      setCurrentQuestion(null);
      setAnswerRevealed(false);
      try {
        const res = await fetch("/api/generate-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confidence_scores: scores }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to generate question");
        }
        const data: QuestionResponse = await res.json();
        setCurrentQuestion(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const startSession = useCallback(async () => {
    if (!email.trim()) return;

    if (sessionType === "AUTH") {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/check-fingerprint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase().trim() }),
        });
        const result = await res.json();
        if (!result.exists) {
          setError("No biometric fingerprint found for this email. Please initialize first.");
          setIsLoading(false);
          return;
        }
      } catch {
        setError("Unable to verify email existence. Please try again.");
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }

    setMode(sessionType);
    setQuestionIndex(0);
    setTraitWeights(defaultScores());
    setTraitCounts(defaultScores());
    setPrimaryHits(defaultScores());
    setLatencies([]);
    setTraitLatencies({
      openness: [],
      conscientiousness: [],
      extraversion: [],
      agreeableness: [],
      neuroticism: [],
    });
    setFinalVector(null);
    setSimilarity(0);
    setEntropy(0);
    setError(null);
    fetchQuestion(defaultScores());
  }, [email, sessionType, fetchQuestion]);

  const buildVector = useCallback(
    (
      weights: OceanScores,
      counts: OceanScores,
      tLatencies: Record<OceanTrait, number[]>
    ): number[] => {
      const psychVector = OCEAN_TRAITS.map((t) =>
        counts[t] > 0 ? weights[t] / counts[t] : 0
      );
      const temporalVector = OCEAN_TRAITS.map((t) => {
        const traitLats = tLatencies[t];
        if (traitLats.length === 0) return 0.5;
        const avg = traitLats.reduce((s, v) => s + v, 0) / traitLats.length;
        return normalizeLatency(avg);
      });
      return [...psychVector, ...temporalVector];
    },
    []
  );

  const handleOptionClick = useCallback(
    async (optionWeights: Partial<OceanScores>) => {
      if (!currentQuestion || !questionReadyRef.current) return;
      questionReadyRef.current = false;

      const latency = performance.now() - startTimeRef.current;
      const primaryTrait = currentQuestion.primary_trait as OceanTrait;

      const newWeights = { ...traitWeights };
      const newCounts = { ...traitCounts };
      for (const t of OCEAN_TRAITS) {
        const w = optionWeights[t];
        if (w !== undefined && w !== 0) {
          newWeights[t] += w;
          newCounts[t] += 1;
        }
      }

      const newPrimaryHits = { ...primaryHits, [primaryTrait]: primaryHits[primaryTrait] + 1 };

      const newLatencies = [...latencies, latency];
      const newTraitLatencies = {
        ...traitLatencies,
        [primaryTrait]: [...traitLatencies[primaryTrait], latency],
      };

      setTraitWeights(newWeights);
      setTraitCounts(newCounts);
      setPrimaryHits(newPrimaryHits);
      setLatencies(newLatencies);
      setTraitLatencies(newTraitLatencies);

      const nextIndex = questionIndex + 1;
      setQuestionIndex(nextIndex);

      const sufficient = isConfidenceSufficient(newPrimaryHits, mode === "INIT");

      if (nextIndex >= maxQuestions || sufficient) {
        const vector = buildVector(newWeights, newCounts, newTraitLatencies);
        setFinalVector(vector);

        if (mode === "INIT") {
          setIsLoading(true);
          try {
            const res = await fetch("/api/save-fingerprint", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: email.toLowerCase().trim(),
                ocean_vector: vector,
              }),
            });
            if (!res.ok) {
              const errBody = await res.json().catch(() => ({}));
              console.error("Save failed:", errBody);
              setError(errBody.details || errBody.error || "Failed to save fingerprint");
            }
            setMode("RESULT_SUCCESS");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Save failed");
            setMode("RESULT_SUCCESS");
          } finally {
            setIsLoading(false);
          }
        } else if (mode === "AUTH") {
          setIsLoading(true);
          try {
            const res = await fetch("/api/verify-fingerprint", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: email.toLowerCase().trim(),
                new_vector: vector,
                latencies: newLatencies,
              }),
            });
            const result = await res.json();
            setSimilarity(result.similarity || 0);
            setEntropy(result.entropy || 0);
            setMode(result.success ? "RESULT_SUCCESS" : "RESULT_FAIL");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Verification failed");
            setMode("RESULT_FAIL");
          } finally {
            setIsLoading(false);
          }
        }
      } else {
        fetchQuestion(newPrimaryHits);
      }
    },
    [
      currentQuestion, traitWeights, traitCounts, primaryHits, latencies, traitLatencies,
      questionIndex, maxQuestions, mode, email, buildVector, fetchQuestion,
    ]
  );

  const isInit = sessionType === "INIT";

  // ═══ GATE: Email entry ═══
  if (mode === "GATE") {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors no-underline text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-white/80" />
            <span className="text-sm font-bold text-white/80 tracking-tight">cogni</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-20">
          <div className="w-full max-w-[440px] animate-fade-in">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-6">
                {isInit ? <Fingerprint className="w-8 h-8 text-white/80" /> : <Shield className="w-8 h-8 text-white/80" />}
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-3">
                {isInit ? "Calibration Sequence" : "Verification Protocol"}
              </h1>
              <p className="text-base text-white/70 leading-relaxed">
                {isInit
                  ? "Calibration: Mapping your unique decision signature."
                  : "Verification: Confirming your psycho-temporal match."}
              </p>
            </div>

            <div className="glass-card">
              <label
                htmlFor="email-input"
                className="block text-label text-white/80 mb-3"
              >
                Your Email Address
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && email.trim()) startSession();
                }}
                placeholder="you@example.com"
                className="w-full glass-input px-4 py-3.5 text-base mb-6"
                autoFocus
                autoComplete="email"
                spellCheck={false}
              />

              {error && (
                <div className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-[var(--color-pivotal-accent)]/10 border border-[var(--color-pivotal-accent)]/20">
                  <AlertTriangle className="w-4 h-4 text-[var(--color-pivotal-accent)] mt-0.5 shrink-0" />
                  <p className="text-sm text-white/70">{error}</p>
                </div>
              )}

              <button
                id="btn-start-session"
                onClick={startSession}
                disabled={!email.trim() || isLoading}
                className="btn-primary w-full py-4 px-6 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed text-base font-bold"
              >
                {isLoading ? (
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                ) : (
                  <>
                    {isInit ? <Fingerprint className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                    {isInit ? "Start Sequence" : "Begin Protocol"}
                  </>
                )}
              </button>

              {/* <p className="text-center text-sm text-white/60 mt-6 leading-relaxed">
                {isInit
                  ? "5 Loops. 60 Seconds. Zero Friction."
                  : "3 Loops. Instant Verification."}
              </p> */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══ DILEMMA LOOP ═══
  if (mode === "INIT" || mode === "AUTH") {
    const progress = ((questionIndex) / maxQuestions) * 100;

    return (
      <div className="min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
            <Brain className="w-5 h-5" />
            <span className="tracking-tight font-bold">cogni</span>
          </div>
          <div className="text-label text-white/60">
            {email} • {questionIndex + 1} / {maxQuestions}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          <div className="w-full max-w-[720px] animate-fade-in">
            {/* Progress */}
            <div className="flex items-center gap-4 mb-10">
              <Scan className="w-4 h-4 text-[var(--color-pivotal-accent)] shrink-0" />
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full progress-bar rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-label text-white/60 shrink-0">
                {mode === "INIT" ? "Calibrating" : "Verifying"}
              </span>
            </div>

            {isLoading && (
              <div className="glass-card flex flex-col items-center justify-center py-24">
                <div className="spinner mb-6" />
                <p className="text-base font-semibold text-white/80">
                  Deriving Synaptic Dilemma...
                </p>
                <p className="text-sm text-white/50 mt-2">
                  Targeting decision node...
                </p>
              </div>
            )}

            {error && (
              <div className="glass-card" style={{ borderColor: "rgba(229,95,47,0.3)" }}>
                <div className="flex items-center gap-2 mb-4 text-[var(--color-pivotal-accent)]">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-label">System Error</span>
                </div>
                <p className="text-base text-white/70 mb-6">{error}</p>
                <button
                  onClick={() => fetchQuestion(primaryHits)}
                  className="btn-ghost py-2.5 px-6 text-sm font-bold"
                >
                  Retry
                </button>
              </div>
            )}

            {currentQuestion && !isLoading && (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-2 w-2 rounded-full bg-[var(--color-pivotal-accent)] animate-pulse" />
                  <span className="text-[var(--color-pivotal-accent)] text-label">
                    {currentQuestion.primary_trait}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug mb-10">
                  {currentQuestion.question}
                </h2>

                {/* ANSWER GATE: Show "Answer" button before revealing options */}
                {!answerRevealed ? (
                  <div className="flex flex-col items-center gap-4 py-12">
                    <p className="text-sm text-white/60 tracking-widest uppercase mb-2">
                      Read the dilemma above carefully. Answer only when you're ready.
                    </p>
                    <button
                      onClick={handleAnswerReveal}
                      className="btn-primary py-4 px-12 text-base font-bold flex items-center gap-3"
                    >
                      <Crosshair className="w-5 h-5" />
                      Answer
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    {currentQuestion.options.map((option, idx) => (
                      <button
                        key={idx}
                        id={`option-${idx}`}
                        onClick={() => handleOptionClick(option.trait_weights)}
                        className="option-block w-full text-left p-6 flex items-start gap-4"
                      >
                        <span className="text-white/50 font-mono text-base font-bold shrink-0 mt-0.5">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <span className="text-white/90 text-base leading-relaxed">
                          {option.text}
                        </span>
                      </button>
                    ))}

                    <p className="text-center text-sm text-white/50 mt-10 tracking-widest uppercase">
                      ◈ Synaptic latency measurement active ◈
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === "RESULT_SUCCESS") {
    const isInitResult = finalVector && similarity === 0;

    if (isInitResult) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
          <div className="w-full max-w-[500px] text-center animate-fade-in">
            <div className="relative mx-auto w-48 h-48 mb-12">
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-full bg-green-400/10 blur-3xl scale-125" />
              <div className="relative w-full h-full rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                <Fingerprint className="w-24 h-24 text-green-400" strokeWidth={1} />
              </div>
            </div>

            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
              Sequence Complete
            </h1>
            <p className="text-base text-white/50 mb-12 max-w-md mx-auto leading-relaxed">
              {error
                ? <>Tensor computed but <strong className="text-[var(--color-pivotal-accent)]">storage failed</strong> for <strong className="text-white">{email}</strong>.</>
                : <>Cognitive signature securely stored.</>
              }
            </p>

            {error && (
              <div className="flex items-start gap-3 mb-12 p-4 rounded-xl bg-[var(--color-pivotal-accent)]/10 border border-[var(--color-pivotal-accent)]/20 text-left max-w-md mx-auto">
                <AlertTriangle className="w-4 h-4 text-[var(--color-pivotal-accent)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-white/70 mb-1">{error}</p>
                  <p className="text-xs text-white/40">Check Supabase RLS policies.</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/"
                className="btn-primary py-3 px-8 text-sm font-bold no-underline flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="w-full max-w-[500px] text-center animate-fade-in">

          <div className="relative mx-auto w-48 h-48 mb-12">
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-full bg-green-400/10 blur-3xl scale-125" />
            <div className="relative w-full h-full rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
              <Fingerprint className="w-24 h-24 text-green-400" strokeWidth={1} />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-5 py-2.5 mb-8">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-green-400 uppercase tracking-widest">Identity Verified</span>
          </div>

          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-12">
            Match Confirmed
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="btn-primary py-3 px-8 text-sm font-bold no-underline flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "RESULT_FAIL") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="w-full max-w-[640px] text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[var(--color-pivotal-accent)]/10 mb-8">
            <XCircle className="w-10 h-10 text-[var(--color-pivotal-accent)]" />
          </div>

          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
            Protocol Deviation
          </h1>
          <p className="text-base text-white/70 mb-12 max-w-md mx-auto leading-relaxed">
            Subject deviation exceeds safety threshold. Synthetic entity or latency mismatch detected for <strong className="text-white">{email}</strong>.
          </p>

          <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto mb-12">
            <div className="glass-card flex flex-col items-center justify-center py-6" style={{ borderColor: "rgba(229,95,47,0.2)" }}>
              <p className="text-label text-white/60 mb-2">Similarity</p>
              <p className="text-3xl font-extrabold font-mono text-white">{similarity.toFixed(4)}</p>
            </div>
            <div className="glass-card flex flex-col items-center justify-center py-6" style={{ borderColor: "rgba(229,95,47,0.2)" }}>
              <p className="text-label text-white/60 mb-2">Entropy</p>
              <p className="text-3xl font-extrabold font-mono text-[var(--color-pivotal-accent)]">{entropy.toFixed(4)}</p>
            </div>
          </div>

          {error && (
            <p className="text-[var(--color-pivotal-accent)] text-sm mb-8">{error}</p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setMode("GATE")}
              className="btn-primary py-3 px-8 text-sm font-bold flex items-center gap-2"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="btn-ghost py-3 px-8 text-sm font-bold no-underline"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthenticatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="spinner" />
        </div>
      }
    >
      <AuthenticateContent />
    </Suspense>
  );
}
