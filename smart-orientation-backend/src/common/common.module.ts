import { Module } from '@nestjs/common';
import { OllamaConfigService } from './services/ollama-config.service';

@Module({
  providers: [OllamaConfigService],
  exports: [OllamaConfigService],
})
export class CommonModule {}
