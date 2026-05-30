import { Injectable } from "@nestjs/common";
import { NotifType } from "@prisma/client";
import { PrismaService } from "../common/database/prisma.service";

@Injectable()
export class InboxService {
  constructor(private prisma: PrismaService) {}

  push(pharmacyId: string, type: NotifType, title: string, body: string, link?: string) {
    return this.prisma.inboxNotification.create({
      data: { pharmacyId, type, title, body, link: link ?? null },
    }).catch(() => {});
  }

  async list(pharmacyId: string, page = 1, limit = 20, unreadOnly = false) {
    const where = { pharmacyId, ...(unreadOnly ? { isRead: false } : {}) };
    const [items, total, unread] = await Promise.all([
      this.prisma.inboxNotification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inboxNotification.count({ where }),
      this.prisma.inboxNotification.count({ where: { pharmacyId, isRead: false } }),
    ]);
    return { items, total, unread, page, limit };
  }

  async getUnreadCount(pharmacyId: string) {
    const count = await this.prisma.inboxNotification.count({ where: { pharmacyId, isRead: false } });
    return { count };
  }

  markRead(pharmacyId: string, id: string) {
    return this.prisma.inboxNotification.updateMany({
      where: { id, pharmacyId },
      data: { isRead: true },
    });
  }

  markAllRead(pharmacyId: string) {
    return this.prisma.inboxNotification.updateMany({
      where: { pharmacyId, isRead: false },
      data: { isRead: true },
    });
  }
}
