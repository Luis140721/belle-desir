// ============================================================
// UTILS — Sistema de custom events tipado
// Permite comunicación entre componentes sin acoplamiento directo
// ============================================================

import type { CartItem } from '../types/index.js';

// Mapa de tipos: nombre del evento → tipo del detail
interface AppEventMap {
  'age:verified': void;
  'cart:add': CartItem;
  'cart:open': void;
  'cart:close': void;
  'cart:updated': CartItem[];
}

/**
 * Emite un custom event tipado en el documento.
 */
export function emit<K extends keyof AppEventMap>(
  name: K,
  detail?: AppEventMap[K]
): void {
  document.dispatchEvent(
    new CustomEvent(name, { detail: detail ?? undefined, bubbles: false })
  );
}

/**
 * Suscribe a un custom event tipado.
 * Devuelve una función para cancelar la suscripción.
 */
export function on<K extends keyof AppEventMap>(
  name: K,
  handler: (detail: AppEventMap[K]) => void,
  options?: AddEventListenerOptions
): () => void {
  const listener = (e: Event) => handler((e as CustomEvent).detail);
  document.addEventListener(name, listener, options);
  return () => document.removeEventListener(name, listener);
}
