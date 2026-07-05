import { auth } from "@/auth";
import { SignOut } from "@/src/Components/auth-components";
import prisma from "@/src/lib/prisma";
import Link from "next/link";
import WorkspacesDropdown from "./WorkspacesDropdown";

export async function Header() {
    const session = await auth();

    const workspaces = session?.user?.id
        ? await prisma.membership.findMany({
            where: { userId: session.user.id },
            include: { workspace: true },
            orderBy: { joinedAt: "desc" },
        }).then((ms) => ms.map((m) => ({ id: m.workspaceId, name: m.workspace.name })))
        : [];

    return (
        <header className="flex items-center justify-between border-b border-[var(--rule)] bg-[var(--bg)] px-6 py-3">
            
            <Link
                href="/dashboard"
                className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--red-signal)] hover:opacity-70 transition-opacity"
            >
                DepoT
            </Link>

            <nav className="flex items-center gap-1">

                <WorkspacesDropdown workspaces={workspaces} />

                <span className="font-mono cursor-not-allowed rounded-sm px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]/40">
                    Test Plans
                </span>
            </nav>

            <div className="flex items-center gap-4">
                {session?.user?.email && (
                    <span className="font-body text-sm text-[var(--text-muted)]">
                        {session.user.email}
                    </span>
                )}
                <SignOut />
            </div>
        </header>
    );
}