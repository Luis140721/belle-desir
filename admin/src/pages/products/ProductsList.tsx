import React, { useEffect, useState, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Image as ImageIcon,
  Check,
  X as XIcon,
  ChevronDown,
  Filter,
  Eye,
  EyeOff,
  Package
} from 'lucide-react';
import { productsApi, categoriesApi } from '../../api/adminApi';
import { Product, Category } from '../../types';
import { formatPrice, formatDate } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../components/ui/Toast';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Pagination } from '../../components/ui/Pagination';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useNavigate, Link } from 'react-router-dom';

export const ProductsList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const debouncedSearch = useDebounce(searchTerm, 500);
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await productsApi.getAll({
        page,
        limit: 10,
        search: debouncedSearch,
        category: selectedCategory,
      });
      setProducts(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, selectedCategory, toastError]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoriesApi.getAll();
        setCategories(res.data);
      } catch (err) {}
    };
    fetchCategories();
  }, []);

  const handleToggleActive = async (product: Product) => {
    try {
      await productsApi.update(product.id, { isActive: !product.isActive });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
      success(`Producto ${!product.isActive ? 'activado' : 'desactivado'}`);
    } catch (err: any) {
      toastError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await productsApi.delete(deleteId);
      success('Producto eliminado (soft delete)');
      fetchProducts();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bd-muted">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-bd-darkest border border-bd-border rounded-xl text-bd-text focus:outline-none focus:ring-2 focus:ring-bd-purple transition-all"
            placeholder="Buscar productos..."
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none pl-10 pr-10 py-2.5 bg-bd-darkest border border-bd-border rounded-xl text-bd-text focus:outline-none focus:ring-2 focus:ring-bd-purple transition-all min-w-[160px]"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-bd-muted">
              <Filter size={16} />
            </div>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-bd-muted">
              <ChevronDown size={16} />
            </div>
          </div>

          <Link
            to="/admin/products/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-bd-purple hover:bg-bd-purple-hover text-white font-bold rounded-xl shadow-lg shadow-bd-purple/20 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nuevo Producto</span>
          </Link>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-bd-darkest border border-bd-border rounded-xl shadow-lg overflow-hidden">
        {isLoading && products.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-bd-muted italic">
            <Spinner size="lg" />
            <p>Cargando productos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-bd-border text-xs text-bd-muted uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Producto</th>
                  <th className="px-6 py-4 font-semibold">Categoría</th>
                  <th className="px-6 py-4 font-semibold">Precio</th>
                  <th className="px-6 py-4 font-semibold">Stock</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bd-border">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-bd-medium/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-bd-medium border border-bd-border overflow-hidden flex items-center justify-center shrink-0">
                          {product.images[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={20} className="text-bd-muted" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-bd-text truncate">{product.name}</p>
                          <p className="text-xs text-bd-muted font-mono truncate">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="neutral">{product.category?.name || 'Sin categoría'}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-bd-text">{formatPrice(product.price)}</p>
                      {product.comparePrice && (
                        <p className="text-xs text-bd-muted line-through">{formatPrice(product.comparePrice)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${product.stock <= 5 ? 'text-bd-error' : 'text-bd-text'}`}>
                          {product.stock}
                        </span>
                        {product.stock === 0 && <Badge variant="error">Agotado</Badge>}
                        {product.stock > 0 && product.stock <= 5 && <span className="text-[10px] text-bd-error uppercase font-bold tracking-tighter">Bajo stock</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ToggleSwitch 
                        checked={product.isActive} 
                        onChange={() => handleToggleActive(product)}
                        label={product.isActive ? 'Activo' : 'Inactivo'}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/admin/products/${product.id}`)}
                          className="p-2 text-bd-muted hover:text-bd-purple hover:bg-bd-purple/10 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => setDeleteId(product.id)}
                          className="p-2 text-bd-muted hover:text-bd-error hover:bg-bd-error/10 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-bd-muted italic">
                      <div className="flex flex-col items-center gap-4">
                        <Package size={48} className="opacity-20" />
                        <p>No se encontraron productos</p>
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

      <ConfirmDialog 
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Producto"
        description="¿Estás seguro de que deseas desactivar este producto? Podrás volver a activarlo más tarde si lo deseas (soft delete)."
        confirmLabel="Desactivar"
      />
    </div>
  );
};
