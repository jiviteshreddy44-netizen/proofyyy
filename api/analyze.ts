import type { VercelRequest, VercelResponse } from '@vercel/node';
import { safeInvoke } from '../_utils/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { model, contents, config } = req.body;

    try {
        const result = await safeInvoke(model, contents, config);
        return res.status(200).json(result);
    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({
            error: error.message || 'Internal Server Error',
            status: error.status || 500
        });
    }
}
