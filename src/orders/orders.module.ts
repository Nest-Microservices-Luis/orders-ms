import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from '../prisma.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs, PRODUCTS_SERVICE } from 'src/config';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
  imports: [
    ClientsModule.register([
      {
        name: PRODUCTS_SERVICE,
        transport: Transport.TCP,
        options: {
          host: envs.PRODUCTS_SERVICE_HOST,
          port: envs.PRODUCTS_SERVICE_PORT,
        },
      },
    ]),
  ]
})
export class OrdersModule {}
