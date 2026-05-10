-- CreateTable
CREATE TABLE "OrientationTest" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "interests" TEXT,
    "skills" JSONB,
    "dominantDomains" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrientationTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationReport" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "orientationTestId" INTEGER,
    "summary" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSignal" (
    "id" SERIAL NOT NULL,
    "domain" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "demand" TEXT,
    "unemploymentRate" DOUBLE PRECISION,
    "source" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationReport_orientationTestId_key" ON "RecommendationReport"("orientationTestId");

-- AddForeignKey
ALTER TABLE "OrientationTest" ADD CONSTRAINT "OrientationTest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationReport" ADD CONSTRAINT "RecommendationReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationReport" ADD CONSTRAINT "RecommendationReport_orientationTestId_fkey" FOREIGN KEY ("orientationTestId") REFERENCES "OrientationTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
