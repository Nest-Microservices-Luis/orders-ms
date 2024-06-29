import { PaginationDto } from 'src/common';
import { OrderStatusList } from '../enum/order.enum';
import { IsEnum, IsOptional } from 'class-validator';
import { OrderStaus } from '@prisma/client';

export class OrderPaginationDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatusList, { message: `Valid status are: ${OrderStatusList}` })
  status: OrderStaus;
}
