import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async mine(userId: number) {
    const student = await this.prisma.student.findFirst({ where: { userId } });
    return this.prisma.notification.findMany({
      where: { OR: [{ studentId: student?.id }, { studentId: null }] },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async markRead(id: number, userId: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: { student: true },
    });
    if (
      notification?.student?.userId &&
      notification.student.userId !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  create(body: { studentId?: number; title: string; message: string }) {
    return this.prisma.notification.create({
      data: {
        studentId: body.studentId ?? null,
        title: body.title,
        message: body.message,
      },
    });
  }
}
