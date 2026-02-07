import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';
import { TENANT_HEADER } from '@phone-marketplace/shared';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers[TENANT_HEADER] as string;

    if (tenantId) {
      const tenant = await this.tenantService.findById(tenantId);
      if (tenant && tenant.isActive) {
        (req as any).tenantId = tenant.id;
      } else {
        (req as any).tenantId = await this.tenantService.getDefaultTenantId();
      }
    } else {
      (req as any).tenantId = await this.tenantService.getDefaultTenantId();
    }

    next();
  }
}
