import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_TENANT_ID } from '@phone-marketplace/shared';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({
      where: { slug },
    });
  }

  async getDefaultTenantId(): Promise<string> {
    return DEFAULT_TENANT_ID;
  }
}
