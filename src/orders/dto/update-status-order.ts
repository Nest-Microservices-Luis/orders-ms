import { OrderStaus } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';
import { OrderStatusList } from '../enum/order.enum';

export class UpdateStatusOrderDto {
  @IsString()
  id: string;

  @IsEnum(OrderStatusList, { message: `Valid status are: ${OrderStatusList}` })
  status: OrderStaus;
}
