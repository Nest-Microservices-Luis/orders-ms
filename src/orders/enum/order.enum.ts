import { OrderStaus } from '@prisma/client';

export const OrderStatusList = [
  OrderStaus.PENDING,
  OrderStaus.DELIVERED,
  OrderStaus.CANCELLED,
];
