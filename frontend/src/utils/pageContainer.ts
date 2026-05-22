/** Contenedor donde las páginas SPA reemplazan el contenido sin borrar navbar ni carrito. */
export function getSpaPageRoot(): HTMLElement | null {
  return document.getElementById('spa-page-root');
}
