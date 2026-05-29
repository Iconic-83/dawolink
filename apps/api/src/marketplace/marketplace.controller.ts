import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, Req, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { MarketplaceService } from "./marketplace.service";
import { CustomerGuard } from "./guards/customer.guard";
import { CustomerRegisterDto } from "./dto/customer-register.dto";
import { CustomerLoginDto } from "./dto/customer-login.dto";

@ApiTags("Marketplace")
@Controller("v1/marketplace")
export class MarketplaceController {
  constructor(private service: MarketplaceService) {}

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
}
