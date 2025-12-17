import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { comparePassword, hashPassword } from "@/lib/auth";
import crypto from "crypto";
import type { User as PrismaUser } from "@/app/generated/prisma/client";

export const authOptions: NextAuthOptions = {
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });
                if (!user) return null;

                const isValid = await comparePassword(
                    credentials.password,
                    user.passwordHash
                );
                if (!isValid) return null;

                // Return session.user in JWT `user` field
                return { id: user.id, email: user.email };
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: "jwt",
    },
    secret: process.env.AUTH_SECRET,
    callbacks: {
        async jwt({ token, user, account }) {
            if (user && account?.provider === "credentials"){
                token.userId = user.id;
            }
            if (account?.provider === "google") {
                const email = token.email;
                if (email) {
                    let dbUser = await prisma.user.findUnique({
                        where: { email },
                    });
                    if (!dbUser) {
                        const randomPassword = crypto.randomBytes(32).toString("hex");
                        const passwordHash = await hashPassword(randomPassword);

                        dbUser = await prisma.user.create({
                            data: {
                                email,
                                passwordHash,
                            },
                        });
                    }
                    token.userId = dbUser.id;
                }
            }
            return token;
        },
        async session({ session, token }) {
            
            if(session.user && token.userId){
                (session.user as PrismaUser).id = token.userId as string;
            }
            return session;
        },
    },
};