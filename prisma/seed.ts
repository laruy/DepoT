import { prisma } from "../../lib/prisma";
import { Role, Priority } from "../../generated/prisma/enums";

async function main() {
    console.log("Seeding...");

    const workspace = await prisma.workspace.create({
        data: {
            name: "Depot QA",
        },
    });

    const admin = await prisma.user.create({
        data: {
            name: "Lais",
            email: "lais@example.com",
            role: Role.ADMIN,
            workspaceId: workspace.id,
        },
    });

    const member = await prisma.user.create({
        data: {
            name: "Isaías",
            email: "isaias@example.com",
            role: Role.MEMBER,
            workspaceId: workspace.id,
        },
    });

    const loginFeature = await prisma.feature.create({
        data: {
        name: "Login",
        description: "Fluxo de autenticação",
        color: "#8B5CF6",
        maestroTags: "login,auth",
        workspaceId: workspace.id,
        },
    });

    const cartFeature = await prisma.feature.create({
        data: {
        name: "Cart",
        description: "Carrinho de compras",
        color: "#10B981",
        maestroTags: "cart,checkout",
        workspaceId: workspace.id,
        },
    });

    await prisma.testCase.createMany({
        data: [
        {
            title: "Login com credenciais válidas",
            description: "Usuário deve conseguir logar",
            steps: "Abrir login\nPreencher email\nPreencher senha\nClicar entrar",
            expectedResult: "Dashboard carregado",
            priority: Priority.HIGH,
            featureId: loginFeature.id,
            createdById: admin.id,
        },
        {
            title: "Login com senha inválida",
            description: "Sistema deve bloquear acesso",
            steps: "Abrir login\nInserir senha errada",
            expectedResult: "Mensagem de erro",
            priority: Priority.HIGH,
            featureId: loginFeature.id,
            createdById: admin.id,
        },
        {
            title: "Adicionar item ao carrinho",
            description: "Item deve aparecer no carrinho",
            steps: "Abrir produto\nClicar adicionar",
            expectedResult: "Carrinho atualizado",
            priority: Priority.MEDIUM,
            featureId: cartFeature.id,
            createdById: member.id,
        },
        ],
    });

    await prisma.automationDoc.create({
        data: {
        featureId: loginFeature.id,
        content: `
    # Automação Login
    - Maestro cobre happy path
    - Validar toast de erro
        `,
        },
    });

    await prisma.invite.create({
        data: {
        token: crypto.randomUUID(),
        email: "newmember@example.com",
        workspaceId: workspace.id,
        invitedById: admin.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    console.log("Seed completed");
    }

    main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
});