import { Controller, Get, Post, Patch, Body, Param, Query, Req, Sse, UseGuards, MessageEvent } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Observable } from "rxjs";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CustomerGuard } from "../marketplace/guards/customer.guard";
import { ChatService } from "./chat.service";

@ApiTags("Chat")
@Controller("v1/chat")
export class ChatController {
  constructor(private chat: ChatService) {}

  // ── Pharmacy staff endpoints (JWT) ────────────────────────────────────────

  @Get("order/:orderId/messages")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get messages for an order (pharmacy staff)" })
  getMessages(@Param("orderId") orderId: string) {
    return this.chat.getMessages(orderId);
  }

  @Post("order/:orderId/messages")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Send message as pharmacy staff" })
  sendAsPharmacy(@Req() req: any, @Param("orderId") orderId: string, @Body("content") content: string) {
    return this.chat.sendMessage(orderId, req.user.id, "PHARMACY", content);
  }

  @Patch("order/:orderId/read")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Mark messages as read (pharmacy)" })
  markReadPharmacy(@Param("orderId") orderId: string) {
    return this.chat.markRead(orderId, "PHARMACY");
  }

  @Get("order/:orderId/unread")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Unread count for pharmacy" })
  unreadPharmacy(@Param("orderId") orderId: string) {
    return this.chat.getUnreadCount(orderId, "PHARMACY");
  }

  @Sse("order/:orderId/stream")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "SSE stream for pharmacy chat" })
  async streamPharmacy(@Param("orderId") orderId: string): Promise<Observable<MessageEvent>> {
    const room = await this.chat.getOrCreateRoom(orderId);
    return this.chat.getStream(room.id);
  }

  // ── Customer endpoints (customer JWT) ─────────────────────────────────────

  @Get("customer/order/:orderId/messages")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiOperation({ summary: "Get messages for an order (customer)" })
  getMessagesCustomer(@Param("orderId") orderId: string) {
    return this.chat.getMessages(orderId);
  }

  @Post("customer/order/:orderId/messages")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiOperation({ summary: "Send message as customer" })
  sendAsCustomer(@Req() req: any, @Param("orderId") orderId: string, @Body("content") content: string) {
    return this.chat.sendMessage(orderId, req.user.id, "CUSTOMER", content);
  }

  @Patch("customer/order/:orderId/read")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiOperation({ summary: "Mark messages as read (customer)" })
  markReadCustomer(@Param("orderId") orderId: string) {
    return this.chat.markRead(orderId, "CUSTOMER");
  }

  @Get("customer/order/:orderId/unread")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiOperation({ summary: "Unread count for customer" })
  unreadCustomer(@Param("orderId") orderId: string) {
    return this.chat.getUnreadCount(orderId, "CUSTOMER");
  }

  @Sse("customer/order/:orderId/stream")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiOperation({ summary: "SSE stream for customer chat" })
  async streamCustomer(@Param("orderId") orderId: string): Promise<Observable<MessageEvent>> {
    const room = await this.chat.getOrCreateRoom(orderId);
    return this.chat.getStream(room.id);
  }
}
