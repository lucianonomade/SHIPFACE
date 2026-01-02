"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Navbar } from "@/components/Navbar";
import { Shield, Loader2, Search, ExternalLink, Power, PowerOff, Activity, Clock } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

interface MonitoredRepo {
    id: string;
    repoFullName: string;
    active: boolean;
    createdAt: string;
}

interface GithubRepo {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string;
    private: boolean;
}

interface UserSettings {
    discordWebhook?: string;
    slackWebhook?: string;
    emailNotifications?: boolean;
}

export default function CyberWatchPage() {
    const { t } = useLanguage();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [repos, setRepos] = useState<GithubRepo[]>([]);
    const [monitored, setMonitored] = useState<MonitoredRepo[]>([]);
    const [search, setSearch] = useState("");
    const [isEnrolling, setIsEnrolling] = useState<string | null>(null);
    const [settings, setSettings] = useState<UserSettings>({});
    const [showSettings, setShowSettings] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        const loadDashboard = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Load monitored repos from Supabase
                const { data: monitoredData } = await supabase
                    .from("MonitoredRepo")
                    .select("*")
                    .eq("userId", user.id);

                // Load user settings
                try {
                    const res = await fetch(`/api/user/settings?userId=${user.id}`);
                    if (res.ok) {
                        const settingsData = await res.json();
                        if (settingsData && !settingsData.error) setSettings(settingsData);
                    }
                } catch (e) {
                    console.error("Failed to load settings", e);
                }

                if (monitoredData) setMonitored(monitoredData);

                // Load user repos from GitHub
                const { data: session } = await supabase.auth.getSession();
                const token = session.session?.provider_token;

                if (token) {
                    try {
                        const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const repoData = await response.json();
                        if (Array.isArray(repoData)) {
                            setRepos(repoData);
                        }
                    } catch (err) {
                        console.error("Failed to fetch GitHub repos:", err);
                    }
                }
            }
            setLoading(false);
        };

        loadDashboard();
    }, []);

    const handleEnroll = async (repo: GithubRepo) => {
        setIsEnrolling(repo.full_name);
        try {
            const { data: session } = await supabase.auth.getSession();
            const githubToken = session.session?.provider_token;
            const accessToken = session.session?.access_token;

            const response = await fetch("/api/cyberwatch/enroll", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    repoFullName: repo.full_name,
                    githubToken: githubToken
                })
            });

            const result = await response.json();
            if (response.ok) {
                // Refresh monitored list
                const { data: monitoredData } = await supabase
                    .from("MonitoredRepo")
                    .select("*")
                    .eq("userId", user?.id);
                if (monitoredData) setMonitored(monitoredData);
            } else {
                alert(result.error || "Failed to enroll repository.");
            }
        } catch (err) {
            console.error("Enrollment error:", err);
            alert("Network error during enrollment.");
        } finally {
            setIsEnrolling(null);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from("MonitoredRepo")
            .update({ active: !currentStatus })
            .eq("id", id);

        if (!error) {
            setMonitored(monitored.map(m => m.id === id ? { ...m, active: !currentStatus } : m));
        }
    };


    const monitoredMap = monitored.reduce((acc, m) => {
        acc[m.repoFullName] = m;
        return acc;
    }, {} as Record<string, MonitoredRepo>);

    const handleSaveSettings = async () => {
        if (!user) return;
        setSavingSettings(true);
        try {
            const response = await fetch("/api/user/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    discordWebhook: settings.discordWebhook,
                    slackWebhook: settings.slackWebhook,
                    emailNotifications: settings.emailNotifications
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            setShowSettings(false);
            alert("Protocol updated.");
        } catch (err) {
            console.error("Failed to save settings:", err);
            alert("Failed to update protocol.");
        } finally {
            setSavingSettings(false);
        }
    };

    const filteredRepos = repos.filter(r =>
        r.full_name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-secondary" size={48} />
                    <p className="mt-4 font-mono text-secondary text-glow tracking-widest uppercase">{t("cyberwatch.loading")}</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center gap-6">
                    <p className="font-mono text-gray-500 uppercase tracking-widest text-glow-red">{t("common.error")}</p>
                    <Link href="/" className="px-6 py-2 bg-accent text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors shadow-neon-red">
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
                            <span className="text-xs font-bold text-secondary border border-secondary/30 px-2 py-0.5 bg-secondary/10 tracking-widest uppercase animate-pulse">{t("cyberwatch.subtitle")}</span>
                        </div>
                        <h1 className="font-display text-4xl font-bold text-white tracking-wide uppercase group">{t("navbar.cyberwatch")} <span className="text-secondary group-hover:text-glow-green transition-all">Monitoring</span></h1>
                        <p className="text-gray-500 font-mono text-xs mt-2 uppercase tracking-tight">{t("cyberwatch.desc")}</p>
                    </div>

                    <div className="w-full md:w-96">
                        <div className="glass flex items-center gap-3 px-4 py-2 group focus-within:border-secondary/50 transition-colors">
                            <Search size={20} className="text-gray-600 group-focus-within:text-secondary transition-colors" />
                            <input
                                type="text"
                                placeholder={t("cyberwatch.search")}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-transparent border-none text-white outline-none w-full font-mono text-sm placeholder:text-gray-700"
                            />
                        </div>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="bg-gray-900 border border-gray-700 hover:border-primary text-gray-400 hover:text-primary px-4 py-2 uppercase text-[10px] tracking-widest font-bold transition-all"
                        >
                            Notification Protocols
                        </button>
                    </div>
                </div>

                {showSettings && (
                    <div className="glass p-6 border-l-2 border-l-primary mb-8 animate-in fade-in slide-in-from-top-4">
                        <h3 className="text-lg font-display font-bold text-white uppercase tracking-wide mb-4">Notification Uplinks</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Discord Webhook</label>
                                <input
                                    type="text"
                                    value={settings.discordWebhook || ""}
                                    onChange={(e) => setSettings({ ...settings, discordWebhook: e.target.value })}
                                    placeholder="https://discord.com/api/webhooks/..."
                                    className="w-full bg-black/50 border border-gray-800 text-white px-3 py-2 text-sm font-mono focus:border-primary outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Slack Webhook</label>
                                <input
                                    type="text"
                                    value={settings.slackWebhook || ""}
                                    onChange={(e) => setSettings({ ...settings, slackWebhook: e.target.value })}
                                    placeholder="https://hooks.slack.com/services/..."
                                    className="w-full bg-black/50 border border-gray-800 text-white px-3 py-2 text-sm font-mono focus:border-secondary outline-none transition-colors"
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="px-4 py-2 text-gray-500 font-mono text-xs uppercase hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={savingSettings}
                                    className="px-6 py-2 bg-primary text-black font-bold uppercase text-xs tracking-widest hover:bg-white transition-all disabled:opacity-50"
                                >
                                    {savingSettings ? "Saving..." : "Save Protocols"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-6">
                    {filteredRepos.length === 0 ? (
                        <div className="py-20 text-center border border-dashed border-gray-800 rounded-xl">
                            <Loader2 className="mx-auto mb-4 text-gray-800" size={32} />
                            <p className="font-mono text-gray-600 uppercase tracking-widest">{t("cyberwatch.no_repos")}</p>
                        </div>
                    ) : (
                        filteredRepos.map((repo) => {
                            const isMonitored = monitoredMap[repo.full_name];
                            return (
                                <div key={repo.id} className="glass group p-5 flex flex-col md:flex-row items-center justify-between hover:border-secondary/30 transition-all border-l-4 border-l-transparent hover:border-l-secondary relative overflow-hidden">
                                    {isMonitored && (
                                        <div className="absolute top-0 right-0 px-2 py-1 bg-secondary/10 text-secondary font-mono text-[8px] tracking-[0.2em] uppercase border-b border-l border-secondary/20 rounded-bl">
                                            {t("cyberwatch.enrolled")}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className={`p-3 border transition-colors ${isMonitored?.active ? 'border-secondary/30 text-secondary bg-secondary/5' : 'border-gray-800 text-gray-700'}`}>
                                            <Activity size={24} className={isMonitored?.active ? 'animate-pulse' : ''} />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-3">
                                                <span className="font-display text-xl font-bold text-white uppercase tracking-wide group-hover:text-secondary transition-colors">
                                                    {repo.name}
                                                </span>
                                                {repo.private && (
                                                    <span className="text-[10px] bg-accent/10 border border-accent/30 text-accent px-1.5 py-0.5 font-bold uppercase tracking-tighter shadow-neon-red">PRIVATE</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 font-mono text-[10px] text-gray-600 lowercase">
                                                <span>{repo.full_name}</span>
                                                {isMonitored && (
                                                    <span className="flex items-center gap-1 uppercase tracking-tighter">
                                                        <Clock size={10} /> SINCE {new Date(isMonitored.createdAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto justify-end">
                                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-700 hover:text-primary transition-colors cursor-pointer">
                                            <ExternalLink size={18} />
                                        </a>

                                        {isMonitored ? (
                                            <button
                                                onClick={() => handleToggle(isMonitored.id, isMonitored.active)}
                                                className={`flex items-center gap-2 px-4 py-2 border font-bold uppercase text-[10px] tracking-widest transition-all ${isMonitored.active ? 'border-secondary text-secondary hover:bg-secondary hover:text-black' : 'border-gray-800 text-gray-600 hover:border-gray-600'}`}
                                            >
                                                {isMonitored.active ? <Power size={14} /> : <PowerOff size={14} />}
                                                {isMonitored.active ? t("cyberwatch.active") : t("cyberwatch.suspended")}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleEnroll(repo)}
                                                disabled={isEnrolling === repo.full_name}
                                                className="px-6 py-2 bg-transparent border border-gray-700 text-gray-500 hover:border-secondary hover:text-secondary font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
                                            >
                                                {isEnrolling === repo.full_name ? <Loader2 className="animate-spin" size={14} /> : <Shield size={14} />}
                                                {t("cyberwatch.init")}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
}
