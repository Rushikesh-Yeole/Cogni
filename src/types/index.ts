export type OceanTrait =
  | "openness"
  | "conscientiousness"
  | "extraversion"
  | "agreeableness"
  | "neuroticism";

/** Mapping of each OCEAN trait to its cumulative score */
export interface OceanScores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

/** A single option returned by Gemini — scores 2-5 OCEAN traits based on relevance */
export interface QuestionOption {
  text: string;
  trait_weights: Partial<OceanScores>;
}

/** The exact JSON schema returned by Gemini for each generated dilemma */
export interface QuestionResponse {
  question: string;
  primary_trait: string;
  options: QuestionOption[];
}

/** The 10-dimensional psycho-temporal fingerprint vector */
export type BiometricVector = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

/** Application mode state machine */
export type AppMode =
  | "GATE"
  | "INIT"
  | "AUTH"
  | "RESULT_SUCCESS"
  | "RESULT_FAIL";

/** Verification API response */
export interface VerificationResult {
  success: boolean;
  similarity: number;
  entropy: number;
  status: string;
}
