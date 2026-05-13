import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SkillService {
  constructor(private prisma: PrismaService) {}

  async create(name: string) {
    return this.prisma.skill.create({
      data: { name },
    });
  }

  async findAll() {
    return this.prisma.skill.findMany();
  }
}
