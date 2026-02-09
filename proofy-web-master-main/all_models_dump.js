
import fs from "fs";

async function listAllModels() {
    const env = fs.readFileSync(".env", "utf8");
    const apiKeyMatch = env.match(/GEMINI_API_KEY=([^\r\n]+)/) || env.match(/API_KEY=([^\r\n]+)/);
    const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

    if (!apiKey) {
        console.error("No API key");
        return;
    }

    const output = [];

    for (const version of ["v1", "v1beta"]) {
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`);
            const data = await res.json();
            output.push(`\n=== VERSION: ${version} ===`);
            if (data.models) {
                data.models.forEach(m => output.push(m.name));
            } else {
                output.push(JSON.stringify(data));
            }
        } catch (e) {
            output.push(`Error ${version}: ${e.message}`);
        }
    }

    fs.writeFileSync("all_models_dump.txt", output.join("\n"));
    console.log("Dumped to all_models_dump.txt");
}

listAllModels();
