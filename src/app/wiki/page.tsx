"use client";

import { Navbar } from "@/components/Navbar";
import { Book, Search, ShieldAlert, Cpu, Database, Binary, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const VULNERABILITIES = [
    {
        slug: "hardcoded-secrets",
        title: "Hardcoded Secrets",
        category: "Credential Management",
        severity: "CRITICAL",
        icon: <Zap size={20} />,
        shortDesc: "API keys, tokens, or passwords stored directly in the source code."
    },
    {
        slug: "sql-injection",
        title: "SQL Injection",
        category: "Data Integrity",
        severity: "HIGH",
        icon: <Database size={20} />,
        shortDesc: "Vulnerabilities allowing attackers to interfere with database queries."
    },
    {
        slug: "excessive-permissions",
        title: "Excessive Permissions",
        category: "Access Control",
        severity: "MEDIUM",
        icon: <ShieldAlert size={20} />,
        shortDesc: "Users or services having more access than required for their tasks."
    },
    {
        slug: "unencrypted-traffic",
        title: "Unencrypted Traffic",
        category: "Network Security",
        severity: "HIGH",
        icon: <Binary size={20} />,
        shortDesc: "Data transmitted without encryption (HTTP vs HTTPS)."
    },
    {
        slug: "dependency-vulnerabilities",
        title: "Vulnerable Dependencies",
        category: "Supply Chain",
        severity: "HIGH",
        icon: <Cpu size={20} />,
        shortDesc: "Using libraries with known security flaws (CVEs)."
    }
];

export default function WikiPage() {
    const { t } = useLanguage();
    const [search, setSearch] = useState("");

    const filtered = VULNERABILITIES.filter(v =>
        v.title.toLowerCase().includes(search.toLowerCase()) ||
        v.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-grow container max-w-6xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-gray-800 pb-10 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold text-primary border border-primary/30 px-2 py-0.5 bg-primary/10 tracking-[0.3em] uppercase">{t("wiki.subtitle")}</span>
                        </div>
                        <h1 className="font-display text-5xl font-bold text-white tracking-wide uppercase">{t("wiki.title")}</h1>
                        <p className="mt-2 text-gray-500 font-mono text-sm max-w-xl">
                            {t("wiki.desc")}
                        </p>
                    </div>

                    <div className="w-full md:w-96">
                        <div className="glass flex items-center gap-3 px-4 py-2 group focus-within:border-primary/50 transition-colors">
                            <Search size={20} className="text-gray-600 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder={t("wiki.query")}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-transparent border-none text-white outline-none w-full font-mono text-sm placeholder:text-gray-700"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((v, idx) => (
                        <Link
                            key={v.slug}
                            href={`/wiki/${v.slug}`}
                            className="glass group p-6 hover:border-primary/50 transition-all relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
                                <Book size={48} className="text-gray-800 group-hover:text-primary transition-colors" />
                            </div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2 border ${v.severity === 'CRITICAL' ? 'border-accent text-accent bg-accent/5' :
                                        v.severity === 'HIGH' ? 'border-accent/50 text-accent/80' : 'border-primary/50 text-primary'
                                        }`}>
                                        {v.icon}
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">{v.category}</span>
                                        <h3 className="font-display text-xl font-bold text-white uppercase group-hover:text-primary transition-colors">{v.title}</h3>
                                    </div>
                                </div>

                                <p className="text-gray-500 font-mono text-xs leading-relaxed mb-8 flex-grow">
                                    {v.shortDesc}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-800/50 group-hover:border-primary/20 transition-colors">
                                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${v.severity === 'CRITICAL' ? 'text-accent' :
                                        v.severity === 'HIGH' ? 'text-accent/80' : 'text-primary'
                                        }`}>
                                        {t("wiki.severity")}: {v.severity}
                                    </span>
                                    <ChevronRight size={16} className="text-gray-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-20 glass p-8 border-primary/20 bg-primary/[0.02] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div className="max-w-2xl">
                            <h2 className="text-xs font-bold text-primary uppercase tracking-[0.5em] mb-2">{t("wiki.contribute_title")}</h2>
                            <p className="text-sm font-mono text-gray-400 leading-relaxed uppercase">
                                {t("wiki.contribute_desc")}
                            </p>
                        </div>
                        <button className="px-8 py-3 glass border-primary/30 text-primary font-bold uppercase tracking-widest text-xs hover:bg-primary/10 transition-all">
                            {t("wiki.submit_entry")}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
