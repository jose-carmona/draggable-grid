# Plan: Rediseño del detalle como card centrada

## Objetivo
Reemplazar el panel lateral por una card cuadrada centrada en pantalla que:
- Ocupa `50vmin` × `50vmin` (50% de la dimensión menor de la pantalla)
- Imagen del producto a la izquierda, textos a la derecha
- Entra deslizando desde la derecha hasta el centro
- La imagen vuela desde el grid hasta la card (Flip)
- Cierra en sentido inverso al abrir; la imagen vuelve al grid
- Es accionable desde la consola del navegador para testing

---

## Paso 1 — CSS: Restyle de `.details` como card centrada

**Archivo:** `css/style.css`

Cambiar `.details` de panel lateral a card modal centrada:

```css
.details {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 50vmin;
  height: 50vmin;
  transform: translate(calc(-50% + 100vw), -50%); /* fuera de pantalla a la derecha */
  z-index: 10;
  background-color: #f1f1f1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}
```

- Eliminar `right: 0`, `padding`, `@media` específico del panel lateral
- El `transform` inicial posiciona la card fuera de pantalla a la derecha

---

## Paso 2 — CSS: Layout interno de la card

**Archivo:** `css/style.css`

La card tiene dos mitades horizontales:

```css
.details__thumb {
  width: 50%;
  height: 100%;
  position: relative;
  flex-shrink: 0;
}

.details__body {
  width: 50%;
  height: 100%;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}
```

- `.details__thumb` ocupa la mitad izquierda
- `.details__body` ocupa la mitad derecha con el texto

---

## Paso 3 — JS: Actualizar `showDetails()`

**Archivo:** `js/app.js`

Eliminar el desplazamiento del container (`x: -50vw`).
La card se anima desde su posición inicial (fuera a la derecha) al centro:

```javascript
showDetails(product) {
  if (this.SHOW_DETAILS) return
  this.SHOW_DETAILS = true
  this.details.classList.add("--is-showing")

  // La card entra al centro (elimina translate hacia derecha)
  gsap.to(this.details, {
    x: 0,
    y: 0,
    duration: 1.2,
    ease: "power3.inOut",
  })

  this.flipProduct(product)
  // ... resto de animaciones de texto igual
}
```

- Eliminar `gsap.to(this.container, { x: "-50vw" })`
- El container permanece quieto

---

## Paso 4 — JS: Actualizar `hideDetails()`

**Archivo:** `js/app.js`

La card sale hacia la derecha (inverso de la entrada):

```javascript
hideDetails() {
  this.SHOW_DETAILS = false

  // La card sale a la derecha
  gsap.to(this.details, {
    x: "calc(100vw - 50% + 50vmin / 2)", // vuelve fuera de pantalla
    duration: 1.2,
    ease: "power3.inOut",
    onComplete: () => {
      this.details.classList.remove("--is-showing")
    }
  })

  this.unFlipProduct()
  // ... resto de animaciones de texto igual
}
```

- Eliminar `gsap.to(this.container, { x: 0 })`

---

## Paso 5 — JS: Ajustar `flipProduct()` / `unFlipProduct()`

**Archivo:** `js/app.js`

El target del flip es ahora `.details__thumb` que es la mitad izquierda de la card.
Las dimensiones del thumb (`50% × 50vmin`) son distintas a las anteriores.

Verificar que `Flip.from()` no necesite opciones adicionales con el nuevo layout.
`unFlipProduct()` debe funcionar igual ya que devuelve el elemento a `this.originalParent`.

Posible simplificación: dado que `unFlipProduct()` hace posicionamiento manual complejo,
evaluar si se puede reemplazar por un segundo `Flip.getState` + `Flip.from` en el cierre.

---

## Paso 6 — JS: Exponer API de consola

**Archivo:** `js/app.js`

Añadir al final del archivo, tras la inicialización de `grid`:

```javascript
// Console API para testing
window.showCard = (index = 0) => {
  const product = grid.products[index]
  if (product) grid.showDetails(product)
}

window.closeCard = () => {
  if (grid.SHOW_DETAILS) grid.hideDetails()
}
```

Uso desde la consola del navegador:
```javascript
showCard(0)   // abre la card del primer producto
showCard(3)   // abre la card del producto en índice 3
closeCard()   // cierra la card
```

---

## Paso 7 — Overlay opcional

Añadir un overlay semitransparente detrás de la card para separar visualmente el grid.

```css
.details::before {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: -1;
  pointer-events: none;
}
```

O manejarlo desde JS añadiendo/quitando una clase al `body`.

---

## Orden de ejecución

| Paso | Archivo | Tipo | Dependencias |
|------|---------|------|--------------|
| 1 | style.css | CSS | — |
| 2 | style.css | CSS | Paso 1 |
| 3 | app.js | JS | Pasos 1-2 |
| 4 | app.js | JS | Paso 3 |
| 5 | app.js | JS | Pasos 3-4 |
| 6 | app.js | JS | Pasos 3-5 |
| 7 | style.css | CSS | Opcional, independiente |

---

## Notas de implementación

- El `transform` inicial de `.details` se gestiona mejor via GSAP `gsap.set()` en el constructor o en `handleDetails()` para evitar conflictos entre CSS transform y GSAP
- La `cross` (cursor personalizado) puede eliminarse o reconvertirse en un botón de cerrar dentro de la card
- Los SplitText de títulos y textos no requieren cambios
- El evento de cierre (`container.addEventListener("click")`) pasa a ser `document.addEventListener("click")` con exclusión del área de la card
