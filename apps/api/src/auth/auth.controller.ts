import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("Auth")
@Controller("v1/auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login and receive JWT" })
  login(@Body() dto: LoginDto, @Req() req: any) {
    dto.ipAddress = req.ip;
    return this.auth.login(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  me(@Req() req: any) {
    return req.user;
  }
}
