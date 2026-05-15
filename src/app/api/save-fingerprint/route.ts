import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { email, ocean_vector } = body;

    if (!email || !ocean_vector) {
      return NextResponse.json(
        { error: "Missing required fields: email, ocean_vector" },
        { status: 400 }
      );
    }

    if (!Array.isArray(ocean_vector) || ocean_vector.length !== 10) {
      return NextResponse.json(
        { error: "ocean_vector must be a 10-dimensional number array" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("fingerprints")
      .upsert(
        {
          email: email.toLowerCase().trim(),
          ocean_vector: ocean_vector,
        },
        { onConflict: "email" }
      )
      .select();

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json(
        { error: "Database write failed", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Biometric fingerprint captured and stored.",
      data,
    });
  } catch (error) {
    console.error("save-fingerprint error:", error);
    return NextResponse.json(
      { error: "Internal server error saving fingerprint" },
      { status: 500 }
    );
  }
}
