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

export async function loginWithGoogleCredential(credential: string): Promise<AuthResponse> {
  const res = await fetch(buildApiUrl('/auth/google'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.message ?? `Error ${res.status} al iniciar sesion con Google`);
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

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No fue posible cargar Google Sign-In'));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
}

export async function renderGoogleSignInButton(
  elementId: string,
  onSuccess: (auth: AuthResponse) => void,
  onError: (message: string) => void
): Promise<boolean> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const target = document.getElementById(elementId);

  if (!target || !clientId) {
    if (target) {
      target.classList.add('google-auth-button-pending');
      target.innerHTML = /* html */ `
        <button type="button" class="google-fallback-button" disabled>
          <span class="google-mark">G</span>
          <span>Continuar con Google</span>
        </button>
        <p class="google-config-hint">Falta configurar Google Client ID</p>
      `;
    }
    return false;
  }

  try {
    await loadGoogleIdentityScript();
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const auth = await loginWithGoogleCredential(response.credential);
          saveSession(auth);
          onSuccess(auth);
        } catch (err) {
          onError(err instanceof Error ? err.message : 'No fue posible iniciar sesion con Google');
        }
      },
    });

    window.google.accounts.id.renderButton(target, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 320,
    });
    return true;
  } catch (err) {
    onError(err instanceof Error ? err.message : 'No fue posible cargar Google Sign-In');
    return false;
  }
}
