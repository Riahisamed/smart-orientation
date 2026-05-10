import { PrismaClient, BacType } from "@prisma/client"
import guide from "./guide.json"
import * as bcrypt from "bcrypt"

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

  const demoPassword = await bcrypt.hash("Demo1234!", 10)
  const adminPassword = await bcrypt.hash("Admin1234!", 10)
  await prisma.user.upsert({
    where: { email: "demo.admin@smart-orientation.local" },
    update: {
      password: adminPassword,
      role: "ADMIN",
    },
    create: {
      email: "demo.admin@smart-orientation.local",
      password: adminPassword,
      role: "ADMIN",
    },
  })

  const demoUser = await prisma.user.upsert({
    where: { email: "demo.student@smart-orientation.local" },
    update: {
      password: demoPassword,
      role: "STUDENT",
    },
    create: {
      email: "demo.student@smart-orientation.local",
      password: demoPassword,
      role: "STUDENT",
    },
  })

  const demoStudent = await prisma.student.upsert({
    where: { userId: demoUser.id },
    update: {
      name: "Demo Student",
      bacType: "MATH",
      bacAverage: 15.75,
      math: 16,
      physics: 15,
      svt: 14,
      french: 13,
      english: 15,
      gov: "Tunis",
      FG: 118.5,
      interests: "informatique, intelligence artificielle, data",
    },
    create: {
      name: "Demo Student",
      bacType: "MATH",
      bacAverage: 15.75,
      math: 16,
      physics: 15,
      svt: 14,
      french: 13,
      english: 15,
      gov: "Tunis",
      FG: 118.5,
      interests: "informatique, intelligence artificielle, data",
      userId: demoUser.id,
    },
  })

  await prisma.notification.deleteMany({
    where: {
      title: {
        in: [
          "Bienvenue sur Smart Orientation",
          "Pensez a completer votre test",
          "Demo: rapport PDF disponible",
        ],
      },
    },
  })

  await prisma.notification.createMany({
    data: [
      {
        studentId: null,
        title: "Bienvenue sur Smart Orientation",
        message: "Explorez les roadmaps et lancez le chatbot pour une recommandation rapide.",
      },
      {
        studentId: demoStudent.id,
        title: "Pensez a completer votre test",
        message: "Le test d orientation aide a affiner vos domaines dominants.",
      },
      {
        studentId: demoStudent.id,
        title: "Demo: rapport PDF disponible",
        message: "Apres soumission du test, utilisez le bouton PDF depuis le dashboard.",
      },
    ],
  })

  await prisma.marketSignal.deleteMany({
    where: {
      domain: {
        in: ["Informatique", "Ingenierie", "Sante"],
      },
    },
  })

  await prisma.marketSignal.createMany({
    data: [
      {
        domain: "Informatique",
        title: "Forte demande en developpement logiciel et data",
        demand: "HIGH",
        source: "demo",
      },
      {
        domain: "Ingenierie",
        title: "Besoins stables dans l industrie et l energie",
        demand: "MEDIUM",
        source: "demo",
      },
      {
        domain: "Sante",
        title: "Parcours selectifs avec bonne employabilite",
        demand: "HIGH",
        source: "demo",
      },
    ],
  })

  console.log("Guide and demo data imported correctly")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
