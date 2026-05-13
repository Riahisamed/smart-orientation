import { Controller, Get } from '@nestjs/common';
import { MarketTrendsService } from './market-trends.service';
import { Public } from '../auth/public.decorator';

@Controller('market-trends')
export class MarketTrendsController {
  constructor(private readonly marketTrendsService: MarketTrendsService) {}

  @Public()
  @Get()
  getTrends() {
    return this.marketTrendsService.getTrends();
  }

  @Public()
  @Get('most-demanded')
  getMostDemanded() {
    return this.marketTrendsService.getMostDemanded();
  }

  @Public()
  @Get('growing-domains')
  getGrowingDomains() {
    return this.marketTrendsService.getGrowingDomains();
  }

  @Public()
  @Get('unemployment')
  getUnemploymentRates() {
    return this.marketTrendsService.getUnemploymentRates();
  }

  @Public()
  @Get('annual-evolution')
  getAnnualEvolution() {
    return this.marketTrendsService.getAnnualEvolution();
  }

  @Public()
  @Get('top-skills')
  getTopSkills() {
    return this.marketTrendsService.getTopSkills();
  }

  @Public()
  @Get('sectors')
  getSectors() {
    return this.marketTrendsService.getSectors();
  }

  @Public()
  @Get('salaries')
  getSalariesBySector() {
    return this.marketTrendsService.getSalariesBySector();
  }

  @Public()
  @Get('demand-distribution')
  getDemandDistribution() {
    return this.marketTrendsService.getDemandDistribution();
  }

  @Public()
  @Get('dashboard')
  getFullDashboard() {
    return this.marketTrendsService.getFullDashboard();
  }
}