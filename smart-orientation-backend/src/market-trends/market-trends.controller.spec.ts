import { Test, TestingModule } from '@nestjs/testing';
import { MarketTrendsController } from './market-trends.controller';

describe('MarketTrendsController', () => {
  let controller: MarketTrendsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketTrendsController],
    }).compile();

    controller = module.get<MarketTrendsController>(MarketTrendsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
