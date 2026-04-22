/*
  Warnings:

  - You are about to drop the `_FiliereToSkill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SkillToStudent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_FiliereToSkill" DROP CONSTRAINT "_FiliereToSkill_A_fkey";

-- DropForeignKey
ALTER TABLE "_FiliereToSkill" DROP CONSTRAINT "_FiliereToSkill_B_fkey";

-- DropForeignKey
ALTER TABLE "_SkillToStudent" DROP CONSTRAINT "_SkillToStudent_A_fkey";

-- DropForeignKey
ALTER TABLE "_SkillToStudent" DROP CONSTRAINT "_SkillToStudent_B_fkey";

-- DropIndex
DROP INDEX "Filiere_name_key";

-- AlterTable
ALTER TABLE "Filiere" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "demandScore" DROP NOT NULL,
ALTER COLUMN "demandScore" SET DATA TYPE DOUBLE PRECISION;

-- DropTable
DROP TABLE "_FiliereToSkill";

-- DropTable
DROP TABLE "_SkillToStudent";

-- CreateTable
CREATE TABLE "_StudentSkills" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_StudentSkills_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FiliereSkills" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_FiliereSkills_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_StudentSkills_B_index" ON "_StudentSkills"("B");

-- CreateIndex
CREATE INDEX "_FiliereSkills_B_index" ON "_FiliereSkills"("B");

-- AddForeignKey
ALTER TABLE "_StudentSkills" ADD CONSTRAINT "_StudentSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentSkills" ADD CONSTRAINT "_StudentSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FiliereSkills" ADD CONSTRAINT "_FiliereSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "Filiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FiliereSkills" ADD CONSTRAINT "_FiliereSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
