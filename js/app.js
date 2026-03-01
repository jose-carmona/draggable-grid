import { preloadImages } from './utils.js'

gsap.registerPlugin(Draggable, Flip, SplitText)

class Grid {
  constructor() {
    this.container = document.querySelector(".container")
    this.grid = document.querySelector(".grid")
    this.products = [...document.querySelectorAll(".product div")]

    this.details = document.querySelector(".details")
    this.detailsThumb = this.details.querySelector(".details__thumb")

    this.cross = document.querySelector(".cross")

    this.isDragging = false

    // Posiciona la card fuera de pantalla desde el primer momento
    gsap.set(this.details, { xPercent: -50, yPercent: -50, x: '100vw' })
  }

  init() {
    this.intro()
  }

  intro() {
    this.centerGrid()

    const timeline = gsap.timeline()

    timeline.set(this.grid, { scale: .5 })
    timeline.set(this.products, {
      scale: 0.2,
      opacity: 0,
    })

    timeline.to(this.products, {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: "power4.out",
      stagger: {
        amount: 1.2,
        from: "random"
      }
    })
    timeline.to(this.grid, {
      scale: 1,
      duration: 2,
      ease: "power3.inOut",
      onComplete: () => {
        this.setupDraggable()
        this.addEvents()
        this.observeProducts()
        this.handleDetails()
      }
    })
  }

  centerGrid() {
    const gridWidth = this.grid.offsetWidth
    const gridHeight = this.grid.offsetHeight
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    const centerX = (windowWidth - gridWidth) / 2
    const centerY = (windowHeight - gridHeight) / 2

    gsap.set(this.grid, {
      x: centerX,
      y: centerY
    })
  }

  setupDraggable() {
    this.container.classList.add("--is-loaded")

    this.draggable = Draggable.create(this.grid, {
      type: "x,y",
      bounds: {
        minX: -(this.grid.offsetWidth - window.innerWidth) - 200,
        maxX: 200,
        minY: -(this.grid.offsetHeight - window.innerHeight) - 100,
        maxY: 100
      },
      inertia: true,
      allowEventDefault: true,
      edgeResistance: 0.9,

      onDragStart: () => {
        this.isDragging = true
        this.grid.classList.add("--is-dragging")
      },

      onDragEnd: () => {
        this.isDragging = false
        this.grid.classList.remove("--is-dragging")
      }
    })[0]
  }

  addEvents() {
    window.addEventListener("wheel", (e) => {
      e.preventDefault()

      const deltaX = -e.deltaX * 7
      const deltaY = -e.deltaY * 7

      const currentX = gsap.getProperty(this.grid, "x")
      const currentY = gsap.getProperty(this.grid, "y")

      const newX = currentX + deltaX
      const newY = currentY + deltaY

      const bounds = this.draggable.vars.bounds
      const clampedX = Math.max(bounds.minX, Math.min(bounds.maxX, newX))
      const clampedY = Math.max(bounds.minY, Math.min(bounds.maxY, newY))

      gsap.to(this.grid, {
        x: clampedX,
        y: clampedY,
        duration: 0.3,
        ease: "power3.out"
      })
    }, { passive: false })

    window.addEventListener("resize", () => {
      this.updateBounds()
    })

    window.addEventListener("mousemove", (e) => {
      if (this.SHOW_DETAILS) {
        this.handleCursor(e)
      }
    })
  }

  updateBounds() {
    if (this.draggable) {
      this.draggable.vars.bounds = {
        minX: -(this.grid.offsetWidth - window.innerWidth) - 50,
        maxX: 50,
        minY: -(this.grid.offsetHeight - window.innerHeight) - 50,
        maxY: 50
      }
    }
  }

  observeProducts() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {

        if (entry.target === this.currentProduct) return

        if (entry.isIntersecting) {
          gsap.to(entry.target, {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: "power2.out"
          })
        } else {
          gsap.to(entry.target, {
            opacity: 0,
            scale: 0.5,
            duration: 0.5,
            ease: "power2.in"
          })
        }
      })
    }, {
      root: null,
      threshold: 0.1
    })

    this.products.forEach(product => {
      observer.observe(product)
    })
  }

  handleDetails() {
    this.SHOW_DETAILS = false

    this.titles = this.details.querySelectorAll(".details__title p")
    this.texts = this.details.querySelectorAll(".details__body [data-text]")

    const splitTitles = new SplitText(this.titles, {
      type: "lines, chars",
      mask: "lines",
      charsClass: "char"
    })

    const splitTexts = new SplitText(this.texts, {
      type: "lines",
      mask: "lines",
      linesClass: "line"
    })

    this.products.forEach(product => {
      product.addEventListener("click", (e) => {
        e.stopPropagation()
        this.showDetails(product)
      })
    })

    // Cierra la card al hacer click fuera de ella
    document.addEventListener("click", (e) => {
      if (this.SHOW_DETAILS && !this.details.contains(e.target)) {
        this.hideDetails()
      }
    })
  }

  showDetails(product) {
    if (this.SHOW_DETAILS) return
    this.SHOW_DETAILS = true
    this.details.classList.add("--is-showing")

    const title = this.details.querySelector(`[data-title="${product.dataset.id}"]`)
    const text = this.details.querySelector(`[data-desc="${product.dataset.id}"]`)

    // Card entra al centro; al llegar se lanza el Flip y el texto
    gsap.to(this.details, {
      x: 0,
      duration: 1.2,
      ease: "power3.inOut",
      onComplete: () => {
        this.flipProduct(product)

        if (title) {
          gsap.to(title.querySelectorAll(".char"), {
            y: 0,
            duration: 1.1,
            delay: .2,
            ease: "power3.inOut",
            stagger: 0.025
          })
        }

        if (text) {
          gsap.to(text.querySelectorAll(".line"), {
            y: 0,
            duration: 1.1,
            delay: .2,
            ease: "power3.inOut",
            stagger: .05,
          })
        }
      }
    })
  }

  hideDetails() {
    this.SHOW_DETAILS = false

    // Card sale hacia la derecha
    gsap.to(this.details, {
      x: '100vw',
      duration: 1.2,
      ease: "power3.inOut",
      onComplete: () => {
        this.details.classList.remove("--is-showing")
      }
    })

    this.unFlipProduct()

    this.titles.forEach(title => {
      gsap.to(title.querySelectorAll(".char"), {
        y: "100%",
        duration: 0.6,
        ease: "power3.inOut",
        stagger: {
          amount: 0.025,
          from: "end"
        }
      })
    })

    this.texts.forEach(text => {
      gsap.to(text.querySelectorAll(".line"), {
        y: "100%",
        duration: 0.6,
        ease: "power3.inOut",
        stagger: 0.05,
      })
    })
  }

  flipProduct(product) {
    this.currentProduct = product
    this.originalParent = product.parentNode

    const state = Flip.getState(product)
    this.detailsThumb.appendChild(product)

    Flip.from(state, {
      absolute: true,
      duration: 1.2,
      ease: "power3.inOut",
    })
  }

  unFlipProduct() {
    if (!this.currentProduct || !this.originalParent) return

    const state = Flip.getState(this.currentProduct)
    this.originalParent.appendChild(this.currentProduct)

    Flip.from(state, {
      absolute: true,
      duration: 1.2,
      ease: "power3.inOut",
      onComplete: () => {
        this.currentProduct = null
        this.originalParent = null
      }
    })
  }

  handleCursor(e) {
    const x = e.clientX
    const y = e.clientY

    gsap.to(this.cross, {
      x: x - this.cross.offsetWidth / 2,
      y: y - this.cross.offsetHeight / 2,
      duration: 0.4,
      ease: "power2.out"
    })
  }
}

const grid = new Grid()

preloadImages('.grid img').then(() => {
  grid.init()
  document.body.classList.remove('loading')
})

// API de consola para testing
window.showCard = (index = 0) => {
  const product = grid.products[index]
  if (product) grid.showDetails(product)
  else console.warn(`No existe producto en el índice ${index}. Total: ${grid.products.length}`)
}

window.closeCard = () => {
  if (grid.SHOW_DETAILS) grid.hideDetails()
  else console.warn('No hay ninguna card abierta')
}
