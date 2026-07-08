"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface WorkspaceSidebarProps {
    workspace: { id: string; name: string };
}

const NAV_ITEMS = [
    { label: "Features", path: "" },
    { label: "Test Plans", path: "/test-plans" },
];

export default function WorkspaceSidebar({ workspace }: WorkspaceSidebarProps) {
    const pathname = usePathname();
    const base = `/workspaces/${workspace.id}`;

    function isActive(path: string) {
        const full = `${base}${path}`;
        if (path === "") {
            // features: ativo em /workspaces/[id] e /workspaces/[id]/features/*
            return pathname === full || pathname.startsWith(`${full}/features`);
        }
        return pathname.startsWith(full);
    }

    return (
        <aside className="flex w-52 shrink-0 flex-col border-r border-[var(--rule)] bg-[var(--bg-panel)]">
            <div className="border-b border-[var(--rule)] px-4 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Workspace
                </p>
                <p className="font-display mt-1 truncate text-sm text-[var(--text-primary)]">
                    {workspace.name}
                </p>
            </div>

            <nav className="flex-1 px-2 py-3">
                <ul className="space-y-0.5">
                    {NAV_ITEMS.map(({ label, path }) => (
                        <li key={path}>
                            <Link
                                href={`${base}${path}`}
                                className={`font-mono flex items-center rounded-sm px-3 py-2 text-xs uppercase tracking-[0.1em] transition-colors ${
                                    isActive(path)
                                        ? "bg-[var(--red-deep)]/20 text-[var(--red-signal)]"
                                        : "text-[var(--text-muted)] hover:bg-[var(--rule)]/30 hover:text-[var(--text-primary)]"
                                }`}
                            >
                                {label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="border-t border-[var(--rule)] px-2 py-3">
                <Link
                    href="/dashboard"
                    className="font-mono flex items-center gap-2 rounded-sm px-3 py-2 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--red-signal)]"
                >
                    ← todos os workspaces
                </Link>
            </div>
        </aside>
    );
}