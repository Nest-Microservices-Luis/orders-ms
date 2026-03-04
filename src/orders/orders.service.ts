import { HttpStatus, Inject, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/prisma.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { OrderStatus } from '@prisma/client';
import { ChangeOrderStatusDto } from './dto';
import { PRODUCTS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PRODUCTS_SERVICE) private readonly productsClient: ClientProxy
  ) { }

  private readonly logger = new Logger('OrdersService');
  

  async create(createOrderDto: CreateOrderDto) {

    const products = await firstValueFrom(this.productsClient.send({ cmd: 'validate_products' }, createOrderDto.items.map(item => item.productId)));
    return products;

    // return {
    //   service: 'orders',
    //   createOrderDto: createOrderDto,
    // }

    // return this.prisma.order.create({
    //   data: createOrderDto,
    // });
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const totalPages = await this.prisma.order.count({
      where: {
        status: orderPaginationDto.status,
      },
    });
    const currentPage = orderPaginationDto.page || 1;
    const perPage = orderPaginationDto.limit || 10;
    return {
      data: await this.prisma.order.findMany({
        skip: (currentPage - 1) * perPage,
        take: perPage,
        where: {
          status: orderPaginationDto.status,
        },
      }),
      meta: {
        total: totalPages,
        page: currentPage,
        lastPage: Math.ceil(totalPages / perPage)

      }
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });
    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: 'Order not found',
      })
    }
    return order;

  }

  async changeStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    
    const { id, status } = changeOrderStatusDto;
    const order = await this.findOne(id);
    if (order.status === status) return order;
    
    return this.prisma.order.update({
      where: { id },
      data: { status: status },
    });


  }
}
