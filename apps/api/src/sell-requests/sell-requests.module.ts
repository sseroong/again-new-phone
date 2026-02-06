import { Module } from '@nestjs/common';
import { SellRequestsController } from './sell-requests.controller';
import { SellRequestsService } from './sell-requests.service';

@Module({
  controllers: [SellRequestsController],
  providers: [SellRequestsService],
  exports: [SellRequestsService],
})
export class SellRequestsModule {}
