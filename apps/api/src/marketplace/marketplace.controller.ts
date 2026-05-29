import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Req, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { MarketplaceService } from "./marketplace.service";
import { CustomerGuard } from "./guards/customer.guard";
import { PushService } from "../push/push.service";
import { CustomerRegisterDto } from "./dto/customer-register.dto";
import { CustomerLoginDto } from "./dto/customer-login.dto";
import { CreateOrderDto } from "./dto/create-order.dto";

@ApiTags("Marketplace")
@Controller("v1/marketplace")
export class MarketplaceController {
  constructor(
    private service: MarketplaceService,
    private push: PushService,
  ) {}

  // ── Auth ─────────────────────────────────────────────────────────────────

  @Post("auth/register")
  @ApiOperation({ summary: "Register a customer account" })
  register(@Body() dto: CustomerRegisterDto) {
    return this.service.register(dto);
  }

  @Post("auth/login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Customer login — returns JWT" })
  login(@Body() dto: CustomerLoginDto) {
    return this.service.login(dto);
  }

  @Get("auth/me")
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Current customer profile" })
  me(@Req() req: any) {
    const { passwordHash: _, ...safe } = req.user;
    return safe;
  }

  // ── Push Notifications ────────────────────────────────────────────────────

  @Get("push/vapid-public-key")
  @ApiOperation({ summary: "VAPID public key for push subscription (public)" })
  vapidKey() {
    return { key: this.push.getPublicKey() };
  }

  @Post("push/subscribe")
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Save push subscription for the current customer" })
  subscribe(
    @Req() req: any,
    @Body("endpoint") endpoint: string,
    @Body("p256dh") p256dh: string,
    @Body("auth") auth: string,
  ) {
    const ua = req.headers?.["user-agent"];
    return this.push.saveSubscription(req.user.id, endpoint, p256dh, auth, ua);
  }

  @Delete("push/unsubscribe")
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove push subscription" })
  unsubscribe(@Body("endpoint") endpoint: string) {
    return this.push.deleteSubscription(endpoint);
  }

  // ── Public medicine search & detail ──────────────────────────────────────

  @Get("search")
  @ApiOperation({ summary: "Search medicines available across pharmacies (public)" })
  @ApiQuery({ name: "q", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  search(
    @Query("q") q = "",
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    return this.service.searchMedicines(q, +page, Math.min(+limit, 50));
  }

  @Get("medicines/:id")
  @ApiOperation({ summary: "Medicine detail with pharmacy availability (public)" })
  detail(@Param("id") id: string) {
    return this.service.getMedicineDetail(id);
  }

  // ── Orders ────────────────────────────────────────────────────────────────

  @Post("orders")
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Place a medicine order" })
  createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.service.createOrder(req.user.id, dto);
  }

  @Get("orders")
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my orders" })
  getMyOrders(@Req() req: any) {
    return this.service.getMyOrders(req.user.id);
  }

  @Get("orders/:id")
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get single order detail" })
  getOrder(@Req() req: any, @Param("id") id: string) {
    return this.service.getOrderById(req.user.id, id);
  }

  @Patch("orders/:id/cancel")
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cancel a pending order" })
  cancelOrder(@Req() req: any, @Param("id") id: string) {
    return this.service.cancelOrder(req.user.id, id);
  }
}
