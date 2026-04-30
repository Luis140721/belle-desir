import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, Eye, EyeOff, Image as ImageIcon, Video, Layers, MousePointer2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../../components/ui/Toast';

interface Multimedia {
  id: string;
  title: string | null;
  type: 'IMAGE' | 'VIDEO' | 'BACKGROUND' | 'SUPPORT';
  url: string;
  page: string;
  section: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
}

export const MultimediaList: React.FC = () => {
  const [multimedia, setMultimedia] = useState<Multimedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const { showToast } = useToast();

  useEffect(() => {
    fetchMultimedia();
  }, []);

  const fetchMultimedia = async () => {
    try {
      const response = await axios.get('/api/multimedia', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMultimedia(response.data);
    } catch (error) {
      showToast('Error al cargar multimedia', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await axios.put(`/api/multimedia/${id}`, { isActive: !currentStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMultimedia(prev => prev.map(m => m.id === id ? { ...m, isActive: !currentStatus } : m));
      showToast('Estado actualizado', 'success');
    } catch (error) {
      showToast('Error al actualizar estado', 'error');
    }
  };

  const deleteMultimedia = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este recurso?')) return;
    try {
      await axios.delete(`/api/multimedia/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMultimedia(prev => prev.filter(m => m.id !== id));
      showToast('Recurso eliminado', 'success');
    } catch (error) {
      showToast('Error al eliminar recurso', 'error');
    }
  };

  const filteredMultimedia = multimedia.filter(m => {
    const matchesSearch = (m.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          m.page.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.section.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  const getEmbedUrl = (url: string) => {
    if (url.includes('drive.google.com')) {
      const id = url.match(/\/file\/d\/(.+?)\//)?.[1] || url.match(/id=(.+?)(&|$)/)?.[1];
      return id ? `https://lh3.googleusercontent.com/d/${id}=w400-h225-p` : null;
    }
    return url;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bd-text">Contenido Multimedia</h1>
          <p className="text-bd-muted">Gestiona imágenes y videos de todo el sitio.</p>
        </div>
        <Link 
          to="/admin/multimedia/new" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-bd-purple hover:bg-bd-purple-hover text-white rounded-lg transition-all shadow-lg shadow-bd-purple/20 font-medium"
        >
          <Plus size={18} />
          Nuevo Recurso
        </Link>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-bd-darkest p-4 rounded-xl border border-bd-border shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-bd-muted" size={18} />
          <input
            type="text"
            placeholder="Buscar por título, página o sección..."
            className="w-full pl-10 pr-4 py-2 bg-bd-dark border border-bd-border rounded-lg text-bd-text focus:outline-none focus:border-bd-purple transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-bd-dark px-4 py-2 rounded-lg border border-bd-border">
          <Filter className="text-bd-muted" size={18} />
          <select 
            className="flex-1 bg-transparent border-none text-bd-text focus:outline-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">Todos los tipos</option>
            <option value="IMAGE">Imagen</option>
            <option value="VIDEO">Video</option>
            <option value="BACKGROUND">Fondo</option>
            <option value="SUPPORT">Apoyo</option>
          </select>
        </div>
        <div className="flex items-center justify-end">
          <p className="text-sm text-bd-muted">Mostrando {filteredMultimedia.length} recursos</p>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bd-purple"></div>
        </div>
      ) : filteredMultimedia.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMultimedia.map((item) => (
            <div key={item.id} className="group relative bg-bd-darkest rounded-xl border border-bd-border overflow-hidden transition-all hover:shadow-xl hover:border-bd-purple/40">
              {/* Preview */}
              <div className="aspect-video bg-bd-dark relative overflow-hidden flex items-center justify-center">
                {item.type === 'IMAGE' || item.type === 'BACKGROUND' || item.type === 'SUPPORT' ? (
                  <img 
                    src={item.url} 
                    alt={item.title || ''} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-bd-dark to-bd-purple/20">
                    {getEmbedUrl(item.url) ? (
                      <img 
                        src={getEmbedUrl(item.url)!} 
                        className="w-full h-full object-cover opacity-60"
                        alt="Video Preview"
                      />
                    ) : (
                      <Video size={48} className="text-bd-purple/40" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-bd-purple/80 flex items-center justify-center text-white shadow-lg">
                        <Video size={24} />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Badge Type */}
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.type === 'IMAGE' ? 'bg-blue-500/80 text-white' :
                    item.type === 'VIDEO' ? 'bg-purple-500/80 text-white' :
                    item.type === 'BACKGROUND' ? 'bg-pink-500/80 text-white' :
                    'bg-amber-500/80 text-white'
                  }`}>
                    {item.type}
                  </span>
                  {!item.isActive && (
                    <span className="bg-red-500/80 text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Inactivo
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-bd-text line-clamp-1">{item.title || 'Sin título'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 bg-bd-medium rounded border border-bd-border text-bd-muted font-mono uppercase">
                      {item.page}
                    </span>
                    <span className="text-bd-muted text-[10px]">•</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-bd-medium rounded border border-bd-border text-bd-muted font-mono uppercase">
                      {item.section}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-bd-border/50">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => toggleStatus(item.id, item.isActive)}
                      className={`p-2 rounded-lg transition-colors ${item.isActive ? 'text-bd-purple hover:bg-bd-purple/10' : 'text-bd-muted hover:bg-bd-border'}`}
                      title={item.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {item.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <Link 
                      to={`/admin/multimedia/${item.id}`}
                      className="p-2 text-bd-muted hover:text-bd-text hover:bg-bd-border rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </Link>
                  </div>
                  <button 
                    onClick={() => deleteMultimedia(item.id)}
                    className="p-2 text-bd-muted hover:text-bd-error hover:bg-bd-error/10 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-bd-darkest rounded-xl border border-bd-border border-dashed p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-bd-border flex items-center justify-center text-bd-muted mb-4">
            <ImageIcon size={32} />
          </div>
          <h3 className="text-lg font-medium text-bd-text">No se encontraron recursos</h3>
          <p className="text-bd-muted max-w-sm mt-2">Prueba ajustando los filtros o crea un nuevo recurso multimedia.</p>
          <Link 
            to="/admin/multimedia/new" 
            className="mt-6 px-6 py-2 bg-bd-purple text-white rounded-lg hover:bg-bd-purple-hover transition-all"
          >
            Agregar mi primer recurso
          </Link>
        </div>
      )}
    </div>
  );
};
