import "dotenv/config";
import { generatePlan } from "../lib/planChain";

async function main() {
    const plan = await generatePlan({
        skillName: "Spanish Language Learning",
        level: "Beginner",
        dailyMinutes: 30,
        totalDays: 7,
    });

    console.log(JSON.stringify(plan, null, 2));
}

main().catch((err) => {
    console.error("Error generating plan:", err);
    process.exit(1);
});