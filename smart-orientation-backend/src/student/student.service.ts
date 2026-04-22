import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class StudentService {

  constructor(private prisma: PrismaService) {}

  //////////////////////////////
  // جلب الطلبة
  //////////////////////////////
  async findAll() {
    return this.prisma.student.findMany()
  }

  //////////////////////////////
  // إنشاء طالب
  //////////////////////////////
async create(data: any, userId: number) {
      const math = this.calculateControlSubject(
      data.mathMain ?? data.math,
      data.mathControl
    )

    const physics = this.calculateControlSubject(
      data.physicsMain ?? data.physics,
      data.physicsControl
    )

    const svt = this.calculateControlSubject(
      data.svtMain ?? data.svt,
      data.svtControl
    )

    const bacAverage = this.calculateControlAverage(
      data.mgMain ?? data.bacAverage,
      data.mgControl
    )

    const FG = this.calculateFG({
      ...data,
      math,
      physics,
      svt,
      bacAverage
    })
const existing = await this.prisma.student.findMany({
  where: { userId },
  orderBy: { id: "desc" }
})

const student = existing[0]

if (student) {
  return this.prisma.student.update({
    where: { id: student.id },
    data: {
      name: data.name,
      bacType: data.bacType,
      math,
      physics,
      svt,
      french: data.french,
      english: data.english,
      bacAverage,
      FG: Number(FG.toFixed(2)),
      gov: data.gov || null
    }
  })
} else {
  return this.prisma.student.create({
    data: {
      name: data.name,
      bacType: data.bacType,
      math,
      physics,
      svt,
      french: data.french,
      english: data.english,
      bacAverage,
      FG: Number(FG.toFixed(2)),
      gov: data.gov || null,
      userId
    }
  })

  

}
  }
async getByUser(userId:number){
  return this.prisma.student.findFirst({
    where: { userId },
    orderBy: { id: "desc" } // 🔥 أهم حاجة
  })
}
  //////////////////////////////
  // حساب الكنترول
  //////////////////////////////
  calculateControlSubject(main?: number, control?: number) {
    if (main == null) return 0
    if (control == null) return main
    return (main + control * 2) / 3
  }

  calculateControlAverage(main?: number, control?: number) {
    if (main == null) return 0
    if (control == null) return main
    return (main + control * 2) / 3
  }

  //////////////////////////////
  // حساب FG
  //////////////////////////////
  calculateFG(data: any) {

    const MG = data.bacAverage || 0
    const F = data.french || 0
    const Ang = data.english || 0

    const M = data.math || 0
    const SP = data.physics || 0
    const PH = data.philosophy || 0
    const HG = data.historyGeo || 0

    switch (data.bacType) {

      case "MATH":
        return 4 * MG + 2 * M + 1.5 * SP + 0.5 * (data.svt || 0) + F + Ang

      case "SVT":
        return 4 * MG + M + 1.5 * SP + 1.5 * (data.svt || 0) + F + Ang

      case "LETTRES":
        return 4 * MG + 1.5 * (data.arabic || 0) + 1.5 * PH + HG + F + Ang

      case "ECO":
        return 4 * MG + 1.5 * (data.economy || 0) + 1.5 * (data.gestion || 0) + 0.5 * M + 0.5 * HG + F + Ang

      case "TECH":
        return 4 * MG + 1.5 * (data.tech || 0) + 1.5 * M + SP + F + Ang

      case "INFO":
        return 4 * MG + 1.5 * M + 1.5 * (data.algo || 0) + 0.5 * SP + 0.5 * (data.sti || 0) + F + Ang

      case "SPORT":
        return 4 * MG
          + 1.5 * (data.bioSport || 0)
          + (data.spSport || 0)
          + 0.5 * (data.physEd || 0)
          + 0.5 * SP
          + 0.5 * PH
          + F
          + Ang

      default:
        return 0
    }
  }
 update(userId:number, data:any){
  return this.prisma.student.update({
    where:{ userId: userId }, // 🔥 هذا أهم سطر
    data
  })
}

  //////////////////////////////
  // حساب T
  //////////////////////////////
calculateT(student: any, formula: string) {

  if (!formula) return 0

  let expr = formula.toUpperCase()

  // 🔥 replace variables
  expr = expr.replace(/FG/g, student.FG || 0)
  expr = expr.replace(/ANG/g, student.english || 0)
  expr = expr.replace(/AR/g, student.arabic || 0)
  expr = expr.replace(/M/g, student.math || 0)
  expr = expr.replace(/F/g, student.french || 0)
  expr = expr.replace(/ESP/g, student.spanish || 0)
  expr = expr.replace(/IT/g, student.italian || 0)
  expr = expr.replace(/ALL/g, student.german || 0)
  expr = expr.replace(/HG/g, student.historyGeo || 0)
  expr = expr.replace(/PH/g, student.philosophy || 0)
  expr = expr.replace(/SP/g, student.sport || 0)
  expr = expr.replace(/INFO/g, student.informatics || 0)
  expr = expr.replace(/TECH/g, student.technical || 0)
  expr = expr.replace(/ECON/g, student.economics || 0)
  expr = expr.replace(/GESTION/g, student.management || 0)
  expr = expr.replace(/SVT/g, student.svt || 0)
  expr = expr.replace(/TE/g, student.technical || 0)
  expr = expr.replace(/INF/g, student.informatics || 0)
  expr = expr.replace(/SPT/g, student.sport || 0)
  expr = expr.replace(/FR/g, student.french || 0)

  try {

    // 🔥 مهم: let مش const
    let result = eval(expr)

    // 🎯 bonus 7%
    if (student.sameGov) {
      result = result * 1.07
    }

    return Number(result.toFixed(2))

  } catch (err) {
    console.log("Formula error:", expr)
    return 0
  }
}
  //////////////////////////////
  // حساب chance
  //////////////////////////////
  calculateChance(T: number, lastScore: number | null) {

    if (lastScore === null) return "UNKNOWN"

    const diff = T - lastScore

    if (diff >= 0) return "HIGH"
    if (diff >= -5) return "MEDIUM"
    if (diff >= -15) return "LOW"

    return "VERY_LOW"
  }

  //////////////////////////////
  // Orientation
  //////////////////////////////
  testStudentChances(student: any, filieres: any[], limit?: number) {

    if (!student) {
      throw new NotFoundException("Student not found")
    }

    const validFilieres = filieres.filter(f =>
      f.bacTypes.some(b => b.type === student.bacType)
    )

    const results = validFilieres.map((filiere) => {

      const scoreInfo = filiere.scores?.find(
        (s: any) => s.bacType === student.bacType
      )

      const bacInfo = filiere.bacTypes.find(
        (b: any) => b.type === student.bacType
      )

      const lastScore = scoreInfo?.lastScore ?? bacInfo?.lastScore ?? null

      let studentScore = this.calculateT(student, filiere.formula)

      studentScore = this.applyRegionalBonus(
        studentScore,
        student.gov,
        filiere.gov
      )

      const chance = this.calculateChance(
        studentScore,
        lastScore
      )

      return {
        code: filiere.code,
        program: filiere.program,
        institution: filiere.institution,
        studentScore: Number(studentScore.toFixed(2)),
        lastScore,
        chance
      }

    })

    const uniqueResults = results.filter((f, index, self) =>
      index === self.findIndex(x => x.code === f.code)
    )

    const sorted = uniqueResults.sort((a, b) => b.studentScore - a.studentScore)

    return limit ? sorted.slice(0, limit) : sorted
  }

  //////////////////////////////
  // Bonus
  //////////////////////////////
  applyRegionalBonus(T: number, studentGov?: string, filiereGov?: string) {

    if (!studentGov || !filiereGov) return T

    if (studentGov.toLowerCase() === filiereGov.toLowerCase()) {
      return T * 1.07
    }

    return T
  }

  //////////////////////////////
  // جلب طالب
  //////////////////////////////
  async getStudent(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id }
    })

    if (!student) {
      throw new NotFoundException("Student not found")
    }

    return student
  }

  //////////////////////////////
  // جلب الشعب
  //////////////////////////////
  async getAllFilieres() {
    return this.prisma.filiere.findMany({
      include: {
        bacTypes: true,
        scores: true
      }
    })
  }
  async findOne(id: number) {
  console.log("ID:", id)

  const student = await this.prisma.student.findUnique({
    where: { id }
  })

  console.log("STUDENT:", student)

  return student
}
}