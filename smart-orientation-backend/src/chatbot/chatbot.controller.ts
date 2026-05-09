import { Controller, Post, Body, Request, Get, Param } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ChatbotService } from './chatbot.service';
import { StudentService } from '../student/student.service';
import { Public } from '../common/decorators/public.decorator';

interface ChatRequest {
  message: string;
  conversationHistory?: any[];
  studentData?: {
    score?: number;
    bacType?: string;
    bac?: string;
    name?: string;
    bacAverage?: number;
    FG?: number;
    selectedFiliere?: string;
    language?: 'fr' | 'ar';
    interest?: string;
  };
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
    const { message, conversationHistory, studentData: bodyStudentData } = body;

    // Priority 1: Use studentData from request body (frontend)
    const hasBodyStudentData = !!bodyStudentData && (
      bodyStudentData.score !== undefined ||
      !!bodyStudentData.bacType ||
      !!bodyStudentData.bac ||
      !!bodyStudentData.interest ||
      !!bodyStudentData.language
    );

    if (hasBodyStudentData) {
      const reply = await this.chatbotService.processMessage(
        message,
        {
          score: bodyStudentData.score,
          bacType: bodyStudentData.bacType || bodyStudentData.bac,
          name: bodyStudentData.name,
          bacAverage: bodyStudentData.bacAverage,
          FG: bodyStudentData.FG,
          selectedFiliere: bodyStudentData.selectedFiliere,
          language: bodyStudentData.language,
          interest: bodyStudentData.interest,
        },
        conversationHistory ?? [],
      );
      return { reply };
    }

    // Priority 2: Fallback to database (authenticated user)
    let student: any = null;
    if (req.user) {
      student = await this.studentService.getByUser(req.user.userId);
    }

    const dbStudentData = student
      ? {
          name: student.name,
          bacType: String(student.bacType),
          bacAverage: student.bacAverage,
          FG: student.FG ?? undefined,
          selectedFiliere: (student as any).selectedFiliere ?? undefined,
        }
      : undefined;

    const reply = await this.chatbotService.processMessage(
      message,
      dbStudentData,
      conversationHistory ?? [],
    );
    return { reply };
  }

  @Get('ping')
  @Public()
  ping() {
    return { message: 'Chatbot is alive! 🤖' };
  }

  @Get('i18n/:lang')
  @Public()
  getI18n(@Param('lang') lang: string) {
    try {
      const filePath = join(__dirname, 'i18n', `${lang}.json`);
      const content = JSON.parse(readFileSync(filePath, 'utf8'));
      return content;
    } catch (e) {
      return { error: 'i18n not found', lang };
    }
  }
}
