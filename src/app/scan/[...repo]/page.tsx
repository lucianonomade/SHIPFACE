"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Ship, Share2, Check, Copy, Globe, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { useLanguage } from "@/context/LanguageContext";
import { NeuralMap } from "@/components/NeuralMap";

interface Issue {
    title: string;
    problem: string;
    fix: string;
    file?: string;
}

export default function ScanPage() {
    const params = useParams();
    const repoParam = params?.repo;
    const repoStr = Array.isArray(repoParam) ? repoParam.join("/") : (repoParam as string || "");
    const decodedRepo = decodeURIComponent(repoStr);
    const { language, t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(t("scan.initiating"));
    const [scanId, setScanId] = useState<string | null>(null);
    const [isPublic, setIsPublic] = useState(false);
    const [shareSlug, setShareSlug] = useState<string | null>(null);
    const [sharing, setSharing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [view, setView] = useState<'list' | 'map'>('list');
    const [tree, setTree] = useState<any[]>([]);

    useEffect(() => {
        const runScan = async () => {
            try {
                setStep(t("scan.scanning"));
                const { data: { session } } = await supabase.auth.getSession();
                const sessionToken = session?.access_token;
                const githubToken = session?.provider_token;

                const response = await fetch("/api/scan", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${sessionToken}`
                    },
                    body: JSON.stringify({
                        full_name: decodedRepo,
                        github_token: githubToken,
                        language: language
                    }),
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || "Failed to scan repository");
                }

                const data = await response.json();
                const normalizedIssues = data.issues || data.results || (Array.isArray(data) ? data : []);
                setIssues(normalizedIssues);
                setScanId(data.scanId);
                setIsPublic(data.isPublic || false);
                setShareSlug(data.shareSlug);
                setTree(data.tree || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (decodedRepo) runScan();
    }, [decodedRepo, language]);

    const handleToggleShare = async () => {
        if (!scanId) return;
        setSharing(true);
        try {
            const nextPublic = !isPublic;
            const res = await fetch(`/api/scan/${scanId}/share`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublic: nextPublic }),
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Uplink generation failed");
            }
            const data = await res.json();
            setIsPublic(data.isPublic ?? data.is_public);
            setShareSlug(data.shareSlug ?? data.share_slug);
        } catch (err: any) {
            console.error("Failed to toggle share", err);
            alert(err.message || t("cyberwatch.sharing_fail"));
        } finally {
            setSharing(false);
        }
    };

    const copyToClipboard = () => {
        if (!shareSlug) return;
        const url = `${window.location.origin}/share/${shareSlug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center">
                    <div className="relative">
                        <Loader2 className="animate-spin text-primary" size={64} />
                        <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse"></div>
                    </div>
                    <h2 className="mt-8 font-display text-2xl font-bold text-white uppercase tracking-widest text-glow">{step}</h2>
                    <p className="mt-2 font-mono text-gray-500 text-sm uppercase">Establishing secure uplink...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center container max-w-2xl text-center px-4">
                    <div className="p-6 bg-black border border-accent text-accent shadow-neon-red mb-8">
                        <AlertCircle size={48} className="mx-auto mb-4" />
                        <h2 className="font-display text-2xl font-bold uppercase tracking-wider mb-2">Protocol Interrupted</h2>
                        <p className="font-mono text-sm leading-relaxed opacity-80">{error}</p>
                    </div>
                    <Link href="/repos" className="px-8 py-3 bg-primary text-black font-bold uppercase tracking-widest hover:bg-white transition-all">
                        Initialize New Protocol
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-grow container max-w-6xl mx-auto px-4 py-10 space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-800 pb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-primary border border-primary/30 px-2 py-0.5 bg-primary/10 tracking-widest uppercase">Target Locked</span>
                        </div>
                        <h1 className="font-display text-4xl font-bold text-white tracking-wide uppercase mb-2">Scan Results Summary</h1>
                        <div className="flex items-center gap-4">
                            <p className="text-gray-400 font-mono text-sm flex items-center gap-2">
                                <span className="text-gray-600">&gt;&gt;</span> Analysis for
                                <a className="text-primary hover:text-white font-medium hover:underline flex items-center gap-2 transition-colors group" href="#">
                                    {decodedRepo}
                                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">open_in_new</span>
                                </a>
                            </p>
                            <div className="flex items-center gap-1 bg-black/40 p-1 border border-gray-800 rounded">
                                <button
                                    onClick={() => setView('list')}
                                    className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'list' ? 'bg-primary text-black shadow-[0_0_10px_#00f3ff]' : 'text-gray-500 hover:text-white'}`}
                                >
                                    List
                                </button>
                                <button
                                    onClick={() => setView('map')}
                                    className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'map' ? 'bg-primary text-black shadow-[0_0_10px_#00f3ff]' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {t("neural_map")}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-xs font-bold tracking-wider uppercase border shadow-inner ${issues.length === 0 ? 'bg-secondary/10 text-secondary border-secondary/30 shadow-[0_0_10px_rgba(57,255,20,0.1)]' : 'bg-accent/10 text-accent border-accent/30 shadow-[0_0_10px_rgba(255,0,60,0.1)]'}`}>
                                {issues.length === 0 ? t("scan.no_threats") : t("scan.threats_found")}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {scanId && (
                                <button
                                    onClick={handleToggleShare}
                                    disabled={sharing}
                                    className={`flex items-center gap-2 px-4 py-2 font-bold uppercase tracking-widest text-[10px] border transition-all ${isPublic
                                        ? 'bg-secondary/10 border-secondary text-secondary shadow-neon-green'
                                        : 'bg-transparent border-gray-700 text-gray-500 hover:border-primary hover:text-primary'
                                        }`}
                                >
                                    {sharing ? <Loader2 size={12} className="animate-spin" /> : <Share2 size={12} />}
                                    {isPublic ? t("history.uplink_active") : t("cyberwatch.share_protocol")}
                                </button>
                            )}
                            <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-6 py-2 bg-transparent border border-primary text-primary hover:bg-primary hover:text-black transition-all duration-300 text-sm font-bold uppercase tracking-wider clip-path-polygon">
                                <span className="material-symbols-outlined text-base">refresh</span>
                                Initiate Re-scan
                            </button>
                        </div>

                        {isPublic && shareSlug && (
                            <div className="flex items-center gap-2 glass px-3 py-1 border-secondary/30 bg-secondary/5 animate-in slide-in-from-right-2">
                                <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Uplink:</span>
                                <span className="font-mono text-[9px] text-white">...{shareSlug.slice(-8)}</span>
                                <button onClick={copyToClipboard} className="text-gray-500 hover:text-primary transition-colors">
                                    {copied ? <Check size={12} className="text-secondary" /> : <Copy size={12} />}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {view === 'list' ? (
                    issues.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <div className="relative mb-10">
                                <div className="p-8 bg-black border border-secondary text-secondary shadow-neon-green rounded-full relative z-10">
                                    <Ship size={80} />
                                </div>
                                <div className="absolute inset-0 blur-3xl bg-secondary/20"></div>
                            </div>
                            <h2 className="font-display text-5xl font-bold text-white uppercase tracking-tighter mb-4">Looks Good. <span className="text-secondary italic">Ship It.</span></h2>
                            <p className="max-w-xl text-gray-500 font-mono text-lg mb-10 leading-relaxed uppercase tracking-wider">{t("scan.no_threats")}</p>
                            <Link href="/history" className="px-10 py-4 bg-primary text-black font-bold uppercase tracking-widest hover:bg-white transition-all shadow-neon">
                                Scan Another Endpoint
                            </Link>
                            <div className="mt-6 flex items-center justify-center gap-2 font-mono text-[10px] text-gray-600 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>
                                SCAN DATA LOGGED TO ARCHIVES
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-surface-dark border-l-4 border-l-accent border-y border-r border-gray-800 p-6 relative overflow-hidden group mb-10">
                                <div className="absolute inset-0 bg-accent/5 pointer-events-none"></div>
                                <div className="flex items-start gap-6 relative z-10">
                                    <div className="p-4 bg-black border border-accent/50 text-accent shadow-neon-red shrink-0">
                                        <span className="material-symbols-outlined text-3xl">error_outline</span>
                                    </div>
                                    <div className="flex-grow">
                                        <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider mb-2">Vulnerabilities Detected: <span className="text-accent">{issues.length.toString().padStart(2, '0')}</span></h2>
                                        <div className="flex items-center gap-4">
                                            <p className="text-gray-400 text-sm font-mono leading-relaxed max-w-2xl">
                                                Security protocols breached. Immediate remediation required. Vulnerabilities range from insecure components to exposed logic.
                                            </p>
                                            <div className="hidden lg:flex items-center gap-2 font-mono text-[9px] text-gray-600 uppercase tracking-widest border border-gray-800/50 px-2 py-1 bg-black/20 shrink-0">
                                                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
                                                Snapshot Logged
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {issues.map((issue, i) => (
                                <div key={i} className="group relative bg-black/40 border border-accent/30 hover:border-accent transition-all duration-300 overflow-hidden">
                                    <div className="p-6 flex items-start sm:items-center gap-6 relative z-10">
                                        <div className="shrink-0 text-accent animate-pulse">
                                            <span className="material-symbols-outlined text-3xl">warning</span>
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] font-bold text-accent border border-accent px-1.5 uppercase">Security Risk</span>
                                                <span className="text-[10px] font-mono text-gray-600">ID: SHIP-{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                                            </div>
                                            <h3 className="font-display text-xl sm:text-2xl font-bold text-gray-100 group-hover:text-white transition-colors tracking-wide">
                                                {issue.title}
                                            </h3>

                                            <div className="mt-8 grid md:grid-cols-2 gap-10">
                                                <div className="border-l border-gray-800 pl-6">
                                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
                                                        <span className="w-1 h-3 bg-accent"></span>
                                                        {t("wiki.threat")}
                                                    </h4>
                                                    <p className="text-gray-400 leading-relaxed text-sm font-mono">
                                                        {issue.problem}
                                                    </p>
                                                </div>

                                                <div className="relative group/code">
                                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary mb-4 flex items-center gap-2">
                                                        <span className="w-1 h-3 bg-secondary shadow-neon-green"></span>
                                                        {t("scan.remediation")}
                                                    </h4>
                                                    <div className="relative bg-black border border-gray-800 p-4 font-mono text-xs text-gray-300 shadow-inner">
                                                        <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                                                            <span className="text-gray-700">patch@ship-safe:~#</span>
                                                        </div>
                                                        <span className="block text-secondary leading-relaxed">
                                                            {issue.fix}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-1000">
                        <NeuralMap
                            files={tree.map(f => f.path)}
                            vulnerableFiles={issues.map(i => i.file).filter(Boolean) as string[]}
                        />
                        <div className="mt-6 p-4 glass border-primary/20 bg-primary/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 font-mono text-[10px] text-gray-400">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                    {t("visual_analysis")} ACTIVE
                                </div>
                                <div className="flex items-center gap-2 font-mono text-[10px] text-gray-400">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
                                    IDENTIFIED ANOMALIES PULSING
                                </div>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[9px] text-primary/60 uppercase tracking-widest">
                                Drag to explore topology | Scroll to zoom
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
