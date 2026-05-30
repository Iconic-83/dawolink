import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../common/database/prisma.service";

@Injectable()
export class DoctorService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // ── Auth ──────────────────────────────────────────────────────────────────
  async login(phone: string, password: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { phone } });
    if (!doctor || !doctor.isActive) throw new UnauthorizedException("Invalid credentials");
    const valid = await bcrypt.compare(password, doctor.password);
    if (!valid) throw new UnauthorizedException("Invalid credentials");
    const { password: _, ...safe } = doctor;
    const token = this.jwt.sign({ sub: doctor.id, role: "DOCTOR" });
    return { doctor: safe, token };
  }

  async createDoctor(dto: {
    name: string;
    licenseNumber: string;
    specialty?: string;
    phone: string;
    email?: string;
    password: string;
    clinicName?: string;
    clinicCity?: string;
  }) {
    const hashed = await bcrypt.hash(dto.password, 10);
    const doctor = await this.prisma.doctor.create({
      data: { ...dto, password: hashed },
    });
    const { password: _, ...safe } = doctor;
    return safe;
  }

  async getMe(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException("Doctor not found");
    const { password: _, ...safe } = doctor;
    return safe;
  }

  // ── Electronic Prescriptions ──────────────────────────────────────────────
  async createPrescription(doctorId: string, dto: {
    patientName: string;
    patientPhone: string;
    patientAge?: number;
    diagnosis?: string;
    medicines: { name: string; dosage: string; frequency: string; duration: string; quantity: number }[];
    notes?: string;
    validDays?: number;
  }) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (dto.validDays ?? 30));

    return this.prisma.electronicPrescription.create({
      data: {
        doctorId,
        patientName: dto.patientName,
        patientPhone: dto.patientPhone,
        patientAge: dto.patientAge,
        diagnosis: dto.diagnosis,
        medicines: dto.medicines as any,
        notes: dto.notes,
        expiresAt,
      },
      include: { doctor: { select: { name: true, specialty: true, clinicName: true, licenseNumber: true } } },
    });
  }

  async getDoctorPrescriptions(doctorId: string) {
    return this.prisma.electronicPrescription.findMany({
      where: { doctorId },
      orderBy: { issuedAt: "desc" },
      include: { doctor: { select: { name: true, specialty: true } } },
    });
  }

  async getPrescriptionByPatient(patientPhone: string) {
    return this.prisma.electronicPrescription.findMany({
      where: {
        patientPhone,
        status: "ISSUED",
        expiresAt: { gte: new Date() },
      },
      include: { doctor: { select: { name: true, specialty: true, clinicName: true, clinicCity: true } } },
      orderBy: { issuedAt: "desc" },
    });
  }

  async dispensePrescription(prescriptionId: string, dispensedById: string) {
    const rx = await this.prisma.electronicPrescription.findUnique({ where: { id: prescriptionId } });
    if (!rx) throw new NotFoundException("Prescription not found");
    if (rx.status !== "ISSUED") throw new BadRequestException(`Prescription is ${rx.status.toLowerCase()}`);
    if (rx.expiresAt < new Date()) throw new BadRequestException("Prescription has expired");

    return this.prisma.electronicPrescription.update({
      where: { id: prescriptionId },
      data: { status: "DISPENSED", dispensedAt: new Date(), dispensedBy: dispensedById },
    });
  }

  async getPrescription(id: string) {
    const rx = await this.prisma.electronicPrescription.findUnique({
      where: { id },
      include: { doctor: { select: { name: true, specialty: true, clinicName: true, clinicCity: true, licenseNumber: true } } },
    });
    if (!rx) throw new NotFoundException("Prescription not found");
    return rx;
  }
}
