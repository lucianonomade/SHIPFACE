import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

import { runScan } from "@/lib/scanner";
import crypto from "crypto";
import { sendNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
    const payload = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    if (!signature) {
        return NextResponse.json({ error: "No signature" }, { status: 401 });
    }

    try {
        const body = JSON.parse(payload);
        const repoFullName = body.repository?.full_name;

        if (!repoFullName) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // 1. Find the monitored repo configuration
        const { data: config, error: dbError } = await supabaseAdmin
            .from("MonitoredRepo")
            .select("*")
            .eq("repoFullName", repoFullName)
            .eq("active", true)
            .single();

        if (dbError || !config) {
            return NextResponse.json({ error: "Repository not enrolled or inactive" }, { status: 404 });
        }

        // 2. Verify Signature
        const hmac = crypto.createHmac("sha256", config.webhookSecret);
        const digest = "sha256=" + hmac.update(payload).digest("hex");

        if (signature !== digest) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        // 3. Process Push Event
        const ref = body.ref; // e.g., "refs/heads/main"
        const isDefaultBranch = ref === `refs/heads/${body.repository.default_branch}`;

        if (isDefaultBranch) {
            console.log(`[Cyber-Watch] Triggering automated scan for ${repoFullName}`);

            // Trigger scan in the background (we don't await so we can respond to GitHub quickly)
            runScan(repoFullName, config.githubToken, config.userId)
                .then(async (result) => {
                    console.log(`[Cyber-Watch] Automated scan complete for ${repoFullName}`);

                    const issueCount = (result.issues || []).length;
                    if (issueCount > 0) {
                        // Fetch User Settings
                        const { data: userSettings } = await supabaseAdmin
                            .from("UserSettings")
                            .select("*")
                            .eq("userId", config.userId)
                            .single();

                        if (userSettings) {
                            const message = `🚨 **Cyber-Watch Alert** 🚨\n\nSecurity breach detected in **${repoFullName}**.\n**${issueCount}** new vulnerabilities found.\n\nView full report: ${process.env.NEXT_PUBLIC_APP_URL}/history`;

                            if (userSettings.discordWebhook) {
                                await sendNotification(userSettings.discordWebhook, message, 'discord');
                            }
                            if (userSettings.slackWebhook) {
                                await sendNotification(userSettings.slackWebhook, message, 'slack');
                            }
                        }
                    }
                })
                .catch(err => console.error(`[Cyber-Watch] Automated scan failed for ${repoFullName}:`, err));
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error("Webhook error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
