import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { SellRequestsModule } from './sell-requests/sell-requests.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PricesModule } from './prices/prices.module';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    // 환경 변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),

    // 데이터베이스
    PrismaModule,

    // 기능 모듈
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    SellRequestsModule,
    ReviewsModule,
    PricesModule,
    AdminModule,
  ],
  providers: [
    // 전역 JWT 인증 가드
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
