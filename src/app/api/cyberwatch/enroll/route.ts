import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import axios from "axios";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const { repoFullName, githubToken } = await req.json();

        // 1. Authenticate user
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
        if (!appUrl) {
            return NextResponse.json({
                error: "Infrastructure Error: Public URL (NEXT_PUBLIC_APP_URL) not configured. Webhooks cannot be established without a public endpoint."
            }, { status: 500 });
        }

        const webhookSecret = crypto.randomBytes(20).toString('hex');
        const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/webhooks/github`;

        // 2. Create GitHub Webhook
        const [owner, repo] = repoFullName.split("/");

        let webhookId = "";
        try {
            const githubResponse = await axios.post(
                `https://api.github.com/repos/${owner}/${repo}/hooks`,
                {
                    name: "web",
                    active: true,
                    events: ["push"],
                    config: {
                        url: webhookUrl,
                        content_type: "json",
                        secret: webhookSecret,
                        insecure_ssl: "0"
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        Accept: "application/vnd.github+json"
                    }
                }
            );
            webhookId = githubResponse.data.id.toString();
        } catch (ghError: any) {
            console.error("GitHub Hook Error:", ghError.response?.data || ghError.message);
            // If hook already exists, we might want to update it, but for now we just error
            return NextResponse.json({
                error: "GitHub Error: " + (ghError.response?.data?.message || "Could not create webhook. Check repository permissions.")
            }, { status: ghError.response?.status || 500 });
        }

        // 3. Save to database using admin client to bypass RLS
        const { error: dbError } = await supabaseAdmin.from("MonitoredRepo").upsert({
            userId: user.id,
            repoFullName,
            webhookId,
            webhookSecret,
            githubToken, // Crucial for background scans
            active: true
        });

        if (dbError) throw dbError;

        return NextResponse.json({
            success: true,
            webhookId,
            message: "Uplink established. Cyber-Watch is now monitoring " + repoFullName
        });

    } catch (error: any) {
        console.error("Enrollment error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
