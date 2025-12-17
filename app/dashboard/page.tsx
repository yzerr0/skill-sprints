import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/auth';

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/signin");
    }
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 text-black">
            <h1 className="text-3xl">Welcome to your Dashboard, {session.user.email}!</h1>
        </div>
    );
}