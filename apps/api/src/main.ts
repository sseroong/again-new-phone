import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS 설정
  const corsOrigins = [
    process.env.WEB_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3002',
  ];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // 정적 파일 서빙 (업로드된 이미지)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // 글로벌 접두사
  app.setGlobalPrefix('api');

  // Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Phone Marketplace API')
    .setDescription('중고 전자기기 거래 플랫폼 API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', '인증')
    .addTag('users', '사용자')
    .addTag('products', '상품')
    .addTag('orders', '주문')
    .addTag('sell-requests', '판매 접수')
    .addTag('reviews', '리뷰')
    .addTag('prices', '시세')
    .addTag('admin-dashboard', '관리자 대시보드')
    .addTag('admin-products', '관리자 상품 관리')
    .addTag('admin-orders', '관리자 주문 관리')
    .addTag('admin-sell-requests', '관리자 판매접수 관리')
    .addTag('admin-users', '관리자 회원 관리')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 API Server running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
