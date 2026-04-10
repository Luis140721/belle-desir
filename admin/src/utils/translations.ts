import { OrderStatus } from '../types';

export const translateStatus = (status: OrderStatus): string => {
  const translations: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'Pendiente',
    [OrderStatus.PAID]: 'Pagado',
    [OrderStatus.PROCESSING]: 'Procesando',
    [OrderStatus.SHIPPED]: 'Enviado',
    [OrderStatus.DELIVERED]: 'Entregado',
    [OrderStatus.CANCELLED]: 'Cancelado',
    [OrderStatus.REFUNDED]: 'Reembolsado',
  };
  return translations[status] || status;
};
