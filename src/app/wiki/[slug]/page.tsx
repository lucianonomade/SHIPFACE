"use client";

import { Navbar } from "@/components/Navbar";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, Info, ShieldAlert, Terminal, Zap } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const WIKI_CONTENT: Record<string, any> = {
    "hardcoded-secrets": {
        title: "Hardcoded Secrets",
        severity: "CRITICAL",
        category: "Credential Management",
        description: "Hardcoded secrets refer to sensitive information (passwords, API keys, tokens, SSH keys) embedded directly into source code, configuration files, or build scripts.",
        threat: "Anyone with access to the source code (including through breaches or accidental public commits) can gain unauthorized access to connected services, databases, or infrastructure.",
        remediation: [
            "Use Environment Variables: Load secrets from the environment at runtime.",
            "Vault Solutions: Use HashiCorp Vault, AWS Secrets Manager, or Google Secret Manager.",
            "GitHub Secrets: Store tokens in repository secrets and reference them in workflows.",
            "Code Scanning: Implement pre-commit hooks (like Gitleaks) to detect secrets before they are pushed."
        ],
        code_example: "// BAD\nconst API_KEY = \"sk_live_51Pjk...\"\n\n// GOOD\nconst API_KEY = process.env.STRIPE_API_KEY;"
    },
    "sql-injection": {
        title: "SQL Injection (SQLi)",
        severity: "HIGH",
        category: "Data Integrity",
        description: "An attacker injects malicious SQL code into an input field, which is then executed by the database. This occurs when user input is concatenated directly into SQL queries.",
        threat: "Attackers can bypass authentication, read sensitive data, modify or delete database records, and in some cases, gain administrative control over the database server.",
        remediation: [
            "Use Parameterized Queries: Always use prepared statements or ORMs.",
            "Input Validation: Strict allow-listing for expected input formats.",
            "Principle of Least Privilege: Ensure the database user has only the necessary permissions.",
            "Web Application Firewall (WAF): Use a WAF to filter out common SQLi patterns."
        ],
        code_example: "// BAD\nconst query = `SELECT * FROM users WHERE id = ${userInput}`;\n\n// GOOD\nconst user = await prisma.user.findUnique({ where: { id: userInput } });"
    }
};

export default function WikiDetailPage() {
    const { t } = useLanguage();
    const params = useParams();
    const slug = params.slug as string;
    const content = WIKI_CONTENT[slug];

    if (!content) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center container max-w-2xl text-center px-4">
                    <div className="p-6 bg-black border border-accent text-accent shadow-neon-red mb-8">
                        <AlertTriangle size={48} className="mx-auto mb-4" />
                        <h2 className="font-display text-2xl font-bold uppercase tracking-wider mb-2">{t("wiki.access_denied")}</h2>
                        <p className="font-mono text-sm leading-relaxed opacity-80">{t("wiki.node_not_found").replace("{slug}", slug)}</p>
                    </div>
                    <Link href="/wiki" className="px-8 py-3 bg-primary text-black font-bold uppercase tracking-widest hover:bg-white transition-all">
                        {t("wiki.back_to_wiki")}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-grow container max-w-4xl mx-auto px-4 py-12">
                <Link href="/wiki" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-8 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold font-mono uppercase tracking-[0.2em]">{t("wiki.return_to_index")}</span>
                </Link>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-4 mb-6">
                        <span className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase border ${content.severity === 'CRITICAL' ? 'bg-accent/10 border-accent text-accent' : 'bg-primary/10 border-primary text-primary'
                            }`}>
                            {content.severity} {t("wiki.threat_level")}
                        </span>
                        <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">{content.category}</span>
                    </div>

                    <h1 className="font-display text-5xl font-bold text-white tracking-tight uppercase mb-8 leading-none">
                        {content.title}
                    </h1>

                    <div className="grid gap-12">
                        <section className="space-y-4">
                            <h2 className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-[0.3em]">
                                <Info size={14} /> {t("wiki.description")}
                            </h2>
                            <p className="text-gray-300 font-mono text-sm leading-relaxed">
                                {content.description}
                            </p>
                        </section>

                        <section className="glass p-6 border-l-2 border-l-accent/50 bg-accent/[0.02]">
                            <h2 className="flex items-center gap-2 text-accent font-mono text-xs font-bold uppercase tracking-[0.3em] mb-4">
                                <AlertTriangle size={14} /> {t("wiki.threat")}
                            </h2>
                            <p className="text-gray-400 font-mono text-sm leading-relaxed italic">
                                &quot;{content.threat}&quot;
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="flex items-center gap-2 text-secondary font-mono text-xs font-bold uppercase tracking-[0.3em]">
                                <CheckCircle2 size={14} /> {t("wiki.protocol")}
                            </h2>
                            <ul className="grid gap-3">
                                {content.remediation.map((step: string, i: number) => (
                                    <li key={i} className="glass p-4 border-l-2 border-l-secondary text-gray-300 font-mono text-xs flex items-center gap-3">
                                        <span className="text-secondary font-bold">{i + 1}.</span>
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-[0.3em]">
                                <Terminal size={14} /> {t("wiki.pattern")}
                            </h2>
                            <div className="glass bg-black p-6 font-mono text-xs text-gray-400 border-gray-800">
                                <pre className="whitespace-pre-wrap">
                                    {content.code_example}
                                </pre>
                            </div>
                        </section>
                    </div>
                </div>

                <footer className="mt-20 pt-12 border-t border-gray-900 flex justify-between items-center text-[10px] font-mono text-gray-800">
                    <span className="uppercase tracking-[0.3em]">{t("wiki.neural_link_stable")}</span>
                    <span className="uppercase tracking-[0.3em]">{t("wiki.archive_v1")}</span>
                </footer>
            </main>
        </div>
    );
}
