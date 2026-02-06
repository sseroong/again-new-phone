import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminProductsController } from './admin-products.controller';
import { AdminProductsService } from './admin-products.service';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminOrdersService } from './admin-orders.service';
import { AdminSellRequestsController } from './admin-sell-requests.controller';
import { AdminSellRequestsService } from './admin-sell-requests.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  controllers: [
    AdminDashboardController,
    AdminProductsController,
    AdminOrdersController,
    AdminSellRequestsController,
    AdminUsersController,
  ],
  providers: [
    AdminDashboardService,
    AdminProductsService,
    AdminOrdersService,
    AdminSellRequestsService,
    AdminUsersService,
  ],
})
export class AdminModule {}
