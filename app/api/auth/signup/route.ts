import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if(!email || !password || password.length < 8){
            return NextResponse.json(
                { error: "Email and password (min 8 characters) are required." },
                { status: 400 }
            )
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if(existingUser){
            return NextResponse.json(
                { error: "User with this email already exists." },
                { status: 400 }
            )
        }

        const passwordHash = await hashPassword(password);

        await prisma.user.create({
            data: {
                email,
                passwordHash,
            },
        });

        return NextResponse.json({ succsess: true }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}