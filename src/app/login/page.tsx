import { SignIn } from "@/src/Components/auth-components";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

    const Page = async () => {
    const session = await auth();
    if (session) redirect("/dashboard");

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-neutral-800 rounded-lg p-6 max-w-xl w-full">
            <h1 className="text-white text-xl mb-4 text-center">QA Hub</h1>
            <div className="text-center">
            <SignIn provider="Google" />
            </div>
        </div>
        </div>
    );
};

export default Page;