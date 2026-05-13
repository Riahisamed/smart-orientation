import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [students, users, filieres, tests, reports, bacGroups] =
      await Promise.all([
        this.prisma.student.count(),
        this.prisma.user.count(),
        this.prisma.filiere.count(),
        this.prisma.orientationTest.count(),
        this.prisma.recommendationReport.count(),
        this.prisma.student.groupBy({
          by: ['bacType'],
          _count: { bacType: true },
        }),
      ]);

    const latestTests = await this.prisma.orientationTest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { dominantDomains: true, createdAt: true },
    });

    const domainCounts = new Map<string, number>();
    for (const test of latestTests) {
      const domains = Array.isArray(test.dominantDomains)
        ? test.dominantDomains
        : [];
      for (const rawItem of domains) {
        const item = rawItem as { domain?: string };
        const domain = String(item?.domain ?? '').trim();
        if (domain)
          domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
      }
    }

    // Calculate average FG across all students
    const studentsWithFG = await this.prisma.student.findMany({
      where: { FG: { not: null } },
      select: { FG: true },
    });
    const avgFG = studentsWithFG.length
      ? studentsWithFG.reduce((sum, s) => sum + (s.FG || 0), 0) /
        studentsWithFG.length
      : 0;

    // Recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentTests = await this.prisma.orientationTest.count({
      where: { createdAt: { gte: weekAgo } },
    });
    const recentStudents = await this.prisma.student.count({
      where: { createdAt: { gte: weekAgo } },
    });

    // Top recommended filieres from orientation tests
    const allRecommendations = await this.prisma.orientationTest.findMany({
      select: { recommendations: true },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });
    const recCount = new Map<string, number>();
    for (const test of allRecommendations) {
      const recs = Array.isArray(test.recommendations)
        ? test.recommendations
        : [];
      for (const rec of recs) {
        const recObj = rec as { code?: string; program?: string } | null;
        const name = String(recObj?.code || recObj?.program || '').trim();
        if (name) recCount.set(name, (recCount.get(name) || 0) + 1);
      }
    }

    return {
      totals: { students, users, filieres, tests, reports },
      bacTypes: bacGroups.map((item) => ({
        bacType: item.bacType,
        count: item._count.bacType,
      })),
      popularDomains: [...domainCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([domain, count]) => ({ domain, count })),
      orientationTrends: this.orientationTrends(latestTests),
      market: this.marketSnapshot(),
      analytics: {
        avgFG: Math.round(avgFG * 100) / 100,
        recentTests,
        recentStudents,
        topRecommendations: [...recCount.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([code, count]) => ({ code, count })),
      },
    };
  }

  students() {
    return this.prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, role: true } } },
      take: 100,
    });
  }

  /** Search students with pagination */
  async searchStudents(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where = query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { gov: { contains: query, mode: 'insensitive' as const } },
            { interests: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  domains() {
    try {
      const parsed = JSON.parse(
        readFileSync(join(process.cwd(), 'data', 'domains.json'), 'utf8'),
      );
      const domains = Array.isArray(parsed.domains) ? parsed.domains : [];
      return domains.slice(0, 200).map((domain) => ({
        id: domain.id,
        field: domain.field,
        category: domain.category,
        difficulty: domain.difficulty,
        demand: domain.demand,
        careerPaths:
          domain.roadmap?.beginner?.career_paths ?? domain.career_paths ?? [],
      }));
    } catch {
      return [];
    }
  }

  notifications() {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { student: { select: { name: true } } },
    });
  }

  /** Get enterprise accounts */
  async getEnterprises() {
    return this.prisma.enterprise.findMany({
      include: {
        user: { select: { email: true, createdAt: true } },
        _count: { select: { jobOffers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Get all job offers */
  async getJobOffers() {
    return this.prisma.jobOffer.findMany({
      include: {
        enterprise: { select: { name: true } },
        requiredSkills: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Full analytics dashboard */
  async getFullAnalytics() {
    const baseStats = await this.stats();

    // Students by gov
    const byGov = await this.prisma.student.groupBy({
      by: ['gov'],
      _count: { gov: true },
      orderBy: { _count: { gov: 'desc' } },
      take: 10,
    });

    // Average scores per bac type
    const studentsData = await this.prisma.student.findMany({
      select: {
        bacType: true,
        bacAverage: true,
        FG: true,
        math: true,
        french: true,
        english: true,
        physics: true,
      },
    });

    const avgScoresByBac = studentsData.reduce(
      (acc, s) => {
        const type = s.bacType;
        if (!acc[type]) {
          acc[type] = {
            bacType: type,
            count: 0,
            totalBacAvg: 0,
            totalFG: 0,
            totalMath: 0,
            totalFrench: 0,
            totalEnglish: 0,
          };
        }
        acc[type].count++;
        acc[type].totalBacAvg += s.bacAverage || 0;
        acc[type].totalFG += s.FG || 0;
        acc[type].totalMath += s.math || 0;
        acc[type].totalFrench += s.french || 0;
        acc[type].totalEnglish += s.english || 0;
        return acc;
      },
      {} as Record<string, any>,
    );

    return {
      ...baseStats,
      byGov: byGov
        .filter((g) => g.gov)
        .map((g) => ({ gov: g.gov, count: g._count.gov })),
      avgScoresByBac: Object.values(avgScoresByBac).map((bac: any) => ({
        bacType: bac.bacType,
        count: bac.count,
        avgBacAverage: Math.round((bac.totalBacAvg / bac.count) * 100) / 100,
        avgFG: Math.round((bac.totalFG / bac.count) * 100) / 100,
        avgMath: Math.round((bac.totalMath / bac.count) * 100) / 100,
        avgFrench: Math.round((bac.totalFrench / bac.count) * 100) / 100,
        avgEnglish: Math.round((bac.totalEnglish / bac.count) * 100) / 100,
      })),
    };
  }

  private marketSnapshot() {
    try {
      const parsed = JSON.parse(
        readFileSync(join(process.cwd(), 'data', 'jobs.json'), 'utf8'),
      );
      const groups = Array.isArray(parsed) ? parsed : (parsed.domains ?? []);
      return groups.slice(0, 8).map((group) => ({
        domain: group.domain,
        jobs: Array.isArray(group.jobs) ? group.jobs.length : 0,
        demand: group.demand ?? 'A verifier',
      }));
    } catch {
      return [];
    }
  }

  private orientationTrends(tests: { createdAt: Date }[]) {
    const buckets = new Map<string, number>();
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      buckets.set(date.toISOString().slice(0, 10), 0);
    }
    for (const test of tests) {
      const key = test.createdAt.toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return [...buckets.entries()].map(([date, count]) => ({
      date,
      count,
    }));
  }
}