import { Controller, Get, Post, Body, Param, Query, Put } from '@nestjs/common'
import { StudentService } from './student.service'
import { AuthGuard } from '@nestjs/passport'
import { Public } from '../common/decorators/public.decorator';
import { Req, UseGuards } from "@nestjs/common"
import { FiliereService } from '../filiere/filiere.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
@Controller('student')
export class StudentController {

constructor(
  private readonly studentService: StudentService,
  private readonly filiereService: FiliereService // 👈 زيد هذا
) {}

/////////////////////////////
// جلب الطلبة (محمي)
/////////////////////////////

@UseGuards(AuthGuard('jwt'))
@Get()
findAll(){
return this.studentService.findAll()
}

/////////////////////////////
// إنشاء طالب
/////////////////////////////



@UseGuards(AuthGuard('jwt'))
@Post()
create(@Body() body:any, @Req() req){
  return this.studentService.create(body, req.user.userId)
}

/////////////////////////////
// FG principale (بدون حماية)
/////////////////////////////
/////////////////////////////
// FG principale
/////////////////////////////
@Public()
@Post("calculate-fg")
calculateFG(@Body() body:any){

const FG = this.studentService.calculateFG(body)

return { FG:Number(FG.toFixed(2)) }

}

@Public()
@Post("calculate-fg-controle")
calculateFGControle(@Body() body:any){

const math = this.studentService.calculateControlSubject(
body.mathMain,
body.mathControl
)

const physics = this.studentService.calculateControlSubject(
body.physicsMain,
body.physicsControl
)

const svt = this.studentService.calculateControlSubject(
body.svtMain,
body.svtControl
)

const bacAverage = this.studentService.calculateControlAverage(
body.mgMain,
body.mgControl
)

const FG = this.studentService.calculateFG({
...body,
math,
physics,
svt,
bacAverage
})

return { FG:Number(FG.toFixed(2)) }

}

@UseGuards(AuthGuard('jwt'))
@Put("update")
update(@Req() req, @Body() body:any){
return this.studentService.update(req.user.userId, body)}
/////////////////////////////
// Orientation (محمي)
/////////////////////////////
@Public()
@Get('me/orientation')
@Public() // 🔥 نحيو auth باش ما يصيرش مشكل token
async orientation() {

  const filieres = await this.filiereService.findAll()

  console.log("======== BACKEND DEBUG: /student/me/orientation ========")
  console.log("FILIERES COUNT:", filieres.length)
  if (filieres.length > 0) {
    console.log("FIRST FILIERE:", JSON.stringify(filieres[0], null, 2))
    console.log("FIRST FILIERE .scores:", filieres[0]?.scores)
    console.log("FIRST FILIERE .scores length:", filieres[0]?.scores?.length)
    // Count how many filieres have scores
    const withScores = filieres.filter((f: any) => f.scores && f.scores.length > 0)
    console.log("FILIERES WITH SCORES:", withScores.length, "/", filieres.length)
    if (withScores.length > 0) {
      console.log("SAMPLE SCORE:", JSON.stringify(withScores[0].scores[0], null, 2))
    } else {
      console.log("⚠️ BACKEND: NO SCORES FOUND IN ANY FILIERE!")
    }
  }
  console.log("========================================================")

  return filieres
}


@Get("me")
@UseGuards(JwtAuthGuard)
getMyStudent(@Req() req){
  console.log("USER:", req.user) // 🔥
  return this.studentService.getByUser(req.user.userId)
}

@UseGuards(AuthGuard('jwt'))
@Get(':id')
findOne(@Param('id') id: string) {
  return this.studentService.findOne(+id)
}
@Public()
@Post("calculate-t")
calculateT(@Body() body:any){

  const T = this.studentService.calculateT(
    body.student,
    body.formula
  )

  return { T }
}


}