"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Navbar } from "@/components/Navbar";
import { Search, Loader2, Calendar, Shield, Trash2, ArrowRight, Activity, Zap, Info } from "lucide-react";
import Link from "next/link";
import { TrendChart } from "@/components/TrendChart";
import { useLanguage } from "@/context/LanguageContext";

interface ScanRecord {
    id: string;
    repoName: string;
    repoUrl: string;
    status: string;
    results: any;
    createdAt: string;
}

export default function HistoryPage() {
    const { t } = useLanguage();
    const [user, setUser] = useState<User | null>(null);
    const [scans, setScans] = useState<ScanRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const loadHistory = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data, error } = await supabase
                    .from("Scan")
                    .select("*")
                    .eq("userId", user.id)
                    .order("createdAt", { ascending: false });

                if (data) setScans(data);
                if (error) console.error("Error loading history:", error);
            }
            setLoading(false);
        };

        loadHistory();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm(t("history.purge_confirm"))) return;

        const { error } = await supabase.from("Scan").delete().eq("id", id);
        if (!error) {
            setScans(scans.filter(s => s.id !== id));
        } else {
            alert(t("history.purge_fail"));
        }
    };

    const filteredScans = scans.filter(s =>
        s.repoName.toLowerCase().includes(search.toLowerCase())
    );

    // Calculate Trend Data
    const chartData = [...scans].reverse().map(s => ({
        date: new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        vulnerabilities: (s.results?.issues || s.results?.results || []).length
    })).slice(-10); // Show last 10 scans

    const totalVulnerabilities = scans.reduce((acc, s) => acc + (s.results?.issues || s.results?.results || []).length, 0);
    const averageRisk = scans.length > 0 ? (totalVulnerabilities / scans.length).toFixed(1) : 0;
    const cleanScans = scans.filter(s => (s.results?.issues || s.results?.results || []).length === 0).length;

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
                    <p className="font-mono text-gray-500 uppercase tracking-widest">{t("common.error")}</p>
                    <Link href="/" className="px-6 py-2 bg-primary text-black font-bold uppercase tracking-widest hover:bg-white transition-colors">
                        {t("common.back")}
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
                            <span className="text-xs font-bold text-primary border border-primary/30 px-2 py-0.5 bg-primary/10 tracking-widest uppercase">{t("history.subtitle")}</span>
                        </div>
                        <h1 className="font-display text-4xl font-bold text-white tracking-wide uppercase">{t("history.title")}</h1>
                    </div>

                    <div className="w-full md:w-96">
                        <div className="glass flex items-center gap-3 px-4 py-2 group focus-within:border-primary/50 transition-colors">
                            <Search size={20} className="text-gray-600 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder={t("history.filter")}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-transparent border-none text-white outline-none w-full font-mono text-sm placeholder:text-gray-700"
                            />
                        </div>
                    </div>
                </div>

                {/* HUD Analytics Layer */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass p-4 border-l-2 border-l-primary/50">
                        <div className="flex items-center gap-3 text-gray-500 mb-2">
                            <Activity size={14} />
                            <span className="text-[10px] font-mono uppercase tracking-widest">{t("dashboard.health")}</span>
                        </div>
                        <div className="text-2xl font-display font-bold text-white uppercase tracking-tight">
                            {Number(averageRisk) === 0 ? t("dashboard.health_optimal") : Number(averageRisk) < 3 ? t("dashboard.health_stable") : t("dashboard.health_compromised")}
                        </div>
                        <div className="text-[10px] font-mono text-primary mt-1">&gt; {t("dashboard.analyzing")}</div>
                    </div>

                    <div className="glass p-4 border-l-2 border-l-primary/50">
                        <div className="flex items-center gap-3 text-gray-500 mb-2">
                            <Zap size={14} />
                            <span className="text-[10px] font-mono uppercase tracking-widest">{t("history.total_threats")}</span>
                        </div>
                        <div className="text-2xl font-display font-bold text-white uppercase tracking-tight">
                            {totalVulnerabilities.toString().padStart(3, '0')}
                        </div>
                        <div className="text-[10px] font-mono text-gray-600 mt-1">{t("dashboard.total_logged")}</div>
                    </div>

                    <div className="glass p-4 border-l-2 border-l-secondary/50">
                        <div className="flex items-center gap-3 text-gray-500 mb-2">
                            <Shield size={14} />
                            <span className="text-[10px] font-mono uppercase tracking-widest">{t("history.clean_records")}</span>
                        </div>
                        <div className="text-2xl font-display font-bold text-secondary uppercase tracking-tight">
                            {cleanScans.toString().padStart(3, '0')}
                        </div>
                        <div className="text-[10px] font-mono text-gray-600 mt-1">{t("dashboard.secure_env")}</div>
                    </div>

                    <div className="glass p-4 border-l-2 border-l-primary/50">
                        <div className="flex items-center gap-3 text-gray-500 mb-2">
                            <Info size={14} />
                            <span className="text-[10px] font-mono uppercase tracking-widest">{t("history.scan_count")}</span>
                        </div>
                        <div className="text-2xl font-display font-bold text-white uppercase tracking-tight">
                            {scans.length.toString().padStart(3, '0')}
                        </div>
                        <div className="text-[10px] font-mono text-gray-600 mt-1">UPLINK OPERATIONS LOGGED</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-mono text-gray-500 uppercase tracking-[0.3em]">{t("history.latest")}</h2>
                            <div className="h-px bg-gray-800 flex-grow mx-6"></div>
                        </div>
                        <div className="grid gap-4">
                            {filteredScans.length === 0 ? (
                                <div className="py-20 text-center border border-dashed border-gray-800 rounded-xl">
                                    <p className="font-mono text-gray-600 uppercase tracking-widest">{t("history.no_data")}</p>
                                    <Link href="/repos" className="mt-6 inline-block px-6 py-2 bg-transparent border border-gray-700 text-gray-500 font-bold uppercase tracking-widest hover:border-primary hover:text-primary transition-all">
                                        {t("history.first_analysis")}
                                    </Link>
                                </div>
                            ) : (
                                filteredScans.map((scan) => {
                                    const vulnerabilities = (scan.results?.issues || scan.results?.results || []).length;
                                    return (
                                        <div key={scan.id} className="glass group p-4 flex flex-col md:flex-row items-center justify-between hover:border-primary/30 transition-all relative overflow-hidden">
                                            <div className="flex items-center gap-6 w-full md:w-auto">
                                                <div className={`p-3 border ${vulnerabilities > 0 ? 'border-accent/30 text-accent bg-accent/5' : 'border-secondary/30 text-secondary bg-secondary/5'}`}>
                                                    <Shield size={24} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-display text-lg font-bold text-white uppercase tracking-wide group-hover:text-primary transition-colors">
                                                        {scan.repoName}
                                                    </span>
                                                    <div className="flex items-center gap-4 mt-1 font-mono text-[10px] text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={10} /> {new Date(scan.createdAt).toLocaleDateString()}
                                                        </span>
                                                        <span className={`uppercase ${vulnerabilities > 0 ? 'text-accent' : 'text-secondary'}`}>
                                                            {vulnerabilities} {t("common.threats")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto justify-end">
                                                <button
                                                    onClick={() => handleDelete(scan.id)}
                                                    className="p-2 text-gray-700 hover:text-accent transition-colors cursor-pointer"
                                                    title="Purge record"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <Link
                                                    href={`/history/${scan.id}`}
                                                    className="px-4 py-1.5 border border-gray-800 text-gray-500 hover:border-primary hover:text-primary font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all"
                                                >
                                                    {t("history.recall")} <ArrowRight size={12} />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-mono text-gray-500 uppercase tracking-[0.3em]">{t("history.trend")}</h2>
                        </div>
                        <div className="sticky top-10">
                            <div className="text-[10px] font-mono text-gray-600 uppercase mb-2">{t("history.density_desc")}</div>
                            <TrendChart data={chartData} />
                            <div className="mt-8 glass p-6 border-accent/20">
                                <h4 className="text-xs font-bold text-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-accent animate-ping rounded-full"></span>
                                    {t("history.security_alert")}
                                </h4>
                                <p className="text-[10px] font-mono text-gray-400 leading-relaxed uppercase">
                                    {t("history.threat_level_desc").replace("{risk}", averageRisk.toString())}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
