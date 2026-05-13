import {
  Controller,
  Post,
  Body,
  Request,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ChatbotService } from './chatbot.service';
import { StudentService } from '../student/student.service';
import { Public } from '../common/decorators/public.decorator';
import { DynamicRoadmapService } from './services/dynamic-roadmap.service';
import { GemmaEnhancerService } from './gemma-enhancer.service';

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
    private readonly dynamicRoadmapService: DynamicRoadmapService,
    private readonly gemmaEnhancerService: GemmaEnhancerService,
  ) {}

  @Post('ask')
  @Public()
  async ask(@Body() body: ChatRequest, @Request() req) {
    const { message, conversationHistory, studentData: bodyStudentData } = body;

    // Priority 1: Use studentData from request body (frontend)
    const hasBodyStudentData =
      !!bodyStudentData &&
      (bodyStudentData.score !== undefined ||
        !!bodyStudentData.bacType ||
        !!bodyStudentData.bac ||
        !!bodyStudentData.interest ||
        !!bodyStudentData.language);

    if (hasBodyStudentData) {
      const effectiveStudentData = {
        score: bodyStudentData.score,
        bacType: bodyStudentData.bacType || bodyStudentData.bac,
        name: bodyStudentData.name,
        bacAverage: bodyStudentData.bacAverage,
        FG: bodyStudentData.FG,
        selectedFiliere: bodyStudentData.selectedFiliere,
        language: bodyStudentData.language,
        interest: bodyStudentData.interest,
      };
      const reply = await this.chatbotService.processMessage(
        message,
        effectiveStudentData,
        conversationHistory ?? [],
      );
      return {
        reply: await this.gemmaEnhancerService.enhanceResponse(
          reply,
          message,
          effectiveStudentData,
        ),
      };
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
          selectedFiliere: student.selectedFiliere ?? undefined,
        }
      : undefined;

    const reply = await this.chatbotService.processMessage(
      message,
      dbStudentData,
      conversationHistory ?? [],
    );
    return {
      reply: await this.gemmaEnhancerService.enhanceResponse(
        reply,
        message,
        dbStudentData,
      ),
    };
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

  @Get('roadmap-cards')
  @Public()
  getRoadmapCards(
    @Query('bacType') bacType: string,
    @Query('language') language: 'fr' | 'ar' = 'fr',
    @Query('interest') interest?: string,
  ) {
    // Generate personalized roadmap selector config based on BAC type
    const config =
      this.dynamicRoadmapService.generatePersonalizedRoadmapSelector(
        '', // empty message - we just want the cards
        bacType,
        undefined,
        interest,
      );

    // Map suggestions to the format expected by the frontend
    // Use domain field as-is for labels (domains.json fields are already descriptive)
    const cards = config.suggestions.map((suggestion) => ({
      domain: suggestion.domain,
      field: suggestion.field,
      labelFr: suggestion.field, // Domain names are already descriptive
      labelAr: suggestion.field, // Can be enhanced with Arabic translations if available
      icon: suggestion.icon,
      color: suggestion.color,
      description: suggestion.description,
      relevanceScore: suggestion.relevanceScore,
      difficulty: suggestion.difficulty,
      demand: suggestion.demand,
    }));

    return {
      title: config.title,
      subtitle: config.subtitle,
      suggestions: cards,
      cards,
      maxSuggestions: config.maxSuggestions,
      personalized: config.personalized,
    };
  }

  @Post('roadmap-selector')
  @Public()
  getRoadmapSelector(@Body() body: any) {
    const config =
      this.dynamicRoadmapService.generatePersonalizedRoadmapSelector(
        body?.message ?? 'roadmap',
        body?.bacType,
        body?.score,
        body?.detectedInterest ?? body?.interest,
      );

    return config;
  }

  @Get('roadmap')
  @Public()
  getRoadmap(
    @Query('domain') domain: string,
    @Query('level')
    level: 'beginner' | 'intermediate' | 'advanced' = 'beginner',
  ) {
    return this.dynamicRoadmapService.generateSpecificRoadmap(domain, level);
  }
}
