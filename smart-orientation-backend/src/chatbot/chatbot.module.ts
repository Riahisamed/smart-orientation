import { Module } from '@nestjs/common'
import { ChatbotController } from './chatbot.controller'
import { ChatbotService } from './chatbot.service'
import { AiService } from './ai.service'
import { IntentDetectorService } from './intent-detector.service'
import { RagService } from './rag.service'
import { ResponseBuilderService } from './response-builder.service'
import { SafetyRulesService } from './safety-rules.service'
import { MemoryService } from './memory.service'
import { StudentModule } from '../student/student.module'
import { CommonModule } from '../common/common.module'

// Generators
import { FollowupGenerator } from '../ai/generators/followup.generator'

@Module({
  imports: [StudentModule, CommonModule],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    AiService,
    IntentDetectorService,
    RagService,
    ResponseBuilderService,
    SafetyRulesService,
    MemoryService,
    FollowupGenerator,
  ],
  exports: [
    ChatbotService,
    AiService,
    IntentDetectorService,
    RagService,
    ResponseBuilderService,
    SafetyRulesService,
    MemoryService,
    FollowupGenerator,
  ],
})
export class ChatbotModule {}
