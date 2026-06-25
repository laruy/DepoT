// src/app/workspaces/new/page.tsx
import { createWorkspace } from "./actions";

export default function NewWorkspacePage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <form
                action={createWorkspace}
                className="bg-neutral-800 rounded-lg p-6 max-w-md w-full space-y-4"
            >
            <h1 className="text-white text-xl text-center">Criar workspace</h1>

            <div>
                <label className="text-gray-300 text-sm block mb-1">Nome</label>
                <input
                    name="name"
                    required
                    className="w-full rounded bg-neutral-900 text-white p-2"
                />
            </div>

            <div>
                <label className="text-gray-300 text-sm block mb-1">
                    Descrição (opcional)
                </label>
                <textarea
                    name="description"
                    className="w-full rounded bg-neutral-900 text-white p-2"
                />
            </div>

            <button
                type="submit"
                className="w-full bg-white text-black rounded p-2 font-medium"
            >
                Criar
            </button>
            </form>
        </div>
    );
}