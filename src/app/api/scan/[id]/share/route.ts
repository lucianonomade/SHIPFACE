import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { isPublic } = await req.json();

        let shareSlug = null;
        if (isPublic) {
            shareSlug = crypto.randomBytes(12).toString("hex");
        }

        console.log(`[SHARE API] Updating scan ${id} to public=${isPublic}, slug=${shareSlug}`);

        const { data, error } = await supabaseAdmin
            .from("Scan")
            .update({
                isPublic,
                shareSlug
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("[SHARE API] Database error:", error);
            throw error;
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("[SHARE API] Route error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
