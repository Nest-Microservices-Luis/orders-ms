
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive } from "class-validator";
import { OrderStatusList } from "../enum/order.enum";
import { OrderStatus } from "@prisma/client";

export class CreateOrderDto {

    @IsNumber()
    @IsPositive()
    totalAmount: number;

    @IsNumber()
    @IsPositive()
    totalItems: number;

    @IsEnum(OrderStatusList, {
        message: 'Possible values are: PENDING, DELIVERED, CANCELLED',
    })
    @IsOptional()
    status: OrderStatus = OrderStatusList[0];

    @IsBoolean()
    @IsOptional()
    paid: boolean = false;




}
