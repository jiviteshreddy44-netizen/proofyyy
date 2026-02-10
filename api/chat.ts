import type { VercelRequest, VercelResponse } from '@vercel/node';
import { safeInvoke } from './_utils/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, history } = req.body;

    try {
        // We treat each chat turn as a safeInvoke call for simplicity
        const result = await safeInvoke("gemini-2.5-flash",
            message,
            {
                systemInstruction: "You are a world-class forensic assistant. You help users understand deepfake detection, text analysis, and source verification. Use Google Search for up-to-date facts.",
                history: history || []
            }
        );

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Chat API Error:', error);
        return res.status(500).json({ error: 'Chat failed' });
    }
}
