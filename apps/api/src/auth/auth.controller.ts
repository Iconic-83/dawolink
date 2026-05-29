import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Req, Param } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";
import { AcceptInviteDto } from "./dto/accept-invite.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("Auth")
@Controller("v1/auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("signup")
  @ApiOperation({ summary: "Self-serve signup — creates pharmacy + owner + 14-day free trial" })
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Post("register")
  @ApiOperation({ summary: "Register a new user (requires existing pharmacyId)" })
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

  @Get("invite/:token")
  @ApiOperation({ summary: "Get invite details by token (public)" })
  getInvite(@Param("token") token: string) {
    return this.auth.getInvite(token);
  }

  @Post("accept-invite")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Accept a staff invite and create account" })
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.auth.acceptInvite(dto);
  }
}
