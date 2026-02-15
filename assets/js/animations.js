/**
 * VetLudics - Animations and Interactions
 * Handles all enhanced UI interactions and animations
 */

(function() {
  'use strict';

  // ==========================================
  // CONFIGURATION
  // ==========================================
  const CONFIG = {
    animationOffset: 50,
    animationDelay: 100,
    toastDuration: 4000,
    throttleDelay: 16
  };

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================
  
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================
  
  window.showToast = function(message, type = 'info', duration = CONFIG.toastDuration) {
    const container = document.querySelector('.pc-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `pc-toast pc-toast--${type}`;
    toast.setAttribute('role', 'status');
    
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };
    
    toast.innerHTML = `
      <span class="pc-toast__icon">${icons[type] || icons.info}</span>
      <span class="pc-toast__message">${message}</span>
      <button class="pc-toast__close" aria-label="Close notification">×</button>
    `;

    container.appendChild(toast);

    // Close button handler
    toast.querySelector('.pc-toast__close').addEventListener('click', () => {
      hideToast(toast);
    });

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => hideToast(toast), duration);
    }

    return toast;
  };

  function hideToast(toast) {
    toast.classList.add('pc-is-exiting');
    toast.addEventListener('animationend', () => toast.remove());
  }

  // ==========================================
  // MOBILE MENU
  // ==========================================
  
  function initMobileMenu() {
    const toggle = document.querySelector('.pc-mobile-toggle');
    const menu = document.querySelector('.pc-mobile-menu');
    const overlay = document.querySelector('.pc-mobile-menu-overlay');
    const closeBtn = document.querySelector('.pc-mobile-menu__close');

    if (!toggle || !menu) return;

    function openMenu() {
      toggle.setAttribute('aria-expanded', 'true');
      menu.classList.add('pc-is-open');
      menu.setAttribute('aria-hidden', 'false');
      overlay?.classList.add('pc-is-active');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      toggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('pc-is-open');
      menu.setAttribute('aria-hidden', 'true');
      overlay?.classList.remove('pc-is-active');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', () => {
      if (menu.classList.contains('pc-is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    closeBtn?.addEventListener('click', closeMenu);
    overlay?.addEventListener('click', closeMenu);

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('pc-is-open')) {
        closeMenu();
      }
    });

    // Close on resize to desktop
    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth > 768 && menu.classList.contains('pc-is-open')) {
        closeMenu();
      }
    }, 100));
  }

  // ==========================================
  // SCROLL-TRIGGERED ANIMATIONS
  // ==========================================
  
  function initScrollAnimations() {
    if (prefersReducedMotion()) return;

    const animatedElements = document.querySelectorAll('[data-animate]');
    if (!animatedElements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay) || 0;
          setTimeout(() => {
            entry.target.classList.add('pc-is-visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
  }

  // ==========================================
  // SEARCH KEYBOARD SHORTCUT
  // ==========================================
  
  function initSearchShortcut() {
    const searchInput = document.querySelector('.pc-search-input--nav');
    if (!searchInput) return;

    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }

      // Escape to blur
      if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.blur();
      }
    });

    // Update shortcut display based on platform
    const shortcutEl = document.querySelector('.pc-search-shortcut');
    if (shortcutEl) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      shortcutEl.textContent = isMac ? '⌘K' : 'Ctrl+K';
    }
  }

  // ==========================================
  // CARD HOVER EFFECTS (Mouse tracking)
  ==========================================
  
  function initCardHoverEffects() {
    if (prefersReducedMotion()) return;

    const cards = document.querySelectorAll('.pc-home-tier-card');
    
    cards.forEach(card => {
      card.addEventListener('mousemove', throttle((e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);
      }, CONFIG.throttleDelay));
    });
  }

  // ==========================================
  // PAGE TRANSITIONS
  // ==========================================
  
  function initPageTransitions() {
    const transition = document.querySelector('.pc-page-transition');
    if (!transition || prefersReducedMotion()) return;

    // Fade out on load
    window.addEventListener('load', () => {
      setTimeout(() => {
        transition.classList.remove('pc-is-active');
      }, 50);
    });

    // Fade in on link click (internal links only)
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || 
          href.startsWith('tel:') || link.target === '_blank') return;

      if (link.hostname === window.location.hostname) {
        e.preventDefault();
        transition.classList.add('pc-is-active');
        
        setTimeout(() => {
          window.location.href = href;
        }, 300);
      }
    });
  }

  // ==========================================
  // SMOOTH SCROLL
  // ==========================================
  
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // ==========================================
  // HEADER SCROLL EFFECTS
  // ==========================================
  
  function initHeaderScroll() {
    const nav = document.querySelector('.pc-portal-nav');
    if (!nav) return;

    let lastScroll = 0;
    const scrollThreshold = 100;

    window.addEventListener('scroll', throttle(() => {
      const currentScroll = window.pageYOffset;

      // Add/remove compact class
      if (currentScroll > scrollThreshold) {
        nav.classList.add('pc-is-scrolled');
      } else {
        nav.classList.remove('pc-is-scrolled');
      }

      lastScroll = currentScroll;
    }, CONFIG.throttleDelay));
  }

  // ==========================================
  // PARALLAX EFFECTS (Hero cards)
  // ==========================================
  
  function initParallax() {
    if (prefersReducedMotion() || window.matchMedia('(pointer: coarse)').matches) return;

    const heroCards = document.querySelectorAll('.pc-hero__card');
    if (!heroCards.length) return;

    document.addEventListener('mousemove', throttle((e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const moveX = (e.clientX - centerX) / centerX;
      const moveY = (e.clientY - centerY) / centerY;

      heroCards.forEach((card, index) => {
        const depth = (index + 1) * 10;
        const x = moveX * depth;
        const y = moveY * depth;
        card.style.transform = `translate(${x}px, ${y}px)`;
      });
    }, CONFIG.throttleDelay));
  }

  // ==========================================
  // FORM ENHANCEMENTS
  // ==========================================
  
  function initFormEnhancements() {
    // Add loading state to newsletter form
    const newsletterForm = document.querySelector('.pc-newsletter-form');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', function(e) {
        const btn = this.querySelector('.pc-newsletter__btn');
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<span class="pc-spinner">⟳</span>';
        }
      });
    }
  }

  // ==========================================
  // ACCESSIBILITY ENHANCEMENTS
  // ==========================================
  
  function initAccessibility() {
    // Respect reduced motion preference
    if (prefersReducedMotion()) {
      document.documentElement.style.setProperty('--pc-transition-fast', '0ms');
      document.documentElement.style.setProperty('--pc-transition-base', '0ms');
      document.documentElement.style.setProperty('--pc-transition-slow', '0ms');
    }

    // Focus visible polyfill enhancement
    document.addEventListener('mousedown', () => {
      document.body.classList.add('pc-using-mouse');
    });

    document.addEventListener('keydown', () => {
      document.body.classList.remove('pc-using-mouse');
    });
  }

  // ==========================================
  // TRUST COUNTER ANIMATION
  // ==========================================
  
  function initTrustCounter() {
    const trustNumbers = document.querySelectorAll('.pc-trust-item__number');
    if (!trustNumbers.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const finalValue = el.textContent;
          
          // Extract number and suffix
          const match = finalValue.match(/^([0-9,.]+)(.*)$/);
          if (!match) return;
          
          const num = parseFloat(match[1].replace(/,/g, ''));
          const suffix = match[2];
          
          if (isNaN(num)) return;

          animateNumber(el, num, suffix, 1500);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    trustNumbers.forEach(el => observer.observe(el));
  }

  function animateNumber(el, final, suffix, duration) {
    if (prefersReducedMotion()) {
      el.textContent = formatNumber(final) + suffix;
      return;
    }

    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (final - start) * easeOut);
      
      el.textContent = formatNumber(current) + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  function formatNumber(num) {
    if (num >= 1000) {
      return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'K';
    }
    return num.toString();
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================
  
  function init() {
    // Remove no-js class to indicate JS is working
    document.body.classList.remove('no-js');
    
    initMobileMenu();
    initScrollAnimations();
    initSearchShortcut();
    initCardHoverEffects();
    initPageTransitions();
    initSmoothScroll();
    initHeaderScroll();
    initParallax();
    initFormEnhancements();
    initAccessibility();
    initTrustCounter();

    // Log initialization
    console.log('🐾 VetLudics: Animations initialized');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
