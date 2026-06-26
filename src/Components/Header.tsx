import { auth } from "@/auth";
import { SignOut } from "@/src/Components/auth-components";

export async function Header() {
    const session = await auth();

    return (
        <header className="flex items-center justify-between border-b border-[var(--rule)] bg-[var(--bg)] px-6 py-4">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--red-signal)]">
            DepoT
        </span>

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