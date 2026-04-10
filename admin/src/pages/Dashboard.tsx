import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { dashboardApi, ordersApi } from '../api/adminApi';
import { AdminStats, Order, OrderStatus } from '../types';
import { formatPrice, formatDate, formatOrderId } from '../utils/formatters';
import { translateStatus } from '../utils/translations';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          dashboardApi.getStats(),
          ordersApi.getAll({ limit: 5, page: 1 })
        ]);
        setStats(statsRes.data);
        setRecentOrders(ordersRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  const metricCards = [
    { 
      label: 'Ventas Totales', 
      value: formatPrice(stats?.totalSales || 0), 
      icon: <DollarSign className="text-bd-success" />, 
      sub: 'Ingresos confirmados' 
    },
    { 
      label: 'Órdenes', 
      value: stats?.statusCounts.reduce((a, b) => a + b.count, 0) || 0, 
      icon: <ShoppingBag className="text-bd-info" />, 
      sub: 'Pedidos totales' 
    },
    { 
      label: 'Stock Bajo', 
      value: stats?.lowStockProducts.length || 0, 
      icon: <AlertTriangle className={stats?.lowStockProducts.length ? 'text-bd-warning' : 'text-bd-muted'} />, 
      sub: 'Productos por agotar',
      highlight: (stats?.lowStockProducts.length || 0) > 0 ? 'text-bd-warning' : ''
    },
    { 
      label: 'Top Ventas', 
      value: stats?.topSellingProducts[0]?.quantitySold || 0, 
      icon: <TrendingUp className="text-bd-purple" />, 
      sub: stats?.topSellingProducts[0]?.name || 'Sin ventas' 
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, i) => (
          <div key={i} className="bg-bd-darkest border border-bd-border p-6 rounded-xl shadow-lg flex items-start justify-between group hover:border-bd-purple/50 transition-colors">
            <div className="space-y-2">
              <p className="text-sm font-medium text-bd-muted uppercase tracking-wider">{card.label}</p>
              <h3 className={`text-2xl font-bold text-bd-text ${card.highlight}`}>{card.value}</h3>
              <p className="text-xs text-bd-muted">{card.sub}</p>
            </div>
            <div className="p-3 bg-bd-medium rounded-lg group-hover:bg-bd-purple/10 transition-colors">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-bd-darkest border border-bd-border p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-bd-text flex items-center gap-2">
              <TrendingUp size={20} className="text-bd-purple" />
              Ingresos (Últimos 30 días)
            </h3>
            <p className="text-sm text-bd-muted">Evolución diaria de ventas</p>
          </div>
        </div>
        
        <div className="h-[350px] w-full">
          {stats?.revenueByDay.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueByDay}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B2A86" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#5B2A86" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D1B4E" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#A89BC2" 
                  fontSize={12} 
                  tickFormatter={(str) => {
                    const d = new Date(str);
                    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
                  }}
                />
                <YAxis 
                  stroke="#A89BC2" 
                  fontSize={12} 
                  tickFormatter={(val) => `$${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A0F24', border: '1px solid #2D1B4E', borderRadius: '8px' }}
                  itemStyle={{ color: '#F5EDE1' }}
                  formatter={(val: any) => [formatPrice(val), 'Ingresos']}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#5B2A86" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-bd-muted italic">
              Sin datos suficientes para mostrar el gráfico
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Table */}
        <div className="bg-bd-darkest border border-bd-border p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-bd-text flex items-center gap-2">
              <Clock size={20} className="text-bd-info" />
              Órdenes Recientes
            </h3>
            <Link to="/admin/orders" className="text-sm text-bd-purple hover:text-bd-purple-hover font-medium flex items-center gap-1 transition-colors">
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-bd-border text-xs text-bd-muted uppercase tracking-wider">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">Cliente</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bd-border">
                {recentOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-bd-medium/50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    <td className="py-4 text-sm font-mono text-bd-purple font-medium">{formatOrderId(order.id)}</td>
                    <td className="py-4">
                      <p className="text-sm text-bd-text font-medium">{order.user?.name || 'Invitado'}</p>
                      <p className="text-xs text-bd-muted">{order.user?.email || '-'}</p>
                    </td>
                    <td className="py-4 text-sm font-bold text-bd-text">{formatPrice(order.total)}</td>
                    <td className="py-4">{getStatusBadge(order.status)}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-bd-muted italic">No hay órdenes recientes</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-bd-darkest border border-bd-border p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-bd-text flex items-center gap-2">
              <Package size={20} className="text-bd-warning" />
              Alertas de Stock
            </h3>
            <Link to="/admin/products" className="text-sm text-bd-purple hover:text-bd-purple-hover font-medium flex items-center gap-1 transition-colors">
              Gestionar <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            {stats?.lowStockProducts.map((prod) => (
              <div key={prod.id} className="flex items-center justify-between p-4 bg-bd-medium/50 border border-bd-border rounded-lg group hover:border-bd-warning/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${prod.stock === 0 ? 'bg-bd-error/10 text-bd-error' : 'bg-bd-warning/10 text-bd-warning'}`}>
                    <Package size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-bd-text group-hover:text-bd-purple transition-colors">{prod.name}</h4>
                    <p className="text-xs text-bd-muted">ID: {prod.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${prod.stock === 0 ? 'text-bd-error' : 'text-bd-warning'}`}>
                    {prod.stock}
                  </span>
                  <p className="text-[10px] text-bd-muted uppercase tracking-tighter">unidades</p>
                </div>
              </div>
            ))}
            {stats?.lowStockProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-bd-muted">
                <ShoppingBag size={48} className="mb-4 opacity-20" />
                <p className="text-sm italic">Todo el inventario está al día</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
