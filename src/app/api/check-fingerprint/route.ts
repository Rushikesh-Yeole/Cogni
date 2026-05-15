import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Missing required field: email" },
        { status: 400 }
      );
    }

    const { data } = await supabase
      .from("fingerprints")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    return NextResponse.json({ exists: !!data });
  } catch (error) {
    console.error("check-fingerprint error:", error);
    return NextResponse.json(
      { error: "Internal server error", exists: false },
      { status: 500 }
    );
  }
}
