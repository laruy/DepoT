import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";

export const fraunces = Fraunces({
    subsets: ["latin"],
    variable: "--font-display",
    weight: ["400", "500", "600"],
    style: ["normal", "italic"],
});

export const inter = Inter({
    subsets: ["latin"],
    variable: "--font-body",
    weight: ["400", "500", "600"],
});

export const plexMono = IBM_Plex_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    weight: ["400", "500"],
});