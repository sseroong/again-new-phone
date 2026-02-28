import { Module } from "@nestjs/common";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminDashboardService } from "./admin-dashboard.service";
import { AdminProductsController } from "./admin-products.controller";
import { AdminProductsService } from "./admin-products.service";
import { AdminOrdersController } from "./admin-orders.controller";
import { AdminOrdersService } from "./admin-orders.service";
import { AdminSellRequestsController } from "./admin-sell-requests.controller";
import { AdminSellRequestsService } from "./admin-sell-requests.service";
import { AdminUsersController } from "./admin-users.controller";
import { AdminUsersService } from "./admin-users.service";
import { AdminCmsController } from "./admin-cms.controller";
import { AdminCmsService } from "./admin-cms.service";
import { AdminMetadataController } from "./admin-metadata.controller";
import { AdminMetadataService } from "./admin-metadata.service";

@Module({
  controllers: [
    AdminDashboardController,
    AdminProductsController,
    AdminOrdersController,
    AdminSellRequestsController,
    AdminUsersController,
    AdminCmsController,
    AdminMetadataController,
  ],
  providers: [
    AdminDashboardService,
    AdminProductsService,
    AdminOrdersService,
    AdminSellRequestsService,
    AdminUsersService,
    AdminCmsService,
    AdminMetadataService,
  ],
})
export class AdminModule {}
