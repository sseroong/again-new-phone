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

  async findByDomain(domain: string) {
    return this.prisma.tenant.findUnique({
      where: { domain },
    });
  }

  async getDefaultTenantId(): Promise<string> {
    return DEFAULT_TENANT_ID;
  }

  async resolve(domain?: string, slug?: string) {
    if (domain) {
      const tenant = await this.findByDomain(domain);
      if (tenant && tenant.isActive) return tenant;
    }
    if (slug) {
      const tenant = await this.findBySlug(slug);
      if (tenant && tenant.isActive) return tenant;
    }
    return this.findById(DEFAULT_TENANT_ID);
  }
}
