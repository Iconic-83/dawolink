import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CustomerService } from "./customer.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";

@ApiTags("Customers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("v1/customers")
export class CustomerController {
  constructor(private customers: CustomerService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateCustomerDto) {
    return this.customers.create(req.user.pharmacyId, dto);
  }

  @Get()
  @ApiQuery({ name: "search", required: false })
  findAll(@Req() req: any, @Query("search") search?: string) {
    return this.customers.findAll(req.user.pharmacyId, search);
  }

  @Get(":id")
  findOne(@Req() req: any, @Param("id") id: string) {
    return this.customers.findOne(req.user.pharmacyId, id);
  }

  @Patch(":id")
  update(@Req() req: any, @Param("id") id: string, @Body() dto: Partial<CreateCustomerDto>) {
    return this.customers.update(req.user.pharmacyId, id, dto);
  }
}
