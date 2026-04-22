import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common'
import { ChatbotService } from './chatbot.service'
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard'
import { StudentService } from '../student/student.service'
import { Public } from '../common/decorators/public.decorator'

interface ChatRequest {
  message: string
  conversationHistory?: any[]
}

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly studentService: StudentService,
  ) {}

  
  @Post('ask')
  @Public()
  async ask(@Body() body: ChatRequest, @Request() req) {
    const { message, conversationHistory } = body

    let student: any = null

if (req.user) {
  student = await this.studentService.getByUser(req.user.userId)
}

    const studentData = student
      ? {
          name: student.name,
          bacType: String(student.bacType),
          bacAverage: student.bacAverage,
          FG: student.FG ?? undefined,
          selectedFiliere: (student as any).selectedFiliere ?? undefined,
        }
      : undefined

   const reply = await this.chatbotService.processMessage(
  message,
  studentData
)
    return { reply }
  }

  @Get('ping')
  @Public()
  ping() {
    return { message: 'Chatbot is alive! 🤖' }
  }
}