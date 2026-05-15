import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import {
  calculateCosineSimilarity,
  calculateEntropyCoefficient,
} from "@/utils/math";

const SIMILARITY_THRESHOLD = 0.85;

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { email, new_vector, latencies } = body;

    if (!email || !new_vector || !latencies) {
      return NextResponse.json(
        { error: "Missing required fields: email, new_vector, latencies" },
        { status: 400 }
      );
    }

    // Fetch stored fingerprint
    const { data, error } = await supabase
      .from("fingerprints")
      .select("ocean_vector")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          error: "No biometric fingerprint found for this email. Please initialize first.",
          status: "UNKNOWN_ENTITY",
        },
        { status: 404 }
      );
    }

    const storedVector: number[] = data.ocean_vector;

    // Anti-agent defense: entropy coefficient
    const entropy = calculateEntropyCoefficient(latencies);
    if (entropy < 0.1) {
      return NextResponse.json({
        success: false,
        similarity: 0,
        entropy,
        status: "SYNTHETIC_ENTITY_DETECTED",
        message:
          "Temporal variance anomaly: latency uniformity indicates non-human entity.",
      });
    }

    // Core verification: cosine similarity
    const similarity = calculateCosineSimilarity(storedVector, new_vector);
    const isMatch = similarity >= SIMILARITY_THRESHOLD;

    return NextResponse.json({
      success: isMatch,
      similarity: Math.round(similarity * 10000) / 10000,
      entropy: Math.round(entropy * 10000) / 10000,
      status: isMatch ? "SYNAPTIC_MATCH" : "COGNITIVE_MISMATCH",
    });
  } catch (error) {
    console.error("verify-fingerprint error:", error);
    return NextResponse.json(
      { error: "Internal server error during verification" },
      { status: 500 }
    );
  }
}
