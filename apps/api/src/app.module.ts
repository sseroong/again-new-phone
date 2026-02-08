import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ProductsModule } from "./products/products.module";
import { OrdersModule } from "./orders/orders.module";
import { SellRequestsModule } from "./sell-requests/sell-requests.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { PricesModule } from "./prices/prices.module";
import { AdminModule } from "./admin/admin.module";
import { SuperAdminModule } from "./super-admin/super-admin.module";
import { UploadModule } from "./upload/upload.module";
import { CmsModule } from "./cms/cms.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { TenantModule } from "./tenant/tenant.module";
import { TenantMiddleware } from "./tenant/tenant.middleware";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";

@Module({
  imports: [
    // 환경 변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === "production" ? undefined : "../../.env",
    }),

    // 데이터베이스
    PrismaModule,

    // 테넌트
    TenantModule,

    // 기능 모듈
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    SellRequestsModule,
    ReviewsModule,
    PricesModule,
    AdminModule,
    SuperAdminModule,
    UploadModule,
    CmsModule,
    HealthModule,
  ],
  providers: [
    // 전역 JWT 인증 가드
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes("*");
  }
}
