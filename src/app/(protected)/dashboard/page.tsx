// src/app/dashboard/page.tsx
import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardEntry() {
    const session = await auth();
    if (!session?.user?.email || !session.user.id) redirect("/login");

    const [pendingInvites, memberships] = await Promise.all([
        prisma.invite.findMany({
        where: { email: session.user.email, status: "PENDING" },
        include: { workspace: true },
        }),
        prisma.membership.findMany({
        where: { userId: session.user.id },
        include: { workspace: true },
        }),
    ]);

    if (pendingInvites.length > 0) redirect("/invites");
    if (memberships.length === 0) redirect("/workspaces/new");
    if (memberships.length === 1) redirect(`/workspaces/${memberships[0].workspaceId}`);
    redirect("/workspaces");
}