/*
  Warnings:

  - You are about to drop the column `demandScore` on the `Filiere` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Filiere` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Filiere` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Filiere` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Filiere` table without a default value. This is not possible if the table is not empty.
  - Added the required column `formula` to the `Filiere` table without a default value. This is not possible if the table is not empty.
  - Added the required column `institution` to the `Filiere` table without a default value. This is not possible if the table is not empty.
  - Added the required column `program` to the `Filiere` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bacType` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `english` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `french` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BacType" AS ENUM ('MATH', 'SVT', 'INFO', 'ECO', 'TECH', 'LETTRES', 'SPORT');

-- AlterTable
ALTER TABLE "Filiere" DROP COLUMN "demandScore",
DROP COLUMN "description",
DROP COLUMN "name",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "formula" TEXT NOT NULL,
ADD COLUMN     "gov" TEXT,
ADD COLUMN     "institution" TEXT NOT NULL,
ADD COLUMN     "program" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "FG" DOUBLE PRECISION,
ADD COLUMN     "algo" DOUBLE PRECISION,
ADD COLUMN     "arabic" DOUBLE PRECISION,
ADD COLUMN     "bacType" "BacType" NOT NULL,
ADD COLUMN     "bioSport" DOUBLE PRECISION,
ADD COLUMN     "economy" DOUBLE PRECISION,
ADD COLUMN     "english" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "french" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "german" DOUBLE PRECISION,
ADD COLUMN     "gestion" DOUBLE PRECISION,
ADD COLUMN     "gov" TEXT,
ADD COLUMN     "historyGeo" DOUBLE PRECISION,
ADD COLUMN     "italian" DOUBLE PRECISION,
ADD COLUMN     "math" DOUBLE PRECISION,
ADD COLUMN     "philosophy" DOUBLE PRECISION,
ADD COLUMN     "physEd" DOUBLE PRECISION,
ADD COLUMN     "physics" DOUBLE PRECISION,
ADD COLUMN     "spSport" DOUBLE PRECISION,
ADD COLUMN     "spanish" DOUBLE PRECISION,
ADD COLUMN     "sti" DOUBLE PRECISION,
ADD COLUMN     "svt" DOUBLE PRECISION,
ADD COLUMN     "tech" DOUBLE PRECISION,
ADD COLUMN     "userId" INTEGER,
ALTER COLUMN "interests" DROP NOT NULL;

-- CreateTable
CREATE TABLE "FiliereBac" (
    "id" SERIAL NOT NULL,
    "type" "BacType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "lastScore" DOUBLE PRECISION,
    "filiereId" INTEGER NOT NULL,

    CONSTRAINT "FiliereBac_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roadmap" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Roadmap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Filiere_code_key" ON "Filiere"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiliereBac" ADD CONSTRAINT "FiliereBac_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "Filiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roadmap" ADD CONSTRAINT "Roadmap_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
