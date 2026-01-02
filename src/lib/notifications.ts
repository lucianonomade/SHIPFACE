
import axios from "axios";

export async function sendNotification(webhookUrl: string | undefined, message: string, platform: 'discord' | 'slack') {
    if (!webhookUrl) return;

    try {
        if (platform === 'discord') {
            await axios.post(webhookUrl, {
                content: message,
                username: "ShipSafe Cyber-Watch",
                avatar_url: "https://shipface.vercel.app/logo.png" // Placeholder
            });
        } else if (platform === 'slack') {
            await axios.post(webhookUrl, {
                text: message
            });
        }
    } catch (e) {
        console.error(`Failed to send ${platform} notification`, e);
    }
}
