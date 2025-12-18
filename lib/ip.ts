import { NextRequest } from "next/server";

// Function to get client IP address from request headers
export function getClientIp(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    return ip;
}