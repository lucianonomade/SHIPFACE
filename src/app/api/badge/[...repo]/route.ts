import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ repo: string[] }> }
) {
    const { repo } = await context.params;
    const repoFullName = repo.join("/");
    const [owner, repoName] = repoFullName.split("/");

    try {
        // Fetch the latest scan for this repo
        const { data: latestScan, error } = await supabaseAdmin
            .from("Scan")
            .select("results, createdAt")
            .eq("repoName", repoName)
            .order("createdAt", { ascending: false })
            .limit(1)
            .single();

        let status = "NO DATA";
        let color = "#4b5563"; // Gray
        let vulnerabilities = 0;

        if (latestScan) {
            vulnerabilities = (latestScan.results?.issues || latestScan.results?.results || []).length;
            if (vulnerabilities === 0) {
                status = "SECURE";
                color = "#39ff14"; // Neon Green
            } else {
                status = `${vulnerabilities} THREATS`;
                color = "#ff003c"; // Cyberpunk Red
            }
        }

        const badgeSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="140" height="20">
                <linearGradient id="g" x2="0" y2="100%">
                    <stop offset="0" stop-color="#0a0a0a" stop-opacity=".1"/>
                    <stop offset="1" stop-opacity=".1"/>
                </linearGradient>
                <clipPath id="r">
                    <rect width="140" height="20" rx="0" fill="#fff"/>
                </clipPath>
                <g clip-path="url(#r)">
                    <rect width="70" height="20" fill="#050505"/>
                    <rect x="70" width="70" height="20" fill="${color}"/>
                    <rect width="140" height="20" fill="url(#g)"/>
                </g>
                <g fill="#fff" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="10">
                    <text x="35" y="14" fill="#00f0ff" font-weight="bold">SHIPSAFE</text>
                    <text x="105" y="14" fill="#000" font-weight="bold">${status}</text>
                </g>
                <rect width="140" height="20" fill="none" stroke="#1f2937" stroke-width="1"/>
            </svg>
        `.trim();

        return new Response(badgeSvg, {
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        });
    } catch (err) {
        return NextResponse.json({ error: "Failed to generate badge" }, { status: 500 });
    }
}
