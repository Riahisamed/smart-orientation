import { Module } from '@nestjs/common';
import { MarketTrendsController } from './market-trends.controller';
import { MarketTrendsService } from './market-trends.service';

@Module({
  controllers: [MarketTrendsController],
  providers: [MarketTrendsService]
})
export class MarketTrendsModule {}
