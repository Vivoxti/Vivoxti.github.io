// Ember particle system
const canvas = document.getElementById('embers');
const ctx = canvas.getContext('2d');
let W, H;
const embers = [];
const EMBER_COUNT = 40;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Ember {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * W;
    this.y = H + Math.random() * 100;
    this.size = Math.random() * 2.5 + 0.5;
    this.speedY = -(Math.random() * 0.6 + 0.15);
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.opacity = Math.random() * 0.6 + 0.2;
    this.life = 0;
    this.maxLife = Math.random() * 600 + 300;
    const r = 200 + Math.random() * 55;
    const g = 80 + Math.random() * 80;
    this.color = `${r},${g},20`;
  }
  update() {
    this.x += this.speedX + Math.sin(this.life * 0.01) * 0.15;
    this.y += this.speedY;
    this.life++;
    if (this.life > this.maxLife || this.y < -20) this.reset();
  }
  draw() {
    const fade = 1 - this.life / this.maxLife;
    const a = this.opacity * fade;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color},${a})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color},${a * 0.15})`;
    ctx.fill();
  }
}

const hero = document.getElementById('hero');
const heroBg = document.getElementById('heroBg');
const trophy = document.getElementById('trophy');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

const parallaxTarget = {
  x: 0,
  y: 0,
  rotateX: 0,
  rotateY: 0,
  bgX: 0,
  bgY: 0
};

const parallaxCurrent = {
  x: 0,
  y: 0,
  rotateX: 0,
  rotateY: 0,
  bgX: 0,
  bgY: 0
};

let activeParallaxSource = 'idle';
let gyroscopeEnabled = false;
let motionPermissionAttempted = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resetParallaxTarget() {
  parallaxTarget.x = 0;
  parallaxTarget.y = 0;
  parallaxTarget.rotateX = 0;
  parallaxTarget.rotateY = 0;
  parallaxTarget.bgX = 0;
  parallaxTarget.bgY = 0;
}

function setParallaxTarget(normalizedX, normalizedY, source) {
  if (motionPreference.matches) {
    resetParallaxTarget();
    return;
  }

  activeParallaxSource = source;
  parallaxTarget.x = normalizedX * 18;
  parallaxTarget.y = normalizedY * 14;
  parallaxTarget.rotateX = -normalizedY * 8;
  parallaxTarget.rotateY = normalizedX * 10;
  parallaxTarget.bgX = normalizedX * 10;
  parallaxTarget.bgY = normalizedY * 10;
}

function updateParallax() {
  const easing = motionPreference.matches ? 0.22 : 0.1;

  if (motionPreference.matches) {
    resetParallaxTarget();
  }

  Object.keys(parallaxCurrent).forEach(key => {
    parallaxCurrent[key] += (parallaxTarget[key] - parallaxCurrent[key]) * easing;
  });

  if (heroBg) {
    heroBg.style.transform = `translate3d(${parallaxCurrent.bgX}px, ${parallaxCurrent.bgY}px, 0)`;
  }

  if (trophy) {
    trophy.style.transform = `translate3d(${parallaxCurrent.x}px, ${parallaxCurrent.y}px, 0) rotateX(${parallaxCurrent.rotateX}deg) rotateY(${parallaxCurrent.rotateY}deg)`;
    trophy.style.setProperty('--parallax-x', `${parallaxCurrent.x}px`);
    trophy.style.setProperty('--parallax-y', `${parallaxCurrent.y}px`);
    trophy.style.setProperty('--glow-shift-x', `${parallaxCurrent.x * -0.35}px`);
    trophy.style.setProperty('--glow-shift-y', `${parallaxCurrent.y * -0.35}px`);
  }
}

function getScreenAngle() {
  if (screen.orientation && typeof screen.orientation.angle === 'number') {
    return screen.orientation.angle;
  }

  if (typeof window.orientation === 'number') {
    return window.orientation;
  }

  return 0;
}

function handlePointerParallax(event) {
  if (!hero || motionPreference.matches) return;

  const rect = hero.getBoundingClientRect();
  const normalizedX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
  const normalizedY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);

  setParallaxTarget(normalizedX, normalizedY, 'pointer');
}

function handleDeviceOrientation(event) {
  if (motionPreference.matches) return;

  const { beta, gamma } = event;
  if (typeof beta !== 'number' || typeof gamma !== 'number') return;

  let normalizedX = clamp(gamma / 18, -1, 1);
  let normalizedY = clamp((beta - 45) / 20, -1, 1);
  const angle = ((getScreenAngle() % 360) + 360) % 360;

  if (angle === 90) {
    normalizedX = clamp(beta / 30, -1, 1);
    normalizedY = clamp(gamma / 18, -1, 1);
  } else if (angle === 180) {
    normalizedX = clamp(-gamma / 18, -1, 1);
    normalizedY = clamp(-(beta - 45) / 20, -1, 1);
  } else if (angle === 270) {
    normalizedX = clamp(-beta / 30, -1, 1);
    normalizedY = clamp(-gamma / 18, -1, 1);
  }

  setParallaxTarget(normalizedX, normalizedY, 'gyroscope');
}

async function enableGyroscopeParallax() {
  if (gyroscopeEnabled || motionPreference.matches || !('DeviceOrientationEvent' in window)) {
    return;
  }

  try {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== 'granted') return;
    }

    window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    gyroscopeEnabled = true;
  } catch (error) {
    // Ignore sensor access errors and keep mouse fallback active.
  }
}

for (let i = 0; i < EMBER_COUNT; i++) {
  const e = new Ember();
  e.y = Math.random() * H;
  e.life = Math.random() * e.maxLife;
  embers.push(e);
}

function animate() {
  ctx.clearRect(0, 0, W, H);
  embers.forEach(e => { e.update(); e.draw(); });
  updateParallax();
  requestAnimationFrame(animate);
}
animate();

if (hero) {
  hero.addEventListener('mousemove', handlePointerParallax);
  hero.addEventListener('mouseleave', () => {
    if (activeParallaxSource === 'pointer') {
      activeParallaxSource = 'idle';
      resetParallaxTarget();
    }
  });
}

if ('DeviceOrientationEvent' in window) {
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    const requestMotionAccess = async () => {
      if (motionPermissionAttempted) return;
      motionPermissionAttempted = true;
      await enableGyroscopeParallax();
    };

    window.addEventListener('touchstart', requestMotionAccess, { once: true, passive: true });
    window.addEventListener('pointerdown', requestMotionAccess, { once: true, passive: true });
  } else {
    enableGyroscopeParallax();
  }
}

const handleMotionPreferenceChange = event => {
  if (event.matches) {
    activeParallaxSource = 'idle';
    resetParallaxTarget();
  }
};

if (typeof motionPreference.addEventListener === 'function') {
  motionPreference.addEventListener('change', handleMotionPreferenceChange);
} else if (typeof motionPreference.addListener === 'function') {
  motionPreference.addListener(handleMotionPreferenceChange);
}

// Scroll fade-in
const sections = document.querySelectorAll('.placements, .journey, .stats, .bottom-nav');
sections.forEach(s => s.classList.add('fade-in'));

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.15 });

sections.forEach(s => observer.observe(s));

// Achievement tooltips
const achievements = document.querySelectorAll('.achievement');

if (achievements.length) {
  const achievementTooltip = document.createElement('div');
  const tooltipTitle = document.createElement('div');
  const tooltipText = document.createElement('div');
  let activeAchievement = null;

  achievementTooltip.className = 'achievement-tooltip';
  achievementTooltip.id = 'achievementTooltip';
  achievementTooltip.setAttribute('role', 'tooltip');
  achievementTooltip.setAttribute('aria-hidden', 'true');

  tooltipTitle.className = 'achievement-tooltip-title';
  tooltipText.className = 'achievement-tooltip-text';

  achievementTooltip.append(tooltipTitle, tooltipText);
  document.body.appendChild(achievementTooltip);

  function setAchievementState(achievement, isExpanded) {
    achievement.classList.toggle('is-tooltip-active', isExpanded);
    achievement.setAttribute('aria-expanded', String(isExpanded));
  }

  function positionAchievementTooltip(achievement) {
    if (!achievement || !achievementTooltip.classList.contains('is-visible')) return;

    const rect = achievement.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 14;
    const tooltipRect = achievementTooltip.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

    left = clamp(left, viewportPadding, window.innerWidth - tooltipRect.width - viewportPadding);

    let top = rect.top - tooltipRect.height - gap;
    let placement = 'top';

    if (top < viewportPadding) {
      top = rect.bottom + gap;
      placement = 'bottom';
    }

    achievementTooltip.dataset.placement = placement;
    achievementTooltip.style.left = `${left}px`;
    achievementTooltip.style.top = `${top}px`;

    const pointerOffset = clamp(rect.left + rect.width / 2 - left, 22, tooltipRect.width - 22);
    achievementTooltip.style.setProperty('--tooltip-pointer-offset', `${pointerOffset}px`);
  }

  function closeAchievementTooltip() {
    if (!activeAchievement) return;

    setAchievementState(activeAchievement, false);
    activeAchievement = null;
    achievementTooltip.classList.remove('is-visible');
    achievementTooltip.setAttribute('aria-hidden', 'true');
  }

  function openAchievementTooltip(achievement) {
    const title = achievement.dataset.tooltip || achievement.querySelector('.ach-label')?.textContent?.replace(/\s+/g, ' ').trim() || 'Achievement';
    const details = achievement.dataset.tooltipDetails || '';

    if (activeAchievement && activeAchievement !== achievement) {
      setAchievementState(activeAchievement, false);
    }

    tooltipTitle.textContent = title;
    tooltipText.textContent = details;
    tooltipText.hidden = !details;

    achievementTooltip.classList.add('is-visible');
    achievementTooltip.setAttribute('aria-hidden', 'false');

    activeAchievement = achievement;
    setAchievementState(achievement, true);
    positionAchievementTooltip(achievement);
  }

  function toggleAchievementTooltip(achievement) {
    if (activeAchievement === achievement) {
      closeAchievementTooltip();
      return;
    }

    openAchievementTooltip(achievement);
  }

  achievements.forEach(achievement => {
    achievement.setAttribute('aria-describedby', achievementTooltip.id);

    achievement.addEventListener('click', event => {
      event.stopPropagation();
      toggleAchievementTooltip(achievement);
    });

    achievement.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleAchievementTooltip(achievement);
      }
    });
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('.achievement')) {
      closeAchievementTooltip();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeAchievementTooltip();
    }
  });

  window.addEventListener('resize', () => {
    if (activeAchievement) {
      positionAchievementTooltip(activeAchievement);
    }
  });

  window.addEventListener('scroll', () => {
    if (activeAchievement) {
      positionAchievementTooltip(activeAchievement);
    }
  }, { passive: true });
}

