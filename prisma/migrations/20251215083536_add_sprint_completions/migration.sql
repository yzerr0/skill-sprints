-- CreateTable
CREATE TABLE "SprintDay" (
    "id" TEXT NOT NULL,
    "skillPlanId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "estimatedMins" INTEGER NOT NULL,
    "instructions" JSONB NOT NULL,
    "reflectionQuestion" TEXT NOT NULL,

    CONSTRAINT "SprintDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SprintCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sprintDayId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER,
    "notes" TEXT,

    CONSTRAINT "SprintCompletion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SprintDay" ADD CONSTRAINT "SprintDay_skillPlanId_fkey" FOREIGN KEY ("skillPlanId") REFERENCES "SkillPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SprintCompletion" ADD CONSTRAINT "SprintCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SprintCompletion" ADD CONSTRAINT "SprintCompletion_sprintDayId_fkey" FOREIGN KEY ("sprintDayId") REFERENCES "SprintDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
