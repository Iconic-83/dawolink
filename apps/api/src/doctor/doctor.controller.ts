import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DoctorService } from "./doctor.service";
import { DoctorJwtGuard } from "./doctor-jwt.guard";

@ApiTags("Doctor Portal")
@Controller({ path: "doctor", version: "1" })
export class DoctorController {
  constructor(private readonly svc: DoctorService) {}

  @Post("auth/login")
  login(@Body() body: { phone: string; password: string }) {
    return this.svc.login(body.phone, body.password);
  }

  @Get("auth/me")
  @UseGuards(DoctorJwtGuard)
  @ApiBearerAuth()
  me(@Req() req: any) {
    return this.svc.getMe(req.doctor.id);
  }

  // ── Admin: create doctor accounts ─────────────────────────────────────────
  @Post("register")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  register(@Body() dto: {
    name: string; licenseNumber: string; specialty?: string;
    phone: string; email?: string; password: string;
    clinicName?: string; clinicCity?: string;
  }) {
    return this.svc.createDoctor(dto);
  }

  // ── Doctor: manage prescriptions ─────────────────────────────────────────
  @Post("prescriptions")
  @UseGuards(DoctorJwtGuard)
  @ApiBearerAuth()
  createPrescription(@Req() req: any, @Body() dto: any) {
    return this.svc.createPrescription(req.doctor.id, dto);
  }

  @Get("prescriptions")
  @UseGuards(DoctorJwtGuard)
  @ApiBearerAuth()
  myPrescriptions(@Req() req: any) {
    return this.svc.getDoctorPrescriptions(req.doctor.id);
  }

  // ── Pharmacist: look up & dispense ───────────────────────────────────────
  @Get("prescriptions/patient")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  byPatient(@Query("phone") phone: string) {
    return this.svc.getPrescriptionByPatient(phone);
  }

  @Get("prescriptions/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getOne(@Param("id") id: string) {
    return this.svc.getPrescription(id);
  }

  @Patch("prescriptions/:id/dispense")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  dispense(@Param("id") id: string, @Req() req: any) {
    return this.svc.dispensePrescription(id, req.user.id);
  }
}
