import { supabase } from "@/lib/supabase";
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, Book, Shield, Activity, Share2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function Navbar() {
    const [user, setUser] = useState<User | null>(null);
    const { language, setLanguage, t } = useLanguage();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setUser(session?.user ?? null);
        });

        const fetchUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (data?.user) setUser(data.user);
        };
        fetchUser();

        return () => subscription.unsubscribe();
    }, []);

    return (
        <nav className="border-b border-gray-800 bg-surface-dark/90 backdrop-blur-md sticky top-0 z-50 shadow-[0_1px_15px_rgba(0,0,0,0.8)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer group" onClick={() => window.location.href = "/"}>
                            <span className="material-symbols-outlined text-primary text-4xl group-hover:animate-pulse">security</span>
                            <div className="flex flex-col">
                                <span className="font-display font-bold text-2xl tracking-wider text-white uppercase group-hover:text-glow transition-all">ShipSafe</span>
                                <span className="text-[10px] text-primary tracking-[0.2em] uppercase leading-none">System Secure</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 font-mono border border-gray-800 px-3 py-1 rounded bg-black/50">
                            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                            <span>{t("navbar.status")}</span>
                        </div>

                        {/* Neural Frequency Selector (Language Switcher) */}
                        <div className="flex items-center gap-1 border border-gray-800 bg-black/30 p-1">
                            {(["en", "pt", "es"] as const).map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => setLanguage(lang)}
                                    className={`px-2 py-0.5 text-[9px] font-mono font-bold transition-all ${language === lang
                                        ? "bg-primary text-black"
                                        : "text-gray-500 hover:text-primary"
                                        }`}
                                >
                                    {lang.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <Link href="/history" className="text-gray-400 hover:text-primary transition-colors uppercase tracking-widest text-xs font-bold">{t("navbar.history")}</Link>
                        <Link href="/cyberwatch" className="text-gray-400 hover:text-primary transition-colors uppercase tracking-widest text-xs font-bold font-mono">[ {t("navbar.cyberwatch")} ]</Link>
                        <Link href="/wiki" className="text-gray-400 hover:text-primary transition-colors uppercase tracking-widest text-xs font-bold font-mono">{t("navbar.wiki")}</Link>

                        {user && (
                            <div className="relative group flex items-center">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-full opacity-50 blur group-hover:opacity-100 transition duration-200"></div>
                                <img
                                    alt="User avatar"
                                    className="relative h-9 w-9 rounded-full ring-2 ring-black bg-black object-cover cursor-pointer"
                                    src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`}
                                    onClick={() => supabase.auth.signOut()}
                                    title="Sign out"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
