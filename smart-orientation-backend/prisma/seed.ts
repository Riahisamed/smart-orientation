import { PrismaClient, BacType } from "@prisma/client"
import guide from "./guide.json"

const prisma = new PrismaClient()

function normalizeBacLabel(value: string): string {
  return value
    .toString()
    .normalize("NFKC")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\s._\-/]+/g, "")
}

function mapBacType(text: string): BacType | null {
  const normalized = normalizeBacLabel(text)

  if (!normalized) return null

  const aliases: Record<BacType, string[]> = {
    MATH: ["MATH", "MATHS", "MATHEMATIQUE", "MATHEMATIQUES", "SCIENCESMATHEMATIQUES", "رياضيات", "رياض"],
    SVT: ["SVT", "SCIENCESEXPERIMENTALES", "SCIENCEEXPERIMENTALE", "SCEXP", "علومتجريبية"],
    ECO: ["ECO", "ECONOMIE", "ECONOMIEGESTION", "ECOGESTION", "اقتصادوتصرف", "اقتصاد"],
    TECH: ["TECH", "TECHNIQUE", "العلومالتقنية", "تقنية"],
    INFO: ["INFO", "INFORMATIQUE", "علومالاعلامية", "اعلامية"],
    LETTRES: ["LETTRES", "LITTERAIRE", "LITTERATURE", "اداب", "الاداب", "آداب"],
    SPORT: ["SPORT", "رياضة"]
  }

  for (const [bacType, values] of Object.entries(aliases) as [BacType, string[]][]) {
    if (values.some(v => normalizeBacLabel(v) === normalized)) {
      return bacType
    }
  }

  return null
}

async function main() {

  for (const item of guide) {

    const filiere = await prisma.filiere.upsert({
      where: { code: item.code },
      update: {},
      create: {
        code: item.code,
        program: item.program,
        institution: item.institution,
        formula: item.formula
      }
    })

    // 🧹 نحذف القديم
    await prisma.filiereScore.deleteMany({
      where: { filiereId: filiere.id }
    })

    await prisma.filiereBac.deleteMany({
      where: { filiereId: filiere.id }
    })

    const scoreByType = new Map<BacType, number | null>()

    for (const bac of item.bacTypes) {

      const type = mapBacType(bac.type)

      if (!type) continue

      await prisma.filiereBac.create({
        data: {
          type,
          capacity: bac.capacity,
          lastScore: bac.lastScore,
          filiereId: filiere.id
        }
      })

      const current = scoreByType.get(type)
      const next = typeof bac.lastScore === 'number' ? bac.lastScore : null

      if (!scoreByType.has(type) || current == null) {
        scoreByType.set(type, next)
      }
    }

    for (const [bacType, lastScore] of scoreByType.entries()) {
      await prisma.filiereScore.create({
        data: {
          filiereId: filiere.id,
          bacType,
          lastScore
        }
      })
    }
  }

  console.log("✅ Guide imported correctly")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())