import { SignIn } from "@/src/Components/auth-components";

export function SignInCard() {
    return (
        <div className="w-full max-w-sm rounded-sm border border-[var(--rule)] bg-[var(--card)] p-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--red-signal)]">
            DepoT
        </p>

        <h2 className="font-display mt-3 text-2xl text-[var(--text-primary)]">
            Entrar para continuar
        </h2>

        <p className="font-body mt-2 text-sm text-[var(--text-muted)]">
            Acesso restrito a workspaces convidados.
        </p>

        <div className="mt-8">
            <SignIn provider="google" />
        </div>
        </div>
    );
}