import { PROMPTS } from "./prompts";
import { supabaseAdmin } from "./supabase";
import axios from "axios";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "",
});

async function getRepoFiles(owner: string, repo: string, token: string) {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
    try {
        const res = await axios.get(url, {
            headers: { Authorization: `token ${token}` },
        });
        return res.data.tree;
    } catch (e) {
        try {
            const res = await axios.get(url.replace('main', 'master'), {
                headers: { Authorization: `token ${token}` },
            });
            return res.data.tree;
        } catch (err) {
            return [];
        }
    }
}

async function getFileContent(owner: string, repo: string, path: string, token: string) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const res = await axios.get(url, {
        headers: { Authorization: `token ${token}` },
    });
    return Buffer.from(res.data.content, 'base64').toString('utf-8');
}

export async function runScan(repoFullName: string, token: string, userId: string, language: string = "en") {
    const [owner, repoName] = repoFullName.split("/");

    // 1. CLASSIFY
    const tree = await getRepoFiles(owner, repoName, token);
    const filePaths = tree.map((f: any) => ({ path: f.path, type: f.type }));
    const fileList = tree.map((f: any) => f.path).join("\n");

    const classifierResponse = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: PROMPTS.CLASSIFIER + "\n\nIMPORTANT: ALSO IDENTIFY DEPENDENCY FILES (package.json, requirements.txt, go.mod, pom.xml, gemfile) and include them in RELEVANT_FILES." }, { role: "user", content: `File list:\n${fileList}` }],
    });

    const classification = classifierResponse.choices[0].message.content || "";
    const relevantFilesMatch = classification.match(/RELEVANT_FILES: (.*)/);
    const relevantFiles = relevantFilesMatch ? relevantFilesMatch[1].split(",").map(f => f.trim()) : [];

    // 2. DETECT
    const detections = [];
    for (const filePath of relevantFiles.slice(0, 3)) {
        try {
            const content = await getFileContent(owner, repoName, filePath, token);
            const detectorResponse = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: PROMPTS.DETECTOR },
                    { role: "user", content: `File: ${filePath}\n\nContent:\n${content}` }
                ],
            });
            detections.push(`File: ${filePath}\nAnalysis:\n${detectorResponse.choices[0].message.content}`);
        } catch (e) {
            console.error(`Failed to process ${filePath}`, e);
        }
    }


    // 2.1 SCA (Dependency Analysis)
    const dependencyFiles = relevantFiles.filter((f: string) =>
        f.endsWith('package.json') ||
        f.endsWith('requirements.txt') ||
        f.endsWith('go.mod') ||
        f.endsWith('pom.xml') ||
        f.endsWith('Gemfile')
    );

    for (const depFile of dependencyFiles) {
        try {
            const content = await getFileContent(owner, repoName, depFile, token);
            const scaResponse = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: PROMPTS.DEPENDENCY_ANALYZER },
                    { role: "user", content: `File: ${depFile}\n\nContent:\n${content}` }
                ],
            });
            const scaResult = scaResponse.choices[0].message.content;
            if (scaResult && scaResult.length > 10) {
                detections.push(`File: ${depFile}\nAnalysis:\n${scaResult}`);
            }
        } catch (e) {
            console.error(`Failed to scan dependency file ${depFile}`, e);
        }
    }

    // 3. VALIDATE & EXPLAIN
    const rawRisks = detections.join("\n");
    let finalResults;
    try {
        const explainerResponse = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: `${PROMPTS.EXPLAINER}\n\nIMPORTANT: Use ${language} for all explanations and titles.` },
                { role: "user", content: `Risks found:\n${rawRisks}` }
            ],
            response_format: { type: "json_object" }
        });
        finalResults = JSON.parse(explainerResponse.choices[0].message.content || "{}");
    } catch (explainError: any) {
        if (explainError?.status === 429 || explainError?.status === 400) {
            const fallbackResponse = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: `${PROMPTS.EXPLAINER}\n\nIMPORTANT: Use ${language} for all explanations and titles.` },
                    { role: "user", content: `Risks found:\n${rawRisks}` }
                ],
                response_format: { type: "json_object" }
            });
            finalResults = JSON.parse(fallbackResponse.choices[0].message.content || "{}");
        } else {
            throw explainError;
        }
    }

    // 4. SAVE
    const { data: scanRecord, error: insertError } = await supabaseAdmin.from("Scan").insert({
        repoName,
        repoUrl: `https://github.com/${repoFullName}`,
        status: "completed",
        results: finalResults,
        userId: userId
    }).select().single();

    if (insertError) {
        console.error("Scan storage error:", insertError);
    }

    return { ...finalResults, tree: filePaths, scanId: scanRecord?.id };
}
