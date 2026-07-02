export function parseSteps(raw: string | null): string[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter((s) => typeof s === "string");
    } catch {
        // não era JSON — assume texto antigo com uma linha por step
    }
    return raw.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function stringifySteps(steps: string[]): string | null {
    const clean = steps.map((s) => s.trim()).filter(Boolean);
    return clean.length > 0 ? JSON.stringify(clean) : null;
}

export function parseTags(raw: string | null): string[] {
    return raw?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
}