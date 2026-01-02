import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { runScan } from "@/lib/scanner";

export async function POST(req: NextRequest) {
    // Verify session using the Authorization header
    const authHeader = req.headers.get("Authorization");
    const sessionToken = authHeader?.split(" ")[1];

    if (!sessionToken) {
        return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(sessionToken);

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    try {
        const { full_name, github_token, language } = await req.json();

        if (!github_token) {
            return NextResponse.json({ error: "GitHub token is required" }, { status: 400 });
        }

        // Ensure user exists in the public "User" table
        await supabaseAdmin.from("User").upsert({
            id: user.id,
            email: user.email,
            name: user.user_metadata.full_name || user.user_metadata.name || user.email,
            image: user.user_metadata.avatar_url
        });

        const results = await runScan(full_name, github_token, user.id, language || "en");

        return NextResponse.json(results);
    } catch (error: any) {
        console.error("Manual scan error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
