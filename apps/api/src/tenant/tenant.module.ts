import { Module, Global } from "@nestjs/common";
import { TenantService } from "./tenant.service";
import { TenantGuard } from "./tenant.guard";
import { TenantController } from "./tenant.controller";

@Global()
@Module({
  controllers: [TenantController],
  providers: [TenantService, TenantGuard],
  exports: [TenantService, TenantGuard],
})
export class TenantModule {}
