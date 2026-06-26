import { signIn, signOut } from "@/auth";

export function SignIn({ provider }: { provider?: string }) {
    return (
        <form
        action={async () => {
            "use server";
            await signIn(provider);
        }}
        >
        <button
            className="font-body flex w-full items-center justify-center gap-3 rounded-sm border border-[var(--rule)] bg-transparent p-3 text-sm text-[var(--text-primary)] transition-colors hover:border-[var(--red-signal)] hover:bg-[var(--red-deep)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--red-signal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]"
        >
            <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#fff" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
            <path fill="#fff" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.85.87-3.06.87-2.36 0-4.36-1.6-5.07-3.74H.86v2.34A9 9 0 0 0 9 18z" />
            <path fill="#fff" d="M3.93 10.69A5.4 5.4 0 0 1 3.64 9c0-.59.1-1.16.29-1.69V4.97H.86A9 9 0 0 0 0 9c0 1.45.35 2.83.86 4.03l3.07-2.34z" />
            <path fill="#fff" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.59 8.59 0 0 0 9 0 9 9 0 0 0 .86 4.97l3.07 2.34C4.64 5.18 6.64 3.58 9 3.58z" />
            </svg>
            Entrar com {provider}
        </button>
        </form>
    );
    }

export function SignOut() {
    return (
        <form
        action={async () => {
            "use server";
            await signOut();
        }}
        >
        <button className="font-body rounded-sm border border-[var(--rule)] bg-transparent px-3 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:border-[var(--red-signal)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--red-signal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]">
            Sair
        </button>
        </form>
    );
}