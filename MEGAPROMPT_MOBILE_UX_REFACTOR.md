# 🎯 MEGAPROMPT: Mobile UX & Accessibility Refactor

## 📋 Objetivo General
Implementar un sistema completo de mejora de experiencia de usuario para dispositivos móviles, transformando la navegación de un modelo basado en menús tradicionales a una arquitectura moderna de drawer lateral con sincronización de scroll inteligente, objetivos táctiles accesibles según estándares WCAG 2.1, y modalidades de visualización adaptativas que respeten las limitaciones de pantalla pequeña. Esta refactorización se enfoca en reducir fricción en la interacción, mejorar la percepción de control del usuario, y crear una jerarquía visual coherente que funcione sin degradación en todos los tamaños de pantalla desde 320px hasta 768px.

---

## 🔧 CAMBIOS DETALLADOS POR ARCHIVO

### 1️⃣ `frontend/index.html`

#### Refactorización de Titulares Hero y Secciones
El archivo HTML requiere una simplificación estructural de los titulares principales del sitio. Los títulos actualmente utilizan saltos de línea (`<br>`) para crear separaciones visuales que, en viewport móvil, generan exceso de espacio vertical o ajuste de texto poco flexible. Esta refactorización busca unificar los titulares en una sola línea lógica donde las palabras clave importantes estén enfatizadas mediante elementos `<em>` con estilos inline. Esto permite que el navegador maneje el wrapping de texto de forma natural según el ancho disponible, sin imponer saltos forzados que rompan la fluidez tipográfica en dispositivos pequeños.

Los titulares afectados son: el héroe principal de bienvenida que actualmente menciona "Conócete" con palabras clave en líneas separadas, el de la sección de catálogo que introduce el explorador de productos, y el de la sección "Nosotros" que describe la marca. Cada uno debe consolidarse en una estructura de párrafo único donde los énfasis se manejen por CSS, no por markup.

#### Simplificación del CTA (Call-to-Action) Hero
El botón "Ver catálogo" en la sección hero actualmente forma parte de un sistema dropdown heredado que emula los comportamientos del navegador (un contenedor con clase `navbar-dropdown` que contiene un menú desplegable de categorías). Este comportamiento es un punto de fricción en mobile porque: (1) requiere un segundo tap para ver categorías, (2) consume espacio de pantalla valiosa con una lista innecesaria cuando el catálogo completo está en la siguiente sección, y (3) agrega complejidad interactiva que confunde la jerarquía de acciones.

El CTA debe simplificarse a un único enlace que lleva directamente al catálogo de productos (section#catalogo). Los usuarios que quieran filtrar por categoría pueden usar ya sea el menú drawer (en mobile) o la barra de navegación. Esto reduce la sobrecarga cognitiva y acelera el flujo principal: héroe → catálogo → producto.

Además, el contenedor del CTA debe perder la clase `navbar-dropdown` para que no quede enganchado a los estilos y comportamientos del sistema de navegación.

---

### 2️⃣ `frontend/src/components/Navbar.ts`

#### Arquitectura de Drawer Navigation
El componente Navbar debe ser refactorizado para soportar un patrón de drawer sidebar que es el estándar de facto en aplicaciones móviles modernas. Este patrón implica una serie de cambios arquitectónicos profundos:

**Creación de Backdrop Dinámico:**
El archivo debe crear e inyectar de forma dinámica un elemento de telón de fondo (backdrop) que cubre la pantalla completa cuando el drawer está abierto. Este backdrop no es simplemente decorativo: actúa como una "zona de seguridad" donde si el usuario toca fuera del menú, el drawer se cierra automáticamente. El backdrop debe ser creado una sola vez en la inicialización y reutilizado. Debe tener un atributo aria-hidden porque es un elemento de UI, no de contenido.

**Detección de Tamaño de Viewport:**
Se requiere una función helper que consulte el tamaño actual de la pantalla para determinar si estamos en modo mobile (≤768px) o desktop. Esta consulta debe usarse como guardia en múltiples puntos: al hacer click fuera del menú, al cerrar dropdowns, y al redimensionar la ventana. En desktop, muchos comportamientos deben desactivarse o cambiar radicalmente.

**Sistema de Cierre Centralizado:**
Actualmente el código para cerrar el menú probablemente se repite en varios lugares (al hacer click en un link, al presionar escape, etc.). Esto debe consolidarse en una función centralizada que maneje toda la lógica de cierre: remover clases de estado, actualizar atributos ARIA, limpiar el overflow del body, etc. Cualquier evento que dispare un cierre debe llamar a esta función centralizada, garantizando consistencia.

**Sincronización de Body Overflow:**
Este es un concepto crítico que requiere explicación. Cuando hay un overlay abierto (drawer, modal, carrito), el body no debe permitir scroll para prevenir que el usuario pueda desplazar la página de fondo mientras interactúa con el overlay. Sin embargo, cuando hay MÚLTIPLES overlays abiertos (por ejemplo, drawer + modal simultáneamente), el control de overflow necesita ser inteligente: no puede simplemente alternar entre hidden/visible en cada componente porque uno podría cerrar antes que otro y reactivar el scroll prematuramente.

La solución es una función centralizada que consulta el estado de TODOS los overlays posibles (drawer abierto, modal de producto abierto, carrito abierto) y aplica la regla: "si CUALQUIERA está abierto, body.overflow = hidden; si NINGUNO está abierto, body.overflow = ''". Esta función debe ser llamada cada vez que cualquier overlay cambia de estado.

**Eventos Interactivos Mejorados:**
El botón hamburguesa debe continuar alternando el estado de apertura/cierre del menú, pero ahora agrega la lógica de backdrop y body overflow. El menú debe cerrarse automáticamente cuando el usuario toca fuera de él (pero solo en mobile). Los links dentro del menú tienen comportamiento diferenciado: links normales cierran el menú automáticamente; links con clase dropdown-toggle que son toggles de submenús NO cierran el drawer. La tecla Escape debe cerrar el drawer y darle el foco de vuelta al botón hamburguesa. El evento de resize debe monitorear cambios de tamaño de pantalla para cerrar el drawer si se agranda a desktop.

---

### 3️⃣ `frontend/src/components/ProductModal.ts`

#### Sincronización de Overflow con Sistema Centralizado
El modal de producto actualmente maneja su propio estado de body overflow directamente (estableciendo y limpiando `document.body.style.overflow`). Este enfoque es problemático en una aplicación donde múltiples overlays pueden coexistir (drawer abierto mientras se abre un producto, carrito visible mientras se abre producto, etc.).

El modal debe ser refactorizado para: (1) NO manipular body.style.overflow directamente, sino (2) llamar a la función centralizada syncBodyOverflow() que existe en Navbar.ts, que considera el estado de todos los overlays simultáneamente. Cuando el modal se abre, el overlay recibe clase active, y luego se invoca syncBodyOverflow() que consulta "¿hay modal abierto?" y toma la decisión correcta. Cuando cierra, remueve la clase active, invoca syncBodyOverflow(), y este ve que no hay modal abierto pero quizás hay drawer abierto, así que mantiene overflow hidden.

#### Mejora de Feedback Visual del Botón "Agregado"
Cuando el usuario clickea el botón "Agregar al carrito", actualmente se recibe feedback visual mediante manipulación de inline styles: el botón cambia de color, y luego de 1.5s vuelve al estado normal. Este enfoque es frágil porque:

1. Los inline styles pueden ser sobrescritos por cambios de estado posteriores
2. El código de JavaScript está acoplado directamente a valores de color, haciendo difícil cambiarlos
3. Si el diseño cambia, hay que editar JavaScript en lugar de CSS

El feedback debe refactorizarse para usar clases CSS: cuando se agrega al carrito, se agrega una clase "added" (o similar) al botón que CSS transforma con estados visuales predefinidos. Además, el botón puede quedar deshabilitado (disabled attribute) durante los 1.5s para prevenir múltiples clicks accidentales. Después del timeout, la clase se remueve y se habilita el botón.

#### Enriquecimiento de Datos del Carrito
Actualmente cuando un producto se agrega al carrito, se envía información básica: id, nombre, precio, imagen, cantidad. Para permitir validaciones de cantidad en el carrito (por ejemplo, no permitir que la cantidad supere el stock disponible), es necesario enviar también la cantidad máxima disponible. El producto modal debe capturar esta información del producto y incluirla en el payload que se envía al carrito.

#### Función Centralizada de Overflow Lock
De la misma manera que en Navbar.ts, ProductModal.ts debe tener su propia copia de la función syncBodyOverflow() que audita el estado de todos los overlays. Esto es necesario para que cada overlay sea independiente y no requiera conocimiento del otro.

---

### 4️⃣ `frontend/src/components/CartSidebar.ts`

#### Verificación e Implementación de Sincronización de Overflow
El carrito sidebar es otro overlay que puede estar abierto simultáneamente con otros elementos. Debe verificarse que este componente ya tiene implementada la lógica de syncBodyOverflow(). Si no, debe agregarse exactamente como en ProductModal.ts: una función local que consulta el estado de todos los overlays y toma la decisión centralizada sobre el overflow del body.

La presencia de esta función en múltiples componentes no es redundancia: es necesaria para que cada componente pueda funcionar de forma aislada sin dependencias externas, garantizando que cualquier overlay pueda llamarla sin saber qué otros overlays existen.

---

### 5️⃣ `frontend/src/components/Catalog.ts`

#### Refactorización de Contenedor de Filtros
Los filtros de categorías actualmente están probablemente directamente en el flujo normal del documento o con estilos que no facilitan una interacción móvil optimizada. En mobile, los filtros deben presentarse como una fila horizontal scrolleable (horizontalmente), NOT como una cuadrícula normal que ocuparía demasiado espacio vertical.

El contenedor de filtros debe ser envuelto en un elemento contenedor dedicado que tenga display flex con dirección horizontal, overflow-x auto para permitir scroll horizontal, y con el scrollbar oculto (scrollbar-width: none para Firefox, ::-webkit-scrollbar none para Chrome). Además, se deben aplicar técnicas de CSS como mask-image o clip-path para crear un "fade out" en los bordes izquierdo y derecho, indicando visualmente que hay más contenido si se scrollea.

Cualquier clase `navbar-dropdown` asociada a los filtros debe ser removida si existe, porque esos estilos están diseñados para dropdowns verticales, no para scroll horizontal.

---

### 6️⃣ `frontend/src/components/ProductCard.ts`

#### Enriquecimiento de Datos y Atributos
El ProductCard actualmente probablemente emite eventos con información del producto cuando se abre. Debe verificarse que los datos incluyen la cantidad máxima disponible (maxQty, stock, o como se nombre actualmente) para que el modal pueda recibirla y incluirla en el payload al carrito.

Además, si aplica según la estructura, el componente debe garantizar que el atributo data-max-qty esté presente en el elemento del card, permitiendo que otros scripts puedan consultarlo si es necesario.

---

### 7️⃣ `frontend/src/types/index.ts`

#### Extensión de Tipos TypeScript
El archivo de tipos debe actualizarse para reflejar los cambios de datos mencionados. Específicamente:

- La interfaz CartItem debe incluir un campo opcional para la cantidad máxima permitida (maxQuantity, maxQty, o el nombre consistente elegido)
- Cualquier interfaz que represente datos de producto que se pasan a componentes debe incluir este campo de cantidad máxima
- Si hay un tipo específico para ProductCardData o similar, debe incluir esta propiedad

Estos cambios en tipos son preventivos: evitan errores en tiempo de compilación (si se usa TypeScript) y mejoran la documentación del código sobre qué datos se esperan.

---

### 8️⃣ `frontend/src/services/productService.ts`

#### Mapeo Completo de Propiedades del Producto
El servicio que obtiene productos (probablemente desde una API) debe asegurar que el mapeo de datos desde la respuesta del servidor hacia los objetos de JavaScript locales incluya la cantidad máxima o stock del producto. Si la API no proporciona este dato, el servicio debe definir valores por defecto razonables o consultar esta información desde otro endpoint.

Esto es una cuestión de "garbage in, garbage out": aunque el componente de modal esté listo para recibir maxQuantity, si el servicio no lo proporciona, nunca llegará el dato.

---

### 9️⃣ `frontend/src/css/layout.css`

#### Limpieza de Estilos Heredados
Actualmente layout.css probablemente contiene estilos para `.hero-dropdown-menu` que fueron diseñados para posicionar absolutamente o fijar un menú dropdown en el hero. Estos estilos (posicionamiento fixed/absolute, transforms, z-index específico, etc.) son completamente innecesarios ahora que el hero-CTA ha sido simplificado a un simple botón.

Estos estilos deben ser removidos por completo para mantener la limpieza del codebase. Si hay referencias a esta clase en otros archivos CSS, también deben ser limpiadas.

---

### 🔟 `frontend/src/css/components.css`

#### Nuevos Estilos para Botón "Agregado"
El archivo debe incluir una nueva regla CSS para la clase "added" que se agrega al botón durante 1.5s. Esta regla define el estado visual del botón cuando está en este estado: color de fondo verde/confirmación, posible cambio de sombra, y quizás animación de transición. El objetivo es dar feedback claro al usuario de que la acción fue exitosa.

#### Nuevos Estilos para Backdrop del Drawer
Debe agregarse la definición de la clase `navbar-backdrop` que es el telón de fondo oscuro que aparece cuando el drawer está abierto. La clase debe definir todos los estilos necesarios: posicionamiento fixed que cubre toda la pantalla, color semitransparente oscuro, backdrop-filter para blur, y transiciones suaves de opacidad/visibility. Además, debe definirse un selector de regla que aplica CUANDO el body tiene la clase `nav-drawer-open`, haciendo que el backdrop pase de estado invisible/no-interactivo a visible/interactivo.

#### Revisiones y Aseguranzas
- El elemento `.producto-card` debe tener cursor: pointer cuando hay hover (si está en desktop), indicando que es clickeable
- El overlay modal debe tener todas las transiciones suaves y z-index correcto para que aparezca siempre encima
- Si el sitio soporta notch en iPhone, debe haber reglas CSS usando safe-area-insets para aplicar padding adicional en zonas seguras

---

### 1️⃣1️⃣ `frontend/src/css/responsive.css` - Sección Media Query 768px

#### Refactorización Completa del Navbar en Mobile

**Botón Hamburguesa:**
El botón debe tener dimensiones fijas y generosas para ser tap-friendly. Debe estar posicionado al inicio del navbar (left) usando flexbox order property si es necesario. La altura y ancho deben ser iguales y >= 44px para cumplir con estándares de accesibilidad móvil.

**Navbar Container:**
El navbar debe tener una altura fija (probablemente 60-64px) para garantizar consistencia. El z-index debe ser alto pero no el máximo, porque el drawer debe estar encima. El padding debe optimizarse para no desperdiciar espacio vertical.

**Logo:**
El logo debe ocupar el espacio disponible entre el botón hamburguesa y otros elementos, posiblemente con flex: 1 para que crezca y ocupe el espacio central.

**Menú Drawer:**
Este es el cambio más significativo. El menú que actualmente probablemente se muestra inline o con display block debe transformarse en un drawer sidebar que sale desde la izquierda. Debe tener:
- Posicionamiento fixed en toda la altura desde top: navbar-height hasta el bottom
- Transform translateX(-110%) para estar completamente fuera de pantalla, y translateX(0) cuando tiene clase abierto
- Ancho limitado (típicamente 60-86vw con un máximo en píxeles)
- Fondo oscuro con backdrop-filter para blur
- Overflow-y auto para permitir scroll interno si el contenido es más largo que la pantalla
- z-index más alto que el navbar pero menos que otros overlays críticos
- Transición suave para el transform

**Links en el Menú:**
Cada link dentro del drawer debe ser un bloque flexible con altura mínima 44px para ser tap-friendly. El espaciado vertical debe permitir que los dedos no toquen dos botones simultáneamente (gap entre items).

**Dropdowns dentro del Drawer:**
Los dropdowns (submenús bajo categorías, por ejemplo) tienen comportamiento diferente en drawer vs desktop. En drawer, el menú desplegable debe cambiar de posicionamiento fixed/absolute a posicionamiento static o relative, y debe ser completamente visible sin necesidad de transformaciones. Los subítems deben fluir naturalmente como parte de la lista, quizás con padding adicional para indicar jerarquía.

**Dropdown Toggles:**
Los botones que abren/cierran submenús deben estar claramente marcados visualmente (quizás con un ícono de flecha) y responder al click alternando una clase active que muestra/esconde el submenú.

#### Ajustes del Hero en Mobile

**Contenedor Hero:**
El padding vertical debe reducirse respecto a desktop para no desperdiciar la pantalla limitada del mobile. La altura mínima debe relajarse porque el contenido debe poder fluir naturalmente.

**Titulares:**
El tamaño de fuente debe reducirse (2rem es típico para h1 en mobile), pero el line-height debe mantenerse legible (1.1-1.2). El margin-bottom debe normalizarse para mantener una jerarquía visual clara.

**Eyebrow (etiqueta pequeña):**
Debe reducir su margin-bottom para no crear brecha excesiva.

**Subtítulo:**
Debe ser legible pero más compacto que en desktop.

#### Remociones de Código Antiguo

Ciertas reglas CSS para `.seccion-cubo` o similares que establecen alturas específicas o comportamientos de overflow deben ser removidas si son conflictivas con el nuevo diseño mobile.

#### Catálogo y Filtros en Mobile

El contenedor de catálogo y sus encabezados deben ajustarse para el ancho limitado. Los filtros particularmente deben ser scrolleables horizontalmente como se describe en la sección Catalog.ts.

#### Tarjetas de Producto en Mobile

Las tarjetas deben adaptarse al ancho disponible. En algunos casos, puede ser una sola columna en mobile muy pequeño vs dos columnas en mobile más grande (500px+).

#### Modal de Producto en Mobile

En viewports muy pequeños (≤500px), el modal de producto puede cambiar de una presentación centrada a una presentación tipo "bottom sheet" que sale desde el fondo, más natural en pantallitas. Debe haber animaciones de entrada/salida suaves (slideUp/slideDown).

#### Touch Targets Universales

Cualquier botón, link, o elemento interactivo debe tener un mínimo de 44px × 44px (o 44px de altura si es un botón horizontal amplio). Esto aplica a: botones primarios, botones secundarios, botones de filtro, botones de cantidad en el modal, etc.

---

### 1️⃣2️⃣ `frontend/src/css/responsive.css` - Sección Media Query 500px

#### Ajustes Ultra-Mobiles

Para viewports muy pequeños (teléfonos antiguos, modo apaisado en móviles pequeños), pueden requerirse ajustes adicionales:

**Tipografía Ultra-Compacta:**
Los títulos pueden reducirse más, los margins/paddings compactarse, para maximizar el real estate disponible.

**Carrito Sidebar en Ultra-Mobile:**
El carrito que es un drawer derecho debe ocupar ancho 100% para ser usable. La altura debe ser 100vh (o 100dvh) para ocupar toda la pantalla.

**Botones de Checkout:**
Los botones de acción final (checkout, comprar) deben tener altura 48px y ocupar el ancho completo para ser fáciles de clickear sin precisión.

**Secciones con Ícono/Título:**
El tamaño de títulos de secciones puede ajustarse a 2rem o menos manteniendo line-height legible.

---

## 🎓 CONCEPTOS ARQUITECTÓNICOS CLAVE

### Drawer Navigation Pattern
El patrón de drawer (o navigation drawer) es la forma estándar en que las aplicaciones móviles manejan la navegación principal. En lugar de una barra horizontal que consume espacio, la navegación se "esconde" en un panel lateral que desliza horizontalmente. Ofrece varias ventajas: (1) preserva el espacio vertical para contenido, (2) es familiar para usuarios de apps móviles, (3) facilita menús grandes sin scrolling, (4) crea una clara separación entre navegación y contenido.

### Body Overflow Lock Synchronization
Cuando múltiples componentes pueden mostrar overlays (navs, modals, sidebars), el control de scroll en el body debe ser inteligente. Si cada componente establece/limpia body.overflow de forma aislada, se pueden producir condiciones de carrera: componente A abre, bloquea scroll; componente B abre, bloquea scroll; componente B cierra, desbloquea scroll; ahora componente A sigue abierto pero el body permite scroll porque B no sabe que A existe.

La solución es una función compartida que audita el estado de todos los overlays y toma una decisión centralizada. Esto es análogo a un sistema de voting: "¿alguien necesita que el scroll esté bloqueado?" Si sí, bloquear. Si no, desbloquear. La función se invoca cada vez que el estado de CUALQUIER overlay cambia.

### WCAG 2.1 AA Compliance - Touch Targets
El estándar de accesibilidad WCAG define que todos los elementos interactivos deben tener un mínimo de 44×44 píxeles CSS (o equivalente) para ser considerados accesibles en plataforma táctil. Esto es basado en estudios de ergonomía sobre el tamaño de la yema del dedo humano. Un botón más pequeño es más difícil de tocar sin tocadores adyacentes.

### Responsive Design with Viewport Breakpoints
La estrategia responsive define breakpoints (768px, 500px, etc.) donde se aplican reglas CSS diferentes. Por debajo de 768px es "mobile". De 768px a ~1024px es "tablet". Arriba es "desktop". Cada región tiene optimizaciones específicas para su tamaño de pantalla.

### CSS Selectors for State Management
Sin JavaScript frameworks robustos, el estado de UI se comunica mediante clases CSS en el HTML (abierto, active, added, etc.). CSS selectors permiten cambiar estilos basados en estas clases. Por ejemplo: `.navbar-menu.abierto { transform: translateX(0); }` significa "cuando el menú tiene AMBAS clases navbar-menu Y abierto, aplicar este transform".

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [x] HTML: Simplificar titulares hero y secciones (eliminar `<br>`, usar `<em>` inline)
- [x] HTML: Remover dropdown del CTA hero, mantener solo botón simple
- [x] Navbar.ts: Crear backdrop dinámico e inyectarlo en el DOM
- [x] Navbar.ts: Implementar función isMobileNav() para consulta de viewport
- [x] Navbar.ts: Implementar función closeMenu() centralizada
- [x] Navbar.ts: Implementar función syncBodyOverflow() para auditar overlays
- [x] Navbar.ts: Refactorizar hamburguesa listener para manejar body classes y backdrop
- [x] Navbar.ts: Agregar listener global para click fuera del menú (solo en mobile)
- [x] Navbar.ts: Refactorizar listener de links para cerrar menú contextualmente
- [x] Navbar.ts: Agregar listener de escape key y resize window
- [x] ProductModal.ts: Remover manipulación directa de body.style.overflow
- [x] ProductModal.ts: Reemplazar con llamadas a syncBodyOverflow()
- [x] ProductModal.ts: Refactorizar feedback de botón "Agregado" a usar clases CSS + disabled
- [x] ProductModal.ts: Agregar maxQuantity al payload del carrito
- [x] ProductModal.ts: Fallback local syncBodyOverflow (importa el de Navbar)
- [x] CartSidebar.ts: syncBodyOverflow() + validación maxQuantity en cantidades
- [x] Catalog.ts: Contenedor wrapper para filtros scrolleables (HTML + CSS)
- [x] Catalog.ts: Filtros sin clase navbar-dropdown
- [x] ProductCard.ts: Atributo data-max-qty desde stock
- [ ] ProductCard.ts: Tipo ProductCardData dedicado (no creado; se usa Product)
- [x] types/index.ts: Campo maxQuantity en CartItem
- [ ] types/index.ts: ProductCardData con maxQty (no aplica; Product.stock basta)
- [x] productService.ts: Stock vía tipo Product del API (sin mapeo extra)
- [x] layout.css: Reglas .hero-dropdown-menu eliminadas
- [x] components.css: .btn-primario.added y .navbar-backdrop
- [x] responsive.css: Drawer, hero, filtros, touch targets, ≤500px bottom-sheet
- [ ] ProductModal.ts: Animación de cierre con clase .closing en JS
- [ ] Gestos swipe / haptics (futuro)

---

## 🎨 PRINCIPIOS DE DISEÑO SUBYACENTES

### Mobile-First Thinking
Aunque el sitio tiene versión desktop, el diseño debe pensarse desde mobile hacia arriba. Los constraints de mobile (pantalla pequeña, una mano, touch) obligan a tomar decisiones más disciplinadas. Las optimizaciones para desktop son típicamente "agregar espacio" o "agregar complejidad visual", no lo inverso.

### Reduce Cognitive Load
Cada overlay adicional, cada opción menú, cada confirmación extra es fricción. El redesign busca minimizar esto: eliminar el dropdown del hero, cerrar menú automáticamente al navegar, sincronizar scroll para que no haya confusión. El usuario debe sentir menos clics necesarios para lograr su objetivo.

### Accessibility is Universal
La accesibilidad (44px touch targets, ARIA labels, keyboard navigation) no es solo para usuarios con discapacidades. Beneficia a todos: dedos mojados, dedos grandes, pantallas grandes, luz solar brillante, navegación con guantes. Es un "rising tide" que levanta todos los botes.

### Progressive Enhancement
Aunque JavaScript crea los drawers y maneja overlays, el HTML base debe funcionar razonablemente incluso sin JS (links navigables, contenido legible, etc.). Luego JavaScript mejora la experiencia con interacciones suaves. Esto es especialmente importante en mobile donde JS puede ser lento.

### CSS Over JavaScript
Cuando sea posible, usar CSS para estados visuales (clases + CSS selectors) en lugar de JavaScript manipulando inline styles. Beneficios: mantenibilidad (cambios de diseño son cambios de CSS), performance (CSS es más eficiente), separación de concerns (HTML/CSS para estructura/presentación, JS para comportamiento).

---

## 📱 TESTING CHECKLIST

### Pruebas de Comportamiento Drawer

- Verificar que el drawer desliza suavemente desde la izquierda en mobile
- Verificar que el backdrop aparece oscuro y semi-transparent cuando drawer abierto
- Verificar que clickear backdrop cierra el drawer
- Verificar que clickear un link en el drawer cierra el drawer (excepto dropdown toggles)
- Verificar que presionar Escape cierra el drawer
- Verificar que el drawer desaparece completamente cuando se redimensiona a tablet/desktop
- Verificar que el menú hamburguesa desaparece cuando se redimensiona a tablet/desktop

### Pruebas de Overflow Lock

- Abrir drawer y verificar que el body background no scrollea
- Abrir modal de producto mientras drawer está abierto, verificar que sigue sin scroll
- Cerrar modal, verificar que aún no hay scroll (drawer sigue abierto)
- Cerrar drawer, verificar que scroll está permitido
- Abrir carrito y modal simultáneamente, verificar que no scrollea
- Cerrar uno de los overlays, verificar que el otro todavía previene scroll

### Pruebas de Responsiveness

- Viewport 375px: Todos elementos visible, sin horizontal scroll
- Viewport 500px: Modal cambia a bottom-sheet (si aplica)
- Viewport 768px: Drawer desaparece, navbar vuelve a layout horizontal
- Viewport 1024px+: Desktop completo

### Pruebas de Accesibilidad

- Todos botones/links tienen > 44px altura/ancho
- Tap en botones se siente responsive, sin lag
- aria-label presentes en botones que no tienen texto visible
- aria-expanded correcto en botones que toggle
- Keyboard navigation funciona (Tab, Escape, Enter)

### Pruebas de Dispositivos Reales

- iPhone 12 mini (375px): Drawer suave, no glitches
- iPhone 12 Pro (390px): Idem
- iPad Air en portrait (768px): Transición suave de drawer a menu
- iPad Air en landscape (1024px): Desktop layout
- Samsung Galaxy S21 (360px): Idem iPhone 12 mini
- Emular iPhone con notch, verificar safe-area-insets

### Pruebas de Performance

- Animación drawer @ 60fps (sin jank)
- Transiciones suaves sin saltos de layout
- No hay memory leaks al abrir/cerrar drawer repetidamente
- Sincronización de overflow no causa reflows repetidos



---

### 2️⃣ `frontend/src/components/Navbar.ts`
**Refactor completo del manejo de drawer navigation:**

#### **Nuevas variables iniciales:**
```typescript
const body = document.body;
const backdropId = 'navbar-backdrop';
let backdrop = document.getElementById(backdropId) as HTMLElement | null;

if (!backdrop) {
  backdrop = document.createElement('div');
  backdrop.id = backdropId;
  backdrop.className = 'navbar-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  body.appendChild(backdrop);
}

const isMobileNav = () => window.matchMedia('(max-width: 768px)').matches;
```

#### **Nueva función: `syncBodyOverflow()`**
```typescript
const syncBodyOverflow = () => {
  const lock =
    body.classList.contains('nav-drawer-open') ||
    Boolean(document.querySelector('.product-modal-overlay.active')) ||
    Boolean(document.querySelector('.carrito-sidebar.abierto'));
  body.style.overflow = lock ? 'hidden' : '';
};
```
**Propósito:** Centralizar la lógica de bloqueo de scroll. Si algún overlay está abierto, bloquear scroll.

#### **Nueva función: `closeMenu()`**
```typescript
const closeMenu = () => {
  if (!btnMenu || !menu) return;
  menu.classList.remove('abierto');
  btnMenu.classList.remove('abierto');
  btnMenu.setAttribute('aria-expanded', 'false');
  btnMenu.setAttribute('aria-label', 'Abrir menú');
  body.classList.remove('nav-drawer-open');
  syncBodyOverflow();
};
```
**Propósito:** Evitar duplicación de código para cerrar el menú.

#### **Mejorar hamburguesa listener:**
- Agregar clases a `body` cuando abre/cierra
- Llamar a `syncBodyOverflow()`
- Agregar listener al backdrop para cerrarlo al clickear

#### **Agregar listener global para cerrar menú:**
- Click fuera del menú (en desktop no hacer nada: `if (!isMobileNav()) return`)
- Si es en el menú o botón, no cerrar
- Si es en otro lado, llamar `closeMenu()`

#### **Actualizar links listener:**
- Ahora todos los `<a>` en el menú disparan check
- Si es `dropdown-toggle`, no cerrar (solo en desktop)
- En mobile, cerrar menú al clickear cualquier link excepto dropdowns

#### **Agregar escape key y resize listeners:**
- Escape: Cerrar menú y dar focus al botón
- Resize: Si se agrandó a desktop, cerrar menú automáticamente

---

### 3️⃣ `frontend/src/components/ProductModal.ts`
**Cambios de body overflow y UX:**

#### **En `openProductModal()`:**
- Remover `document.body.style.overflow = 'hidden';` (línea anterior a RAF)
- En el RAF, agregar `syncBodyOverflow();` después de agregar clase active

#### **En el botón de agregar al carrito:**
```typescript
// Antes:
btn.style.background = 'linear-gradient(135deg, #2a7a4f, #1e6640)';
setTimeout(() => {
  btn.style.background = '';
}, 1500);

// Después:
btn.classList.add('added');
btn.disabled = true;
setTimeout(() => {
  btn.classList.remove('added');
  btn.disabled = false;
}, 1500);
```
**Propósito:** Usar clases CSS en lugar de inline styles (mejor maintainability).

#### **Pasar `maxQuantity` al carrito:**
```typescript
{
  // ... otros datos
  maxQuantity: maxQty,  // Agregar esta línea
}
```

#### **En `closeModal()`:**
- Remover `document.body.style.overflow = '';`
- Agregar `syncBodyOverflow();`

#### **Nueva función al final del archivo:**
```typescript
function syncBodyOverflow(): void {
  const lock =
    document.body.classList.contains('nav-drawer-open') ||
    Boolean(document.querySelector('.product-modal-overlay.active')) ||
    Boolean(document.querySelector('.carrito-sidebar.abierto'));
  document.body.style.overflow = lock ? 'hidden' : '';
}
```

---

### 4️⃣ `frontend/src/components/CartSidebar.ts`
**Verificar que ya tiene `syncBodyOverflow()` implementado:**
- Buscar y confirmar que existe la función
- Si no, agregar la misma que en ProductModal

---

### 5️⃣ `frontend/src/components/Catalog.ts`
**Cambios menores:**
- Remover clase `navbar-dropdown` del filtro de categorías si existe
- Envolver filtros en un contenedor con clase `catalogo-filtros-wrapper`
- Mejorar estilos de scroll horizontal (fading edges)

---

### 6️⃣ `frontend/src/components/ProductCard.ts`
**Mejoras de accesibilidad:**
- Agregar atributo `data-max-qty` si no está
- Asegurar que el tipo `ProductCardData` tenga `maxQuantity` (si falta, agregar)

---

### 7️⃣ `frontend/src/types/index.ts`
**Actualizar tipos:**
```typescript
export interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  image: string;
  quantity: number;
  maxQuantity?: number;  // Agregar si no está
}

export interface ProductCardData {
  maxQty?: number;  // Agregar si no está
}
```

---

### 8️⃣ `frontend/src/services/productService.ts`
**Cambios menores:**
- Asegurar que al mapear productos se incluya `maxQty` o `stock`
- Ajustar tipos si es necesario para que incluyan cantidad máxima

---

### 9️⃣ `frontend/src/css/layout.css`
**Remover:**
```css
.hero-dropdown-menu {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  /* ... otras propiedades */
}
```
**Porque:** Ya no necesitamos el dropdown en hero (simplificado en HTML).

---

### 🔟 `frontend/src/css/components.css`
**Cambios principales:**

#### **Botón "Agregado" - Nueva clase `.btn-primario.added`:**
```css
.btn-primario.added {
  background: linear-gradient(135deg, #2a7a4f, #1e6640);
  box-shadow: 0 4px 15px rgba(42, 122, 79, 0.3);
}
```

#### **Navbar backdrop - Nueva clase:**
```css
.navbar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  z-index: 1200;
}

body.nav-drawer-open .navbar-backdrop {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}
```

#### **Revisar y ajustar:**
- Asegurar que `.producto-card` tenga `cursor: pointer` en desktop
- Modal overlay tiene las clases correctas para animaciones
- Safe area insets para notch en iPhone:
  ```css
  @supports (padding: max(0px)) {
    .product-modal-container {
      padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
    }
  }
  ```

---

### 1️⃣1️⃣ `frontend/src/css/responsive.css` (ARCHIVO CRÍTICO)
**Rewrite completo de media queries para mobile:**

#### **En `@media (max-width: 768px):`**

**Navbar:**
```css
.navbar-hamburguesa {
  display: flex !important;
  order: -1; /* Move hamburger to the left */
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.navbar {
  padding: 0.75rem 1rem;
  gap: 0.5rem;
  height: 64px;
  z-index: 1300;
}

.navbar-logo { 
  /* Existing styles */
  flex: 1;
  text-align: center;
}

.navbar-menu {
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 64px;
  left: 0;
  width: min(86vw, 360px);
  height: calc(100svh - 64px);
  padding: 1rem 1.25rem 1.25rem;
  gap: 0.25rem;
  background: rgba(18, 11, 24, 0.98);
  backdrop-filter: blur(22px);
  border-right: 1px solid rgba(196, 168, 232, 0.15);
  transform: translateX(-110%);
  transition: transform 0.28s ease;
  z-index: 1310;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  flex: 0 0 auto;
  right: auto;
  box-sizing: border-box;
}
.navbar-menu::-webkit-scrollbar { display: none; }
.navbar-menu.abierto { transform: translateX(0); }
.navbar-menu a {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0.75rem 0.25rem;
}

.navbar-dropdown {
  width: 100%;
}

.navbar-dropdown .dropdown-menu {
  position: static;
  transform: none;
  opacity: 1;
  visibility: visible;
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0.25rem 0 0.75rem;
  min-width: 0;
  display: none;
  gap: 0;
}

.navbar-dropdown.active .dropdown-menu {
  display: flex;
  flex-direction: column;
}

.navbar-dropdown .dropdown-menu a {
  min-height: 44px;
  padding: 0.65rem 0.25rem 0.65rem 1rem;
  font-size: 0.7rem !important;
  letter-spacing: 0.14em;
  opacity: 0.9;
}
```

**Hero:**
```css
.hero {
  padding: 4rem 1.2rem 1.75rem;
  min-height: 0;
}
.hero-titulo { 
  font-size: 2rem; 
  line-height: 1.15; 
  margin-bottom: 1rem; 
}
.hero-titulo em { display: inline; }
.hero-eyebrow { margin-bottom: 0.6rem; }
.hero-subtitulo { font-size: 0.85rem; margin-bottom: 1.25rem; }
```

**Remover (ya no necesario):**
```css
/* Remover esta sección completa */
.seccion-cubo {
  height: auto;
  min-height: 0;
  padding: 1.5rem 0;
  overflow: visible;
}
```

**Catálogo y filtros:**
```css
.catalogo {
  padding: var(--space-8) var(--space-4);
}

.catalogo-encabezado {
  margin-bottom: 1.5rem;
}

.catalogo-filtros-wrapper {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 0.5rem 0;
  mask-image: linear-gradient(90deg, transparent, black 20%, black 80%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, black 20%, black 80%, transparent);
}
.catalogo-filtros-wrapper::-webkit-scrollbar { display: none; }
```

**Producto card y modal:**
```css
.producto-card {
  /* El card existente, pero asegurar que en mobile no tenga hover effects destructivos */
}

@media (max-width: 500px) {
  .product-modal-overlay {
    z-index: 2000;
  }
  
  .product-modal-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-height: 90vh;
    border-radius: 20px 20px 0 0;
    transform: translateY(0);
    animation: slideUp 0.3s ease;
  }
  
  .product-modal-container.closing {
    animation: slideDown 0.2s ease;
    transform: translateY(100%);
  }
  
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  
  @keyframes slideDown {
    from { transform: translateY(0); }
    to { transform: translateY(100%); }
  }
  
  /* Drag handle para swipe down */
  .product-modal-container::before {
    content: '';
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 4px;
    background: rgba(196, 168, 232, 0.3);
    border-radius: 2px;
  }
}
```

**Touch targets (44px mínimo):**
```css
button, a.btn-primario, a.btn-secundario {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-filter-btn {
  min-height: 44px;
  padding: 0.75rem 1rem;
}
```

---

### 1️⃣2️⃣ `frontend/src/css/responsive.css` - Secciones adicionales

#### **En `@media (max-width: 500px):`**
```css
.seccion-titulo { 
  font-size: 2rem;
  line-height: 1.15;
}

.carrito-sidebar {
  width: 100%;
  height: 100vh;
  right: -100%;
}
.carrito-sidebar.abierto {
  right: 0;
}

/* Asegurar que el checkout tenga botones grandes */
.checkout-btn {
  min-height: 48px;
  font-size: 1rem;
  padding: 1rem;
  width: 100%;
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN (resumen)

- [x] HTML: Simplificar titulares y remover hero dropdown
- [x] Navbar.ts: Drawer, backdrop, syncBodyOverflow
- [x] ProductModal.ts: syncBodyOverflow y clases CSS
- [x] CartSidebar.ts: syncBodyOverflow + tope maxQuantity
- [x] Catalog.ts: Wrapper de filtros con scroll horizontal
- [x] ProductCard.ts: data-max-qty
- [x] types/index.ts: maxQuantity en CartItem
- [x] productService.ts: stock vía Product (API)
- [x] layout.css: hero-dropdown-menu eliminado
- [x] components.css: .btn-primario.added y .navbar-backdrop
- [x] responsive.css: Drawer navigation y ultra-mobile
- [ ] Animación cierre modal (.closing en JS)
- [ ] Gestos swipe / pruebas manuales en dispositivos

---

## 🎨 NOTAS DE UX

1. **Drawer desde izquierda**: Estándar en mobile, familiar
2. **Backdrop oscuro**: Indica que hay overlay, permite cerrar al clickear
3. **44px tap targets**: Accesibilidad WCAG 2.1 (nivel AA)
4. **Bottom sheet en mobile**: Menos deslumbrante, más natural en pequeñas pantallas
5. **100svh vs 100vh**: Respeta notch en iPhone (se recomienda 100dvh en navegadores modernos)
6. **syncBodyOverflow centralizado**: Evita conflictos cuando hay múltiples overlays

---

## 📱 TESTING CHECKLIST

- [ ] Mobile (375px): Navbar drawer abre/cierra suave
- [ ] Mobile (375px): Backdrop clickeable y semi-opaco
- [ ] Tablet (768px): Drawer desaparece, menú vuelve normal
- [ ] Product modal: Scroll no sale afuera del modal
- [ ] Carrito + Modal: No se puede scroller body cuando ambos abiertos
- [ ] iPhone notch: Safe area insets aplicados correctamente
- [ ] Tap targets: Todos ≥44px (devtools)
- [ ] Accesibilidad: aria-labels y aria-expanded correctos

