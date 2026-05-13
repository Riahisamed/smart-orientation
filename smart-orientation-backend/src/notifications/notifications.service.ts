import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Notifications Service (Enhanced)
 * Supports priorities, types, scheduling, and automatic notifications
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Get notifications for the current user */
  async mine(userId: number) {
    const student = await this.prisma.student.findFirst({
      where: { userId },
    });
    return this.prisma.notification.findMany({
      where: { OR: [{ studentId: student?.id }, { studentId: null }] },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  /** Get unread count */
  async unreadCount(userId: number) {
    const student = await this.prisma.student.findFirst({
      where: { userId },
    });
    if (!student) return { count: 0 };

    const count = await this.prisma.notification.count({
      where: {
        OR: [{ studentId: student.id }, { studentId: null }],
        readAt: null,
      },
    });
    return { count };
  }

  /** Mark notification as read */
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

  /** Mark all notifications as read for user */
  async markAllRead(userId: number) {
    const student = await this.prisma.student.findFirst({
      where: { userId },
    });
    if (!student) return { count: 0 };

    const result = await this.prisma.notification.updateMany({
      where: {
        OR: [{ studentId: student.id }, { studentId: null }],
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return { count: result.count };
  }

  /** Create a notification */
  async create(body: {
    studentId?: number;
    title: string;
    message: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    type?: 'GENERAL' | 'RECOMMENDATION' | 'REMINDER' | 'NEW_FILIERE' | 'MARKET_UPDATE' | 'JOB_ALERT';
    link?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        studentId: body.studentId ?? null,
        title: body.title,
        message: body.message,
        priority: body.priority ?? 'MEDIUM',
        type: body.type ?? 'GENERAL',
        link: body.link ?? null,
      },
    });
  }

  /** Create notification for all students */
  async broadcast(body: {
    title: string;
    message: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    type?: 'GENERAL' | 'RECOMMENDATION' | 'REMINDER' | 'NEW_FILIERE' | 'MARKET_UPDATE' | 'JOB_ALERT';
    link?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        studentId: null, // null = broadcast to all
        title: body.title,
        message: body.message,
        priority: body.priority ?? 'MEDIUM',
        type: body.type ?? 'GENERAL',
        link: body.link ?? null,
      },
    });
  }

  /** Delete a notification */
  async delete(id: number, userId: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!notification) throw new ForbiddenException('Notification not found');
    if (
      notification.student?.userId &&
      notification.student.userId !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.notification.delete({ where: { id } });
  }

  /** Get notifications by type */
  async getByType(userId: number, type: string) {
    const student = await this.prisma.student.findFirst({
      where: { userId },
    });
    return this.prisma.notification.findMany({
      where: {
        OR: [{ studentId: student?.id }, { studentId: null }],
        type: type as any,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  //////////////////////////////
  // Automatic Notification Triggers
  //////////////////////////////

  /** Auto-generate recommendations notification for a student */
  async notifyRecommendation(studentId: number, filiereCode: string, filiereName: string) {
    return this.create({
      studentId,
      title: '🎯 Nouvelle Recommandation',
      message: `Une nouvelle filière vous a été recommandée : ${filiereName} (${filiereCode})`,
      priority: 'HIGH',
      type: 'RECOMMENDATION',
      link: `/orientation`,
    });
  }

  /** Remind student to take orientation test */
  async remindOrientationTest(studentId: number, studentName: string) {
    return this.create({
      studentId,
      title: '⏰ Rappel : Test d\'Orientation',
      message: `${studentName}, n'oubliez pas de passer votre test d'orientation pour découvrir les filières qui vous correspondent.`,
      priority: 'MEDIUM',
      type: 'REMINDER',
      link: `/orientation-test`,
    });
  }

  /** Notify about new filieres available */
  async notifyNewFiliere(studentId: number | null, filiereName: string) {
    const data = {
      studentId: studentId ?? undefined,
      title: '📚 Nouvelle Filière Disponible',
      message: `La filière "${filiereName}" est maintenant disponible sur la plateforme.`,
      priority: 'MEDIUM' as const,
      type: 'NEW_FILIERE' as const,
      link: '/orientation',
    };
    return this.prisma.notification.create({
      data: {
        studentId: data.studentId ?? null,
        title: data.title,
        message: data.message,
        priority: data.priority,
        type: data.type,
        link: data.link,
      },
    });
  }

  /** Notify about market updates */
  async notifyMarketUpdate(studentId: number | null, domain: string, demand: string) {
    const data = {
      studentId: studentId ?? undefined,
      title: '📈 Mise à Jour du Marché',
      message: `Le domaine "${domain}" est actuellement en "${demand}" demande. Consultez les tendances du marché.`,
      priority: 'LOW' as const,
      type: 'MARKET_UPDATE' as const,
      link: '/market-trends',
    };
    return this.prisma.notification.create({
      data: {
        studentId: data.studentId ?? null,
        title: data.title,
        message: data.message,
        priority: data.priority,
        type: data.type,
        link: data.link,
      },
    });
  }

  /** Notify about new job offer matching */
  async notifyJobAlert(studentId: number, offerTitle: string, enterpriseName: string) {
    return this.create({
      studentId,
      title: '💼 Offre d\'Emploi Correspondante',
      message: `L'entreprise "${enterpriseName}" cherche un "${offerTitle}" - votre profil pourrait correspondre !`,
      priority: 'HIGH',
      type: 'JOB_ALERT',
      link: '/enterprise/offers',
    });
  }
}