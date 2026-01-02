"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations } from "@/lib/translations";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>("pt");

    useEffect(() => {
        const saved = localStorage.getItem("shipsafe_lang") as Language;
        if (saved && (saved === "en" || saved === "pt" || saved === "es")) {
            setLanguageState(saved);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("shipsafe_lang", lang);
    };

    const t = (path: string): string => {
        const keys = path.split(".");
        let current: any = translations[language];

        for (const key of keys) {
            if (current[key] !== undefined) {
                current = current[key];
            } else {
                return path; // Fallback to key path
            }
        }

        return current;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
