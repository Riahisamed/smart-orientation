import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { exec } from 'child_process'
import * as fs from 'fs'
import { BacType } from '@prisma/client'

@Injectable()
export class FiliereService {

  constructor(private prisma: PrismaService) {}

  private normalizeBacLabel(value: any): string {
    return value
      ?.toString()
      ?.normalize('NFKC')
      ?.replace(/[أإآ]/g, 'ا')
      ?.replace(/ى/g, 'ي')
      ?.trim()
      ?.toUpperCase()
      ?.normalize('NFD')
      ?.replace(/[\u0300-\u036f]/g, '')
      ?.replace(/[\s._\-/]+/g, '')
  }

  private mapBacType(value: any): BacType | null {
    const normalized = this.normalizeBacLabel(value)

    if (!normalized) return null

    const aliases: Record<BacType, string[]> = {
      MATH: ['MATH', 'MATHS', 'MATHEMATIQUE', 'MATHEMATIQUES', 'SCIENCESMATHEMATIQUES', 'رياضيات', 'رياض'],
      SVT: ['SVT', 'SCIENCESEXPERIMENTALES', 'SCIENCEEXPERIMENTALE', 'SCEXP', 'علومتجريبية'],
      ECO: ['ECO', 'ECONOMIE', 'ECONOMIEGESTION', 'ECOGESTION', 'اقتصادوتصرف', 'اقتصاد'],
      TECH: ['TECH', 'TECHNIQUE', 'العلومالتقنية', 'تقنية'],
      INFO: ['INFO', 'INFORMATIQUE', 'علومالاعلامية', 'اعلامية'],
      LETTRES: ['LETTRES', 'LITTERAIRE', 'LITTERATURE', 'اداب', 'الاداب', 'آداب'],
      SPORT: ['SPORT', 'رياضة']
    }

    for (const [bacType, values] of Object.entries(aliases) as [BacType, string[]][]) {
      if (values.some(v => this.normalizeBacLabel(v) === normalized)) {
        return bacType
      }
    }

    return null
  }

  // جلب كل الشعب مع معلومات الباك
  async findAll() {
    return this.prisma.filiere.findMany({
      include: {
        bacTypes: true,
        scores: true
      }
    });
  }

  // جلب شعبة واحدة
  async findOne(id: number) {
    return this.prisma.filiere.findUnique({
      where: { id },
      include: {
        bacTypes: true,
        scores: true
      }
    });
  }

  // إنشاء شعبة جديدة (للأدمن)
  async create(data: any) {
    return this.prisma.filiere.create({
      data: {
        code: data.code,
        program: data.program,
        institution: data.institution,
        formula: data.formula,
        gov: data.gov
      }
    });
  }

  // إضافة معلومات الباك للشعبة
  async addBacInfo(filiereId: number, data: any) {
    const mappedType = this.mapBacType(data.type)

    if (!mappedType) {
      throw new Error(`Invalid bac type: ${data.type}`)
    }

    const bacInfo = await this.prisma.filiereBac.create({
      data: {
        type: mappedType,
        capacity: data.capacity,
        lastScore: data.lastScore,
        filiereId: filiereId
      }
    });

    await this.prisma.filiereScore.upsert({
      where: {
        filiereId_bacType: {
          filiereId,
          bacType: mappedType
        }
      },
      update: {
        lastScore: data.lastScore
      },
      create: {
        filiereId,
        bacType: mappedType,
        lastScore: data.lastScore
      }
    })

    return bacInfo
  }
  async importGuide(data: any[]) {

  // 🧨 نحيو القديم
  await this.prisma.filiereScore.deleteMany()
  await this.prisma.filiereBac.deleteMany()
  await this.prisma.filiere.deleteMany()

  // 🔄 نعاودو نزرعو
  for (const item of data) {

    const filiere = await this.prisma.filiere.create({
      data: {
        code: item.code,
        program: item.program,
        institution: item.institution,
        formula: item.formula
      }
    })

    const scoreByType = new Map<BacType, number | null>()

    for (const bac of item.bacTypes) {
      const mappedType = this.mapBacType(bac?.type)

      if (!mappedType) continue

      await this.prisma.filiereBac.create({
        data: {
          type: mappedType,
          capacity: bac.capacity,
          lastScore: bac.lastScore,
          filiereId: filiere.id
        }
      })

      const existingScore = scoreByType.get(mappedType)
      const nextScore = typeof bac?.lastScore === 'number' ? bac.lastScore : null

      if (!scoreByType.has(mappedType) || existingScore == null) {
        scoreByType.set(mappedType, nextScore)
      }
    }

    for (const [bacType, lastScore] of scoreByType.entries()) {
      await this.prisma.filiereScore.create({
        data: {
          bacType,
          lastScore,
          filiereId: filiere.id
        }
      })
    }
  }

  return { message: "Guide imported successfully" }
}
async processPdf(file: Express.Multer.File) {

  // 1️⃣ نحفظ PDF
  const filePath = `scripts/${file.originalname}`
  fs.writeFileSync(filePath, file.buffer)

  // 2️⃣ نشغّل Python
  await new Promise((resolve, reject) => {
    exec(`python scripts/convert.py ${filePath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr)
        return reject(error)
      }
      resolve(stdout)
    })
  })

  // 3️⃣ نقرى JSON
  const json = JSON.parse(
    fs.readFileSync('output.json', 'utf-8')
  )

  // 4️⃣ نعمل import للـ DB
  await this.importGuide(json)

  return { message: "PDF processed + DB updated 🔥" }
}
}
