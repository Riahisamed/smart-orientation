import { Injectable } from '@nestjs/common';

/**
 * Market Trends Service
 * Provides market data, trends, and analytics about the job market
 * Uses enriched mock datasets to simulate real-time market intelligence
 */
@Injectable()
export class MarketTrendsService {

  //////////////////////////////
  // Enriched Mock Datasets
  //////////////////////////////

  private readonly marketData = [
    {
      domain: 'Informatique & Technologies',
      title: 'Développeur Full Stack',
      demand: 'Très élevée',
      demandLevel: 'HIGH',
      unemploymentRate: 2.5,
      growthRate: 22,
      salaryAvg: 42000,
      salaryRange: '35,000 - 55,000 TND',
      topSkills: ['React', 'Node.js', 'TypeScript', 'Python', 'Docker'],
      category: 'Tech',
    },
    {
      domain: 'Informatique & Technologies',
      title: 'Data Scientist',
      demand: 'Très élevée',
      demandLevel: 'HIGH',
      unemploymentRate: 1.8,
      growthRate: 35,
      salaryAvg: 48000,
      salaryRange: '40,000 - 65,000 TND',
      topSkills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Statistics'],
      category: 'Tech',
    },
    {
      domain: 'Informatique & Technologies',
      title: 'Cybersécurité Analyst',
      demand: 'Élevée',
      demandLevel: 'HIGH',
      unemploymentRate: 1.2,
      growthRate: 28,
      salaryAvg: 50000,
      salaryRange: '42,000 - 70,000 TND',
      topSkills: ['Network Security', 'Ethical Hacking', 'Compliance', 'Risk Management'],
      category: 'Tech',
    },
    {
      domain: 'Informatique & Technologies',
      title: 'Cloud Architect',
      demand: 'Élevée',
      demandLevel: 'HIGH',
      unemploymentRate: 1.5,
      growthRate: 25,
      salaryAvg: 55000,
      salaryRange: '45,000 - 75,000 TND',
      topSkills: ['AWS', 'Azure', 'GCP', 'DevOps', 'Kubernetes'],
      category: 'Tech',
    },
    {
      domain: 'Santé & Biologie',
      title: 'Médecin Généraliste',
      demand: 'Très élevée',
      demandLevel: 'HIGH',
      unemploymentRate: 0.5,
      growthRate: 8,
      salaryAvg: 60000,
      salaryRange: '50,000 - 80,000 TND',
      topSkills: ['Diagnostic', 'Patient Care', 'Medical Ethics', 'Communication'],
      category: 'Medical',
    },
    {
      domain: 'Santé & Biologie',
      title: 'Infirmier Diplômé',
      demand: 'Élevée',
      demandLevel: 'HIGH',
      unemploymentRate: 1.0,
      growthRate: 12,
      salaryAvg: 25000,
      salaryRange: '18,000 - 35,000 TND',
      topSkills: ['Soins Infirmiers', 'Urgences', 'Pharmacologie', 'Empathie'],
      category: 'Medical',
    },
    {
      domain: 'Santé & Biologie',
      title: 'Biotechnologiste',
      demand: 'Moyenne',
      demandLevel: 'MEDIUM',
      unemploymentRate: 4.5,
      growthRate: 15,
      salaryAvg: 32000,
      salaryRange: '25,000 - 45,000 TND',
      topSkills: ['Biologie Moléculaire', 'Génétique', 'Analyse Labo', 'Bioinformatique'],
      category: 'Medical',
    },
    {
      domain: 'Économie & Gestion',
      title: 'Data Analyst Financier',
      demand: 'Élevée',
      demandLevel: 'HIGH',
      unemploymentRate: 3.2,
      growthRate: 18,
      salaryAvg: 38000,
      salaryRange: '30,000 - 50,000 TND',
      topSkills: ['Excel', 'SQL', 'Power BI', 'Finance', 'Modélisation'],
      category: 'Business',
    },
    {
      domain: 'Économie & Gestion',
      title: 'Chef de Projet Digital',
      demand: 'Élevée',
      demandLevel: 'HIGH',
      unemploymentRate: 2.8,
      growthRate: 20,
      salaryAvg: 45000,
      salaryRange: '35,000 - 60,000 TND',
      topSkills: ['Agile', 'Scrum', 'Management', 'Communication', 'JIRA'],
      category: 'Business',
    },
    {
      domain: 'Économie & Gestion',
      title: 'Expert Comptable',
      demand: 'Moyenne',
      demandLevel: 'MEDIUM',
      unemploymentRate: 2.0,
      growthRate: 5,
      salaryAvg: 40000,
      salaryRange: '32,000 - 55,000 TND',
      topSkills: ['Comptabilité', 'Audit', 'Fiscalité', 'ERP'],
      category: 'Business',
    },
    {
      domain: 'Ingénierie',
      title: 'Ingénieur Génie Civil',
      demand: 'Élevée',
      demandLevel: 'HIGH',
      unemploymentRate: 3.0,
      growthRate: 10,
      salaryAvg: 38000,
      salaryRange: '30,000 - 50,000 TND',
      topSkills: ['AutoCAD', 'BIM', 'Structure', 'Matériaux', 'Gestion Projet'],
      category: 'Engineering',
    },
    {
      domain: 'Ingénierie',
      title: 'Ingénieur Électromécanique',
      demand: 'Moyenne',
      demandLevel: 'MEDIUM',
      unemploymentRate: 4.0,
      growthRate: 8,
      salaryAvg: 35000,
      salaryRange: '28,000 - 48,000 TND',
      topSkills: ['CAO', 'Électricité', 'Mécanique', 'Automation'],
      category: 'Engineering',
    },
    {
      domain: 'Ingénierie',
      title: 'Ingénieur en Intelligence Artificielle',
      demand: 'Très élevée',
      demandLevel: 'HIGH',
      unemploymentRate: 1.0,
      growthRate: 40,
      salaryAvg: 52000,
      salaryRange: '42,000 - 75,000 TND',
      topSkills: ['Deep Learning', 'NLP', 'Computer Vision', 'Python', 'PyTorch'],
      category: 'Tech',
    },
    {
      domain: 'Sciences Humaines & Sociales',
      title: 'Psychologue Clinicien',
      demand: 'Moyenne',
      demandLevel: 'MEDIUM',
      unemploymentRate: 6.0,
      growthRate: 10,
      salaryAvg: 22000,
      salaryRange: '15,000 - 35,000 TND',
      topSkills: ['Psychothérapie', 'Évaluation', 'Empathie', 'Écoute Active'],
      category: 'Social',
    },
    {
      domain: 'Sciences Humaines & Sociales',
      title: 'Journaliste Digital',
      demand: 'Moyenne',
      demandLevel: 'MEDIUM',
      unemploymentRate: 8.5,
      growthRate: 5,
      salaryAvg: 20000,
      salaryRange: '12,000 - 30,000 TND',
      topSkills: ['Rédaction', 'SEO', 'Réseaux Sociaux', 'Montage Vidéo'],
      category: 'Media',
    },
    {
      domain: 'Droit',
      title: 'Avocat d\'Affaires',
      demand: 'Moyenne',
      demandLevel: 'MEDIUM',
      unemploymentRate: 5.5,
      growthRate: 7,
      salaryAvg: 45000,
      salaryRange: '30,000 - 70,000 TND',
      topSkills: ['Droit des Sociétés', 'Négociation', 'Contentieux', 'Conseil'],
      category: 'Legal',
    },
    {
      domain: 'Agriculture & Environnement',
      title: 'Ingénieur Agronome',
      demand: 'Moyenne',
      demandLevel: 'MEDIUM',
      unemploymentRate: 4.5,
      growthRate: 12,
      salaryAvg: 28000,
      salaryRange: '20,000 - 40,000 TND',
      topSkills: ['Agronomie', 'Irrigation', 'Développement Durable', 'Gestion'],
      category: 'Agriculture',
    },
    {
      domain: 'Architecture & Urbanisme',
      title: 'Architecte',
      demand: 'Moyenne',
      demandLevel: 'MEDIUM',
      unemploymentRate: 5.0,
      growthRate: 8,
      salaryAvg: 35000,
      salaryRange: '25,000 - 50,000 TND',
      topSkills: ['AutoCAD', 'SketchUp', 'Design', 'Urbanisme', 'DAO'],
      category: 'Engineering',
    },
  ];

  // Annual evolution data (2019-2026)
  private readonly annualEvolution = [
    { year: 2019, tech: 15, medical: 10, business: 8, engineering: 12, social: 5 },
    { year: 2020, tech: 18, medical: 12, business: 6, engineering: 10, social: 4 },
    { year: 2021, tech: 25, medical: 14, business: 10, engineering: 13, social: 6 },
    { year: 2022, tech: 30, medical: 15, business: 12, engineering: 14, social: 7 },
    { year: 2023, tech: 32, medical: 16, business: 14, engineering: 15, social: 8 },
    { year: 2024, tech: 35, medical: 18, business: 16, engineering: 16, social: 9 },
    { year: 2025, tech: 38, medical: 20, business: 18, engineering: 17, social: 10 },
    { year: 2026, tech: 40, medical: 22, business: 20, engineering: 18, social: 10 },
  ];

  // Unemployement rate by sector
  private readonly sectorUnemployment = [
    { sector: 'Informatique & Technologies', rate: 2.1 },
    { sector: 'Santé & Biologie', rate: 3.5 },
    { sector: 'Ingénierie', rate: 4.2 },
    { sector: 'Économie & Gestion', rate: 5.8 },
    { sector: 'Droit', rate: 7.5 },
    { sector: 'Sciences Humaines', rate: 10.2 },
    { sector: 'Agriculture', rate: 8.0 },
    { sector: 'Architecture', rate: 6.5 },
  ];

  //////////////////////////////
  // Service Methods
  //////////////////////////////

  /** Get all market trends */
  async getTrends() {
    return this.marketData;
  }

  /** Get most in-demand jobs (demand = HIGH) */
  async getMostDemanded() {
    return this.marketData
      .filter((m) => m.demandLevel === 'HIGH')
      .sort((a, b) => b.growthRate - a.growthRate);
  }

  /** Get growing domains (growth > 15%) */
  async getGrowingDomains() {
    const domains = this.marketData.reduce(
      (acc, m) => {
        if (!acc[m.domain]) {
          acc[m.domain] = { domain: m.domain, growthRate: 0, count: 0 };
        }
        acc[m.domain].growthRate += m.growthRate;
        acc[m.domain].count += 1;
        return acc;
      },
      {} as Record<string, { domain: string; growthRate: number; count: number }>,
    );

    return Object.values(domains)
      .map((d) => ({
        domain: d.domain,
        avgGrowthRate: Math.round((d.growthRate / d.count) * 10) / 10,
      }))
      .sort((a, b) => b.avgGrowthRate - a.avgGrowthRate);
  }

  /** Get unemployment rate by domain */
  async getUnemploymentRates() {
    return this.sectorUnemployment;
  }

  /** Get annual evolution data */
  async getAnnualEvolution() {
    return this.annualEvolution;
  }

  /** Get top demanded skills across all domains */
  async getTopSkills() {
    const skillCount: Record<string, number> = {};
    this.marketData.forEach((m) => {
      m.topSkills.forEach((skill) => {
        skillCount[skill] = (skillCount[skill] || 0) + 1;
      });
    });

    return Object.entries(skillCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([skill, count]) => ({ skill, count, domains: this.getSkillDomains(skill) }));
  }

  /** Get all unique sectors/categories */
  async getSectors() {
    const sectors = [...new Set(this.marketData.map((m) => m.category))];
    return sectors.map((s) => ({
      name: s,
      count: this.marketData.filter((m) => m.category === s).length,
    }));
  }

  /** Get average salary by sector */
  async getSalariesBySector() {
    const sectors = this.marketData.reduce(
      (acc, m) => {
        if (!acc[m.category]) {
          acc[m.category] = { sector: m.category, totalSalary: 0, count: 0 };
        }
        acc[m.category].totalSalary += m.salaryAvg;
        acc[m.category].count += 1;
        return acc;
      },
      {} as Record<string, { sector: string; totalSalary: number; count: number }>,
    );

    return Object.values(sectors).map((s) => ({
      sector: s.sector,
      avgSalary: Math.round(s.totalSalary / s.count),
    }));
  }

  /** Get demand level distribution */
  async getDemandDistribution() {
    const distribution = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    this.marketData.forEach((m) => {
      distribution[m.demandLevel as keyof typeof distribution] += 1;
    });
    return Object.entries(distribution).map(([level, count]) => ({
      level,
      count,
      percentage: Math.round((count / this.marketData.length) * 100),
    }));
  }

  /** Full dashboard data */
  async getFullDashboard() {
    return {
      trends: this.marketData,
      mostDemanded: await this.getMostDemanded(),
      growingDomains: await this.getGrowingDomains(),
      unemploymentRates: this.sectorUnemployment,
      annualEvolution: this.annualEvolution,
      topSkills: await this.getTopSkills(),
      sectors: await this.getSectors(),
      salariesBySector: await this.getSalariesBySector(),
      demandDistribution: await this.getDemandDistribution(),
      lastUpdated: new Date().toISOString(),
    };
  }

  // Helper: find domains for a skill
  private getSkillDomains(skill: string): string[] {
    const domains = new Set<string>();
    this.marketData.forEach((m) => {
      if (m.topSkills.includes(skill)) {
        domains.add(m.domain);
      }
    });
    return [...domains];
  }
}