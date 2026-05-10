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
      select: { dominantDomains: true },
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
      market: this.marketSnapshot(),
    };
  }

  students() {
    return this.prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, role: true } } },
      take: 100,
    });
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
}
