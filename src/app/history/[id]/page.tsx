"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, Ship, ArrowLeft, Loader2, Share2, Check, Copy, Link as LinkIcon, Globe } from "lucide-react";
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

export default function HistoryDetailPage() {
    const { t } = useLanguage();
    const params = useParams();
    const id = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [repoName, setRepoName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPublic, setIsPublic] = useState(false);
    const [shareSlug, setShareSlug] = useState<string | null>(null);
    const [sharing, setSharing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [view, setView] = useState<'list' | 'map'>('list');
    const [tree, setTree] = useState<any[]>([]);

    useEffect(() => {
        const loadHistoryDetail = async () => {
            if (!id) return;
            try {
                const { data, error } = await supabase
                    .from("Scan")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) throw error;
                if (data) {
                    setRepoName(data.repoName || data.repo_name);
                    setIsPublic(data.isPublic ?? data.is_public ?? false);
                    setShareSlug(data.shareSlug ?? data.share_slug);
                    const results = data.results;
                    const normalizedIssues = results?.issues || results?.results || (Array.isArray(results) ? results : []);
                    setIssues(normalizedIssues);
                    setTree(results?.tree || []);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadHistoryDetail();
    }, [id]);

    const handleToggleShare = async () => {
        setSharing(true);
        try {
            const nextPublic = !isPublic;
            const res = await fetch(`/api/scan/${id}/share`, {
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
                    <Loader2 className="animate-spin text-primary" size={48} />
                    <p className="mt-4 font-mono text-primary text-glow tracking-widest uppercase">{t("scan.scanning")}</p>
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
                        <h2 className="font-display text-2xl font-bold uppercase tracking-wider mb-2">{t("common.error")}</h2>
                        <p className="font-mono text-sm leading-relaxed opacity-80">{error}</p>
                    </div>
                    <Link href="/history" className="px-8 py-3 bg-primary text-black font-bold uppercase tracking-widest hover:bg-white transition-all">
                        {t("history.back_to_archives")}
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
                            <Link href="/history" className="text-gray-500 hover:text-primary transition-colors flex items-center gap-1 group">
                                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                <span className="text-xs font-bold tracking-widest uppercase">{t("history.back_to_archives")}</span>
                            </Link>
                        </div>
                        <h1 className="font-display text-4xl font-bold text-white tracking-wide uppercase mb-2">{t("history.historical_analysis")}</h1>
                        <div className="flex items-center gap-4">
                            <p className="text-gray-400 font-mono text-sm flex items-center gap-2">
                                <span className="text-gray-600">&gt;&gt;</span> {t("history.snapshot_for")}
                                <span className="text-primary font-medium">{repoName}</span>
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
                    <div className="flex flex-col items-end gap-4 min-w-[300px]">
                        <button
                            onClick={handleToggleShare}
                            disabled={sharing}
                            className={`w-full flex items-center justify-center gap-2 px-6 py-3 font-bold uppercase tracking-[0.2em] text-xs border transition-all duration-500 ${isPublic
                                ? 'bg-secondary/10 border-secondary text-secondary hover:bg-secondary/20 shadow-[0_0_20px_rgba(57,255,20,0.2)]'
                                : 'bg-transparent border-gray-700 text-gray-500 hover:border-primary hover:text-primary'
                                }`}
                        >
                            {sharing ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                isPublic ? <Check size={16} /> : <Share2 size={16} />
                            )}
                            {isPublic ? t("history.uplink_active") : t("history.generate_uplink")}
                        </button>

                        {isPublic && shareSlug && (
                            <div className="w-full animate-in slide-in-from-right-4 duration-500">
                                <div className="glass p-4 border-secondary/30 bg-black/60 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-1">
                                        <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></div>
                                    </div>
                                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-2">
                                        {t("cyberwatch.public_uplink")}
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-grow bg-black/40 border border-gray-800 px-3 py-2 rounded font-mono text-[10px] text-white overflow-hidden text-ellipsis whitespace-nowrap">
                                            {window.location.origin}/share/{shareSlug}
                                        </div>
                                        <button
                                            onClick={copyToClipboard}
                                            className="p-2 bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-black transition-all shrink-0"
                                            title={t("cyberwatch.link_copied")}
                                        >
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                    {copied && (
                                        <p className="text-[8px] font-mono text-secondary mt-2 animate-pulse uppercase tracking-widest">
                                            &gt; {t("cyberwatch.link_copied")}
                                        </p>
                                    )}
                                </div>
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
                            <h2 className="font-display text-5xl font-bold text-white uppercase tracking-tighter mb-4">{t("scan.no_threats")}</h2>
                            <p className="max-w-xl text-gray-500 font-mono text-lg mb-10 leading-relaxed uppercase tracking-wider">{t("history.no_threats_history")}</p>
                            <Link href="/history" className="px-10 py-4 bg-primary text-black font-bold uppercase tracking-widest hover:bg-white transition-all shadow-neon">
                                {t("history.back_to_archives")}
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-surface-dark border-l-4 border-l-accent border-y border-r border-gray-800 p-6 relative overflow-hidden group mb-10">
                                <div className="absolute inset-0 bg-accent/5 pointer-events-none"></div>
                                <div className="flex items-start gap-6 relative z-10">
                                    <div className="p-4 bg-black border border-accent/50 text-accent shadow-neon-red shrink-0">
                                        <span className="material-symbols-outlined text-3xl">history</span>
                                    </div>
                                    <div className="flex-grow">
                                        <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider mb-2">{t("history.historical_report")}: <span className="text-accent">{issues.length.toString().padStart(2, '0')} {t("common.threats")}</span></h2>
                                        <p className="text-gray-400 text-sm font-mono leading-relaxed max-w-3xl">
                                            {t("history.review_desc")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {issues.map((issue, i) => (
                                <div key={i} className="group relative bg-black/40 border border-accent/30 hover:border-accent transition-all duration-300 overflow-hidden">
                                    <div className="p-6 flex items-start sm:items-center gap-6 relative z-10">
                                        <div className="shrink-0 text-accent">
                                            <span className="material-symbols-outlined text-3xl">warning</span>
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] font-bold text-accent border border-accent px-1.5 uppercase">{t("history.security_risk")}</span>
                                            </div>
                                            <h3 className="font-display text-xl sm:text-2xl font-bold text-gray-100 group-hover:text-white transition-colors tracking-wide">
                                                {issue.title}
                                            </h3>

                                            <div className="mt-8 grid md:grid-cols-2 gap-10">
                                                <div className="border-l border-gray-800 pl-6">
                                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
                                                        <span className="w-1 h-3 bg-accent"></span>
                                                        {t("wiki.threat_analysis")}
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
