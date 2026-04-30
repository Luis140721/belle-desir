import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { 
  ArrowLeft, 
  Save, 
  Image as ImageIcon, 
  Video, 
  Monitor, 
  Smartphone, 
  Settings2, 
  Layout, 
  Palette,
  Eye,
  Info
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

const multimediaSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  alt: z.string().optional(),
  type: z.enum(['IMAGE', 'VIDEO', 'BACKGROUND', 'SUPPORT']),
  url: z.string().min(1, 'La URL es requerida'),
  page: z.string().min(1, 'La página es requerida'),
  section: z.string().min(1, 'La sección es requerida'),
  position: z.string().optional(),
  priority: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  overlayOpacity: z.coerce.number().min(0).max(1).default(0),
  alignment: z.string().optional(),
  size: z.string().optional(),
  desktopVisible: z.boolean().default(true),
  mobileVisible: z.boolean().default(true),
});

type MultimediaFormData = z.infer<typeof multimediaSchema>;

export const MultimediaForm: React.FC<{ mode: 'create' | 'edit' }> = ({ mode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<MultimediaFormData>({
    resolver: zodResolver(multimediaSchema),
    defaultValues: {
      type: 'IMAGE',
      isActive: true,
      priority: 0,
      overlayOpacity: 0,
      desktopVisible: true,
      mobileVisible: true,
      page: 'HOME',
      section: 'HERO'
    }
  });

  const watchedUrl = watch('url');
  const watchedType = watch('type');

  useEffect(() => {
    if (mode === 'edit' && id) {
      fetchMultimedia();
    }
  }, [id, mode]);

  const fetchMultimedia = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/multimedia/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      reset(response.data);
      setPreviewUrl(response.data.url);
    } catch (error) {
      showToast('Error al cargar el recurso', 'error');
      navigate('/admin/multimedia');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: MultimediaFormData) => {
    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };

      if (mode === 'create') {
        await axios.post('/api/multimedia', data, config);
        showToast('Recurso creado exitosamente', 'success');
      } else {
        await axios.put(`/api/multimedia/${id}`, data, config);
        showToast('Recurso actualizado exitosamente', 'success');
      }
      navigate('/admin/multimedia');
    } catch (error) {
      showToast('Error al guardar el recurso', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getEmbedPreview = (url: string) => {
    if (!url) return null;
    if (url.includes('drive.google.com')) {
      const id = url.match(/\/file\/d\/(.+?)\//)?.[1] || url.match(/id=(.+?)(&|$)/)?.[1];
      if (id) return `https://drive.google.com/embed?id=${id}`;
    }
    return url;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/admin/multimedia')}
          className="flex items-center gap-2 text-bd-muted hover:text-bd-text transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Volver al listado</span>
        </button>
        <h1 className="text-xl font-bold text-bd-text">
          {mode === 'create' ? 'Nuevo Recurso Multimedia' : 'Editar Recurso Multimedia'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-bd-darkest p-6 rounded-xl border border-bd-border space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-bd-purple mb-2">
              <ImageIcon size={20} />
              <h2 className="font-semibold">Información General</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-bd-muted mb-1">Título del Recurso</label>
                <input
                  {...register('title')}
                  placeholder="Ej: Hero Background Lingerie"
                  className={`w-full px-4 py-2 bg-bd-dark border rounded-lg text-bd-text focus:outline-none focus:border-bd-purple transition-colors ${errors.title ? 'border-bd-error' : 'border-bd-border'}`}
                />
                {errors.title && <p className="text-bd-error text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-bd-muted mb-1">Tipo de Contenido</label>
                  <select
                    {...register('type')}
                    className="w-full px-4 py-2 bg-bd-dark border border-bd-border rounded-lg text-bd-text focus:outline-none focus:border-bd-purple transition-colors"
                  >
                    <option value="IMAGE">Imagen</option>
                    <option value="VIDEO">Video (Drive/Embed)</option>
                    <option value="BACKGROUND">Fondo (Full Screen)</option>
                    <option value="SUPPORT">Imagen de Apoyo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-bd-muted mb-1">Página</label>
                  <select
                    {...register('page')}
                    className="w-full px-4 py-2 bg-bd-dark border border-bd-border rounded-lg text-bd-text focus:outline-none focus:border-bd-purple transition-colors"
                  >
                    <option value="HOME">Inicio</option>
                    <option value="SHOP">Tienda</option>
                    <option value="ABOUT">Nosotros</option>
                    <option value="CONTACT">Contacto</option>
                    <option value="CHECKOUT">Pago</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-bd-muted mb-1">Sección</label>
                <input
                  {...register('section')}
                  placeholder="Ej: HERO, CATEGORIES, FEATURED_1, FOOTER"
                  className="w-full px-4 py-2 bg-bd-dark border border-bd-border rounded-lg text-bd-text focus:outline-none focus:border-bd-purple transition-colors uppercase"
                />
                <p className="text-[10px] text-bd-muted mt-1 italic">Usa nombres descriptivos como HERO, FEATURED, GALLERY_1, etc.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-bd-muted mb-1">URL / Link del Recurso</label>
                <div className="relative">
                  <input
                    {...register('url')}
                    placeholder="URL de Cloudinary o Google Drive"
                    className={`w-full px-4 py-2 bg-bd-dark border rounded-lg text-bd-text focus:outline-none focus:border-bd-purple transition-colors ${errors.url ? 'border-bd-error' : 'border-bd-border'}`}
                  />
                  {watchedUrl && watchedUrl.includes('drive.google.com') && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-bd-purple">
                      <Video size={16} />
                      <span className="text-[10px] font-bold">DRIVE DETECTED</span>
                    </div>
                  )}
                </div>
                {errors.url && <p className="text-bd-error text-xs mt-1">{errors.url.message}</p>}
                <div className="flex items-start gap-2 mt-2 p-2 bg-bd-medium rounded border border-bd-border/50">
                  <Info size={14} className="text-bd-purple shrink-0 mt-0.5" />
                  <p className="text-[10px] text-bd-muted leading-relaxed">
                    Para videos de Drive, asegúrate que el archivo sea <strong>Público</strong> o que <strong>"Cualquier persona con el enlace pueda verlo"</strong>.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-bd-muted mb-1">Texto Alternativo (SEO)</label>
                <input
                  {...register('alt')}
                  placeholder="Descripción para lectores de pantalla..."
                  className="w-full px-4 py-2 bg-bd-dark border border-bd-border rounded-lg text-bd-text focus:outline-none focus:border-bd-purple transition-colors"
                />
              </div>
            </div>
          </section>

          <section className="bg-bd-darkest p-6 rounded-xl border border-bd-border space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-bd-purple mb-2">
              <Palette size={20} />
              <h2 className="font-semibold">Configuración Visual</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-bd-muted mb-1">Opacidad del Overlay (0 a 1)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    {...register('overlayOpacity')}
                    className="w-full accent-bd-purple"
                  />
                  <div className="flex justify-between text-[10px] text-bd-muted mt-1">
                    <span>Transparente (0)</span>
                    <span className="font-bold text-bd-purple">{watch('overlayOpacity')}</span>
                    <span>Oscuro (1)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-bd-muted mb-1">Alineación (CSS)</label>
                  <select
                    {...register('alignment')}
                    className="w-full px-4 py-2 bg-bd-dark border border-bd-border rounded-lg text-bd-text focus:outline-none focus:border-bd-purple transition-colors"
                  >
                    <option value="center">Centro</option>
                    <option value="left">Izquierda</option>
                    <option value="right">Derecha</option>
                    <option value="top">Superior</option>
                    <option value="bottom">Inferior</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-bd-muted mb-1">Tamaño / Cover (CSS)</label>
                  <select
                    {...register('size')}
                    className="w-full px-4 py-2 bg-bd-dark border border-bd-border rounded-lg text-bd-text focus:outline-none focus:border-bd-purple transition-colors"
                  >
                    <option value="cover">Cubrir todo (Cover)</option>
                    <option value="contain">Contener (Contain)</option>
                    <option value="auto">Automático</option>
                    <option value="100% 100%">Estirar (100% 100%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-bd-muted mb-1">Prioridad (Orden)</label>
                  <input
                    type="number"
                    {...register('priority')}
                    className="w-full px-4 py-2 bg-bd-dark border border-bd-border rounded-lg text-bd-text focus:outline-none focus:border-bd-purple transition-colors"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Options */}
        <div className="space-y-6">
          <section className="bg-bd-darkest p-6 rounded-xl border border-bd-border space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-bd-purple mb-2">
              <Eye size={20} />
              <h2 className="font-semibold">Estado y Visibilidad</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 bg-bd-dark rounded-lg border border-bd-border cursor-pointer group">
                <span className="text-sm font-medium text-bd-text">Activo</span>
                <input type="checkbox" {...register('isActive')} className="w-5 h-5 accent-bd-purple" />
              </label>

              <div className="space-y-2">
                <p className="text-xs font-medium text-bd-muted uppercase tracking-wider">Dispositivos</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer ${watch('desktopVisible') ? 'bg-bd-purple/10 border-bd-purple text-bd-purple' : 'bg-bd-dark border-bd-border text-bd-muted'}`}>
                    <Monitor size={20} />
                    <span className="text-[10px] font-bold uppercase">Desktop</span>
                    <input type="checkbox" {...register('desktopVisible')} className="hidden" />
                  </label>
                  <label className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer ${watch('mobileVisible') ? 'bg-bd-purple/10 border-bd-purple text-bd-purple' : 'bg-bd-dark border-bd-border text-bd-muted'}`}>
                    <Smartphone size={20} />
                    <span className="text-[10px] font-bold uppercase">Mobile</span>
                    <input type="checkbox" {...register('mobileVisible')} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-bd-darkest p-6 rounded-xl border border-bd-border space-y-4 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 text-bd-purple mb-2">
              <Layout size={20} />
              <h2 className="font-semibold">Vista Previa</h2>
            </div>

            <div className="aspect-video bg-bd-dark rounded-lg border border-bd-border flex items-center justify-center overflow-hidden relative">
              {watchedType === 'VIDEO' && watchedUrl ? (
                <iframe
                  src={getEmbedPreview(watchedUrl)!}
                  className="w-full h-full border-none pointer-events-none"
                  title="Preview"
                />
              ) : watchedUrl ? (
                <img src={watchedUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon size={32} className="mx-auto text-bd-muted mb-2" />
                  <p className="text-[10px] text-bd-muted">Introduce una URL para ver la previsualización</p>
                </div>
              )}
              {watch('overlayOpacity') > 0 && (
                <div 
                  className="absolute inset-0 bg-black pointer-events-none" 
                  style={{ opacity: watch('overlayOpacity') }}
                />
              )}
            </div>
            <p className="text-[10px] text-bd-muted text-center italic">La previsualización es aproximada.</p>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-bd-purple hover:bg-bd-purple-hover text-white rounded-xl transition-all shadow-lg shadow-bd-purple/20 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={20} />
                <span>{mode === 'create' ? 'Crear Recurso' : 'Guardar Cambios'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
