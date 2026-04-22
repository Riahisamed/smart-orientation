/*
  Warnings:

  - The primary key for the `_FiliereSkills` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_StudentSkills` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_FiliereSkills` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_StudentSkills` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_FiliereSkills" DROP CONSTRAINT "_FiliereSkills_AB_pkey";

-- AlterTable
ALTER TABLE "_StudentSkills" DROP CONSTRAINT "_StudentSkills_AB_pkey";

-- CreateTable
CREATE TABLE "FiliereScore" (
    "id" SERIAL NOT NULL,
    "bacType" "BacType" NOT NULL,
    "lastScore" DOUBLE PRECISION,
    "filiereId" INTEGER NOT NULL,

    CONSTRAINT "FiliereScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FiliereScore_filiereId_bacType_key" ON "FiliereScore"("filiereId", "bacType");

-- CreateIndex
CREATE UNIQUE INDEX "_FiliereSkills_AB_unique" ON "_FiliereSkills"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_StudentSkills_AB_unique" ON "_StudentSkills"("A", "B");

-- AddForeignKey
ALTER TABLE "FiliereScore" ADD CONSTRAINT "FiliereScore_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "Filiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
