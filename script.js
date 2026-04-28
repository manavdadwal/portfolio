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

  const sayHiBtn = document.getElementById('sayHiBtn')
  const sayHiBackdrop = document.getElementById('sayHiBackdrop')
  const sayHiModal = document.getElementById('sayHiModal')
  const sayHiCloseBtn = document.getElementById('sayHiCloseBtn')
  const chatToggleBtn = document.getElementById('chatToggleBtn')
  const chatPanel = document.getElementById('chatPanel')
  const chatCloseBtn = document.getElementById('chatCloseBtn')
  const chatMessages = document.getElementById('chatMessages')
  const chatForm = document.getElementById('chatForm')
  const chatInput = document.getElementById('chatInput')
  const chatChips = document.getElementById('chatChips')
  const hobbyDetailEl = document.getElementById('hobbyDetail')

  let chatHasWelcomed = false
  let sayHiIsOpen = false

  // ── Command palette + section rail + now-line refs ───────────────
  const cmdkBackdrop = document.getElementById('cmdkBackdrop')
  const cmdkInput = document.getElementById('cmdkInput')
  const cmdkList = document.getElementById('cmdkList')
  const cmdkOpenBtn = document.getElementById('cmdkOpenBtn')
  const cmdkModKey = document.getElementById('cmdkModKey')
  const sectionRail = document.getElementById('sectionRail')
  const nowLineEl = document.getElementById('nowLine')
  const nowLineText = document.getElementById('nowLineText')
  let cmdkIsOpen = false
  let cmdkActiveIndex = 0
  let cmdkFiltered = []
  let nowLineTimer = null

  // ── Theme palette per tab (canvas particles + meteors read from here) ──
  const THEMES = {
    default:      { primaryRgb: '108, 99, 255', secondaryRgb: '0, 212, 255' },
    skills:       { primaryRgb: '108, 99, 255', secondaryRgb: '0, 212, 255' },
    experience:   { primaryRgb: '16, 185, 129', secondaryRgb: '34, 211, 238' },
    projects:     { primaryRgb: '251, 113, 133', secondaryRgb: '251, 191, 36' },
    hobbies:      { primaryRgb: '236, 72, 153',  secondaryRgb: '168, 85, 247' },
    education:    { primaryRgb: '79, 70, 229',   secondaryRgb: '56, 189, 248' },
    achievements: { primaryRgb: '245, 158, 11',  secondaryRgb: '250, 204, 21' },
  }
  let activeTheme = THEMES.default

  function setTheme(themeId) {
    const next = THEMES[themeId] ? themeId : 'default'
    activeTheme = THEMES[next]
    if (next === 'default') {
      document.body.removeAttribute('data-theme')
    } else {
      document.body.setAttribute('data-theme', next)
    }
  }

  const HOBBY_COPY = {
    singing:
      'Singing keeps me grounded — casual jams with friends, pitch drills when I can, and learning to listen as much as I project. Small improvements stack over time.',
    football:
      'Football taught me spacing, timing, and passing the spotlight. I value discipline, quick decisions, and celebrating a good team sequence as much as the final score.',
    sketching:
      'Sketching is my slow mode — observing light, shape, and negative space. It trains patience and maps naturally to UI and layout decisions.',
    lead:
      'I step up to lead when clarity is missing — framing goals, keeping the group unblocked, and making sure everyone is heard. To me, leadership is listening and sequencing work well.',
  }

  const DEFAULT_HOBBY_BLURB =
    'Tap a tile for a short note — singing, pitch drills with friends; football for discipline and teamwork; sketching to observe and unwind; stepping up to lead when the group needs direction.'

  // ── Initialization ───────────────────────────────────────────────
  function init() {
    setupCanvas()
    splitLetters()
    playIntroAnimation()
    bindEvents()
    animateCanvasParticles()
    setupCardGlow()
    startDateTimeUpdate()
    setupInteractiveLayer()
    setupCustomCursor()
    setupMagneticElements()
    setupCardTilt()
    setupKonamiEasterEgg()
    setupNowLine()
    setupSectionRail()
    setupCommandPalette()
    setupEntryScreen()
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

    // Click anywhere outside info to collapse (ignore interactive UI layers)
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-interactive-ui]')) return
      if (isExpanded && !infoContainer.contains(e.target)) {
        handleCollapse()
      }
    })

    // Touch anywhere outside info to collapse
    document.addEventListener('touchend', (e) => {
      if (e.target.closest('[data-interactive-ui]')) return
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
      if (e.key !== 'Escape') return
      if (cmdkIsOpen) {
        // The cmdk palette has its own input handler that closes it
        return
      }
      if (sayHiIsOpen) {
        closeSayHi()
        return
      }
      if (chatPanel && chatPanel.classList.contains('is-open')) {
        closeChat()
        return
      }
      if (isExpanded) handleCollapse()
    })
  }

  // ================================================================
  //  INTERACTIVE LAYER — Say hi, chat, hobbies, filters
  // ================================================================
  function setupInteractiveLayer() {
    if (sayHiBtn && sayHiBackdrop) {
      sayHiBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        openSayHi()
      })
    }
    if (sayHiCloseBtn) {
      sayHiCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        closeSayHi()
      })
    }
    if (sayHiBackdrop) {
      sayHiBackdrop.addEventListener('click', (e) => {
        if (e.target === sayHiBackdrop) closeSayHi()
      })
    }

    if (chatToggleBtn && chatPanel) {
      chatToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        if (chatPanel.classList.contains('is-open')) closeChat()
        else openChat()
      })
    }
    if (chatCloseBtn && chatPanel) {
      chatCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        closeChat()
      })
    }
    if (chatForm && chatInput && chatMessages) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const text = chatInput.value.trim()
        if (!text) return
        appendChatMessage(text, 'user')
        chatInput.value = ''
        appendChatMessage(botReply(text), 'bot')
      })
    }
    if (chatChips) {
      chatChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.chat-chip')
        if (!chip || !chip.dataset.prompt) return
        e.preventDefault()
        const prompt = chip.dataset.prompt
        appendChatMessage(prompt, 'user')
        appendChatMessage(botReply(prompt), 'bot')
      })
    }

    document.querySelectorAll('.hobby-tile').forEach((tile) => {
      tile.addEventListener('click', (e) => {
        e.stopPropagation()
        const key = tile.dataset.hobby
        if (!key || !hobbyDetailEl) return
        document.querySelectorAll('.hobby-tile').forEach((t) => t.classList.remove('is-selected'))
        tile.classList.add('is-selected')
        hobbyDetailEl.textContent = HOBBY_COPY[key] || DEFAULT_HOBBY_BLURB
      })
    })

    setupPortfolioTabs()
  }

  function activatePortfolioTab(tabId, animate) {
    document.querySelectorAll('.floating-tab').forEach((btn) => {
      const selected = btn.dataset.tab === tabId
      btn.classList.toggle('is-active', selected)
      btn.setAttribute('aria-selected', selected ? 'true' : 'false')
    })
    document.querySelectorAll('.tab-panel').forEach((panel) => {
      const match = panel.dataset.tabPanel === tabId
      panel.classList.toggle('is-active', match)
      if (match) panel.removeAttribute('hidden')
      else panel.setAttribute('hidden', '')
    })
    document.querySelectorAll('.rail-dot').forEach((dot) => {
      dot.classList.toggle('is-active', dot.dataset.tab === tabId)
    })
    setTheme(tabId)
    if (animate && typeof gsap !== 'undefined') {
      const card = document.querySelector(`.tab-panel[data-tab-panel="${tabId}"] .info-card`)
      if (card) {
        gsap.killTweensOf(card)
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 26,
            scale: 0.94,
            rotateY: -10,
            rotateX: 4,
            transformPerspective: 900,
            filter: 'blur(10px)',
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateY: 0,
            rotateX: 0,
            filter: 'blur(0px)',
            duration: 0.62,
            ease: 'expo.out',
            onComplete: () => {
              gsap.set(card, { clearProps: 'transformPerspective' })
            },
          }
        )

        const headerEls = card.querySelectorAll('.info-card__header, .info-card__lead')
        const itemEls = card.querySelectorAll('.info-card__list li, .skill-tag, .hobby-tile')
        if (headerEls.length) {
          gsap.fromTo(
            headerEls,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.05 }
          )
        }
        if (itemEls.length) {
          gsap.fromTo(
            itemEls,
            { opacity: 0, y: 14 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: 'expo.out',
              stagger: { each: 0.04, from: 'start' },
            }
          )
        }
      }
    }
  }

  function setupPortfolioTabs() {
    document.querySelectorAll('.floating-tab').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        if (btn.classList.contains('is-active')) return
        activatePortfolioTab(btn.dataset.tab, true)
      })
    })
  }

  function resetPortfolioTabs() {
    activatePortfolioTab('skills', false)
    document.querySelectorAll('.hobby-tile').forEach((t) => t.classList.remove('is-selected'))
    if (hobbyDetailEl) hobbyDetailEl.textContent = DEFAULT_HOBBY_BLURB
  }

  function startTabFloat() {
    const tabs = document.querySelectorAll('.floating-tab')
    gsap.killTweensOf(tabs)
    tabs.forEach((tab, i) => {
      gsap.set(tab, { y: 0, rotation: 0 })
      gsap.to(tab, {
        y: gsap.utils.random(5, 11) * (i % 2 === 0 ? -1 : 1),
        rotation: gsap.utils.random(-1.2, 1.2) * (i % 3 === 0 ? 1 : -1),
        duration: gsap.utils.random(2.6, 4.1),
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: i * 0.065,
      })
    })
  }

  function openSayHi() {
    if (!sayHiBackdrop || !sayHiModal) return
    sayHiBackdrop.removeAttribute('hidden')
    sayHiIsOpen = true
    requestAnimationFrame(() => {
      requestAnimationFrame(() => sayHiBackdrop.classList.add('is-open'))
    })
    sayHiModal.focus()
  }

  function closeSayHi() {
    if (!sayHiBackdrop) return
    sayHiBackdrop.classList.remove('is-open')
    sayHiIsOpen = false
    const cleanupFilters = () => {
      repairPortfolioFilters()
    }
    const onEnd = (ev) => {
      if (ev.target !== sayHiBackdrop || ev.propertyName !== 'opacity') return
      sayHiBackdrop.setAttribute('hidden', '')
      sayHiBackdrop.removeEventListener('transitionend', onEnd)
      cleanupFilters()
    }
    sayHiBackdrop.addEventListener('transitionend', onEnd)
    window.setTimeout(() => {
      if (sayHiBackdrop.hasAttribute('hidden')) return
      if (!sayHiBackdrop.classList.contains('is-open')) {
        sayHiBackdrop.setAttribute('hidden', '')
      }
      sayHiBackdrop.removeEventListener('transitionend', onEnd)
      cleanupFilters()
    }, 450)
  }

  /** Clears GSAP filter leftovers on tabs/cards (fixes fuzzy UI after Say Hi modal). */
  function repairPortfolioFilters() {
    if (typeof gsap === 'undefined') return
    const nodes = document.querySelectorAll('.floating-tab, .tab-panel .info-card')
    if (!nodes.length) return
    gsap.set(nodes, { clearProps: 'filter' })
  }

  function openChat() {
    if (!chatPanel || !chatToggleBtn) return
    chatPanel.classList.add('is-open')
    chatPanel.setAttribute('aria-hidden', 'false')
    chatToggleBtn.setAttribute('aria-expanded', 'true')
    if (!chatHasWelcomed && chatMessages) {
      chatHasWelcomed = true
      appendChatMessage(
        'Hi! I’m a tiny on-page assistant. Ask about Manav’s skills, experience, hobbies, or projects — or tap the chips below.',
        'bot'
      )
    }
    if (chatInput) {
      chatInput.focus()
    }
  }

  function closeChat() {
    if (!chatPanel || !chatToggleBtn) return
    chatPanel.classList.remove('is-open')
    chatPanel.setAttribute('aria-hidden', 'true')
    chatToggleBtn.setAttribute('aria-expanded', 'false')
  }

  function appendChatMessage(text, role) {
    if (!chatMessages) return
    const div = document.createElement('div')
    div.className = `chat-msg chat-msg--${role}`
    div.textContent = text
    chatMessages.appendChild(div)
    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  function botReply(raw) {
    const t = raw.toLowerCase().trim()

    if (/^(hi|hello|hey|howdy)\b/.test(t) || /^what.*(up|new)\b/.test(t)) {
      return 'Hey! Manav is a full-stack developer with a creative edge. Ask me about skills, work history, hobbies, or projects.'
    }
    if (/skill|tech|stack|language|tool/.test(t)) {
      return 'He works across JavaScript/TypeScript, Angular, Next.js, Node.js, SQL, Azure, Git, Figma, and AI-assisted workflows (GPT, Cursor).'
    }
    if (/experience|job|work|reliance|schneider|career/.test(t)) {
      return 'He is a Software Engineer at Reliance Industries Limited (Dec 2022–present), with earlier trainee roles at Schneider Electric and Pravin Electricals.'
    }
    if (/project|vocab|vessel|micro front/.test(t)) {
      return 'Notable work includes a Vessel Reporting & Performance Management System (micro frontends with Angular/TS/Node) and VocabMaster — open the Projects tab for the live link.'
    }
    if (/hobby|hobbies|sing|football|sketch|lead|personal|life/.test(t)) {
      return 'His interests include singing, football, sketching, and stepping up to lead groups. Click your name to open the portfolio, then use the floating Hobbies tab for details.'
    }
    if (/contact|email|hire|reach|collab/.test(t)) {
      return 'Use the Say hi button for a fuller intro and placeholder contact links — update the email and LinkedIn in index.html with your real details.'
    }
    if (/bye|goodbye|thanks|thank you/.test(t)) {
      return 'Anytime! Click the name when you want the full portfolio view again.'
    }
    return 'Try asking: “What are your skills?”, “Tell me about hobbies”, or “What projects have you built?” You can also use the chips under the chat box.'
  }


  // ================================================================
  //  EXPAND — Magical disintegration: Name → Glowing Particles → Info
  // ================================================================
  function handleExpand() {
    if (isExpanded || isAnimating || expandLocked) return
    isAnimating = true
    isExpanded = true
    document.body.classList.add('is-portfolio-open')

    const letters = document.querySelectorAll('.name-letter')
    const floatingTabElements = document.querySelectorAll('.floating-tab')
    const allPanelCards = document.querySelectorAll('.tab-panel .info-card')
    const activePanelCard = document.querySelector('.tab-panel.is-active .info-card')

    gsap.killTweensOf(letters)
    gsap.killTweensOf(floatingTabElements)
    gsap.killTweensOf(allPanelCards)
    // Wipe any leftover transforms / filters from a previous collapse cycle
    gsap.set([floatingTabElements, allPanelCards], {
      clearProps: 'filter,transform,x,y,scale,rotate,rotateX,rotateY,rotateZ',
    })

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
        spawnParticles(cx, cy, 8, 'burst')
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

    // ── Phase 7: Floating tabs orbit in (hero-style capsules) ──
    masterTL.fromTo(
      floatingTabElements,
      {
        opacity: 0,
        y: 44,
        scale: 0.86,
        rotateZ: () => gsap.utils.random(-10, 10),
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateZ: 0,
        duration: 0.82,
        ease: 'expo.out',
        stagger: { each: 0.056, from: 'center' },
      },
      0.72
    )

    // ── Phase 8: Active panel card rises into view ──
    masterTL.fromTo(
      activePanelCard,
      {
        opacity: 0,
        y: 42,
        scale: 0.93,
        filter: 'blur(10px)',
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.88,
        ease: 'expo.out',
      },
      0.88
    )

    // ── Phase 9: Glow pulse on active panel ──
    masterTL.fromTo(
      activePanelCard,
      { boxShadow: '0 0 0 rgba(108,99,255,0)' },
      {
        boxShadow: '0 0 22px rgba(108,99,255,0.14), inset 0 0 22px rgba(108,99,255,0.03)',
        duration: 0.58,
      },
      1.05
    )
    masterTL.to(activePanelCard, {
      boxShadow: '0 0 0 rgba(108,99,255,0)',
      duration: 1.0,
      ease: 'power2.out',
    }, 1.42)

    masterTL.add(() => backHint.classList.add('visible'), 1.18)

    // ── Phase 10: Independent gentle float per tab (like name letters) ──
    masterTL.add(() => startTabFloat(), 1.38)
  }

  // ================================================================
  //  COLLAPSE — Professional Info → Reassemble Name
  // ================================================================
  function handleCollapse() {
    if (!isExpanded || isAnimating) return
    isAnimating = true

    const letters = document.querySelectorAll('.name-letter')
    const floatingTabElements = document.querySelectorAll('.floating-tab')
    const visiblePanelCard = document.querySelector('.tab-panel:not([hidden]) .info-card')

    gsap.killTweensOf(infoContainer)
    gsap.killTweensOf(floatingTabElements)
    if (masterTL) masterTL.kill()

    const tl = gsap.timeline({
      defaults: { ease: 'expo.out' },
      onComplete: () => {
        isExpanded = false
        isAnimating = false
        expandLocked = true
        setTimeout(() => { expandLocked = false }, 400)
        // Clear inline filter/transform residue so re-expand starts crisp
        gsap.set([floatingTabElements, document.querySelectorAll('.tab-panel .info-card')], {
          clearProps: 'filter,transform,x,y,scale,rotate,rotateX,rotateY,rotateZ',
        })
        document.body.classList.remove('is-portfolio-open')
        resetPortfolioTabs()
        setTheme('default')
        startLetterFloat()
      },
    })

    // Hide back hint
    backHint.classList.remove('visible')

    const collapseTargets = visiblePanelCard
      ? [...floatingTabElements, visiblePanelCard]
      : [...floatingTabElements]

    tl.to(collapseTargets, {
      opacity: 0,
      y: -22,
      scale: 0.94,
      filter: 'blur(5px)',
      duration: 0.45,
      ease: 'power3.inOut',
      stagger: { each: 0.028, from: 'center' },
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
  //  AMBIENT BACKGROUND PARTICLES + METEORS — Canvas-based
  // ================================================================
  const bgParticles = []
  const meteors = []
  const PARTICLE_COUNT = 80
  let lastMeteorAt = 0
  let nextMeteorDelay = 6500

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

  function spawnMeteor(opts) {
    const fromTop = Math.random() > 0.4
    const startX = fromTop
      ? gsap.utils.random(-canvas.width * 0.1, canvas.width * 0.9)
      : -40
    const startY = fromTop
      ? gsap.utils.random(-40, canvas.height * 0.35)
      : gsap.utils.random(0, canvas.height * 0.45)

    const angle = gsap.utils.random(Math.PI / 5, Math.PI / 3)
    const speed = (opts && opts.speed) || gsap.utils.random(7, 12)

    meteors.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      length: gsap.utils.random(110, 180),
      life: 1,
      decay: gsap.utils.random(0.008, 0.014),
      hue: Math.random() > 0.5 ? 'primary' : 'cyan',
    })
  }

  function maybeSpawnMeteor(now) {
    if (now - lastMeteorAt < nextMeteorDelay) return
    lastMeteorAt = now
    nextMeteorDelay = document.body.classList.contains('boost-mode')
      ? gsap.utils.random(900, 2000)
      : gsap.utils.random(5500, 13500)
    spawnMeteor()
  }

  function animateCanvasParticles(timestamp) {
    const now = timestamp || performance.now()
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
      ctx.fillStyle = `rgba(${activeTheme.primaryRgb}, ${p.alpha})`
      ctx.fill()
    })

    for (let i = 0; i < bgParticles.length; i++) {
      for (let j = i + 1; j < bgParticles.length; j++) {
        const dx = bgParticles[i].x - bgParticles[j].x
        const dy = bgParticles[i].y - bgParticles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 120) {
          ctx.beginPath()
          ctx.moveTo(bgParticles[i].x, bgParticles[i].y)
          ctx.lineTo(bgParticles[j].x, bgParticles[j].y)
          ctx.strokeStyle = `rgba(${activeTheme.primaryRgb}, ${0.06 * (1 - dist / 120)})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }
    }

    maybeSpawnMeteor(now)
    drawAndUpdateMeteors()

    requestAnimationFrame(animateCanvasParticles)
  }

  function drawAndUpdateMeteors() {
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i]
      m.x += m.vx
      m.y += m.vy
      m.life -= m.decay

      const tailX = m.x - m.vx * (m.length / 10)
      const tailY = m.y - m.vy * (m.length / 10)
      const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y)
      const accent = m.hue === 'primary'
        ? activeTheme.primaryRgb
        : activeTheme.secondaryRgb
      grad.addColorStop(0, `rgba(${accent}, 0)`)
      grad.addColorStop(0.6, `rgba(${accent}, ${0.55 * m.life})`)
      grad.addColorStop(1, `rgba(255, 255, 255, ${0.85 * m.life})`)

      ctx.strokeStyle = grad
      ctx.lineWidth = 1.6
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(tailX, tailY)
      ctx.lineTo(m.x, m.y)
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(m.x, m.y, 1.7, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * m.life})`
      ctx.fill()

      const offscreen = m.x > canvas.width + 80 || m.y > canvas.height + 80
      if (offscreen || m.life <= 0) meteors.splice(i, 1)
    }
  }

  // ================================================================
  //  CUSTOM CURSOR + AMBIENT SPOTLIGHT
  // ================================================================
  function setupCustomCursor() {
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (!supportsHover) return

    const dot = document.querySelector('.cursor-dot')
    const ring = document.querySelector('.cursor-ring')
    if (!dot || !ring) return

    document.body.classList.add('has-cursor')

    const dotXTo = gsap.quickTo(dot, 'x', { duration: 0.06, ease: 'power3' })
    const dotYTo = gsap.quickTo(dot, 'y', { duration: 0.06, ease: 'power3' })
    const ringXTo = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' })
    const ringYTo = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' })

    let pendingX = window.innerWidth / 2
    let pendingY = window.innerHeight / 2
    let needsSpotlightFrame = false

    window.addEventListener('mousemove', (e) => {
      pendingX = e.clientX
      pendingY = e.clientY
      dotXTo(pendingX)
      dotYTo(pendingY)
      ringXTo(pendingX)
      ringYTo(pendingY)
      if (!needsSpotlightFrame) {
        needsSpotlightFrame = true
        requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--cursor-x', pendingX + 'px')
          document.documentElement.style.setProperty('--cursor-y', pendingY + 'px')
          needsSpotlightFrame = false
        })
      }
    }, { passive: true })

    const interactiveSelector =
      'button, a, .name-container, .floating-tab, .hobby-tile, .skill-tag, .info-card, .chat-chip, .dock-btn, [role="button"]'

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactiveSelector)) {
        document.body.classList.add('cursor-active')
      }
    })
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest && e.target.closest(interactiveSelector)) {
        document.body.classList.remove('cursor-active')
      }
    })

    document.addEventListener('mouseleave', () => {
      gsap.to([dot, ring], { autoAlpha: 0, duration: 0.25 })
    })
    document.addEventListener('mouseenter', () => {
      gsap.to([dot, ring], { autoAlpha: 1, duration: 0.25 })
    })
  }

  // ================================================================
  //  MAGNETIC ELEMENTS — pull tabs / dock buttons toward the cursor
  // ================================================================
  function setupMagneticElements() {
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (!supportsHover) return

    const targets = document.querySelectorAll('.floating-tab, .dock-btn')
    targets.forEach((el) => {
      let active = false

      el.addEventListener('mouseenter', () => {
        active = true
        gsap.killTweensOf(el)
      })

      el.addEventListener('mousemove', (e) => {
        if (!active) return
        const rect = el.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = (e.clientX - cx) * 0.28
        const dy = (e.clientY - cy) * 0.28
        gsap.to(el, {
          x: dx,
          y: dy,
          duration: 0.35,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      })

      el.addEventListener('mouseleave', () => {
        active = false
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.55)',
          overwrite: 'auto',
          onComplete: () => {
            if (el.classList.contains('floating-tab') && isExpanded) {
              startSingleTabFloat(el)
            }
          },
        })
      })
    })
  }

  function startSingleTabFloat(tab) {
    const i = Array.prototype.indexOf.call(
      document.querySelectorAll('.floating-tab'),
      tab
    )
    gsap.set(tab, { y: 0, rotation: 0 })
    gsap.to(tab, {
      y: gsap.utils.random(5, 11) * (i % 2 === 0 ? -1 : 1),
      rotation: gsap.utils.random(-1.2, 1.2) * (i % 3 === 0 ? 1 : -1),
      duration: gsap.utils.random(2.6, 4.1),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: 0.05,
    })
  }

  // ================================================================
  //  3D TILT — Active tab panel card responds to cursor
  // ================================================================
  function setupCardTilt() {
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (!supportsHover) return

    document.querySelectorAll('.tab-panel .info-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect()
        const px = (e.clientX - rect.left) / rect.width
        const py = (e.clientY - rect.top) / rect.height
        const rotateY = (px - 0.5) * 12
        const rotateX = (py - 0.5) * -8
        gsap.to(card, {
          rotateX,
          rotateY,
          transformPerspective: 1000,
          duration: 0.45,
          ease: 'power3.out',
          overwrite: 'auto',
        })
      })
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.7,
          ease: 'expo.out',
          overwrite: 'auto',
        })
      })
    })
  }

  // ================================================================
  //  KONAMI CODE — Boost mode easter egg
  // ================================================================
  function setupKonamiEasterEgg() {
    const SEQ = [
      'arrowup', 'arrowup', 'arrowdown', 'arrowdown',
      'arrowleft', 'arrowright', 'arrowleft', 'arrowright',
      'b', 'a',
    ]
    let progress = 0

    document.addEventListener('keydown', (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase()
      if (key === SEQ[progress]) {
        progress++
        if (progress === SEQ.length) {
          progress = 0
          activateBoostMode()
        }
      } else {
        progress = key === SEQ[0] ? 1 : 0
      }
    })
  }

  let boostTimer = null
  function activateBoostMode() {
    document.body.classList.add('boost-mode')
    showBoostToast('✦ Boost mode unlocked')

    for (let i = 0; i < 5; i++) {
      setTimeout(() => spawnMeteor({ speed: gsap.utils.random(11, 16) }), i * 220)
    }

    const tabs = document.querySelectorAll('.floating-tab')
    if (tabs.length && typeof gsap !== 'undefined') {
      gsap.fromTo(tabs,
        { scale: 1 },
        { scale: 1.06, duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 1, stagger: 0.03 }
      )
    }

    if (boostTimer) clearTimeout(boostTimer)
    boostTimer = setTimeout(() => {
      document.body.classList.remove('boost-mode')
      boostTimer = null
    }, 14000)
  }

  function showBoostToast(text) {
    const toast = document.getElementById('boostToast')
    if (!toast) return
    toast.textContent = text
    toast.removeAttribute('hidden')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('is-show'))
    })
    setTimeout(() => {
      toast.classList.remove('is-show')
      setTimeout(() => toast.setAttribute('hidden', ''), 450)
    }, 2400)
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

  // ================================================================
  //  NOW LINE — Cycling typewriter under the role
  // ================================================================
  const NOW_LINES = [
    'Building thoughtful interfaces with Angular & Node.',
    'Reading on systems, design, and the calm web.',
    'Listening to lo-fi loops while shipping micro-frontends.',
    'Sketching in margins · Singing badly · Scoring sometimes.',
    'Available for meaningful work — say hi anytime.',
    'Currently @ Reliance Industries — leading micro-frontends.',
  ]

  function setupNowLine() {
    if (!nowLineEl || !nowLineText) return
    // Reveal after intro settles. Skip the auto-kick-off if the entry
    // screen is going to handle starting the now-line on dismiss instead.
    const seenEntry = (() => {
      try { return sessionStorage.getItem('md.entry.dismissed') === '1' } catch (_) { return true }
    })()
    if (!seenEntry) return
    nowLineTimer = setTimeout(() => {
      nowLineEl.classList.add('is-ready')
      cycleNowLine(0)
    }, 2400)
  }

  function cycleNowLine(idx) {
    if (!nowLineText) return
    const text = NOW_LINES[idx % NOW_LINES.length]
    typeNowLine(text, () => {
      // hold
      nowLineTimer = setTimeout(() => {
        eraseNowLine(() => {
          cycleNowLine(idx + 1)
        })
      }, 3200)
    })
  }

  function typeNowLine(text, done) {
    if (!nowLineText) return
    nowLineText.textContent = ''
    let i = 0
    const step = () => {
      nowLineText.textContent = text.slice(0, i)
      i++
      if (i <= text.length) {
        nowLineTimer = setTimeout(step, 26 + Math.random() * 28)
      } else if (typeof done === 'function') {
        done()
      }
    }
    step()
  }

  function eraseNowLine(done) {
    if (!nowLineText) return
    let s = nowLineText.textContent
    const step = () => {
      if (s.length === 0) {
        if (typeof done === 'function') done()
        return
      }
      s = s.slice(0, -1)
      nowLineText.textContent = s
      nowLineTimer = setTimeout(step, 14)
    }
    step()
  }

  // ================================================================
  //  SECTION RAIL — Vertical jump nav (visible when expanded)
  // ================================================================
  function setupSectionRail() {
    if (!sectionRail) return
    sectionRail.querySelectorAll('.rail-dot').forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation()
        const tab = dot.dataset.tab
        if (!tab) return
        if (!isExpanded) {
          expandThenActivate(tab)
        } else {
          activatePortfolioTab(tab, true)
        }
      })
    })
  }

  // Helper: expand the portfolio (if needed) and then activate a specific tab
  function expandThenActivate(tabId) {
    if (isExpanded) {
      activatePortfolioTab(tabId, true)
      return
    }
    handleExpand()
    // Wait for expand timeline to finish, then activate
    const wait = () => {
      if (isAnimating) {
        setTimeout(wait, 60)
      } else {
        activatePortfolioTab(tabId, true)
      }
    }
    setTimeout(wait, 700)
  }

  // ================================================================
  //  COMMAND PALETTE — ⌘K / Ctrl+K
  // ================================================================
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '')

  const COMMANDS = [
    { id: 'go-skills',       group: 'Sections', title: 'Go to Skills',       hint: 'Tech stack & tooling',          icon: '01', keywords: 'skills tech stack tools javascript angular' },
    { id: 'go-experience',   group: 'Sections', title: 'Go to Experience',   hint: 'Career & roles',                icon: '02', keywords: 'experience work career jobs reliance' },
    { id: 'go-projects',     group: 'Sections', title: 'Go to Projects',     hint: 'Things I have shipped',         icon: '03', keywords: 'projects portfolio shipped vessel vocab' },
    { id: 'go-hobbies',      group: 'Sections', title: 'Go to Hobbies',      hint: 'Singing, football, sketching',  icon: '04', keywords: 'hobbies singing football sketching lead' },
    { id: 'go-education',    group: 'Sections', title: 'Go to Education',    hint: 'Academic background',           icon: '05', keywords: 'education degree university college' },
    { id: 'go-achievements', group: 'Sections', title: 'Go to Achievements', hint: 'Awards & wins',                 icon: '06', keywords: 'achievements awards wins recognition' },

    { id: 'open-sayhi', group: 'Actions', title: 'Open “Say hi”',     hint: 'Greeting & contact links',  icon: '✦', keywords: 'sayhi say hi hello contact email greeting' },
    { id: 'open-chat',  group: 'Actions', title: 'Open chat assistant', hint: 'Ask me anything',         icon: '✦', keywords: 'chat assistant bot help' },
    { id: 'email',      group: 'Actions', title: 'Email Manav',         hint: 'manavdadwalwork@gmail.com', icon: '@', keywords: 'email mail contact' },
    { id: 'github',     group: 'Actions', title: 'Open GitHub',         hint: 'github.com/manavdadwal',   icon: '↗', keywords: 'github code repo' },
    { id: 'linkedin',   group: 'Actions', title: 'Open LinkedIn',       hint: 'in/manav-dadwal',          icon: '↗', keywords: 'linkedin profile network' },

    { id: 'theme-default',      group: 'Theme', title: 'Theme · Default',      hint: 'Electric purple + cyan', icon: '◐', keywords: 'theme default purple cyan' },
    { id: 'theme-experience',   group: 'Theme', title: 'Theme · Emerald',      hint: 'Calm growth',            icon: '◐', keywords: 'theme green emerald experience' },
    { id: 'theme-projects',     group: 'Theme', title: 'Theme · Coral',        hint: 'Warm energy',            icon: '◐', keywords: 'theme coral amber projects' },
    { id: 'theme-hobbies',      group: 'Theme', title: 'Theme · Magenta',      hint: 'Playful pulse',          icon: '◐', keywords: 'theme pink magenta hobbies' },
    { id: 'theme-education',    group: 'Theme', title: 'Theme · Indigo',       hint: 'Quiet focus',            icon: '◐', keywords: 'theme indigo blue education' },
    { id: 'theme-achievements', group: 'Theme', title: 'Theme · Gold',         hint: 'Glow up',                icon: '◐', keywords: 'theme gold yellow achievements' },

    { id: 'boost', group: 'Easter eggs', title: 'Activate Boost mode', hint: 'Hue-shift + meteors', icon: '✦', keywords: 'boost konami easter egg meteor' },
    { id: 'home',  group: 'Navigation',  title: 'Back to hero',         hint: 'Collapse the portfolio', icon: '↩', keywords: 'home back hero close collapse' },
  ]

  function setupCommandPalette() {
    if (!cmdkBackdrop || !cmdkInput || !cmdkList) return

    if (cmdkModKey) cmdkModKey.textContent = isMac ? '⌘' : 'Ctrl'
    if (cmdkOpenBtn) {
      cmdkOpenBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        openCmdk()
      })
    }

    cmdkBackdrop.addEventListener('click', (e) => {
      if (e.target === cmdkBackdrop) closeCmdk()
    })

    cmdkInput.addEventListener('input', () => renderCmdkList(cmdkInput.value))
    cmdkInput.addEventListener('keydown', onCmdkKeydown)

    cmdkList.addEventListener('click', (e) => {
      const item = e.target.closest('.cmdk-item')
      if (!item) return
      runCommand(item.dataset.cmd)
    })

    document.addEventListener('keydown', (e) => {
      const key = (e.key || '').toLowerCase()
      const isMod = isMac ? e.metaKey : e.ctrlKey
      if (isMod && key === 'k') {
        e.preventDefault()
        if (cmdkIsOpen) closeCmdk()
        else openCmdk()
        return
      }
      if (cmdkIsOpen && e.key === 'Escape') {
        e.preventDefault()
        closeCmdk()
      }
    })
  }

  function openCmdk() {
    if (!cmdkBackdrop) return
    cmdkBackdrop.removeAttribute('hidden')
    requestAnimationFrame(() => {
      cmdkBackdrop.classList.add('is-open')
    })
    cmdkIsOpen = true
    cmdkInput.value = ''
    renderCmdkList('')
    setTimeout(() => cmdkInput.focus(), 60)
  }

  function closeCmdk() {
    if (!cmdkBackdrop) return
    cmdkBackdrop.classList.remove('is-open')
    cmdkIsOpen = false
    setTimeout(() => {
      if (!cmdkIsOpen) cmdkBackdrop.setAttribute('hidden', '')
    }, 320)
  }

  function renderCmdkList(query) {
    if (!cmdkList) return
    const q = (query || '').trim().toLowerCase()
    const filtered = !q
      ? COMMANDS.slice()
      : COMMANDS.filter((c) => {
          return (
            c.title.toLowerCase().includes(q) ||
            c.hint.toLowerCase().includes(q) ||
            (c.keywords || '').toLowerCase().includes(q) ||
            c.group.toLowerCase().includes(q)
          )
        })

    cmdkFiltered = filtered
    cmdkActiveIndex = 0

    if (filtered.length === 0) {
      cmdkList.innerHTML = '<li class="cmdk-empty">No commands match — try “projects”, “theme”, or “boost”.</li>'
      return
    }

    let html = ''
    let lastGroup = ''
    filtered.forEach((cmd, idx) => {
      if (cmd.group !== lastGroup) {
        html += `<li class="cmdk-group-label" role="presentation">${cmd.group}</li>`
        lastGroup = cmd.group
      }
      html += `
        <li>
          <div class="cmdk-item${idx === 0 ? ' is-active' : ''}" role="option" data-cmd="${cmd.id}" data-idx="${idx}">
            <span class="cmdk-item__icon" aria-hidden="true">${cmd.icon}</span>
            <span class="cmdk-item__body">
              <span class="cmdk-item__title">${cmd.title}</span>
              <span class="cmdk-item__hint">${cmd.hint}</span>
            </span>
            <span class="cmdk-item__shortcut">${cmd.group}</span>
          </div>
        </li>`
    })
    cmdkList.innerHTML = html
  }

  function onCmdkKeydown(e) {
    const items = cmdkList.querySelectorAll('.cmdk-item')
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      cmdkActiveIndex = Math.min(items.length - 1, cmdkActiveIndex + 1)
      updateCmdkActive(items)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      cmdkActiveIndex = Math.max(0, cmdkActiveIndex - 1)
      updateCmdkActive(items)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const active = items[cmdkActiveIndex]
      if (active) runCommand(active.dataset.cmd)
    }
  }

  function updateCmdkActive(items) {
    items.forEach((it, i) => it.classList.toggle('is-active', i === cmdkActiveIndex))
    const active = items[cmdkActiveIndex]
    if (active) active.scrollIntoView({ block: 'nearest' })
  }

  function runCommand(id) {
    if (!id) return

    if (id.startsWith('go-')) {
      const tab = id.slice(3)
      closeCmdk()
      expandThenActivate(tab)
      return
    }

    if (id.startsWith('theme-')) {
      const t = id.slice(6)
      setTheme(t)
      closeCmdk()
      return
    }

    switch (id) {
      case 'open-sayhi':
        closeCmdk()
        openSayHi()
        break
      case 'open-chat':
        closeCmdk()
        openChat()
        break
      case 'email':
        window.location.href = 'mailto:manavdadwalwork@gmail.com'
        closeCmdk()
        break
      case 'github':
        window.open('https://github.com/manavdadwal', '_blank', 'noopener,noreferrer')
        closeCmdk()
        break
      case 'linkedin':
        window.open('https://in.linkedin.com/in/manav-dadwal', '_blank', 'noopener,noreferrer')
        closeCmdk()
        break
      case 'boost':
        closeCmdk()
        if (typeof activateBoostMode === 'function') activateBoostMode()
        break
      case 'home':
        closeCmdk()
        if (isExpanded) handleCollapse()
        break
    }
  }

  // ================================================================
  //  ENTRY SCREEN — Cinematic quote gate (once per session)
  // ================================================================
  const ENTRY_QUOTE = "Time is everything we have and don't."
  const ENTRY_STORAGE_KEY = 'md.entry.dismissed'

  let entryScreenEl = null
  let entryDismissed = false
  let entryDismissBound = false

  function setupEntryScreen() {
    entryScreenEl = document.getElementById('entryScreen')
    if (!entryScreenEl) return

    let alreadySeen = false
    try {
      alreadySeen = sessionStorage.getItem(ENTRY_STORAGE_KEY) === '1'
    } catch (_) { /* storage may be blocked — fall through */ }

    if (alreadySeen) {
      entryScreenEl.setAttribute('hidden', '')
      entryDismissed = true
      return
    }

    // Type the quote out, then bind the dismiss handlers
    typeEntryQuote(ENTRY_QUOTE, () => {
      bindEntryDismiss()
    })

    // Allow dismiss even mid-typing via the Enter button
    const enterBtn = document.getElementById('entryEnterBtn')
    if (enterBtn) {
      enterBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        dismissEntryScreen()
      })
    }
  }

  function typeEntryQuote(text, done) {
    const target = document.getElementById('entryQuoteText')
    if (!target) return
    target.textContent = ''
    let i = 0
    const tick = () => {
      if (entryDismissed) {
        target.textContent = text
        if (typeof done === 'function') done()
        return
      }
      target.textContent = text.slice(0, i)
      i++
      if (i <= text.length) {
        // Slight pause after punctuation for cadence
        const ch = text[i - 2]
        const delay = ch === ' ' ? 70 : ch === ',' ? 220 : 50 + Math.random() * 35
        setTimeout(tick, delay)
      } else if (typeof done === 'function') {
        done()
      }
    }
    setTimeout(tick, 900)
  }

  function bindEntryDismiss() {
    if (entryDismissBound || !entryScreenEl) return
    entryDismissBound = true

    entryScreenEl.addEventListener('click', (e) => {
      // Avoid double-dismiss when clicking the Enter button
      if (e.target.closest('.entry-screen__enter')) return
      dismissEntryScreen()
    })

    document.addEventListener('keydown', entryKeydownHandler, { once: false })
  }

  function entryKeydownHandler(e) {
    if (entryDismissed) return
    if (!entryScreenEl || entryScreenEl.hasAttribute('hidden')) return
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault()
      dismissEntryScreen()
    }
  }

  function dismissEntryScreen() {
    if (entryDismissed || !entryScreenEl) return
    entryDismissed = true

    try { sessionStorage.setItem(ENTRY_STORAGE_KEY, '1') } catch (_) { /* ignore */ }

    entryScreenEl.classList.add('is-leaving')

    // Sweep the canvas with a soft spawn for continuity
    if (typeof spawnFlash === 'function') {
      spawnFlash(window.innerWidth / 2, window.innerHeight / 2)
    }

    // Re-trigger the now-line so the user sees a fresh typing pass
    if (nowLineText) {
      clearTimeout(nowLineTimer)
      nowLineText.textContent = ''
      setTimeout(() => {
        if (nowLineEl) nowLineEl.classList.add('is-ready')
        cycleNowLine(0)
      }, 700)
    }

    // Hard-hide once transition finishes so it can't intercept clicks
    setTimeout(() => {
      if (entryScreenEl) entryScreenEl.setAttribute('hidden', '')
      document.removeEventListener('keydown', entryKeydownHandler)
    }, 950)
  }
})()
