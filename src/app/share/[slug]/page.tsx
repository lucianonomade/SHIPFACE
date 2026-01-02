"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Loader2, Shield, Calendar, Info, ChevronRight, Terminal, Lock, ExternalLink, Share2 } from "lucide-react";
import { NeuralMap } from "@/components/NeuralMap";
import { useLanguage } from "@/context/LanguageContext";

interface ScanRecord {
    id: string;
    repoName: string;
    repoUrl: string;
    status: string;
    results: any;
    createdAt: string;
}

export default function SharedReportPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [scan, setScan] = useState<ScanRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'map'>('list');
    const { t } = useLanguage();

    useEffect(() => {
        const fetchSharedScan = async () => {
            const { data, error } = await supabase
                .from("Scan")
                .select("*")
                .eq("shareSlug", slug)
                .eq("isPublic", true)
                .single();

            if (!error && data) {
                setScan(data);
            }
            setLoading(false);
        };

        if (slug) fetchSharedScan();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={48} />
                    <p className="mt-4 font-mono text-primary text-glow tracking-widest uppercase">Deciphering Uplink...</p>
                </div>
            </div>
        );
    }

    if (!scan) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center gap-6">
                    <Lock className="text-accent animate-pulse" size={64} />
                    <p className="font-mono text-gray-500 uppercase tracking-widest text-center">
                        Secure Uplink Terminated<br />
                        <span className="text-xs text-gray-700">Link expired or access denied by administrator</span>
                    </p>
                </div>
            </div>
        );
    }

    const issues = scan.results?.issues || scan.results?.results || [];

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-grow container max-w-5xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-6">
                        <div className={`p-4 border shadow-neon ${issues.length > 0 ? 'border-accent text-accent bg-accent/5' : 'border-secondary text-secondary bg-secondary/5'}`}>
                            <Shield size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-primary border border-primary/30 px-2 py-0.5 bg-primary/10 tracking-[0.2em] uppercase">Shared Intel</span>
                                <span className="text-[10px] font-mono text-gray-600">ID: {scan.id.slice(0, 8)}</span>
                            </div>
                            <h1 className="font-display text-4xl font-bold text-white tracking-wide uppercase">{scan.repoName}</h1>
                            <div className="flex items-center gap-4 mt-1 font-mono text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(scan.createdAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1 uppercase">&gt; System Snapshot</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
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
                                {t("neural_map") || "Neural Map"}
                            </button>
                        </div>
                        <a
                            href={scan.repoUrl}
                            target="_blank"
                            className="glass px-6 py-2 flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs hover:bg-primary/10 transition-all border-primary/30"
                        >
                            View Source <ExternalLink size={14} />
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                    <div className="glass p-4 border-l-2 border-l-primary/50">
                        <span className="block text-[10px] font-mono text-gray-600 uppercase mb-1">Scanning Status</span>
                        <span className="text-xl font-display font-bold text-white uppercase tracking-tight">{scan.status}</span>
                    </div>
                    <div className="glass p-4 border-l-2 border-l-accent/50">
                        <span className="block text-[10px] font-mono text-gray-600 uppercase mb-1">Threats Detected</span>
                        <span className="text-xl font-display font-bold text-accent uppercase tracking-tight">{issues.length}</span>
                    </div>
                    <div className="glass md:col-span-2 p-4 border-l-2 border-l-primary/50">
                        <span className="block text-[10px] font-mono text-gray-600 uppercase mb-1">Public Access</span>
                        <span className="text-xl font-display font-bold text-secondary uppercase tracking-tight">ACTIVE PROTOCOL</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-sm font-mono text-gray-500 uppercase tracking-[0.4em]">Vulnerability Protocol Details</h2>
                        <div className="h-px bg-gray-800 flex-grow"></div>
                    </div>

                    {view === 'list' ? (
                        issues.length === 0 ? (
                            <div className="glass p-12 text-center border-secondary/20 bg-secondary/5 border-dashed border-2">
                                <Shield className="mx-auto text-secondary mb-4 opacity-50" size={48} />
                                <h3 className="text-lg font-display font-bold text-white uppercase tracking-widest mb-2 text-glow-green">Sector Secure</h3>
                                <p className="text-xs font-mono text-gray-500 uppercase italic">No active threats detected in this repository branch.</p>
                            </div>
                        ) : (
                            issues.map((issue: any, idx: number) => (
                                <div key={idx} className="glass p-6 group hover:border-accent/40 transition-all relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="absolute top-0 right-0 p-4 font-mono text-[8px] text-gray-800 pointer-events-none">
                                        THREAT_LAYER_0{idx + 1}
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-tighter ${issue.severity === 'high' ? 'bg-accent text-white' :
                                                    issue.severity === 'medium' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'
                                                    }`}>
                                                    {issue.severity || 'UNKNOWN'} RISK
                                                </span>
                                                <h3 className="text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2 group-hover:text-glow-red transition-all">
                                                    {issue.title || issue.type}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-mono text-primary mb-4">
                                                <Terminal size={10} />
                                                <span>FILE: {issue.file || issue.filePath || 'SYSTEM_CORE'}</span>
                                                {issue.line && (
                                                    <>
                                                        <span className="text-gray-700">/</span>
                                                        <span>LINE: {issue.line}</span>
                                                    </>
                                                )}
                                            </div>
                                            <p className="text-gray-400 text-sm leading-relaxed mb-6 font-mono border-l-2 border-gray-800 pl-4 py-1 italic">
                                                {issue.description || issue.explanation || issue.problem}
                                            </p>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-secondary uppercase tracking-widest">
                                                    <ChevronRight size={14} /> Countermeasure Protocol
                                                </div>
                                                <div className="glass bg-black/40 p-4 font-mono text-xs border-secondary/20">
                                                    <div className="text-secondary opacity-50 mb-2 uppercase text-[8px] tracking-widest border-b border-secondary/10 pb-1">Recommended Action</div>
                                                    <p className="text-gray-300">
                                                        {issue.remediation || issue.fix || "IMPLEMENT HIGH-LEVEL SECURITY OVERRIDE. AUDIT CODEBASE IMMEDIATELY."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        <div className="animate-in fade-in zoom-in-95 duration-1000">
                            <NeuralMap
                                files={(scan.results?.tree || []).map((f: any) => f.path)}
                                vulnerableFiles={issues.map((i: any) => i.file || i.filePath).filter(Boolean) as string[]}
                            />
                            <div className="mt-6 p-4 glass border-primary/20 bg-primary/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 font-mono text-[10px] text-gray-400">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                        {t("visual_analysis") || "VISUAL ANALYSIS"} ACTIVE
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
                </div>

                <footer className="mt-20 pt-8 border-t border-gray-900 text-center">
                    <p className="text-[10px] font-mono text-gray-700 uppercase tracking-[0.5em]">
                        &gt; SHIPSAFE SECURE DATA TRANSMISSION END &lt;
                    </p>
                </footer>
            </main>
        </div>
    );
}
