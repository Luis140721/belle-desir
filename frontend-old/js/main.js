// ============================================
// BELLE DÉSIR — Lógica principal
// ============================================

// Primero "agarramos" los elementos HTML por su id
// Esto es como decirle a JavaScript: "oye, necesito trabajar con estos elementos"

const verificacionOverlay  = document.getElementById('verificacion-edad')
const contenidoPrincipal   = document.getElementById('contenido-principal')
const btnEntrar            = document.getElementById('btn-entrar')
const btnSalir             = document.getElementById('btn-salir')

// ============================================
// BOTÓN: "Sí, tengo 18 o más"
// ============================================

// Escuchamos el clic en el botón de entrar
btnEntrar.addEventListener('click', function() {

  // 1. Ocultamos la pantalla de verificación
  verificacionOverlay.style.display = 'none'

  // 2. Mostramos el contenido de la tienda
  contenidoPrincipal.classList.remove('oculto')

  // 3. Guardamos en el navegador que ya verificó su edad
  //    Así no le vuelve a aparecer si recarga la página
  localStorage.setItem('edadVerificada', 'true')

})

// ============================================
// BOTÓN: "No, salir"
// ============================================

btnSalir.addEventListener('click', function() {

  // Redirige a Google — el usuario sale del sitio
  window.location.href = 'https://www.google.com'

})

// ============================================
// VERIFICAR SI YA CONFIRMÓ LA EDAD ANTES
// Esto se ejecuta cada vez que carga la página
// ============================================

// Revisamos si en el navegador ya está guardado que verificó su edad
const yaVerifico = localStorage.getItem('edadVerificada')

if (yaVerifico === 'true') {
  // Si ya verificó, saltamos directo al contenido
  verificacionOverlay.style.display = 'none'
  contenidoPrincipal.classList.remove('oculto')
}
// ============================================
// MENÚ HAMBURGUESA
// ============================================

const btnMenu    = document.getElementById('btn-menu')
const navbarMenu = document.getElementById('navbar-menu')

if (btnMenu && navbarMenu) {
  btnMenu.addEventListener('click', function() {
    btnMenu.classList.toggle('abierto')
    navbarMenu.classList.toggle('abierto')
    
  })

  navbarMenu.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      btnMenu.classList.remove('abierto')
      navbarMenu.classList.remove('abierto')
    })
  })
}