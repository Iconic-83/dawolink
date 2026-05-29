import { Controller, Get, Post, Body, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TransferService, CreateTransferDto } from "./transfer.service";

@ApiTags("Stock Transfers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("v1/transfers")
export class TransferController {
  constructor(private transfers: TransferService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateTransferDto) {
    return this.transfers.create(req.user.pharmacyId, req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.transfers.getAll(req.user.pharmacyId);
  }

  @Get(":id")
  findOne(@Req() req: any, @Param("id") id: string) {
    return this.transfers.getOne(req.user.pharmacyId, id);
  }
}
