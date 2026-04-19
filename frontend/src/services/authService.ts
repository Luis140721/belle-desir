// ============================================================
// SERVICE - Auth: registro, login, gestión del token
// ============================================================

import { buildApiUrl } from '../config/api';

export interface AuthPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthPayload;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(buildApiUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.message ?? `Error ${res.status} al iniciar sesión`);
  }
  return body.data as AuthResponse;
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(buildApiUrl('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.message ?? `Error ${res.status} al registrarse`);
  }
  return body.data as AuthResponse;
}

/** Guarda tokens y datos del usuario en localStorage */
export function saveSession(auth: AuthResponse): void {
  localStorage.setItem('accessToken', auth.accessToken);
  localStorage.setItem('refreshToken', auth.refreshToken);
  localStorage.setItem('user', JSON.stringify(auth.user));
}

/** Recupera el access token guardado, o null */
export function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

/** ¿Hay sesión activa? */
export function isLoggedIn(): boolean {
  return Boolean(localStorage.getItem('accessToken'));
}

/** Cierra sesión localmente (sin llamar al backend) */
export function clearSession(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}
