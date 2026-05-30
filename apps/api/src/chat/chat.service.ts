import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { Subject } from "rxjs";
import { filter, map } from "rxjs/operators";
import { MessageEvent } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";

interface ChatEvent { roomId: string; message: any }

@Injectable()
export class ChatService {
  private readonly bus$ = new Subject<ChatEvent>();

  constructor(private prisma: PrismaService) {}

  // ── Room ──────────────────────────────────────────────────────────────────

  async getOrCreateRoom(orderId: string) {
    const existing = await this.prisma.chatRoom.findUnique({ where: { orderId } });
    if (existing) return existing;
    return this.prisma.chatRoom.create({ data: { orderId } });
  }

  async getMessages(orderId: string, limit = 50) {
    const room = await this.prisma.chatRoom.findUnique({ where: { orderId } });
    if (!room) return [];
    return this.prisma.chatMessage.findMany({
      where: { roomId: room.id },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  // ── Send ──────────────────────────────────────────────────────────────────

  async sendMessage(orderId: string, senderId: string, senderType: "CUSTOMER" | "PHARMACY", content: string, imageUrl?: string) {
    const room = await this.getOrCreateRoom(orderId);
    const message = await this.prisma.chatMessage.create({
      data: { roomId: room.id, senderId, senderType, content, imageUrl: imageUrl ?? null },
    });
    this.bus$.next({ roomId: room.id, message });
    return message;
  }

  async markRead(orderId: string, readerType: "CUSTOMER" | "PHARMACY") {
    const room = await this.prisma.chatRoom.findUnique({ where: { orderId } });
    if (!room) return;
    const now = new Date();
    await this.prisma.chatMessage.updateMany({
      where: {
        roomId: room.id,
        readAt: null,
        senderType: readerType === "CUSTOMER" ? "PHARMACY" : "CUSTOMER",
      },
      data: { readAt: now },
    });
  }

  async getUnreadCount(orderId: string, readerType: "CUSTOMER" | "PHARMACY") {
    const room = await this.prisma.chatRoom.findUnique({ where: { orderId } });
    if (!room) return { count: 0 };
    const count = await this.prisma.chatMessage.count({
      where: {
        roomId: room.id,
        readAt: null,
        senderType: readerType === "CUSTOMER" ? "PHARMACY" : "CUSTOMER",
      },
    });
    return { count };
  }

  // ── SSE stream ────────────────────────────────────────────────────────────

  getStream(roomId: string) {
    return this.bus$.pipe(
      filter(e => e.roomId === roomId),
      map(e => ({ data: JSON.stringify(e.message) } as MessageEvent)),
    );
  }

  async getRoomId(orderId: string) {
    const room = await this.prisma.chatRoom.findUnique({ where: { orderId } });
    return room?.id ?? null;
  }
}
