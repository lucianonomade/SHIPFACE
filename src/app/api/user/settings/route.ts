
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, discordWebhook, slackWebhook, emailNotifications } = body;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const newId = crypto.randomUUID();
        const now = new Date().toISOString();

        await prisma.$executeRaw`
            INSERT INTO "UserSettings" ("id", "userId", "discordWebhook", "slackWebhook", "emailNotifications", "createdAt", "updatedAt")
            VALUES (${newId}, ${userId}, ${discordWebhook}, ${slackWebhook}, ${emailNotifications}, ${now}::timestamp, ${now}::timestamp)
            ON CONFLICT ("userId") 
            DO UPDATE SET 
                "discordWebhook" = ${discordWebhook}, 
                "slackWebhook" = ${slackWebhook}, 
                "emailNotifications" = ${emailNotifications},
                "updatedAt" = ${now}::timestamp
        `;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    try {
        const result = await prisma.$queryRaw<any[]>`
            SELECT * FROM "UserSettings" WHERE "userId" = ${userId} LIMIT 1
        `;

        const settings = result[0] || {};
        return NextResponse.json(settings);
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
