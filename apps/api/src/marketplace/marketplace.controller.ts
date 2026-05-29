import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { MarketplaceService } from "./marketplace.service";

@ApiTags("Marketplace")
@Controller("v1/marketplace")
export class MarketplaceController {
  constructor(private service: MarketplaceService) {}

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
