/* ===================================================================
   MANAV DADWAL — Portfolio Hero Interactions
   GSAP-powered morph, particle dispersion & reveal animations
   =================================================================== */

;(function () {
  'use strict'

  // ── Wait for DOM + GSAP ──────────────────────────────────────────
  window.addEventListener('DOMContentLoaded', init)

  // ── State (must be let, NOT const) ──────────────────────────────
  let isExpanded = false
  let isAnimating = false
  let masterTL = null
  let isTouchDevice = false
  let expandLocked = false

  // ── DOM References ───────────────────────────────────────────────
  const nameContainer = document.getElementById('nameContainer')
  const infoContainer = document.getElementById('infoContainer')
  const backHint = document.getElementById('backHint')
  const firstName = document.getElementById('firstName')
  const lastName = document.getElementById('lastName')
  const nameSubtitle = document.getElementById('nameSubtitle')
  const nameRole = document.getElementById('nameRole')
  const nameCta = document.getElementById('nameCta')
  const canvas = document.getElementById('particleCanvas')
  const ctx = canvas.getContext('2d')
  const dateTimeContainer = document.getElementById('date-time-val')

  // ── Initialization ───────────────────────────────────────────────
  function init() {
    setupCanvas()
    splitLetters()
    playIntroAnimation()
    bindEvents()
    animateCanvasParticles()
    setupCardGlow()
    startDateTimeUpdate()
  }

  // ================================================================
  //  TEXT SPLITTING — Wrap each letter in a <span>
  // ================================================================
  function splitLetters() {
    ;[firstName, lastName].forEach((el) => {
      const text = el.textContent
      el.textContent = ''
      text.split('').forEach((char, i) => {
        const span = document.createElement('span')
        span.className = 'name-letter'
        span.textContent = char
        span.style.setProperty('--i', i)
        el.appendChild(span)
      })
    })
  }

  // ================================================================
  //  INTRO ANIMATION — Staggered entrance + independent floating
  // ================================================================
  function playIntroAnimation() {
    const letters = document.querySelectorAll('.name-letter')

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })

    tl.set(letters, { opacity: 0, y: 80, rotateX: -90 })
      .set([nameSubtitle, nameRole, nameCta], { opacity: 0, y: 20 })

      // Letters cascade in
      .to(letters, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 1.2,
        stagger: { each: 0.04, from: 'center' },
      })

      // Subtitle fades in
      .to(nameSubtitle, { opacity: 0.8, y: 0, duration: 0.8 }, '-=0.6')

      // Role fades in
      .to(nameRole, { opacity: 0.7, y: 0, duration: 0.8 }, '-=0.5')

      // Hover hint
      .to(nameCta, { opacity: 0.6, y: 0, duration: 0.6 }, '-=0.4')

      // Start independent floating for each letter
      .add(() => startLetterFloat(), '-=0.3')
  }

  // ================================================================
  //  LETTER FLOAT — Each letter floats independently
  // ================================================================
  function startLetterFloat() {
    const letters = document.querySelectorAll('.name-letter')

    letters.forEach((letter, i) => {
      // Reset to base position first to prevent stacking offsets
      gsap.set(letter, { y: 0, x: 0, rotation: 0 })

      const duration = gsap.utils.random(2.5, 4.0)
      const yAmount = gsap.utils.random(5, 10)
      const xAmount = gsap.utils.random(1, 3)
      const rotAmount = gsap.utils.random(0.5, 2)
      const delay = i * 0.1

      gsap.to(letter, {
        y: yAmount * (i % 2 === 0 ? -1 : 1),
        x: xAmount * (i % 2 === 0 ? 1 : -1),
        rotation: rotAmount * (i % 2 === 0 ? 1 : -1),
        duration: duration,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: delay,
      })
    })
  }

  // ================================================================
  //  EVENT BINDING — Desktop hover + Mobile touch + Keyboard
  // ================================================================
  function bindEvents() {
    // Detect touch device on first touch
    // document.addEventListener('touchstart', () => { isTouchDevice = true }, { passive: true })

    // Desktop: hover on name (disabled on touch devices)
    // nameContainer.addEventListener('mouseenter', () => {
    //   if (!isTouchDevice) handleExpand()
    // })

    // Click on name — desktop fallback + mobile 
    nameContainer.addEventListener('click', (e) => {
      e.stopPropagation()
      handleExpand()
    })

    // Touch: direct touchend for reliable mobile tap
    nameContainer.addEventListener('touchend', (e) => {
      e.preventDefault()
      handleExpand()
    })

    // Click anywhere outside info to collapse
    document.addEventListener('click', (e) => {
      if (isExpanded && !infoContainer.contains(e.target)) {
        handleCollapse()
      }
    })

    // Touch anywhere outside info to collapse
    document.addEventListener('touchend', (e) => {
      if (isExpanded && !infoContainer.contains(e.target) && !nameContainer.contains(e.target)) {
        handleCollapse()
      }
    }, { passive: true })

    // Keyboard: Enter/Space to toggle, Escape to collapse
    nameContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (!isExpanded) handleExpand()
        else handleCollapse()
      }
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isExpanded) handleCollapse()
    })
  }

  // ================================================================
  //  EXPAND — Magical disintegration: Name → Glowing Particles → Info
  // ================================================================
  function handleExpand() {
    if (isExpanded || isAnimating || expandLocked) return
    isAnimating = true
    isExpanded = true

    const letters = document.querySelectorAll('.name-letter')
    const cards = document.querySelectorAll('.info-card')

    // Kill any running letter float
    gsap.killTweensOf(letters)

    masterTL = gsap.timeline({
      defaults: { ease: 'expo.out' },
      onComplete: () => { isAnimating = false },
    })

    // ── Phase 1: Glow charge-up (letters intensify before dispersing) ──
    masterTL.to(letters, {
      textShadow: '0 0 30px rgba(108,99,255,0.8), 0 0 60px rgba(0,212,255,0.4), 0 0 100px rgba(108,99,255,0.2)',
      scale: 1.05,
      duration: 0.35,
      ease: 'power2.in',
      stagger: { each: 0.015, from: 'center' },
    })

    // ── Phase 2: Spawn central flash ──
    masterTL.add(() => {
      const nameRect = nameContainer.getBoundingClientRect()
      spawnFlash(nameRect.left + nameRect.width / 2, nameRect.top + nameRect.height / 2)
    }, 0.3)

    // ── Phase 3: Particle burst from each letter ──
    masterTL.add(() => {
      letters.forEach((letter) => {
        const rect = letter.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        // Dense glowing burst
        spawnParticles(cx, cy, 8, 'burst')
        // Trailing sparkles that linger
        spawnParticles(cx, cy, 4, 'sparkle')
      })
    }, 0.32)

    // ── Phase 4: Letters disperse outward with rotation + fade ──
    masterTL.to(letters, {
      opacity: 0,
      scale: 0.2,
      y: () => gsap.utils.random(-160, -50),
      x: () => gsap.utils.random(-100, 100),
      rotateZ: () => gsap.utils.random(-60, 60),
      filter: 'blur(10px)',
      textShadow: '0 0 0 transparent',
      duration: 0.65,
      ease: 'expo.out',
      stagger: { each: 0.02, from: 'center' },
    }, 0.35)

    // ── Phase 5: Fade out subtitle / role / hint ──
    masterTL.to(
      [nameSubtitle, nameRole, nameCta],
      { opacity: 0, y: -20, duration: 0.35, ease: 'power3.out' },
      0.2
    )

    // ── Phase 6: Hide name, show info container ──
    masterTL.set(nameContainer, { display: 'none' }, 0.7)
    masterTL.set(infoContainer, {
      opacity: 1,
      visibility: 'visible',
      pointerEvents: 'auto',
    }, 0.7)

    // ── Phase 7: Stagger cards in with elegant entrance ──
    masterTL.fromTo(
      cards,
      {
        opacity: 0,
        y: 50,
        scale: 0.9,
        filter: 'blur(8px)',
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.85,
        ease: 'expo.out',
        stagger: { each: 0.09, from: 'start' },
      },
      0.75
    )

    // ── Phase 8: Animate card borders with a glow pulse on entry ──
    masterTL.fromTo(
      cards,
      { boxShadow: '0 0 0 rgba(108,99,255,0)' },
      {
        boxShadow: '0 0 20px rgba(108,99,255,0.1), inset 0 0 20px rgba(108,99,255,0.02)',
        duration: 0.6,
        stagger: { each: 0.09, from: 'start' },
      },
      0.85
    )
    masterTL.to(cards, {
      boxShadow: '0 0 0 rgba(108,99,255,0)',
      duration: 1.0,
      ease: 'power2.out',
      stagger: { each: 0.05, from: 'start' },
    }, 1.3)

    // ── Phase 9: Show back hint ──
    masterTL.add(() => backHint.classList.add('visible'), 1.2)

    // ── Phase 10: Gentle float on the info container ──
    masterTL.add(() => startInfoFloat(), 1.4)
  }

  // ================================================================
  //  INFO FLOAT — Subtle breathing float on the info container
  // ================================================================
  function startInfoFloat() {
    gsap.to(infoContainer, {
      y: '-=14',
      duration: 3.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      force3d: true,
    })
  }

  // ================================================================
  //  COLLAPSE — Professional Info → Reassemble Name
  // ================================================================
  function handleCollapse() {
    if (!isExpanded || isAnimating) return
    isAnimating = true

    const letters = document.querySelectorAll('.name-letter')
    const cards = document.querySelectorAll('.info-card')

    gsap.killTweensOf(infoContainer)
    if (masterTL) masterTL.kill()

    const tl = gsap.timeline({
      defaults: { ease: 'expo.out' },
      onComplete: () => {
        isExpanded = false
        isAnimating = false
        expandLocked = true
        setTimeout(() => { expandLocked = false }, 400)
        startLetterFloat()
      },
    })

    // Hide back hint
    backHint.classList.remove('visible')

    // 1) Fade out cards
    tl.to(cards, {
      opacity: 0,
      y: -20,
      scale: 0.95,
      filter: 'blur(5px)',
      duration: 0.45,
      ease: 'power3.inOut',
      stagger: { each: 0.04, from: 'end' },
    })

    // 2) Hide info container, show name container
    tl.set(infoContainer, { opacity: 0, visibility: 'hidden', pointerEvents: 'none' }, 0.35)
    tl.set(nameContainer, { display: 'block' }, 0.35)

    // 3) Spawn convergence particles
    tl.add(() => {
      const nameRect = nameContainer.getBoundingClientRect()
      const cx = nameRect.left + nameRect.width / 2
      const cy = nameRect.top + nameRect.height / 2
      for (let i = 0; i < 20; i++) {
        spawnConvergeParticle(cx, cy)
      }
    }, 0.38)

    // 4) Reassemble letters with glow trail
    tl.to(letters, {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      rotateZ: 0,
      filter: 'blur(0px)',
      textShadow: '0 0 20px rgba(108,99,255,0.6), 0 0 40px rgba(0,212,255,0.3)',
      duration: 0.85,
      ease: 'expo.out',
      stagger: { each: 0.025, from: 'edges' },
    }, 0.4)

    // 5) Dissipate the glow after reassembly
    tl.to(letters, {
      textShadow: '0 0 0 transparent',
      duration: 0.8,
      ease: 'power2.out',
      stagger: { each: 0.02, from: 'center' },
    }, 1.0)

    // 6) Fade in surrounding text
    tl.to(nameSubtitle, { opacity: 0.8, y: 0, duration: 0.6 }, 0.65)
    tl.to(nameRole, { opacity: 0.7, y: 0, duration: 0.6 }, 0.75)
    tl.to(nameCta, { opacity: 0.6, y: 0, duration: 0.5 }, 0.85)
  }

  // ================================================================
  //  CENTRAL FLASH — Radial glow burst at (x, y)
  // ================================================================
  function spawnFlash(x, y) {
    const flash = document.createElement('div')
    flash.className = 'flash-ring'
    flash.style.left = x + 'px'
    flash.style.top = y + 'px'
    document.body.appendChild(flash)

    gsap.fromTo(flash, {
      scale: 0.3,
      opacity: 0.9,
    }, {
      scale: 3,
      opacity: 0,
      duration: 0.8,
      ease: 'expo.out',
      onComplete: () => flash.remove(),
    })
  }

  // ================================================================
  //  PARTICLE SYSTEM — Glowing burst & sparkle particles
  // ================================================================
  function spawnParticles(x, y, count, type) {
    const colors = ['particle--primary', 'particle--cyan', 'particle--white']

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div')
      const colorClass = colors[Math.floor(Math.random() * colors.length)]

      if (type === 'sparkle') {
        p.className = `particle particle--sparkle ${colorClass}`
      } else {
        p.className = `particle ${colorClass}`
      }

      p.style.left = x + 'px'
      p.style.top = y + 'px'

      const size = type === 'sparkle'
        ? gsap.utils.random(1.5, 3)
        : gsap.utils.random(2.5, 6)
      p.style.width = size + 'px'
      p.style.height = size + 'px'

      document.body.appendChild(p)

      const angle = (Math.PI * 2 * i) / count + gsap.utils.random(-0.5, 0.5)
      const distance = type === 'sparkle'
        ? gsap.utils.random(40, 150)
        : gsap.utils.random(60, 180)
      const duration = type === 'sparkle'
        ? gsap.utils.random(0.8, 2.0)
        : gsap.utils.random(0.5, 1.2)

      gsap.to(p, {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance + (type === 'sparkle' ? gsap.utils.random(-30, -80) : 0),
        opacity: 0,
        scale: type === 'sparkle' ? gsap.utils.random(0.2, 1.0) : gsap.utils.random(0.3, 2.0),
        duration: duration,
        ease: type === 'sparkle' ? 'power2.out' : 'expo.out',
        onComplete: () => p.remove(),
      })
    }
  }

  // ================================================================
  //  CONVERGING PARTICLES — Fly inward for reassembly effect
  // ================================================================
  function spawnConvergeParticle(cx, cy) {
    const p = document.createElement('div')
    const colors = ['particle--primary', 'particle--cyan', 'particle--white']
    p.className = `particle particle--sparkle ${colors[Math.floor(Math.random() * colors.length)]}`

    // Start from a random offset
    const angle = Math.random() * Math.PI * 2
    const dist = gsap.utils.random(100, 250)
    const startX = cx + Math.cos(angle) * dist
    const startY = cy + Math.sin(angle) * dist

    p.style.left = startX + 'px'
    p.style.top = startY + 'px'

    const size = gsap.utils.random(1.5, 4)
    p.style.width = size + 'px'
    p.style.height = size + 'px'

    document.body.appendChild(p)

    gsap.to(p, {
      x: cx - startX + gsap.utils.random(-15, 15),
      y: cy - startY + gsap.utils.random(-15, 15),
      opacity: 0,
      scale: 0.1,
      duration: gsap.utils.random(0.4, 0.9),
      ease: 'power3.in',
      onComplete: () => p.remove(),
    })
  }

  // ================================================================
  //  AMBIENT BACKGROUND PARTICLES — Canvas-based
  // ================================================================
  const bgParticles = []
  const PARTICLE_COUNT = 80

  function setupCanvas() {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      bgParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      })
    }
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  function animateCanvasParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    bgParticles.forEach((p) => {
      p.x += p.vx
      p.y += p.vy

      if (p.x < 0) p.x = canvas.width
      if (p.x > canvas.width) p.x = 0
      if (p.y < 0) p.y = canvas.height
      if (p.y > canvas.height) p.y = 0

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(108, 99, 255, ${p.alpha})`
      ctx.fill()
    })

    // Draw connections between nearby particles
    for (let i = 0; i < bgParticles.length; i++) {
      for (let j = i + 1; j < bgParticles.length; j++) {
        const dx = bgParticles[i].x - bgParticles[j].x
        const dy = bgParticles[i].y - bgParticles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 120) {
          ctx.beginPath()
          ctx.moveTo(bgParticles[i].x, bgParticles[i].y)
          ctx.lineTo(bgParticles[j].x, bgParticles[j].y)
          ctx.strokeStyle = `rgba(108, 99, 255, ${0.06 * (1 - dist / 120)})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }
    }

    requestAnimationFrame(animateCanvasParticles)
  }

  // ================================================================
  //  CARD GLOW — Mouse-tracking radial glow on each card
  // ================================================================
  function setupCardGlow() {
    const cards = document.querySelectorAll('.info-card')

    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        card.style.setProperty('--mouse-x', x + '%')
        card.style.setProperty('--mouse-y', y + '%')
      })
    })
  }

  function setupCardGlowMouseEnter() {
    const cards = document.querySelectorAll('.name-line')

    cards.forEach((card) => {
      card.addEventListener('mouseenter', (e) => {
        const rect = card.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        card.style.setProperty('--mouse-x', x + '%')
        card.style.setProperty('--mouse-y', y + '%')
      })
    })
  }

  // ================================================================
  //  DATE TIME DISPLAY — Update current date and time
  // ================================================================
  function updateDateTime() {
    const now = new Date()
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
    const dateTimeString = now.toLocaleDateString('en-US', options)
    if (dateTimeContainer) {
      dateTimeContainer.textContent = dateTimeString
    }
  }

  function startDateTimeUpdate() {
    updateDateTime() // Initial update
    setInterval(updateDateTime, 1000) // Update every second
  }
})()
