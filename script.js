/* ===================================================================
   MANAV DADWAL — Portfolio Hero Interactions
   GSAP-powered morph, particle dispersion & reveal animations
   =================================================================== */

   ; (function () {
    'use strict'
  
    // ── Wait for DOM + GSAP ──────────────────────────────────────────
    window.addEventListener('DOMContentLoaded', init)
  
    // ── State ────────────────────────────────────────────────────────
    let isExpanded = false
    let isAnimating = false
    let masterTL = null
  
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
  
    // ── Initialization ───────────────────────────────────────────────
    function init() {
      setupCanvas()
      splitLetters()
      playIntroAnimation()
      bindEvents()
      animateCanvasParticles()
      setupCardGlow()
    }
  
    // ================================================================
    //  TEXT SPLITTING — Wrap each letter in a <span>
    // ================================================================
    function splitLetters() {
      ;[firstName, lastName].forEach((el) => {
        const text = el.textContent
        // el.textContent = ''
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
          stagger: {
            each: 0.04,
            from: 'center',
          },
        })
  
        // Subtitle fades in
        .to(
          nameSubtitle,
          { opacity: 0.8, y: 0, duration: 0.8 },
          '-=0.6'
        )
  
        // Role fades in
        .to(
          nameRole,
          { opacity: 0.7, y: 0, duration: 0.8 },
          '-=0.5'
        )
  
        // Hover hint
        .to(
          nameCta,
          { opacity: 0.6, y: 0, duration: 0.6 },
          '-=0.4'
        )
  
        // Start independent floating for each letter
        .add(() => startLetterFloat(), '-=0.3')
    }
  
    // ================================================================
    //  LETTER FLOAT — Each letter floats independently
    // ================================================================
    function startLetterFloat() {
      const letters = document.querySelectorAll('.name-letter')
  
      letters.forEach((letter, i) => {
        // Each letter gets its own unique floating pattern
        const duration = gsap.utils.random(2.0, 3.5)
        const yAmount = gsap.utils.random(6, 14)
        const xAmount = gsap.utils.random(1, 4)
        const rotAmount = gsap.utils.random(1, 4)
        const delay = i * 0.12
  
        gsap.to(letter, {
          y: `-=${yAmount}`,
          x: `+=${xAmount * (i % 2 === 0 ? 1 : -1)}`,
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
    //  EVENT BINDING
    // ================================================================
    function bindEvents() {
      // Desktop: hover on name
      nameContainer.addEventListener('mouseenter', handleExpand)
      // Mobile: tap on name
      nameContainer.addEventListener('click', handleExpand)
  
      // Click anywhere to collapse (when expanded)
      document.addEventListener('click', (e) => {
        if (isExpanded && !infoContainer.contains(e.target)) {
          handleCollapse()
        }
      })
  
      // Keyboard: Escape to collapse
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isExpanded) handleCollapse()
      })
    }
  
    // ================================================================
    //  EXPAND — Name → Professional Info
    // ================================================================
    function handleExpand() {
      if (isExpanded || isAnimating) return
      isAnimating = true
      isExpanded = true
  
      const letters = document.querySelectorAll('.name-letter')
      const cards = document.querySelectorAll('.info-card')
  
      // Kill any running letter float
      gsap.killTweensOf(letters)
  
      masterTL = gsap.timeline({
        defaults: { ease: 'expo.out' },
        onComplete: () => {
          isAnimating = false
        },
      })
  
      // 1) Spawn particles from each letter position
      letters.forEach((letter, i) => {
        const rect = letter.getBoundingClientRect()
        spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 6)
      })
  
      // 2) Disperse letters outward with rotation + fade
      masterTL.to(letters, {
        opacity: 0,
        scale: 0.3,
        y: () => gsap.utils.random(-120, -40),
        x: () => gsap.utils.random(-80, 80),
        rotateZ: () => gsap.utils.random(-45, 45),
        filter: 'blur(8px)',
        duration: 0.7,
        stagger: { each: 0.02, from: 'center' },
      })
  
      // 3) Fade out subtitle / role / hint
      masterTL.to(
        [nameSubtitle, nameRole, nameCta],
        { opacity: 0, y: -20, duration: 0.4 },
        0
      )
  
      // 4) Hide name container
      masterTL.set(nameContainer, { display: 'none' }, 0.5)
  
      // 5) Show info container
      masterTL.set(infoContainer, { opacity: 1, visibility: 'visible' }, 0.5)
  
      // 6) Stagger cards in
      masterTL.fromTo(
        cards,
        {
          opacity: 0,
          y: 40,
          scale: 0.92,
          filter: 'blur(6px)',
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.8,
          stagger: { each: 0.1, from: 'start' },
        },
        0.55
      )
  
      // 7) Show back hint
      masterTL.add(() => backHint.classList.add('visible'), 1.0)
    }
  
    // ================================================================
    //  COLLAPSE — Professional Info → Name
    // ================================================================
    function handleCollapse() {
      if (!isExpanded || isAnimating) return
      isAnimating = true
  
      const letters = document.querySelectorAll('.name-letter')
      const cards = document.querySelectorAll('.info-card')
  
      if (masterTL) masterTL.kill()
  
      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        onComplete: () => {
          isExpanded = false
          isAnimating = false
          infoContainer.classList.remove('active')
  
          // Restart independent letter float
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
        filter: 'blur(4px)',
        duration: 0.5,
        stagger: { each: 0.05, from: 'end' },
      })
  
      // 2) Hide info container
      tl.set(infoContainer, { opacity: 0, visibility: 'hidden' }, 0.4)
  
      // 3) Show name container
      tl.set(nameContainer, { display: 'block' }, 0.4)
  
      // 4) Reassemble letters
      tl.to(
        letters,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          x: 0,
          rotateZ: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          stagger: { each: 0.03, from: 'edges' },
        },
        0.45
      )
  
      // 5) Fade in surrounding text
      tl.to(
        nameSubtitle,
        { opacity: 0.8, y: 0, duration: 0.6 },
        0.7
      )
      tl.to(
        nameRole,
        { opacity: 0.7, y: 0, duration: 0.6 },
        0.8
      )
      tl.to(
        nameCta,
        { opacity: 0.6, y: 0, duration: 0.5 },
        0.9
      )
  
      // Spawn particles for reassembly effect
      letters.forEach((letter) => {
        const rect = letter.getBoundingClientRect()
        spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 3)
      })
    }
  
    // ================================================================
    //  PARTICLE SYSTEM — Spawn burst particles at (x, y)
    // ================================================================
    function spawnParticles(x, y, count) {
      const colors = ['', 'particle--cyan', 'particle--white']
  
      for (let i = 0; i < count; i++) {
        const p = document.createElement('div')
        p.className = `particle ${colors[Math.floor(Math.random() * colors.length)]}`
        p.style.left = x + 'px'
        p.style.top = y + 'px'
  
        const size = gsap.utils.random(2, 5)
        p.style.width = size + 'px'
        p.style.height = size + 'px'
  
        document.body.appendChild(p)
  
        gsap.to(p, {
          x: gsap.utils.random(-100, 100),
          y: gsap.utils.random(-100, 100),
          opacity: 0,
          scale: gsap.utils.random(0.5, 2),
          duration: gsap.utils.random(0.6, 1.4),
          ease: 'expo.out',
          onComplete: () => p.remove(),
        })
      }
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
  
        // Wrap around edges
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
  })()
  
  