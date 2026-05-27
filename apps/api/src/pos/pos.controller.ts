import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PosService } from "./pos.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";

@ApiTags("POS")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("v1/pos")
export class PosController {
  constructor(private pos: PosService) {}

  @Post("branches/:branchId/transactions")
  createTransaction(
    @Param("branchId") branchId: string,
    @Req() req: any,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.pos.createTransaction(branchId, req.user.id, dto);
  }

  @Get("branches/:branchId/transactions")
  @ApiQuery({ name: "from", required: false })
  @ApiQuery({ name: "to", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number })
  getTransactions(
    @Param("branchId") branchId: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("limit") limit?: number,
  ) {
    return this.pos.getTransactions(branchId, { from, to, limit });
  }

  @Get("branches/:branchId/summary")
  @ApiQuery({ name: "date", required: false })
  getDailySummary(@Param("branchId") branchId: string, @Query("date") date?: string) {
    return this.pos.getDailySummary(branchId, date);
  }
}
