import type { VercelRequest, VercelResponse } from '@vercel/node';
import { safeInvoke } from '../_utils/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { files } = req.body;
    const fileListString = files
        .map((f: any) => `${f.name} (${f.isDirectory ? 'Dir' : f.size + ' bytes'})`)
        .slice(0, 100)
        .join('\n');

    try {
        const result = await safeInvoke("gemini-2.5-flash",
            `Analyze this list of files from a ZIP archive and provide a technical summary of what this project/package likely is.
      
      Files:
      ${fileListString}`,
            {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        summary: { type: "STRING" },
                        category: { type: "STRING" },
                        technologies: { type: "ARRAY", items: { type: "STRING" } },
                        securityNotes: { type: "ARRAY", items: { type: "STRING" } }
                    },
                    required: ["summary", "category", "technologies", "securityNotes"]
                }
            }
        );

        return res.status(200).json(JSON.parse(result.response));
    } catch (error: any) {
        console.error('ZIP API Error:', error);
        return res.status(500).json({ error: 'Analysis failed' });
    }
}
