import { Module } from "@nestjs/common";
import { SuperAdminTenantsController } from "./super-admin-tenants.controller";
import { SuperAdminTenantsService } from "./super-admin-tenants.service";
import { SuperAdminUsersController } from "./super-admin-users.controller";
import { SuperAdminUsersService } from "./super-admin-users.service";
import { SuperAdminDashboardController } from "./super-admin-dashboard.controller";
import { SuperAdminDashboardService } from "./super-admin-dashboard.service";

@Module({
  controllers: [
    SuperAdminTenantsController,
    SuperAdminUsersController,
    SuperAdminDashboardController,
  ],
  providers: [
    SuperAdminTenantsService,
    SuperAdminUsersService,
    SuperAdminDashboardService,
  ],
})
export class SuperAdminModule {}
