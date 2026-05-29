import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../common/database/prisma.service";
import * as webpush from "web-push";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly log = new Logger(PushService.name);
  private enabled = false;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey  = this.config.get<string>("VAPID_PUBLIC_KEY");
    const privateKey = this.config.get<string>("VAPID_PRIVATE_KEY");
    const email      = this.config.get<string>("VAPID_EMAIL", "mailto:admin@dawolink.com");

    if (publicKey && privateKey) {
      webpush.setVapidDetails(email, publicKey, privateKey);
      this.enabled = true;
      this.log.log("Web Push (VAPID) configured");
    } else {
      this.log.warn("VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set — push notifications disabled");
    }
  }

  getPublicKey(): string | null {
    return this.config.get<string>("VAPID_PUBLIC_KEY") ?? null;
  }

  async saveSubscription(
    appUserId: string,
    endpoint: string,
    p256dh: string,
    auth: string,
    userAgent?: string,
  ) {
    return this.prisma.appPushSubscription.upsert({
      where: { endpoint },
      create: { appUserId, endpoint, p256dh, auth, userAgent },
      update: { appUserId, p256dh, auth, userAgent, updatedAt: new Date() },
    });
  }

  async deleteSubscription(endpoint: string) {
    await this.prisma.appPushSubscription.deleteMany({ where: { endpoint } });
  }

  async sendToUser(appUserId: string, payload: PushPayload): Promise<void> {
    if (!this.enabled) return;

    const subs = await this.prisma.appPushSubscription.findMany({
      where: { appUserId },
      select: { endpoint: true, p256dh: true, auth: true },
    });

    if (!subs.length) return;

    const notification = JSON.stringify({
      ...payload,
      icon:  payload.icon  ?? "/icon-512.png",
      badge: payload.badge ?? "/logo.png",
    });

    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification,
        ).catch(async (err: any) => {
          // 410 Gone = subscription expired; clean it up
          if (err.statusCode === 410) {
            await this.prisma.appPushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
          }
          throw err;
        }),
      ),
    );

    const failed = results.filter(r => r.status === "rejected").length;
    if (failed) this.log.warn(`${failed}/${subs.length} push(es) failed for user ${appUserId}`);
  }
}
