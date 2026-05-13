import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EnterpriseService {
  constructor(private readonly prisma: PrismaService) {}

  //////////////////////////////
  // Enterprise Registration
  //////////////////////////////
  async register(data: {
    email: string;
    password: string;
    name: string;
    description?: string;
    sector?: string;
    location?: string;
    website?: string;
    contactEmail?: string;
    contactPhone?: string;
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: 'ENTERPRISE',
        enterprise: {
          create: {
            name: data.name,
            description: data.description,
            sector: data.sector,
            location: data.location,
            website: data.website,
            contactEmail: data.contactEmail || data.email,
            contactPhone: data.contactPhone,
          },
        },
      },
      include: { enterprise: true },
    });

    return {
      message: 'Enterprise account created successfully',
      enterprise: user.enterprise
        ? {
            id: user.enterprise.id,
            name: user.enterprise.name,
            email: user.email,
            role: user.role,
          }
        : null,
    };
  }

  //////////////////////////////
  // Get Enterprise Profile
  //////////////////////////////
  async getProfile(userId: number) {
    const enterprise = await this.prisma.enterprise.findUnique({
      where: { userId },
    });
    if (!enterprise) {
      throw new NotFoundException('Enterprise not found');
    }
    return enterprise;
  }

  //////////////////////////////
  // Update Enterprise Profile
  //////////////////////////////
  async updateProfile(userId: number, data: any) {
    const enterprise = await this.prisma.enterprise.findUnique({
      where: { userId },
    });
    if (!enterprise) {
      throw new NotFoundException('Enterprise not found');
    }

    return this.prisma.enterprise.update({
      where: { userId },
      data: {
        name: data.name ?? enterprise.name,
        description: data.description ?? enterprise.description,
        sector: data.sector ?? enterprise.sector,
        location: data.location ?? enterprise.location,
        website: data.website ?? enterprise.website,
        contactEmail: data.contactEmail ?? enterprise.contactEmail,
        contactPhone: data.contactPhone ?? enterprise.contactPhone,
        logo: data.logo ?? enterprise.logo,
      },
    });
  }

  //////////////////////////////
  // Job Offers CRUD
  //////////////////////////////
  async getJobOffers(userId: number) {
    const enterprise = await this.prisma.enterprise.findUnique({
      where: { userId },
    });
    if (!enterprise) {
      throw new NotFoundException('Enterprise not found');
    }

    return this.prisma.jobOffer.findMany({
      where: { enterpriseId: enterprise.id },
      include: { requiredSkills: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJobOfferById(userId: number, offerId: number) {
    const enterprise = await this.prisma.enterprise.findUnique({
      where: { userId },
    });
    if (!enterprise) throw new NotFoundException('Enterprise not found');

    const offer = await this.prisma.jobOffer.findUnique({
      where: { id: offerId },
      include: { requiredSkills: true },
    });
    if (!offer) throw new NotFoundException('Job offer not found');
    if (offer.enterpriseId !== enterprise.id) {
      throw new ForbiddenException('Access denied');
    }

    return offer;
  }

  async createJobOffer(
    userId: number,
    data: {
      title: string;
      description: string;
      location?: string;
      contractType?: string;
      salary?: string;
      skills?: { name: string; level?: string }[];
    },
  ) {
    const enterprise = await this.prisma.enterprise.findUnique({
      where: { userId },
    });
    if (!enterprise) throw new NotFoundException('Enterprise not found');

    return this.prisma.jobOffer.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        contractType: data.contractType,
        salary: data.salary,
        enterpriseId: enterprise.id,
        requiredSkills: data.skills
          ? {
              create: data.skills.map((s) => ({
                name: s.name,
                level: s.level,
              })),
            }
          : undefined,
      },
      include: { requiredSkills: true },
    });
  }

  async updateJobOffer(
    userId: number,
    offerId: number,
    data: {
      title?: string;
      description?: string;
      location?: string;
      contractType?: string;
      salary?: string;
      isActive?: boolean;
      skills?: { name: string; level?: string }[];
    },
  ) {
    const enterprise = await this.prisma.enterprise.findUnique({
      where: { userId },
    });
    if (!enterprise) throw new NotFoundException('Enterprise not found');

    const offer = await this.prisma.jobOffer.findUnique({
      where: { id: offerId },
    });
    if (!offer) throw new NotFoundException('Job offer not found');
    if (offer.enterpriseId !== enterprise.id) {
      throw new ForbiddenException('Access denied');
    }

    // If skills provided, replace them
    if (data.skills) {
      await this.prisma.requiredSkill.deleteMany({
        where: { jobOfferId: offerId },
      });
      await this.prisma.requiredSkill.createMany({
        data: data.skills.map((s) => ({
          name: s.name,
          level: s.level,
          jobOfferId: offerId,
        })),
      });
    }

    return this.prisma.jobOffer.update({
      where: { id: offerId },
      data: {
        title: data.title ?? offer.title,
        description: data.description ?? offer.description,
        location: data.location ?? offer.location,
        contractType: data.contractType ?? offer.contractType,
        salary: data.salary ?? offer.salary,
        isActive: data.isActive ?? offer.isActive,
      },
      include: { requiredSkills: true },
    });
  }

  async deleteJobOffer(userId: number, offerId: number) {
    const enterprise = await this.prisma.enterprise.findUnique({
      where: { userId },
    });
    if (!enterprise) throw new NotFoundException('Enterprise not found');

    const offer = await this.prisma.jobOffer.findUnique({
      where: { id: offerId },
    });
    if (!offer) throw new NotFoundException('Job offer not found');
    if (offer.enterpriseId !== enterprise.id) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.requiredSkill.deleteMany({
      where: { jobOfferId: offerId },
    });
    await this.prisma.jobOffer.delete({ where: { id: offerId } });

    return { message: 'Job offer deleted successfully' };
  }

  //////////////////////////////
  // Matching: Find compatible students
  //////////////////////////////
  async getCompatibleStudents(userId: number, offerId: number) {
    const enterprise = await this.prisma.enterprise.findUnique({
      where: { userId },
    });
    if (!enterprise) throw new NotFoundException('Enterprise not found');

    const offer = await this.prisma.jobOffer.findUnique({
      where: { id: offerId },
      include: { requiredSkills: true },
    });
    if (!offer) throw new NotFoundException('Job offer not found');
    if (offer.enterpriseId !== enterprise.id) {
      throw new ForbiddenException('Access denied');
    }

    const requiredSkillNames = offer.requiredSkills.map((s) =>
      s.name.toLowerCase(),
    );

    // Get all students with their skills
    const students = await this.prisma.student.findMany({
      include: {
        skills: true,
        user: true,
      },
    });

    // Calculate compatibility percentage for each student
    const compatibleStudents = students.map((student) => {
      const studentSkillNames = student.skills.map((s) =>
        s.name.toLowerCase(),
      );

      if (requiredSkillNames.length === 0) {
        return { student, compatibility: 0 };
      }

      const matchedSkills = requiredSkillNames.filter((rs) =>
        studentSkillNames.some((ss) => ss.includes(rs) || rs.includes(ss)),
      ).length;

      const compatibility = Math.round(
        (matchedSkills / requiredSkillNames.length) * 100,
      );

      return { student, compatibility };
    });

    // Sort by compatibility descending, filter > 0
    return compatibleStudents
      .filter((cs) => cs.compatibility > 0)
      .sort((a, b) => b.compatibility - a.compatibility)
      .map((cs) => ({
        id: cs.student.id,
        name: cs.student.name,
        bacType: cs.student.bacType,
        bacAverage: cs.student.bacAverage,
        skills: cs.student.skills,
        compatibility: cs.compatibility,
      }));
  }

  //////////////////////////////
  // Statistics per domain
  //////////////////////////////
  async getStudentStatistics(userId: number) {
    const enterprise = await this.prisma.enterprise.findUnique({
      where: { userId },
    });
    if (!enterprise) throw new NotFoundException('Enterprise not found');

    const students = await this.prisma.student.findMany({
      include: { skills: true },
    });

    const totalStudents = students.length;

    // Stats by BacType
    const byBacType = students.reduce(
      (acc, s) => {
        const type = s.bacType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Stats by domain (using interests)
    const domains = students
      .filter((s) => s.interests)
      .flatMap((s) => s.interests!.split(',').map((i) => i.trim()));

    const byDomain = domains.reduce(
      (acc, d) => {
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Top skills across all students
    const allSkills = students.flatMap((s) => s.skills.map((sk) => sk.name));
    const topSkills = allSkills.reduce(
      (acc, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalStudents,
      byBacType,
      byDomain: Object.entries(byDomain)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([domain, count]) => ({ domain, count })),
      topSkills: Object.entries(topSkills)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([skill, count]) => ({ skill, count })),
    };
  }
}