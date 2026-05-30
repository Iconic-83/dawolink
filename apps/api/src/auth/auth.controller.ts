import { Controller, Post, Get, Delete, Body, HttpCode, HttpStatus, UseGuards, Req, Param } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";
import { AcceptInviteDto } from "./dto/accept-invite.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
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

  // ── 2FA ───────────────────────────────────────────────────────────────────

  @Post("verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Submit 2FA OTP to complete login" })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto);
  }

  @Get("2fa/status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get 2FA status for current user" })
  get2FAStatus(@Req() req: any) {
    return this.auth.get2FAStatus(req.user.id);
  }

  @Post("2fa/enable")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Initiate 2FA enable — sends OTP to email" })
  enable2FA(@Req() req: any) {
    return this.auth.enable2FA(req.user.id);
  }

  @Post("2fa/confirm")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Confirm OTP to activate 2FA" })
  confirm2FA(@Req() req: any, @Body("otp") otp: string) {
    return this.auth.confirm2FA(req.user.id, otp);
  }

  @Delete("2fa/disable")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Disable 2FA for current user" })
  disable2FA(@Req() req: any) {
    return this.auth.disable2FA(req.user.id);
  }
}
