import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Trash2, 
  Plus,
  ExternalLink
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useNavigate, useParams } from 'react-router-dom';
import { productsApi, categoriesApi } from '../../api/adminApi';
import { Category, Product } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { formatPrice, slugify } from '../../utils/formatters';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { Spinner } from '../../components/ui/Spinner';

const productSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  price: z.coerce.number().positive('El precio debe ser positivo'),
  comparePrice: z.coerce.number().positive('El precio debe ser positivo').optional(),
  stock: z.coerce.number().int().nonnegative('El stock no puede ser negativo'),
  sku: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  categoryId: z.coerce.number().int().positive('Selecciona una categoría'),
});

type ProductFormInputs = z.infer<typeof productSchema>;

interface ProductFormProps {
  mode: 'create' | 'edit';
}

export const ProductForm: React.FC<ProductFormProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductFormInputs>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      isFeatured: false,
      isActive: true,
    }
  });

  const productName = watch('name');

  useEffect(() => {
    if (productName && mode === 'create') {
      // Auto-generate slug could be shown as a preview
    }
  }, [productName, mode]);

  const fetchData = useCallback(async () => {
    try {
      const catRes = await categoriesApi.getAll();
      setCategories(catRes.data);

      if (mode === 'edit' && id) {
        const prodRes = await productsApi.getById(id);
        const prod = prodRes.data;
        setProduct(prod);
        
        // Populate form
        setValue('name', prod.name);
        setValue('description', prod.description);
        setValue('price', prod.price);
        setValue('comparePrice', prod.comparePrice);
        setValue('stock', prod.stock);
        setValue('sku', prod.sku);
        setValue('isFeatured', prod.isFeatured);
        setValue('isActive', prod.isActive);
        setValue('categoryId', prod.categoryId);
      }
    } catch (err: any) {
      toastError(err.message);
      navigate('/admin/products');
    } finally {
      setIsLoading(false);
    }
  }, [id, mode, navigate, setValue, toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = async (data: ProductFormInputs) => {
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const res = await productsApi.create(data);
        success('Producto creado con éxito');
        navigate(`/admin/products/${res.data.id}`);
      } else if (id) {
        await productsApi.update(id, data);
        success('Producto actualizado con éxito');
        fetchData();
      }
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (mode === 'create') return;
    if (!id) return;

    setIsUploading(true);
    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      await productsApi.uploadImages(id, formData);
      success('Imágenes subidas con éxito');
      fetchData();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    if (!id) return;
    try {
      await productsApi.removeImage(id, imageUrl);
      success('Imagen eliminada');
      fetchData();
    } catch (err: any) {
      toastError(err.message);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 5,
    disabled: mode === 'create' || isUploading
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-bd-muted italic">
        <Spinner size="lg" />
        <p>Cargando información del producto...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/products')}
            className="p-2 text-bd-muted hover:text-bd-text hover:bg-bd-border rounded-lg transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-bd-text">
            {mode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
          </h1>
        </div>

        <button
          onClick={handleSubmit(onSubmit) as any}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-bd-purple hover:bg-bd-purple-hover text-white font-bold rounded-xl shadow-lg shadow-bd-purple/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          <span>{mode === 'create' ? 'Crear' : 'Guardar'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - General Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bd-darkest border border-bd-border p-6 rounded-xl shadow-lg space-y-6">
            <h3 className="text-lg font-bold text-bd-text border-b border-bd-border pb-4">Información General</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-bd-muted block">Nombre del Producto</label>
                <input
                  {...register('name')}
                  type="text"
                  className={`
                    w-full px-4 py-2.5 bg-bd-medium border rounded-xl text-bd-text focus:outline-none focus:ring-2 focus:ring-bd-purple transition-all
                    ${errors.name ? 'border-bd-error focus:ring-bd-error' : 'border-bd-border'}
                  `}
                  placeholder="Ej. Vibrador Rabbit de Lujo"
                />
                {errors.name && <p className="text-bd-error text-xs font-medium">{errors.name.message}</p>}
                {productName && (
                  <p className="text-[10px] text-bd-muted font-mono uppercase tracking-widest mt-1">
                    SLUG: {slugify(productName)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-bd-muted block">Categoría</label>
                <select
                  {...register('categoryId')}
                  className={`
                    w-full px-4 py-2.5 bg-bd-medium border rounded-xl text-bd-text focus:outline-none focus:ring-2 focus:ring-bd-purple transition-all
                    ${errors.categoryId ? 'border-bd-error focus:ring-bd-error' : 'border-bd-border'}
                  `}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-bd-error text-xs font-medium">{errors.categoryId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-bd-muted block">Descripción</label>
                <textarea
                  {...register('description')}
                  rows={6}
                  className={`
                    w-full px-4 py-2.5 bg-bd-medium border rounded-xl text-bd-text focus:outline-none focus:ring-2 focus:ring-bd-purple transition-all resize-none
                    ${errors.description ? 'border-bd-error focus:ring-bd-error' : 'border-bd-border'}
                  `}
                  placeholder="Describe las características, beneficios y uso del producto..."
                />
                {errors.description && <p className="text-bd-error text-xs font-medium">{errors.description.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-bd-muted block">SKU (Código Interno)</label>
                <input
                  {...register('sku')}
                  type="text"
                  className="w-full px-4 py-2.5 bg-bd-medium border border-bd-border rounded-xl text-bd-text focus:outline-none focus:ring-2 focus:ring-bd-purple transition-all"
                  placeholder="Ej. VIB-RAB-001"
                />
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-bd-darkest border border-bd-border p-6 rounded-xl shadow-lg space-y-6">
            <h3 className="text-lg font-bold text-bd-text border-b border-bd-border pb-4">Imágenes del Producto</h3>
            
            {mode === 'edit' && product ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {product.images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl bg-bd-medium border border-bd-border overflow-hidden">
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          type="button"
                          onClick={() => handleRemoveImage(img)}
                          className="p-2 bg-bd-error text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="Eliminar imagen"
                        >
                          <Trash2 size={16} />
                        </button>
                        <a 
                          href={img} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 bg-bd-purple text-white rounded-lg hover:bg-bd-purple-hover transition-colors"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  ))}
                  {product.images.length < 5 && (
                    <div 
                      {...getRootProps()} 
                      className={`
                        aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all
                        ${isDragActive ? 'border-bd-purple bg-bd-purple/10' : 'border-bd-border hover:border-bd-purple/50 hover:bg-bd-purple/5'}
                        ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <input {...getInputProps()} />
                      {isUploading ? <Loader2 className="animate-spin text-bd-purple" /> : <Plus size={24} className="text-bd-muted" />}
                      <span className="text-[10px] text-bd-muted uppercase font-bold tracking-tighter">Subir</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-bd-muted italic">Máximo 5 imágenes. Formatos: JPG, PNG, WEBP.</p>
              </div>
            ) : (
              <div className="py-10 flex flex-col items-center justify-center gap-4 text-bd-muted border-2 border-dashed border-bd-border rounded-xl">
                <ImageIcon size={48} className="opacity-10" />
                <p className="text-sm">Podrás subir imágenes después de crear el producto.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Inventory & Pricing */}
        <div className="space-y-6">
          <div className="bg-bd-darkest border border-bd-border p-6 rounded-xl shadow-lg space-y-6">
            <h3 className="text-lg font-bold text-bd-text border-b border-bd-border pb-4">Precio e Inventario</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-bd-muted block">Precio de Venta</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bd-muted">
                    <span className="text-sm">$</span>
                  </div>
                  <input
                    {...register('price')}
                    type="number"
                    className={`
                      w-full pl-8 pr-4 py-2.5 bg-bd-medium border rounded-xl text-bd-text focus:outline-none focus:ring-2 focus:ring-bd-purple transition-all
                      ${errors.price ? 'border-bd-error focus:ring-bd-error' : 'border-bd-border'}
                    `}
                    placeholder="0"
                  />
                </div>
                {errors.price && <p className="text-bd-error text-xs font-medium">{errors.price.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-bd-muted block">Precio de Comparación (Antes)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bd-muted">
                    <span className="text-sm">$</span>
                  </div>
                  <input
                    {...register('comparePrice')}
                    type="number"
                    className="w-full pl-8 pr-4 py-2.5 bg-bd-medium border border-bd-border rounded-xl text-bd-text focus:outline-none focus:ring-2 focus:ring-bd-purple transition-all"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-bd-border">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-bd-muted block">Stock en Bodega</label>
                  <input
                    {...register('stock')}
                    type="number"
                    className={`
                      w-full px-4 py-2.5 bg-bd-medium border rounded-xl text-bd-text focus:outline-none focus:ring-2 focus:ring-bd-purple transition-all
                      ${errors.stock ? 'border-bd-error focus:ring-bd-error' : 'border-bd-border'}
                    `}
                    placeholder="0"
                  />
                  {errors.stock && <p className="text-bd-error text-xs font-medium">{errors.stock.message}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-bd-darkest border border-bd-border p-6 rounded-xl shadow-lg space-y-6">
            <h3 className="text-lg font-bold text-bd-text border-b border-bd-border pb-4">Visibilidad</h3>
            
            <div className="space-y-6">
              <ToggleSwitch
                checked={watch('isActive')}
                onChange={(val) => setValue('isActive', val)}
                label="Producto Activo"
              />
              <p className="text-xs text-bd-muted -mt-4 pl-14">
                Si está desactivado, el producto no aparecerá en el catálogo de la tienda.
              </p>

              <ToggleSwitch
                checked={watch('isFeatured')}
                onChange={(val) => setValue('isFeatured', val)}
                label="Producto Destacado"
              />
              <p className="text-xs text-bd-muted -mt-4 pl-14">
                Aparecerá en la sección de recomendados de la página principal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
