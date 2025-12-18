import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generatePlan } from "@/lib/planChain";
import { llmRatelimit } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/ip";


export async function POST(req: NextRequest) {
    const session = await NextAuth(authOptions).getSession({ req });
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const key = session.user.id ? `user:${session.user.id}` : `ip:${getClientIp(req)}`;
    const limit = await llmRatelimit.limit(key);
    if (!limit.success) {
        return NextResponse.json(
            { error: "Rate limit exceeded, please try again later." }, 
            { status: 429 }
        );
    }

    const body = await req.json();
    const skillName = String(body.skillName);
    const level = String(body.level);
    const dailyMinutes = Number(body.dailyMinutes);
    const totalDays = Number(body.totalDays);

    if(!skillName) {
        return NextResponse.json({ error: "Skill name is required" }, { status: 400 });
    }
    if(!Number.isFinite(dailyMinutes) || dailyMinutes < 5 || dailyMinutes > 240) {
        return NextResponse.json({ error: "Daily minutes out of range" }, { status: 400 });
    }
    if(!Number.isFinite(totalDays) || totalDays < 1) {
        return NextResponse.json({ error: "Total days out of range" }, { status: 400 });
    }

    const retrievedContext = "";

    let planJson;
    try {
        planJson = await generatePlan({
            skillName,
            level,
            dailyMinutes,
            totalDays,
            retrievedContext,
        });
    }
    catch (error) {
        console.error("Error generating plan:", error);
        return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
    }

    const created = await prisma.$transaction(async (tx) => {
        const plan = await tx.skillPlan.create({
            data: {
                userId: session.user.id as string,
                skillName,
                description: planJson.overview,
                level,
                dailyMinutes,
                totalDays,
                planRaw: planJson,
            },
        });

        await tx.sprintDay.createMany({
            data: planJson.days.map((d) => ({
                skillPlanId: plan.id,
                dayNumber: d.day,
                title: d.title,
                estimatedMins: d.estimatedMins,
                instructions: d.instructions,
                reflectionQuestion: d.reflectionQuestion,
            })),
        });

        return plan;
    });

    return NextResponse.json({ planId: created.id });
}