import React, { useEffect, useMemo, useState } from 'react';
import { Edit3, Eye, Film, Image as ImageIcon, Plus, Trash2, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { siteMediaApi } from '../../api/adminApi';
import { useToast } from '../../components/ui/Toast';
import { SiteMedia, SiteMediaPlacement, SiteMediaType } from '../../types';

const placements: Array<{ value: SiteMediaPlacement; label: string; hint: string }> = [
  { value: 'HERO_BACKGROUND', label: 'Hero principal', hint: 'Aparece como fondo de la primera pantalla.' },
  { value: 'CATALOG_SUPPORT', label: 'Catalogo', hint: 'Aparece debajo del titulo del catalogo, antes de filtros y productos.' },
  { value: 'ABOUT_SUPPORT', label: 'Nosotros', hint: 'Aparece dentro de Nosotros, antes de los valores.' },
  { value: 'CONTACT_SUPPORT', label: 'Contacto', hint: 'Aparece como cierre editorial antes del footer.' },
  { value: 'CUBE_FACE', label: 'Caras del cubo 3D', hint: 'Aparece en el cubo flotante. Orden: 0 frente, 1 derecha, 2 atras, 3 izquierda, 4 arriba, 5 abajo.' },
];

const emptyForm = {
  placement: 'CATALOG_SUPPORT' as SiteMediaPlacement,
  type: 'IMAGE' as SiteMediaType,
  title: '',
  subtitle: '',
  url: '',
  posterUrl: '',
  altText: '',
  isActive: true,
  sortOrder: 0,
};

function MediaPreview({ item }: { item: Pick<SiteMedia, 'type' | 'url' | 'posterUrl' | 'altText' | 'title'> }) {
  if (!item.url) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-bd-border bg-bd-dark text-sm text-bd-muted">
        La vista previa aparece aqui
      </div>
    );
  }

  if (item.type === 'IMAGE') {
    return (
      <div
        role="img"
        aria-label={item.altText || item.title}
        className="h-56 w-full rounded-xl bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.18)), url("${item.url}")`,
        }}
      />
    );
  }

  return (
    <video
      src={item.url}
      poster={item.posterUrl || undefined}
      title={item.title || 'Video de apoyo'}
      className="h-56 w-full rounded-xl bg-black object-cover"
      controls
    />
  );
}

export const SiteMediaPage: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<SiteMedia[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const placementLabel = useMemo(() => {
    return placements.reduce<Record<string, string>>((acc, placement) => {
      acc[placement.value] = placement.label;
      return acc;
    }, {});
  }, []);

  const activePlacement = placements.find((placement) => placement.value === form.placement);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const response = await siteMediaApi.getAll();
      setItems(response.data);
    } catch (error: any) {
      toast.error(error.message || 'No se pudo cargar el contenido visual');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (item: SiteMedia) => {
    setEditingId(item.id);
    setForm({
      placement: item.placement,
      type: item.type,
      title: item.title,
      subtitle: item.subtitle || '',
      url: item.url,
      posterUrl: item.posterUrl || '',
      altText: item.altText || '',
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim() || !form.url.trim()) {
      toast.error('Titulo y URL son obligatorios');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        ...form,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        url: form.url.trim(),
        posterUrl: form.posterUrl.trim() || undefined,
        altText: form.altText.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (editingId) {
        await siteMediaApi.update(editingId, payload);
        toast.success('Contenido visual actualizado');
      } else {
        await siteMediaApi.create(payload);
        toast.success('Contenido visual creado');
      }

      resetForm();
      await loadItems();
    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('media', file);

    try {
      setIsUploading(true);
      const response = await siteMediaApi.upload(formData);
      setForm((prev) => ({
        ...prev,
        type: response.data.type,
        url: response.data.url,
        title: prev.title || file.name.replace(/\.[^.]+$/, ''),
      }));
      toast.success('Archivo subido correctamente');
    } catch (error: any) {
      toast.error(error.message || 'No se pudo subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleDelete = async (item: SiteMedia) => {
    const confirmed = window.confirm(`Eliminar "${item.title}"? Esta accion no se puede deshacer.`);
    if (!confirmed) return;

    try {
      await siteMediaApi.delete(item.id);
      toast.success('Contenido eliminado');
      await loadItems();
      if (editingId === item.id) resetForm();
    } catch (error: any) {
      toast.error(error.message || 'No se pudo eliminar');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-bd-border bg-bd-darkest p-6 shadow-xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-bd-purple">Belle Desir editorial</p>
            <h1 className="mt-2 font-serif text-3xl text-bd-text">Contenido visual de la pagina</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-bd-muted">
              Agrega imagenes sensuales y videos de apoyo sin tocar codigo. El archivo se sube al mismo storage usado por el catalogo, en una carpeta separada para contenido editorial.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-lg border border-bd-border px-4 py-2 text-sm text-bd-muted transition hover:border-bd-purple hover:text-bd-text"
            >
              <X size={16} />
              Cancelar edicion
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-bd-text">Ubicacion</span>
              <select
                value={form.placement}
                onChange={(event) => setForm((prev) => ({ ...prev, placement: event.target.value as SiteMediaPlacement }))}
                className="w-full rounded-lg border border-bd-border bg-bd-medium px-4 py-3 text-bd-text outline-none transition focus:border-bd-purple"
              >
                {placements.map((placement) => (
                  <option key={placement.value} value={placement.value}>{placement.label}</option>
                ))}
              </select>
              <span className="block text-xs leading-5 text-bd-muted">{activePlacement?.hint}</span>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-bd-text">Tipo</span>
              <select
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as SiteMediaType }))}
                className="w-full rounded-lg border border-bd-border bg-bd-medium px-4 py-3 text-bd-text outline-none transition focus:border-bd-purple"
              >
                <option value="IMAGE">Imagen</option>
                <option value="VIDEO">Video</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-bd-text">Titulo</span>
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-lg border border-bd-border bg-bd-medium px-4 py-3 text-bd-text outline-none transition focus:border-bd-purple"
                placeholder="Ej: Ritual de confianza"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-bd-text">Orden</span>
              <input
                type="number"
                min={form.placement === 'CUBE_FACE' ? 0 : undefined}
                max={form.placement === 'CUBE_FACE' ? 5 : undefined}
                value={form.sortOrder}
                onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))}
                className="w-full rounded-lg border border-bd-border bg-bd-medium px-4 py-3 text-bd-text outline-none transition focus:border-bd-purple"
              />
              {form.placement === 'CUBE_FACE' && (
                <span className="block text-xs leading-5 text-bd-muted">Usa 0 a 5 para elegir la cara exacta del cubo.</span>
              )}
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-bd-text">Subtitulo o descripcion breve</span>
              <textarea
                value={form.subtitle}
                onChange={(event) => setForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-bd-border bg-bd-medium px-4 py-3 text-bd-text outline-none transition focus:border-bd-purple"
                placeholder="Texto corto que acompana la pieza visual."
              />
            </label>

            <div className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-bd-text">Archivo visual</span>
              <div
                {...getRootProps()}
                className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
                  isDragActive ? 'border-bd-purple bg-bd-purple/10' : 'border-bd-border bg-bd-medium hover:border-bd-purple/50'
                } ${isUploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <input {...getInputProps()} />
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bd-purple/15 text-bd-purple">
                  {form.type === 'VIDEO' ? <Film size={22} /> : <ImageIcon size={22} />}
                </div>
                <p className="text-sm font-semibold text-bd-text">
                  {isUploading ? 'Subiendo archivo...' : 'Arrastra una imagen o video, o haz clic para subir'}
                </p>
                <p className="mt-1 text-xs text-bd-muted">Imagen: JPG, PNG, WEBP. Video: MP4, WEBM, MOV. Maximo 50MB.</p>
              </div>
              {form.url && (
                <div className="rounded-lg border border-bd-border bg-bd-darkest px-3 py-2 text-xs text-bd-muted">
                  <p className="truncate">Archivo actual: {form.url}</p>
                  <a href={form.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-bd-purple hover:text-bd-text">
                    Abrir archivo en una pestana nueva
                  </a>
                </div>
              )}
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-bd-text">Poster URL opcional</span>
              <input
                value={form.posterUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, posterUrl: event.target.value }))}
                className="w-full rounded-lg border border-bd-border bg-bd-medium px-4 py-3 text-bd-text outline-none transition focus:border-bd-purple"
                placeholder="Imagen previa para videos"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-bd-text">Texto alternativo</span>
              <input
                value={form.altText}
                onChange={(event) => setForm((prev) => ({ ...prev, altText: event.target.value }))}
                className="w-full rounded-lg border border-bd-border bg-bd-medium px-4 py-3 text-bd-text outline-none transition focus:border-bd-purple"
                placeholder="Descripcion accesible"
              />
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-bd-border bg-bd-medium p-4 md:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                className="h-5 w-5 accent-bd-purple"
              />
              <span className="text-sm text-bd-text">Visible en la pagina publica</span>
            </label>
          </div>

          <aside className="rounded-2xl border border-bd-border bg-bd-medium p-4">
            <div className="mb-4 flex items-center gap-2 text-bd-text">
              <Eye size={18} />
              <span className="text-sm font-semibold">Vista previa</span>
            </div>
            <MediaPreview item={form} />
            <div className="mt-4 rounded-xl bg-bd-darkest p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-bd-purple">{placementLabel[form.placement]}</p>
              <h3 className="mt-2 break-words font-serif text-xl text-bd-text">{form.title || 'Titulo editorial'}</h3>
              <p className="mt-2 break-words text-sm leading-6 text-bd-muted">{form.subtitle || 'Descripcion breve de apoyo visual.'}</p>
              <p className="mt-3 rounded-lg border border-bd-border bg-bd-medium px-3 py-2 text-xs leading-5 text-bd-muted">
                Donde se vera: {activePlacement?.hint}
              </p>
            </div>
            <button
              type="submit"
              disabled={isSaving || !form.url}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-bd-purple px-5 py-3 font-semibold text-white transition hover:bg-bd-purple/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={18} />
              {isSaving ? 'Guardando...' : editingId ? 'Actualizar y publicar' : 'Crear y publicar'}
            </button>
            {!form.url && (
              <p className="mt-2 text-center text-xs text-bd-muted">Primero sube un archivo para activar la publicacion.</p>
            )}
          </aside>
        </form>
      </section>

      <section className="rounded-2xl border border-bd-border bg-bd-darkest p-6 shadow-xl">
        <h2 className="font-serif text-2xl text-bd-text">Piezas publicadas</h2>
        <p className="mt-1 text-sm text-bd-muted">
          Ordenadas por ubicacion y prioridad. En la pagina publica se muestra la primera pieza activa de cada ubicacion.
        </p>

        {isLoading ? (
          <p className="mt-6 text-sm text-bd-muted">Cargando contenido visual...</p>
        ) : items.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-bd-border p-6 text-sm text-bd-muted">
            Todavia no hay contenido visual. Crea la primera pieza para activar estos espacios en la web.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {items.map((item) => (
              <article key={item.id} className="grid gap-4 rounded-2xl border border-bd-border bg-bd-medium p-4 md:grid-cols-[180px_1fr]">
                <MediaPreview item={item} />
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-bd-purple/15 px-3 py-1 text-xs font-semibold text-bd-purple">
                      {item.type === 'IMAGE' ? <ImageIcon size={13} /> : <Film size={13} />}
                      {item.type === 'IMAGE' ? 'Imagen' : 'Video'}
                    </span>
                    <span className="rounded-full bg-bd-darkest px-3 py-1 text-xs text-bd-muted">{placementLabel[item.placement]}</span>
                    <span className={`rounded-full px-3 py-1 text-xs ${item.isActive ? 'bg-bd-success/15 text-bd-success' : 'bg-bd-error/15 text-bd-error'}`}>
                      {item.isActive ? 'Visible' : 'Oculto'}
                    </span>
                  </div>
                  <h3 className="break-words font-serif text-xl text-bd-text">{item.title}</h3>
                  {item.subtitle && <p className="mt-2 break-words text-sm leading-6 text-bd-muted">{item.subtitle}</p>}
                  <p className="mt-3 truncate text-xs text-bd-muted">{item.url}</p>
                  <p className="mt-2 text-xs leading-5 text-bd-purple">
                    Se vera asi: {placements.find((placement) => placement.value === item.placement)?.hint}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="inline-flex items-center gap-2 rounded-lg border border-bd-border px-3 py-2 text-sm text-bd-text transition hover:border-bd-purple hover:text-bd-purple"
                    >
                      <Edit3 size={15} />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item)}
                      className="inline-flex items-center gap-2 rounded-lg border border-bd-error/40 px-3 py-2 text-sm text-bd-error transition hover:bg-bd-error/10"
                    >
                      <Trash2 size={15} />
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
