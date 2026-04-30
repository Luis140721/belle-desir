# 📋 DOCUMENTO UNIFICADO DE MEJORAS Y CORRECCIONES — Belle Désir

**Fecha:** 29 de abril de 2026  
**Proyecto:** Belle Désir E-commerce (belle-desir.vercel.app)  
**Compilado por:** Daniel Fernando Salamanca Narvaéz

---

## ÍNDICE

1. [Mejoras Solicitadas (Requerimientos del Cliente)](#mejoras-solicitadas)
2. [Errores Críticos (QA Desktop + Móvil)](#errores-criticos)
3. [Errores de Severidad Media](#errores-severidad-media)
4. [Problemas de UX/Contenido](#problemas-ux-contenido)
5. [Tabla Resumen de Todos los Issues](#tabla-resumen)
6. [Prioridades de Corrección](#prioridades)

---

## MEJORAS SOLICITADAS (Requerimientos del Cliente) {#mejoras-solicitadas}

### 1. Contenido Visual y Multimedia
- **MEJORA-001:** Incluir imágenes en la página (fondos sensuales, imágenes de apoyo)
- **MEJORA-002:** Incluir videos de apoyo desde Drive en las páginas relevantes

### 2. Funcionalidad de Contacto
- **MEJORA-003:** Agregar botón flotante de WhatsApp

### 3. Elementos Flotantes/Animaciones
- **MEJORA-004:** Mantener el dibujo/animación flotante y optimizarlo
  - Incluir 3 figuras o al menos un juguete como se había planeado

### 4. Catálogo y Productos
- **MEJORA-005:** Expandir productos del catálogo con descripción, precio e indicaciones
  - La información debe provenir de la página de Pleasure Sensual
- **MEJORA-006:** Apegarse a los precios de venta de Pleasure Sensual (https://pleasuresensual.com.co/)
  - Estos son los que generan grandes ganancias
- **MEJORA-007:** Expandir el catálogo — incluir la mayoría de productos de la página de Pleasure

### 5. Interfaz de Productos
- **MEJORA-008:** Quitar el botón de "unidades disponibles"
  - Solo dejar el de "agotado" cuando sea necesario
  - Justificación: como es e-commerce, se asume disponibilidad de mercado

### 6. Política de Envíos y Pagos
- **MEJORA-009:** El envío NO puede ser gratis
  - En su lugar, fortalecer el mensaje de "no cobramos comisión por el pago"
- **MEJORA-010:** Incluir un limitante de pedidos
  - Mensaje: "Para envío, comprar superiores a 20 mil"

### 7. Administración
- **MEJORA-011:** Cambiar el admin al correo empresarial

### 8. Tipografía
- **MEJORA-012:** Cambiar la letra de los títulos a una fuente más amena como Arial
  - Actual: considerada "un poco fea"

### 9. Contenido Inclusivo
- **MEJORA-013:** Ajustar el mensaje de bienvenida
  - Actualmente solo se refiere a mujeres
  - Debe ser inclusivo para todos los públicos

### 10. Navegación del Catálogo
- **MEJORA-014:** Crear botón "Ver Catálogo" con menú desplegable hover
  - Subdivisiones:
    - Hombre
    - Mujer
    - Lencería
    - Juguetes
    - Pareja

---

## ERRORES CRÍTICOS (QA Desktop + Móvil) {#errores-criticos}

### 🔴 Desktop & Móvil

#### BUG-001 — Páginas de producto individuales rotas
- **Severidad:** CRÍTICA
- **Plataforma:** Ambas (Desktop + Móvil)
- **Dónde:** `/producto/[slug]` — cualquier producto
- **Descripción:** Todas las páginas de detalle de producto arrojan "Error al cargar el producto". El título de la pestaña muestra `undefined - Belle Désir`.
- **Pasos para reproducir:** 
  1. Desde el buscador, hacer clic en cualquier resultado de producto
  2. También reproducible navegando directamente a `/producto/blow-pop-elixir-sandia`
- **Impacto:** El usuario **no puede ver el detalle de ningún producto**. El flujo de compra completo desde página de producto está roto. La búsqueda también lleva a esta página rota.
- **Causa probable:** Error al cargar datos desde la API/backend; el objeto `product` retorna `undefined`.

---

#### BUG-002 — Links del footer "INFORMACIÓN" no funcionan
- **Severidad:** CRÍTICA
- **Plataforma:** Ambas (Desktop + Móvil)
- **Dónde:** Footer → sección INFORMACIÓN
- **Descripción:** Los cuatro links legales (Política de privacidad, Términos y condiciones, Política de envíos, Preguntas frecuentes) tienen `href="/#"` y simplemente hacen scroll al inicio de la página en lugar de llevar a páginas reales.
- **Impacto:** El sitio **no cumple con obligaciones legales mínimas** de e-commerce (política de privacidad, términos de uso). Incumplimiento potencial con la Ley 1581 de Colombia (habeas data) al no mostrar política de privacidad accesible.

---

#### BUG-003 — Página `/terminos` no muestra contenido
- **Severidad:** CRÍTICA
- **Plataforma:** Ambas (Desktop + Móvil)
- **Dónde:** `/terminos` (link desde formulario de registro)
- **Descripción:** Al hacer clic en "TÉRMINOS Y CONDICIONES" en el formulario de registro, la URL cambia a `/terminos` pero la página carga el inicio del sitio sin mostrar ningún documento legal.
- **Impacto:** El usuario acepta términos que no puede leer. Esto es un problema legal y de confianza.

---

### 🔴 Solo Móvil

#### MOB-001 — Navbar móvil: botones "Registrarse", carrito y búsqueda fuera del viewport
- **Severidad:** CRÍTICA
- **Plataforma:** Solo Móvil
- **Dónde:** Header/navbar en todas las páginas móvil
- **Descripción:** La barra de navegación tiene demasiados elementos para el ancho móvil (~400px). Solo se ven el ícono hamburguesa, el logo y el inicio del texto "In..." (cortado). Los botones "Registrarse", el ícono del carrito y el botón BUSCAR **no son visibles en pantalla** — están fuera del viewport a la derecha.
- **Impacto:** El usuario en móvil **no puede acceder fácilmente al carrito, registrarse ni buscar productos** desde la navbar. Son funciones clave del e-commerce completamente ocultas.

---

#### MOB-002 — Abrir/cerrar el carrito desplaza el contenido horizontalmente
- **Severidad:** CRÍTICA
- **Plataforma:** Solo Móvil
- **Dónde:** Carrito lateral (drawer) en móvil
- **Descripción:** Al abrir el panel del carrito y cerrarlo, el contenido de la página queda temporalmente desplazado hacia la izquierda, mostrando solo el borde derecho de la página y cortando todo el texto y los elementos.
- **Impacto:** El layout se rompe visualmente después de usar el carrito. El usuario queda desorientado hasta que la página vuelve a su posición normal.
- **Causa probable:** El drawer del carrito usa `transform: translateX` o modifica `overflow` del body sin restaurarlo correctamente.

---

#### MOB-003 — Menú hamburguesa sin fondo opaco (contenido visible detrás)
- **Severidad:** CRÍTICA
- **Plataforma:** Solo Móvil
- **Dónde:** Menú móvil desplegado
- **Descripción:** Al abrir el menú hamburguesa, los links INICIO/CATÁLOGO/NOSOTROS/CONTACTO se superponen sobre el contenido del hero **sin un fondo opaco**. El texto del hero ("sin límites, sin juicios", el botón VER CATÁLOGO) se ve completamente detrás del menú.
- **Impacto:** Baja legibilidad del menú. El usuario puede confundirse al ver dos capas de contenido a la vez.

---

#### MOB-004 — Búsqueda inaccesible en móvil (sin botón visible)
- **Severidad:** CRÍTICA
- **Plataforma:** Solo Móvil
- **Dónde:** Toda la vista móvil
- **Descripción:** El botón "BUSCAR" que existe en desktop **no aparece en ningún lugar visible** en la interfaz móvil — ni en la navbar (está fuera del viewport), ni dentro del menú hamburguesa, ni como ícono flotante.
- **Impacto:** El usuario móvil **no puede buscar productos** a menos que sepa hacer scroll horizontal en la navbar (comportamiento no intuitivo).

---

## ERRORES DE SEVERIDAD MEDIA {#errores-severidad-media}

### 🟠 Desktop & Móvil

#### BUG-004 — Mensaje de error de login en inglés
- **Severidad:** MEDIA
- **Plataforma:** Ambas
- **Dónde:** `/login`
- **Descripción:** Al ingresar credenciales incorrectas, el sistema muestra **"Invalid credentials"** en inglés, cuando todo el sitio está en español.
- **Impacto:** Inconsistencia de idioma que afecta la experiencia del usuario.

---

#### BUG-005 — Checkout con campos duplicados
- **Severidad:** MEDIA
- **Plataforma:** Ambas
- **Dónde:** `/checkout`
- **Descripción:** El formulario de checkout tiene **"NOMBRE COMPLETO" repetido dos veces** y **"TELÉFONO" repetido dos veces** (una en la sección de datos de contacto y otra en la sección de dirección de entrega).
- **Impacto:** Confusión para el usuario, datos inconsistentes, posibles errores en el procesamiento del pedido.

---

#### BUG-006 — Texto del botón "¡AGREGADO!" truncado
- **Severidad:** MEDIA
- **Plataforma:** Solo Desktop
- **Dónde:** Catálogo, tarjetas de producto
- **Descripción:** Cuando se agrega un producto al carrito, el botón cambia a "¡AGREGADO!" pero el texto aparece cortado visualmente como "¡AGRE...DO!".
- **Impacto:** El usuario no puede leer claramente la confirmación de que el producto fue añadido.

---

#### BUG-007 — No hay página 404 personalizada
- **Severidad:** MEDIA
- **Plataforma:** Ambas
- **Dónde:** Rutas inexistentes (ej. `/pagina-que-no-existe`)
- **Descripción:** Las rutas inválidas redirigen silenciosamente al homepage sin ningún mensaje de error o indicación de que la página no existe.
- **Impacto:** Desorientación del usuario; no hay manejo claro de errores de navegación.

---

#### BUG-008 — Checkout accesible sin autenticación (sin aviso claro)
- **Severidad:** MEDIA
- **Plataforma:** Ambas
- **Dónde:** `/checkout`
- **Descripción:** El usuario puede ir directamente al checkout sin haber iniciado sesión. Aunque hay un banner que sugiere "Inicia sesión para guardar tu historial", no es obligatorio. Esto puede generar pedidos "huérfanos" sin cuenta asociada.
- **Impacto:** Datos de pedidos no vinculados a cuentas de usuario.

---

### 🟠 Solo Móvil

#### MOB-005 — Texto "ACEPTO LOS TÉRMINOS Y CONDICIONES" partido/mal alineado
- **Severidad:** MEDIA
- **Plataforma:** Solo Móvil
- **Dónde:** `/registro` — checkbox de términos
- **Descripción:** El texto del checkbox se rompe en dos líneas de forma inconsistente: "ACEPTO LOS" en una línea y "TÉRMINOS Y CONDICIONES" en otra, con el checkbox mal alineado respecto al bloque de texto.
- **Impacto:** Apariencia antiestética y confusa. El usuario puede no entender bien qué está aceptando.

---

#### MOB-006 — Botón "+ AGREGAR" no muestra confirmación visual "¡AGREGADO!" en móvil
- **Severidad:** MEDIA
- **Plataforma:** Solo Móvil
- **Dónde:** Catálogo móvil, botón de agregar al carrito
- **Descripción:** En desktop, al agregar un producto, el botón cambia brevemente a "¡AGREGADO!" (aunque truncado). En **móvil, el botón no cambia de texto** — sigue mostrando "+ AGREGAR" sin ninguna confirmación visual de que el producto se añadió.
- **Impacto:** El usuario no sabe si el producto fue agregado exitosamente. Solo el contador del carrito (oculto en la navbar) da esa señal.

---

#### MOB-007 — Flecha "›" del carrusel se sale del borde del viewport
- **Severidad:** MEDIA
- **Plataforma:** Solo Móvil
- **Dónde:** Carrusel de imágenes en tarjetas de producto (catálogo móvil)
- **Descripción:** La flecha derecha del carrusel (botón ›) queda parcialmente fuera del borde derecho de la pantalla móvil, pudiendo causar scroll horizontal indeseado al intentar tocarla.
- **Impacto:** Difícil de usar en móvil; posibilidad de scroll horizontal accidental.

---

## PROBLEMAS DE UX/CONTENIDO {#problemas-ux-contenido}

### 🟡 Desktop & Móvil

#### UX-001 — Texto "ÚLTIMAS 1 UNIDADES" gramaticalmente incorrecto
- **Dónde:** Tarjetas de producto con stock = 1
- **Descripción:** El badge de stock usa siempre "ÚLTIMAS X UNIDADES" sin concordar en género/número. Para 1 unidad debería ser **"ÚLTIMA UNIDAD"**.

---

#### UX-002 — Título del login orientado solo a pago
- **Dónde:** `/login`
- **Descripción:** La página de login dice "Inicia sesión para *pagar*" con descripción "Necesitas iniciar sesión para continuar con tu compra". Sin embargo, el usuario puede llegar desde el botón "Iniciar sesión" del menú sin querer comprar nada (ej. para ver su historial).
- **Sugerencia:** Usar un título más neutral como "Inicia sesión en Belle Désir".

---

#### UX-003 — Gran espacio vacío entre Hero y catálogo
- **Dónde:** Página de inicio
- **Descripción:** Hay una animación 3D de un cubo (con etiqueta "✦ DISEÑO PREMIUM") que ocupa aproximadamente 2 pantallas completas de espacio antes de llegar al catálogo. No tiene call-to-action ni texto explicativo.
- **Impacto:** El usuario podría pensar que la página no tiene más contenido y abandonar.

---

#### UX-004 — Espacio en blanco excesivo al filtrar por categoría con pocos productos
- **Dónde:** Catálogo → filtro PAREJAS
- **Descripción:** Al filtrar por "PAREJAS" (1 solo producto), queda un espacio vacío muy grande antes de la siguiente sección. No hay mensaje tipo "Solo encontramos X productos en esta categoría".

---

#### UX-005 — Productos no tienen link en título/imagen
- **Dónde:** Catálogo
- **Descripción:** Los nombres e imágenes de productos en el catálogo no son clicables. La única acción disponible es "AGREGAR" al carrito, pero no hay forma de ver más detalles (y las páginas de detalle están rotas de todas formas — ver BUG-001).
- **Impacto:** Experiencia de compra muy limitada; el usuario no puede informarse antes de comprar.

---

#### UX-006 — Validación del checkout incompleta visualmente
- **Dónde:** `/checkout`
- **Descripción:** Al intentar enviar el formulario vacío, solo se resalta el primer campo "NOMBRE COMPLETO" sin mostrar mensajes de error claros para todos los campos requeridos.
- **Sugerencia:** Mostrar mensajes de error debajo de cada campo obligatorio, como sí se hace en el formulario de registro.

---

### 🟡 Solo Móvil

#### UX-MOB-001 — Espacio vacío excesivo en formularios (registro/login)
- **Descripción:** Las páginas `/registro` y `/login` tienen un bloque negro vacío muy grande en la parte superior antes del formulario. En desktop esto ya era notable, pero en móvil consume ~40% de la primera pantalla.

---

#### UX-MOB-002 — Menú hamburguesa no tiene opción de búsqueda
- **Descripción:** El menú hamburguesa solo tiene los 4 links de navegación (INICIO, CATÁLOGO, NOSOTROS, CONTACTO). Dado que el botón BUSCAR no está visible en la navbar móvil, **debería añadirse al menú hamburguesa**.

---

#### UX-MOB-003 — Precio en carrito muestra precio unitario, no el total por ítem
- **Descripción:** En el carrito móvil, cada ítem muestra "$5.200" aunque la cantidad sea 3 (total $15.600). No queda claro si es el precio unitario o el subtotal del ítem.

---

#### UX-MOB-004 — Espacios en blanco excesivos entre secciones en móvil
- **Descripción:** La animación 3D (cubo "DISEÑO PREMIUM") ocupa varias pantallas de espacio en móvil, con un espacio vacío mayor que en desktop. El usuario puede pensar que el sitio no cargó correctamente.

---

## TABLA RESUMEN DE TODOS LOS ISSUES {#tabla-resumen}

| ID | Descripción | Tipo | Plataforma | Severidad |
|---|---|---|---|---|
| **MEJORAS SOLICITADAS** |
| MEJORA-001 | Incluir imágenes sensuales como fondos | Mejora | Ambas | — |
| MEJORA-002 | Incluir videos de apoyo | Mejora | Ambas | — |
| MEJORA-003 | Botón flotante de WhatsApp | Mejora | Ambas | — |
| MEJORA-004 | Optimizar dibujo flotante (3 figuras/juguete) | Mejora | Ambas | — |
| MEJORA-005 | Expandir productos con descripción, precio, indicaciones | Mejora | Ambas | — |
| MEJORA-006 | Apegarse a precios de Pleasure Sensual | Mejora | Ambas | — |
| MEJORA-007 | Expandir catálogo con productos de Pleasure | Mejora | Ambas | — |
| MEJORA-008 | Quitar botón "unidades disponibles" | Mejora | Ambas | — |
| MEJORA-009 | Eliminar envío gratis / resaltar "sin comisión" | Mejora | Ambas | — |
| MEJORA-010 | Limitante de pedidos (mín. 20 mil) | Mejora | Ambas | — |
| MEJORA-011 | Cambiar admin al correo empresarial | Mejora | Backend | — |
| MEJORA-012 | Cambiar tipografía títulos a Arial | Mejora | Ambas | — |
| MEJORA-013 | Mensaje bienvenida inclusivo (no solo mujeres) | Mejora | Ambas | — |
| MEJORA-014 | Botón "Ver Catálogo" con menú hover | Mejora | Ambas | — |
| **BUGS CRÍTICOS** |
| BUG-001 | Páginas de producto rotas (undefined) | Bug | Ambas | 🔴 CRÍTICA |
| BUG-002 | Links de políticas del footer no funcionan | Bug | Ambas | 🔴 CRÍTICA |
| BUG-003 | Página /terminos sin contenido | Bug | Ambas | 🔴 CRÍTICA |
| MOB-001 | Navbar móvil: botones fuera del viewport | Bug | Solo Móvil | 🔴 CRÍTICA |
| MOB-002 | Carrito desplaza layout horizontalmente | Bug | Solo Móvil | 🔴 CRÍTICA |
| MOB-003 | Menú hamburguesa sin fondo opaco | Bug | Solo Móvil | 🔴 CRÍTICA |
| MOB-004 | Búsqueda inaccesible en móvil | Bug | Solo Móvil | 🔴 CRÍTICA |
| **BUGS MEDIOS** |
| BUG-004 | Mensaje de error login en inglés | Bug | Ambas | 🟠 MEDIA |
| BUG-005 | Campos duplicados en checkout | Bug | Ambas | 🟠 MEDIA |
| BUG-006 | Botón "¡AGREGADO!" texto truncado | Bug | Solo Desktop | 🟠 MEDIA |
| BUG-007 | Sin página 404 personalizada | Bug | Ambas | 🟠 MEDIA |
| BUG-008 | Checkout sin autenticación obligatoria | Bug | Ambas | 🟠 MEDIA |
| MOB-005 | Texto checkbox T&C partido en móvil | Bug | Solo Móvil | 🟠 MEDIA |
| MOB-006 | Sin confirmación visual al agregar (móvil) | Bug | Solo Móvil | 🟠 MEDIA |
| MOB-007 | Flecha carrusel sale del viewport móvil | Bug | Solo Móvil | 🟠 MEDIA |
| **UX/CONTENIDO** |
| UX-001 | "ÚLTIMAS 1 UNIDADES" incorrecto | UX | Ambas | 🟡 BAJA |
| UX-002 | Título login orientado solo a pago | UX | Ambas | 🟡 BAJA |
| UX-003 | Espacio vacío excesivo en hero | UX | Ambas | 🟡 BAJA |
| UX-004 | Espacio en blanco al filtrar | UX | Ambas | 🟡 BAJA |
| UX-005 | Productos sin link de detalle | UX | Ambas | 🟡 BAJA |
| UX-006 | Validación incompleta en checkout | UX | Ambas | 🟡 BAJA |
| UX-MOB-001 | Espacio vacío en formularios móvil | UX | Solo Móvil | 🟡 BAJA |
| UX-MOB-002 | Búsqueda no en menú hamburguesa | UX | Solo Móvil | 🟡 BAJA |
| UX-MOB-003 | Precio en carrito ambiguo | UX | Solo Móvil | 🟡 BAJA |
| UX-MOB-004 | Espacios excesivos móvil | UX | Solo Móvil | 🟡 BAJA |

**Total de issues:** 42 (14 mejoras solicitadas + 11 bugs críticos + 8 bugs medios + 10 UX/contenido)

---

## PRIORIDADES DE CORRECCIÓN {#prioridades}

### ⚡ INMEDIATO (Bloquean funcionalidad crítica o representan riesgo legal)

1. **BUG-001** — Corregir páginas de producto (bloquea el flujo de compra completo)
2. **BUG-002, BUG-003** — Crear y enlazar páginas legales reales (riesgo legal en Colombia - Ley 1581)
3. **MOB-001** — Rediseñar navbar móvil (búsqueda y carrito inaccesibles)
4. **MOB-004** — Hacer búsqueda accesible en móvil
5. **MOB-002** — Corregir bug de desplazamiento horizontal del carrito

### 🔧 CORTO PLAZO (1-2 semanas)

6. **MOB-003** — Agregar fondo opaco al menú hamburguesa
7. **BUG-004** — Traducir mensajes de error a español
8. **BUG-005** — Eliminar campos duplicados en checkout
9. **BUG-006, MOB-006** — Corregir confirmación al agregar al carrito (desktop y móvil)
10. **MOB-005** — Arreglar alineación checkbox T&C en móvil
11. **MOB-007** — Corregir posicionamiento flechas del carrusel móvil
12. **MEJORA-003** — Implementar botón flotante de WhatsApp
13. **MEJORA-008** — Quitar botón "unidades disponibles"
14. **MEJORA-012** — Cambiar tipografía de títulos a Arial

### 📅 MEDIANO PLAZO (2-4 semanas)

15. **BUG-007** — Crear página 404 personalizada
16. **BUG-008** — Definir flujo de autenticación en checkout
17. **MEJORA-001, MEJORA-002** — Agregar imágenes y videos
18. **MEJORA-004** — Optimizar animación flotante
19. **MEJORA-005, MEJORA-006, MEJORA-007** — Expandir catálogo con productos de Pleasure Sensual
20. **MEJORA-009, MEJORA-010** — Actualizar política de envíos y pedido mínimo
21. **MEJORA-013** — Ajustar mensaje de bienvenida (inclusivo)
22. **MEJORA-014** — Crear menú desplegable "Ver Catálogo"
23. Todos los issues **UX-001 a UX-MOB-004**

### 🔐 ADMINISTRATIVO

24. **MEJORA-011** — Cambiar admin al correo empresarial

---

## ✅ FUNCIONALIDADES QUE OPERAN CORRECTAMENTE

### Desktop
- Buscador (autocompletado y "sin resultados")
- Filtros de catálogo (TODOS, WELLNESS, etc.)
- Carrusel de imágenes en tarjetas
- Validaciones formulario de registro
- Agregar al carrito
- Contador del carrito
- Carrito (abrir, modificar cantidad, eliminar)
- Cálculo del total del carrito
- Botón "AGOTADO" deshabilitado
- Navegación por anclas (#catalogo, #nosotros, etc.)
- WhatsApp link de contacto
- Diseño visual general

### Móvil
- Menú hamburguesa (apertura/cierre, links)
- Filtros del catálogo en grilla 2×2
- Tarjetas de producto en columna única
- Carrusel de imágenes de producto
- Carrito lateral (contenido)
- Validaciones de formularios
- Checkout (campos en columna única)
- Botón "CONFIRMAR Y PAGAR" ancho completo
- Sección Nosotros (tarjetas en columna)
- Widget de WhatsApp
- Footer en columna única
- Métodos de pago visibles en footer

---

**Documento generado automáticamente el 29 de abril de 2026**  
**Belle Désir E-commerce — Compilación de QA y Requerimientos del Cliente**
