import { PrismaClient, BacType } from "@prisma/client"
import guide from "../data/guide.json"

const prisma = new PrismaClient()

const bacMap: Record<string, BacType> = {
  "ﺁﺩﺍﺏ": BacType.LETTRES,
  "ﺭﻳﺎﺿﻴﺎﺕ": BacType.MATH,
  "ﻋﻠﻮﻡ ﺗﺠﺮﻳﺒﻴﺔ": BacType.SVT,
  "ﺇﻗﺘﺼﺎﺩ ﻭﺗﺼﺮﻑ": BacType.ECO,
  "ﻋﻠﻮﻡ ﺍﻹﻋﻼﻣﻴﺔ": BacType.INFO,
  "ﺍﻟﻌﻠﻮﻡ ﺍﻟﺘﻘﻨﻴﺔ": BacType.TECH,
  "ﺭﻳﺎﺿﺔ": BacType.SPORT
}

async function main() {

  console.log("Importing guide...")

  for (const f of guide as any[]) {

    const filiere = await prisma.filiere.upsert({
      where: { code: f.code },
      update: {
        program: f.program,
        institution: f.institution,
        formula: f.formula,
        gov: f.gov || null
      },
      create: {
        code: f.code,
        program: f.program,
        institution: f.institution,
        formula: f.formula,
        gov: f.gov || null
      }
    })

    await prisma.filiereBac.deleteMany({
      where: { filiereId: filiere.id }
    })

    await prisma.filiereScore.deleteMany({
      where: { filiereId: filiere.id }
    })

    const scoreByType = new Map<BacType, number | null>()

    for (const b of f.bacTypes) {

      const mappedType = bacMap[b.type]
      if (!mappedType) continue

      await prisma.filiereBac.create({
        data: {
          type: mappedType,
          capacity: b.capacity,
          lastScore: b.lastScore,
          filiereId: filiere.id
        }
      })

      const existing = scoreByType.get(mappedType)
      const next = typeof b.lastScore === "number" ? b.lastScore : null

      if (!scoreByType.has(mappedType) || existing == null) {
        scoreByType.set(mappedType, next)
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

  console.log("Guide imported successfully ✅")

}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })