"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface Workspace {
    id: string;
    name: string;
    }

export default function WorkspacesDropdown({ workspaces }: { workspaces: Workspace[] }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    useEffect(() => { setIsOpen(false); }, [pathname]);

    return (
        <div ref={ref} className="relative">
        <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className={`font-mono flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs uppercase tracking-[0.1em] transition-colors ${
            pathname.startsWith("/workspaces")
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
        >
            Workspaces
            <span
            className="text-[10px] transition-transform duration-150"
            style={{ display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            >
            ▾
            </span>
        </button>

        {isOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] shadow-lg">
            {workspaces.length === 0 ? (
                <p className="font-mono px-4 py-3 text-xs text-[var(--text-muted)]">
                Nenhum workspace ainda.
                </p>
            ) : (
                <ul>
                {workspaces.map((ws) => (
                    <li key={ws.id}>
                    <Link
                        href={`/workspaces/${ws.id}`}
                        className={`font-body block truncate border-b border-[var(--rule)] px-4 py-2.5 text-sm transition-colors last:border-0 ${
                        pathname.startsWith(`/workspaces/${ws.id}`)
                            ? "text-[var(--red-signal)]"
                            : "text-[var(--text-primary)] hover:text-[var(--red-signal)]"
                        }`}
                    >
                        {ws.name}
                    </Link>
                    </li>
                ))}
                </ul>
            )}

            <div className="border-t border-[var(--rule)]">
                <Link
                href="/dashboard"
                className="font-mono block px-4 py-2.5 text-xs uppercase tracking-[0.1em] text-[var(--text-muted)] hover:text-[var(--red-signal)]"
                >
                + novo workspace
                </Link>
            </div>
            </div>
        )}
        </div>
    );
}