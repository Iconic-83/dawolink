import { Controller, Get, Patch, Param, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { InboxService } from "./inbox.service";

@ApiTags("Inbox")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("v1/inbox")
export class InboxController {
  constructor(private inbox: InboxService) {}

  @Get()
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "unreadOnly", required: false, type: Boolean })
  list(
    @Req() req: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("unreadOnly") unreadOnly?: string,
  ) {
    return this.inbox.list(
      req.user.pharmacyId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      unreadOnly === "true",
    );
  }

  @Get("unread-count")
  unreadCount(@Req() req: any) {
    return this.inbox.getUnreadCount(req.user.pharmacyId);
  }

  @Patch("read-all")
  markAllRead(@Req() req: any) {
    return this.inbox.markAllRead(req.user.pharmacyId);
  }

  @Patch(":id/read")
  markRead(@Req() req: any, @Param("id") id: string) {
    return this.inbox.markRead(req.user.pharmacyId, id);
  }
}
