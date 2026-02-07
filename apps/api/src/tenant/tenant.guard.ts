import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.tenantId;

    // Public 엔드포인트 (user가 없는 경우)는 통과
    if (!user) {
      return true;
    }

    // SUPER_ADMIN은 모든 테넌트 접근 가능
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    if (!tenantId) {
      throw new ForbiddenException('테넌트 정보가 없습니다.');
    }

    // UserTenant 테이블에서 소속 확인
    const userTenant = await this.prisma.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId,
        },
      },
    });

    if (!userTenant || !userTenant.isActive) {
      throw new ForbiddenException('해당 테넌트에 대한 접근 권한이 없습니다.');
    }

    return true;
  }
}
