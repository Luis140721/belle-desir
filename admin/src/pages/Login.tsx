import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bd-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-bd-text font-serif tracking-tight">Belle Désir</h1>
          <p className="text-bd-muted mt-2 font-medium">Panel de Administración</p>
        </div>

        <div className="bg-bd-medium border border-bd-border p-8 rounded-2xl shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-bd-text block">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bd-muted">
                  <Mail size={18} />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  autoFocus
                  className={`
                    w-full pl-10 pr-4 py-3 bg-bd-dark border rounded-xl text-bd-text focus:outline-none focus:ring-2 focus:ring-bd-purple transition-all
                    ${errors.email ? 'border-bd-error focus:ring-bd-error' : 'border-bd-border'}
                  `}
                  placeholder="admin@belledesir.com"
                />
              </div>
              {errors.email && <p className="text-bd-error text-xs font-medium">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-bd-text block">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bd-muted">
                  <Lock size={18} />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`
                    w-full pl-10 pr-12 py-3 bg-bd-dark border rounded-xl text-bd-text focus:outline-none focus:ring-2 focus:ring-bd-purple transition-all
                    ${errors.password ? 'border-bd-error focus:ring-bd-error' : 'border-bd-border'}
                  `}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-bd-muted hover:text-bd-text transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-bd-error text-xs font-medium">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-bd-purple hover:bg-bd-purple-hover text-white font-bold py-3.5 rounded-xl shadow-lg shadow-bd-purple/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Ingresando...</span>
                </>
              ) : (
                'Ingresar al Panel'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-bd-muted text-xs mt-10 tracking-widest uppercase">
          &copy; 2026 Belle Désir &bull; Todos los derechos reservados
        </p>
      </div>
    </div>
  );
};
