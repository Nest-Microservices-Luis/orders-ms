import { HttpStatus, Inject, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/prisma.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ChangeOrderStatusDto, OrderPaginationDto, PaidOrderDto } from './dto';
import { NATS_SERVICES } from 'src/config';
import { firstValueFrom } from 'rxjs';
import { OrderWithProducts } from './interfaces/order-with-products.interface';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(NATS_SERVICES) private readonly client: ClientProxy
  ) { }

  private readonly logger = new Logger('OrdersService');


  async create(createOrderDto: CreateOrderDto) {


    try {

      //1 Confirmar los ids de los productos
      const productIds = createOrderDto.items.map(item => item.productId);
      const products: any[] = await firstValueFrom(this.client.send({ cmd: 'validate_products' }, productIds));

      //2 Calculos de los valores
      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const price = products.find((product) => product.id === orderItem.productId,).price;
        return acc + (price * orderItem.quantity);

      }, 0);

      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);

      //3 crear transaccion de base de datos
      const order = await this.prisma.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => {
                const price = products.find((product) => product.id === orderItem.productId).price;
                return {
                  productId: orderItem.productId,
                  quantity: orderItem.quantity,
                  price,
                };
              }),
            }

          }
        },
        include: {
          OrderItem: {
            select: {
              productId: true,
              quantity: true,
              price: true,
            }
          }
        }
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((product) => product.id === orderItem.productId).name,
        })),
      }



    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Check the products',
      })
    }

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
      include: {
        OrderItem: {
          select: {
            price: true,
            productId: true,
            quantity: true,
          }
        }
      }
    });
    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: 'Order not found',
      })
    }


    const productIds = order.OrderItem.map((item) => item.productId);
    const products: any[] = await firstValueFrom(this.client.send({ cmd: 'validate_products' }, productIds));
    return {
      ...order,
      OrderItem: order.OrderItem.map((item) => ({
        ...item,
        name: products.find((product) => product.id === item.productId).name,
      })),
    };

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

  async createPaymentSession(order: OrderWithProducts) {
    const paymentSession = await firstValueFrom(this.client.send('create.payment.session', {
      orderId: order.id,
      currency: 'usd',
      items:
        order.OrderItem.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),

    })
    );
    return paymentSession;
  }

  async paidOrder(paidOrderDto: PaidOrderDto) {
    this.logger.log({
      message: 'Paid order',
      paidOrderDto,
    });

    const order = await this.prisma.order.update({
      where: { id: paidOrderDto.orderId },
      data: {
        status: 'PAID',
        paid: true,
        paidAt: new Date(),
        stripeChargeId: paidOrderDto.stripePaymentId,
        OrderReceipt: {
          create: {
            receiptUrl: paidOrderDto.receipUrl,
          },
        },
      },
    });

    return order;


  }
}
