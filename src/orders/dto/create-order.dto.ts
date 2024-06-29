import { OrderStaus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { OrderStatusList } from '../enum/order.enum';

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @IsNumber()
  @IsPositive()
  totalItems: number;

  @IsEnum(OrderStatusList, {
    message: `Posible status values are ${OrderStatusList}`,
  })
  @IsOptional()
  status: OrderStaus = OrderStaus.PENDING;

  @IsBoolean()
  @IsOptional()
  paid: boolean = false;
}
