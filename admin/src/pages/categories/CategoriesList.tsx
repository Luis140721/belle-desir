import React, { useEffect, useState, useCallback } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Image as ImageIcon,
  Tag,
  Loader2,
  X,
  Save,
  Package
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { categoriesApi } from '../../api/adminApi';
import { Category } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { slugify } from '../../utils/formatters';

const categorySchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  imageUrl: z.string().url('URL de imagen inválida'),
});

type CategoryFormInputs = z.infer<typeof categorySchema>;

export const CategoriesList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const { success, error: toastError } = useToast();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CategoryFormInputs>({
    resolver: zodResolver(categorySchema),
  });

  const categoryName = watch('name');

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await categoriesApi.getAll();
      setCategories(res.data);
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openModal = (category: Category | null = null) => {
    setEditingCategory(category);
    if (category) {
      reset({
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
      });
    } else {
      reset({
        name: '',
        description: '',
        imageUrl: '',
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: CategoryFormInputs) => {
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, data);
        success('Categoría actualizada con éxito');
      } else {
        await categoriesApi.create(data);
        success('Categoría creada con éxito');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await categoriesApi.delete(deleteId);
      success('Categoría eliminada con éxito');
      fetchCategories();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bd-text">Categorías</h1>
          <p className="text-sm text-bd-muted">Administra las secciones de tu tienda</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-bd-purple hover:bg-bd-purple-hover text-white font-bold rounded-xl shadow-lg shadow-bd-purple/20 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* Grid Section */}
      {isLoading ? (
        <div className="p-20 flex flex-col items-center justify-center gap-4 text-bd-muted italic">
          <Spinner size="lg" />
          <p>Cargando categorías...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-bd-darkest border border-bd-border rounded-xl shadow-lg overflow-hidden flex flex-col group hover:border-bd-purple/50 transition-colors">
              <div className="relative aspect-video bg-bd-medium overflow-hidden">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-bd-muted">
                    <ImageIcon size={48} className="opacity-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-bd-darkest/90 to-transparent flex flex-col justify-end p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag size={16} className="text-bd-purple" />
                    <span className="text-xs font-mono text-bd-muted uppercase tracking-widest">{cat.slug}</span>
                  </div>
                  <h3 className="text-xl font-bold text-bd-text">{cat.name}</h3>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-sm text-bd-muted line-clamp-2">{cat.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-bd-border">
                  <div className="flex items-center gap-2 text-xs font-bold text-bd-purple uppercase tracking-tighter">
                    <Package size={14} />
                    <span>{cat._count?.products || 0} Productos</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openModal(cat)}
                      className="p-2 text-bd-muted hover:text-bd-purple hover:bg-bd-purple/10 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => setDeleteId(cat.id)}
                      className="p-2 text-bd-muted hover:text-bd-error hover:bg-bd-error/10 rounded-lg transition-all"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {categories.length === 0 && !isLoading && (
            <div className="col-span-full py-20 text-center text-bd-muted italic border-2 border-dashed border-bd-border rounded-xl">
              <div className="flex flex-col items-center gap-4">
                <Tag size={48} className="opacity-10" />
                <p>No se encontraron categorías</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-bd-muted block">Nombre de la Categoría</label>
              <input
                {...register('name')}
                type="text"
                className={`
                  w-full px-4 py-2.5 bg-bd-dark border rounded-xl text-bd-text focus:outline-none focus:ring-2 focus:ring-bd-purple transition-all
                  ${errors.name ? 'border-bd-error focus:ring-bd-error' : 'border-bd-border'}
                `}
                placeholder="Ej. Lencería Erótica"
              />
              {errors.name && <p className="text-bd-error text-xs font-medium">{errors.name.message}</p>}
              {categoryName && !editingCategory && (
                <p className="text-[10px] text-bd-muted font-mono uppercase tracking-widest mt-1">
                  SLUG: {slugify(categoryName)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-bd-muted block">URL de la Imagen</label>
              <input
                {...register('imageUrl')}
                type="text"
                className={`
                  w-full px-4 py-2.5 bg-bd-dark border rounded-xl text-bd-text focus:outline-none focus:ring-2 focus:ring-bd-purple transition-all
                  ${errors.imageUrl ? 'border-bd-error focus:ring-bd-error' : 'border-bd-border'}
                `}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
              {errors.imageUrl && <p className="text-bd-error text-xs font-medium">{errors.imageUrl.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-bd-muted block">Descripción</label>
              <textarea
                {...register('description')}
                rows={4}
                className={`
                  w-full px-4 py-2.5 bg-bd-dark border rounded-xl text-bd-text focus:outline-none focus:ring-2 focus:ring-bd-purple transition-all resize-none
                  ${errors.description ? 'border-bd-error focus:ring-bd-error' : 'border-bd-border'}
                `}
                placeholder="Describe qué tipo de productos contiene esta categoría..."
              />
              {errors.description && <p className="text-bd-error text-xs font-medium">{errors.description.message}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-bd-border">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-bd-border text-bd-text hover:bg-bd-border transition-all font-bold"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-bd-purple hover:bg-bd-purple-hover text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-bd-purple/20 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              <span>{editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}</span>
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Categoría"
        description="¿Estás seguro de que deseas eliminar esta categoría? Solo se podrá eliminar si no tiene productos asociados."
      />
    </div>
  );
};
