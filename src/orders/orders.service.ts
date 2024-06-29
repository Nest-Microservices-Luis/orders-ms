import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { OrderPaginationDto, UpdateStatusOrderDto } from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('Orders-Service');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Databse connected.');
  }

  create(createOrderDto: CreateOrderDto) {
    return this.order.create({
      data: createOrderDto,
    });
  }

  async findAll(paginationDto: OrderPaginationDto) {
    const { page, limit } = paginationDto;

    const totalItems = await this.order.count({
      where: { status: paginationDto.status },
    });

    const lastPage = Math.ceil(totalItems / limit);

    return {
      data: await this.order.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { status: paginationDto.status },
      }),
      meta: {
        total: totalItems,
        page,
        lastPage,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({ where: { id } });

    if (!order) {
      throw new RpcException({
        message: `Order with id: ${id} not found`,
        status: HttpStatus.NOT_FOUND,
      });
    }

    return order;
  }

  async changeStatus(updateStatusOrderDto: UpdateStatusOrderDto) {
    const { id, status } = updateStatusOrderDto;
    const order = await this.findOne(id);

    if (order.status === status) {
      return order;
    }

    return await this.order.update({
      where: { id },
      data: { status },
    });
  }
}
