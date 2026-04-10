import React, { useEffect, useState, useCallback } from 'react';
import { 
  Search, 
  ShoppingBag, 
  ChevronDown,
  Filter,
  Eye,
  Calendar,
  DollarSign
} from 'lucide-react';
import { ordersApi } from '../../api/adminApi';
import { Order, OrderStatus } from '../../types';
import { formatPrice, formatDate, formatOrderId } from '../../utils/formatters';
import { translateStatus } from '../../utils/translations';
import { useToast } from '../../components/ui/Toast';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Pagination } from '../../components/ui/Pagination';
import { useNavigate } from 'react-router-dom';

export const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { error: toastError } = useToast();
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await ordersApi.getAll({
        page,
        limit: 10,
        status: selectedStatus || undefined,
      });
      setOrders(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedStatus, toastError]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusBadge = (status: OrderStatus) => {
    const variants: Record<OrderStatus, any> = {
      [OrderStatus.PAID]: 'success',
      [OrderStatus.DELIVERED]: 'success',
      [OrderStatus.SHIPPED]: 'info',
      [OrderStatus.PROCESSING]: 'warning',
      [OrderStatus.PENDING]: 'neutral',
      [OrderStatus.CANCELLED]: 'error',
      [OrderStatus.REFUNDED]: 'error',
    };
    return <Badge variant={variants[status]}>{translateStatus(status)}</Badge>;
  };

  const statusOptions = Object.values(OrderStatus);

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="appearance-none pl-10 pr-10 py-2.5 bg-bd-darkest border border-bd-border rounded-xl text-bd-text focus:outline-none focus:ring-2 focus:ring-bd-purple transition-all min-w-[200px]"
            >
              <option value="">Todos los estados</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{translateStatus(status)}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-bd-muted">
              <Filter size={16} />
            </div>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-bd-muted">
              <ChevronDown size={16} />
            </div>
          </div>

          {(selectedStatus) && (
            <button 
              onClick={() => {
                setSelectedStatus('');
                setPage(1);
              }}
              className="text-sm text-bd-purple hover:text-bd-purple-hover font-medium underline transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="text-bd-muted text-sm flex items-center gap-2">
          <ShoppingBag size={16} />
          <span>Mostrando {orders.length} órdenes</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-bd-darkest border border-bd-border rounded-xl shadow-lg overflow-hidden">
        {isLoading && orders.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-bd-muted italic">
            <Spinner size="lg" />
            <p>Cargando órdenes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-bd-border text-xs text-bd-muted uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Orden</th>
                  <th className="px-6 py-4 font-semibold">Cliente</th>
                  <th className="px-6 py-4 font-semibold">Fecha</th>
                  <th className="px-6 py-4 font-semibold">Total</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bd-border">
                {orders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-bd-medium/50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="p-2 bg-bd-medium rounded-lg text-bd-purple group-hover:bg-bd-purple group-hover:text-white transition-all">
                          <ShoppingBag size={16} />
                        </span>
                        <span className="text-sm font-mono text-bd-purple font-bold">
                          {formatOrderId(order.id)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-bd-text">{order.user?.name || 'Invitado'}</p>
                      <p className="text-xs text-bd-muted">{order.user?.email || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-bd-muted">
                        <Calendar size={14} />
                        <span className="text-xs">{formatDate(order.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm font-bold text-bd-text">
                        <DollarSign size={14} className="text-bd-success" />
                        <span>{formatPrice(order.total)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-bd-muted hover:text-bd-purple hover:bg-bd-purple/10 rounded-lg transition-all">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-bd-muted italic">
                      <div className="flex flex-col items-center gap-4">
                        <ShoppingBag size={48} className="opacity-20" />
                        <p>No se encontraron órdenes</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-4 border-t border-bd-border bg-bd-darkest/50">
          <Pagination 
            currentPage={page} 
            totalPages={totalPages} 
            onPageChange={setPage} 
          />
        </div>
      </div>
    </div>
  );
};
