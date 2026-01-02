import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#00f0ff", // Cyan neon
                secondary: "#39ff14", // Neon green
                accent: "#ff003c", // Cyberpunk red
                "background-dark": "#050505", // Deepest black
                "surface-dark": "#0a0a0a", // Slightly lighter black
                "border-dark": "#1f2937", // Gray-800
            },
            fontFamily: {
                display: ["Rajdhani", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
            boxShadow: {
                'neon': '0 0 5px #00f0ff, 0 0 20px #00f0ff',
                'neon-red': '0 0 5px #ff003c, 0 0 10px #ff003c',
                'neon-green': '0 0 5px #39ff14, 0 0 10px #39ff14',
            }
        },
    },
    plugins: [],
};
export default config;
