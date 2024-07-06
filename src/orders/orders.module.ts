import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PRODUCTS_SERVICE, envs } from 'src/config';

@Module({
  controllers: [OrdersController],
  imports: [
    ClientsModule.register([
      {
        name: PRODUCTS_SERVICE,
        transport: Transport.TCP,
        options: {
          host: envs.microservice_products_host,
          port: envs.microservice_products_port,
        },
      },
    ]),
  ],
  providers: [OrdersService],
})
export class OrdersModule {}
