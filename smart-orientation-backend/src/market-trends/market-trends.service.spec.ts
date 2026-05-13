import { Test, TestingModule } from '@nestjs/testing';
import { MarketTrendsService } from './market-trends.service';

describe('MarketTrendsService', () => {
  let service: MarketTrendsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarketTrendsService],
    }).compile();

    service = module.get<MarketTrendsService>(MarketTrendsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
