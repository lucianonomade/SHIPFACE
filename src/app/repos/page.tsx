"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Github, Search, Loader2, ArrowRight, Activity, Zap, Shield, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Navbar } from "@/components/Navbar";
import { TrendChart } from "@/components/TrendChart";
import { useLanguage } from "@/context/LanguageContext";

interface Repo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description: string;
}

interface ScanRecord {
    id: string;
    repoName: string;
    results: any;
    createdAt: string;
}

export default function ReposPage() {
    const { t } = useLanguage();
    const [user, setUser] = useState<User | null>(null);
    const [repos, setRepos] = useState<Repo[]>([]);
    const [scans, setScans] = useState<ScanRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const loadDashboard = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch Scans for HUD
                const { data: scanData } = await supabase
                    .from("Scan")
                    .select("*")
                    .eq("userId", user.id)
                    .order("createdAt", { ascending: false });

                if (scanData) setScans(scanData);

                // Fetch Repos
                const { data: { session } } = await supabase.auth.getSession();
                let providerToken = session?.provider_token;

                // PERSISTENCE FIX: Supabase doesn't always persist the provider token in the session on refresh.
                // We try to retrieve it from localStorage if missing, or save it if present.
                if (providerToken) {
                    localStorage.setItem("gh_provider_token", providerToken);
                } else {
                    providerToken = localStorage.getItem("gh_provider_token");
                }

                console.log("Session Token:", session?.provider_token ? "Present" : "Missing");
                console.log("Storage Token:", localStorage.getItem("gh_provider_token") ? "Present" : "Missing");

                if (providerToken) {
                    try {
                        const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
                            headers: { Authorization: `token ${providerToken}` },
                        });

                        if (res.status === 401) {
                            // Token expired or invalid
                            localStorage.removeItem("gh_provider_token");
                            console.error("Token expired");
                        } else {
                            const data = await res.json();
                            if (Array.isArray(data)) {
                                setRepos(data);
                            } else {
                                console.error("GitHub API Error:", data);
                            }
                        }
                    } catch (err) {
                        console.error("Failed to fetch repos", err);
                    }
                }
            }
            setLoading(false);
        };

        loadDashboard();
    }, []);

    const filteredRepos = repos.filter((repo) =>
        repo.full_name.toLowerCase().includes(search.toLowerCase())
    );

    // HUD Calculations
    const totalVulnerabilities = scans.reduce((acc, s) => acc + (s.results?.issues || s.results?.results || []).length, 0);
    const averageRisk = scans.length > 0 ? (totalVulnerabilities / scans.length).toFixed(1) : 0;
    const cleanScans = scans.filter(s => (s.results?.issues || s.results?.results || []).length === 0).length;

    const chartData = [...scans].reverse().map(s => ({
        date: new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        vulnerabilities: (s.results?.issues || s.results?.results || []).length
    })).slice(-10);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={48} />
                    <p className="mt-4 font-mono text-primary text-glow tracking-widest uppercase">{t("common.loading")}</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center gap-6">
                    <p className="font-mono text-gray-500 uppercase tracking-widest">Unauthorized Access Detected</p>
                    <Link href="/" className="px-6 py-2 bg-primary text-black font-bold uppercase tracking-widest hover:bg-white transition-colors">
                        Return to Origin
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
                            <span className="text-xs font-bold text-primary border border-primary/30 px-2 py-0.5 bg-primary/10 tracking-widest uppercase">{t("dashboard.subtitle")}</span>
                        </div>
                        <h1 className="font-display text-4xl font-bold text-white tracking-wide uppercase">{t("dashboard.title")}</h1>
                    </div>

                    <div className="w-full md:w-96">
                        <div className="glass flex items-center gap-3 px-4 py-2 group focus-within:border-primary/50 transition-colors">
                            <Search size={20} className="text-gray-600 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder={t("dashboard.search_placeholder")}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-transparent border-none text-white outline-none w-full font-mono text-sm placeholder:text-gray-700"
                            />
                        </div>
                    </div>
                </div>

                {/* HUD Intelligence Layer */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="glass p-4 border-l-2 border-l-primary/50">
                                <div className="flex items-center gap-3 text-gray-500 mb-2">
                                    <Activity size={14} />
                                    <span className="text-[10px] font-mono uppercase tracking-widest">{t("dashboard.health")}</span>
                                </div>
                                <div className="text-2xl font-display font-bold text-white uppercase tracking-tight">
                                    {Number(averageRisk) === 0 ? t("dashboard.health_optimal") : Number(averageRisk) < 3 ? t("dashboard.health_stable") : t("dashboard.health_compromised")}
                                </div>
                                <div className="text-[10px] font-mono text-primary mt-1 uppercase tracking-tighter">{t("dashboard.analyzing")}</div>
                            </div>

                            <div className="glass p-4 border-l-2 border-l-accent/50">
                                <div className="flex items-center gap-3 text-gray-500 mb-2">
                                    <Zap size={14} />
                                    <span className="text-[10px] font-mono uppercase tracking-widest">{t("dashboard.global_threats")}</span>
                                </div>
                                <div className="text-2xl font-display font-bold text-white uppercase tracking-tight">
                                    {totalVulnerabilities.toString().padStart(3, '0')}
                                </div>
                                <div className="text-[10px] font-mono text-gray-600 mt-1 uppercase tracking-tighter">{t("dashboard.total_logged")}</div>
                            </div>

                            <div className="glass p-4 border-l-2 border-l-secondary/50">
                                <div className="flex items-center gap-3 text-gray-500 mb-2">
                                    <Shield size={14} />
                                    <span className="text-[10px] font-mono uppercase tracking-widest">{t("dashboard.clean_protocols")}</span>
                                </div>
                                <div className="text-2xl font-display font-bold text-secondary uppercase tracking-tight">
                                    {cleanScans.toString().padStart(3, '0')}
                                </div>
                                <div className="text-[10px] font-mono text-gray-600 mt-1 uppercase tracking-tighter">{t("dashboard.secure_env")}</div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="glass p-5 border-l-2 border-l-primary/30 relative h-full">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{t("dashboard.trend")}</span>
                                <Link href="/history" className="text-[8px] font-mono text-primary hover:underline uppercase tracking-tighter">{t("dashboard.full_logs")}</Link>
                            </div>
                            <TrendChart data={chartData} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-mono text-gray-500 uppercase tracking-[0.4em]">{t("dashboard.available_targets")}</h2>
                    <div className="h-px bg-gray-800 flex-grow mx-8"></div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {repos.length === 0 && !loading && (
                        <div className="col-span-full py-20 text-center border border-dashed border-gray-800 rounded-xl bg-black/50">
                            <p className="font-mono text-gray-400 uppercase tracking-widest mb-6">No accessible targets found or uplink disconnected</p>

                            <div className="flex flex-col items-center gap-4">
                                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-transparent border border-gray-700 text-gray-500 font-bold uppercase tracking-widest hover:border-primary hover:text-primary transition-all">
                                    Refresh Uplink
                                </button>

                                <button
                                    onClick={async () => {
                                        await supabase.auth.signInWithOAuth({
                                            provider: "github",
                                            options: {
                                                redirectTo: window.location.origin + "/repos",
                                                scopes: "read:user user:email repo"
                                            }
                                        });
                                    }}
                                    className="px-6 py-2 bg-primary/10 border border-primary text-primary font-bold uppercase tracking-widest hover:bg-primary hover:text-black transition-all shadow-neon"
                                >
                                    Re-authenticate GitHub
                                </button>
                                <p className="text-[10px] text-gray-600 font-mono mt-2 max-w-md">
                                    If you refreshed the page, the secure uplink token might have been flushed from memory.
                                    Re-authenticate to re-establish the Neural Handshake.
                                </p>
                            </div>
                        </div>
                    )}
                    {filteredRepos.map((repo) => (
                        <Link
                            key={repo.id}
                            href={`/scan/${encodeURIComponent(repo.full_name)}`}
                            className="glass group p-6 flex flex-col justify-between hover:border-primary/50 transition-all hover:shadow-[0_0_20px_rgba(0,240,255,0.05)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
                                <Github size={40} className="text-gray-800 group-hover:text-primary transition-colors" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="font-display text-xl font-bold text-gray-100 group-hover:text-white transition-colors tracking-wide uppercase truncate">
                                        {repo.name}
                                    </span>
                                    {repo.private && (
                                        <span className="text-[10px] font-bold text-accent border border-accent/50 px-1.5 py-0.5 rounded uppercase">Encrypted</span>
                                    )}
                                </div>
                                <p className="text-gray-500 font-mono text-xs leading-relaxed mb-8 line-clamp-3">
                                    {repo.description || "NO METADATA AVAILABLE FOR THIS ENDPOINT."}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-800/50 group-hover:border-primary/20 transition-colors">
                                <span className="text-[10px] font-bold text-gray-600 group-hover:text-primary uppercase tracking-widest transition-colors">Initiate Protocol</span>
                                <ArrowRight size={16} className="text-gray-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
