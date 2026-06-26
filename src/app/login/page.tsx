import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginVisual } from "@/src/Components/login/LoginVisual";
import { SignInCard } from "@/src/Components/login/SignInCard";

const Page = async () => {
    const session = await auth();
    if (session) redirect("/dashboard");

    return (
        <div className="grid min-h-screen bg-[var(--bg)] lg:grid-cols-[1fr_440px]">
        <LoginVisual />
        <div className="flex items-center justify-center border-t border-[var(--rule)] p-6 lg:border-t-0 lg:border-l">
            <SignInCard />
        </div>
        </div>
    );
};

export default Page;