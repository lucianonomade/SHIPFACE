"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Github, ShieldCheck, Zap, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Navbar } from "@/components/Navbar";

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: window.location.origin + "/repos",
        scopes: "read:user user:email repo"
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow container max-w-6xl mx-auto px-4 py-20 flex flex-col items-center text-center">
        <div className="mb-6 flex items-center gap-2">
          <span className="text-xs font-bold text-primary border border-primary/30 px-3 py-1 bg-primary/10 tracking-[0.3em] uppercase animate-pulse">
            System Online
          </span>
        </div>

        <h1 className="font-display text-6xl md:text-8xl font-bold text-white tracking-tighter uppercase mb-6 text-glow">
          Ship fast.<br />
          <span className="text-primary italic">Ship safe.</span>
        </h1>

        <p className="max-w-2xl text-gray-400 font-mono text-lg mb-12 leading-relaxed">
          The elite security scanner for modern developers.
          Identify critical vulnerabilities and exposed secrets before they reach production.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 mb-20">
          {user ? (
            <Link href="/repos" className="group relative px-8 py-3 bg-primary text-black font-bold uppercase tracking-widest transition-all hover:bg-white overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                Enter Control Panel <Zap size={18} />
              </span>
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </Link>
          ) : (
            <button onClick={handleLogin} className="group relative px-8 py-3 bg-transparent border-2 border-primary text-primary font-bold uppercase tracking-widest transition-all hover:text-black hover:shadow-neon overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                Initiate Authentication <Github size={18} />
              </span>
              <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
          )}
        </div>

        <section className="grid md:grid-cols-3 gap-8 w-full">
          <div className="glass p-8 text-left group hover:border-primary/50 transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
              <Lock size={80} />
            </div>
            <Lock className="text-primary mb-6" size={32} />
            <h3 className="font-display text-2xl font-bold text-white uppercase mb-4 tracking-wider">Secret Detection</h3>
            <p className="text-gray-500 font-mono text-sm leading-relaxed">We intercept API keys, private tokens, and environment leaks before they become liabilities.</p>
          </div>

          <div className="glass p-8 text-left group hover:border-secondary/50 transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
              <ShieldCheck size={80} />
            </div>
            <ShieldCheck className="text-secondary mb-6" size={32} />
            <h3 className="font-display text-2xl font-bold text-white uppercase mb-4 tracking-wider">Auth Integrity</h3>
            <p className="text-gray-500 font-mono text-sm leading-relaxed">Instant verification of JWT policies, session handling, and OAuth flow vulnerabilities.</p>
          </div>

          <div className="glass p-8 text-left group hover:border-accent/50 transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
              <Zap size={80} />
            </div>
            <Zap className="text-accent mb-6" size={32} />
            <h3 className="font-display text-2xl font-bold text-white uppercase mb-4 tracking-wider">Dev-to-Dev</h3>
            <p className="text-gray-500 font-mono text-sm leading-relaxed">Direct, actionable intelligence without the enterprise noise. Built by devs, for devs.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-800 bg-surface-dark py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-gray-600">security</span>
            <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">
              © {new Date().getFullYear()} ShipSafe. Processed in-memory, never stored.
            </span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-xs font-mono text-gray-600 hover:text-primary transition-colors">[ DOCS ]</a>
            <a href="#" className="text-xs font-mono text-gray-600 hover:text-primary transition-colors">[ STATUS ]</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
