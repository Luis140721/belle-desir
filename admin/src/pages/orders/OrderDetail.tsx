import React, { useEffect, useState, useCallback } from 'react';
import { 
  ArrowLeft, 
  ShoppingBag, 
  User as UserIcon, 
  Truck, 
  CreditCard, 
  Calendar,
  DollarSign,
  Package,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Clock,
  Save,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersApi } from '../../api/adminApi';
import { Order, OrderStatus } from '../../types';
import { formatPrice, formatDate, formatOrderId } from '../../utils/formatters';
import { translateStatus } from '../../utils/translations';
import { useToast } from '../../components/ui/Toast';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await ordersApi.getById(id);
      setOrder(res.data);
      setNewStatus(res.data.status);
    } catch (err: any) {
      toastError(err.message);
      navigate('/admin/orders');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, toastError]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleUpdateStatus = async () => {
    if (!id || !newStatus || newStatus === order?.status) return;
    setIsUpdating(true);
    try {
      await ordersApi.updateStatus(id, newStatus as OrderStatus);
      success('Estado de la orden actualizado');
      fetchOrder();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-bd-muted italic">
        <Spinner size="lg" />
        <p>Cargando detalles de la orden...</p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/orders')}
            className="p-2 text-bd-muted hover:text-bd-text hover:bg-bd-border rounded-lg transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-bd-text flex items-center gap-3">
              Orden {formatOrderId(order.id)}
              {getStatusBadge(order.status)}
            </h1>
            <p className="text-sm text-bd-muted flex items-center gap-2 mt-1">
              <Calendar size={14} />
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {order.status === OrderStatus.PAID && (
          <div className="bg-bd-success/10 border border-bd-success/20 px-4 py-2 rounded-xl flex items-center gap-3 text-bd-success">
            <CheckCircle2 size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">Pago Confirmado</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bd-darkest border border-bd-border p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-bold text-bd-text flex items-center gap-2 mb-6">
              <Package size={20} className="text-bd-purple" />
              Productos del pedido
            </h3>
            
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-bd-medium/50 border border-bd-border rounded-xl group hover:border-bd-purple/30 transition-colors">
                  <div className="w-16 h-16 rounded-lg bg-bd-dark border border-bd-border overflow-hidden flex items-center justify-center shrink-0">
                    {item.product?.images[0] ? (
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={24} className="text-bd-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-bd-text truncate group-hover:text-bd-purple transition-colors">{item.product?.name}</h4>
                    <p className="text-xs text-bd-muted font-mono truncate">{item.product?.id.slice(0, 8)}</p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <p className="text-sm font-bold text-bd-text">{formatPrice(item.price)}</p>
                    <p className="text-xs text-bd-muted">Cant: {item.quantity}</p>
                    <p className="text-sm font-bold text-bd-purple mt-1">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Totals */}
            <div className="mt-8 pt-6 border-t border-bd-border space-y-3">
              <div className="flex justify-between text-sm text-bd-muted">
                <span>Subtotal</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-bd-muted">
                <span>Envío</span>
                <span className="font-medium">{formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-bd-text pt-3 border-t border-bd-border/50">
                <span className="flex items-center gap-2">
                  <DollarSign size={24} className="text-bd-success" />
                  Total
                </span>
                <span className="text-bd-success">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Status, Customer, Shipping */}
        <div className="space-y-6">
          {/* Order Status Card */}
          <div className="bg-bd-darkest border border-bd-border p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-lg font-bold text-bd-text flex items-center gap-2">
              <Clock size={20} className="text-bd-warning" />
              Estado de la Orden
            </h3>
            
            <div className="space-y-4">
              <div className="relative">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full appearance-none pl-4 pr-10 py-3 bg-bd-medium border border-bd-border rounded-xl text-bd-text focus:outline-none focus:ring-2 focus:ring-bd-purple transition-all"
                >
                  {Object.values(OrderStatus).map(status => (
                    <option key={status} value={status}>{translateStatus(status)}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-bd-muted">
                  <ChevronDown size={18} />
                </div>
              </div>

              <button
                onClick={handleUpdateStatus}
                disabled={isUpdating || newStatus === order.status}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-bd-purple hover:bg-bd-purple-hover text-white font-bold rounded-xl shadow-lg shadow-bd-purple/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                <span>Actualizar Estado</span>
              </button>
            </div>
          </div>

          {/* Customer Card */}
          <div className="bg-bd-darkest border border-bd-border p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-lg font-bold text-bd-text flex items-center gap-2">
              <UserIcon size={20} className="text-bd-info" />
              Cliente
            </h3>
            <div className="p-4 bg-bd-medium border border-bd-border rounded-xl space-y-2">
              <p className="text-sm font-bold text-bd-text">{order.user?.name || 'Invitado'}</p>
              <p className="text-sm text-bd-muted flex items-center gap-2">
                <Mail size={14} />
                {order.user?.email || '-'}
              </p>
              {order.user?.phone && (
                <p className="text-sm text-bd-muted flex items-center gap-2">
                  <Phone size={14} />
                  {order.user.phone}
                </p>
              )}
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-bd-darkest border border-bd-border p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-lg font-bold text-bd-text flex items-center gap-2">
              <Truck size={20} className="text-bd-success" />
              Envío
            </h3>
            <div className="p-4 bg-bd-medium border border-bd-border rounded-xl space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-bd-muted mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-bold text-bd-text">{order.shippingAddress?.name || 'Invitado'}</p>
                  <p className="text-bd-muted">{order.shippingAddress?.address || '-'}</p>
                  <p className="text-bd-muted">{order.shippingAddress?.city || 'Bogotá'}, {order.shippingAddress?.country || 'Colombia'}</p>
                  <p className="text-bd-muted font-mono text-xs mt-1">ZIP: {order.shippingAddress?.zip || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-bd-darkest border border-bd-border p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-lg font-bold text-bd-text flex items-center gap-2">
              <CreditCard size={20} className="text-bd-purple" />
              Información de Pago
            </h3>
            <div className="p-4 bg-bd-medium border border-bd-border rounded-xl space-y-2">
              {order.stripePaymentIntentId || order.stripeSessionId ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-bd-muted">Proveedor:</span>
                    <span className="text-bd-text font-bold uppercase">Stripe</span>
                  </div>
                  {order.stripeSessionId && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-bd-muted uppercase font-bold tracking-tighter">Session ID</p>
                      <p className="text-xs text-bd-text font-mono truncate">{order.stripeSessionId}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-bd-muted italic">
                  <p className="text-xs">No hay información de pasarela disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal sub-components needed for OrderDetail
const ChevronDown = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);
const Mail = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
);
const Phone = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);
