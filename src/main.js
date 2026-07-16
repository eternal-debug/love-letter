import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import SplitType from 'split-type';
import * as THREE from 'three';
import { ArrowDown, RotateCcw, Volume2, VolumeX, createIcons } from 'lucide';
import { letterScenes } from './data/letter';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = {
  unlocked: false,
  ambient: false,
  audioMode: null,
  audioContext: null,
  audioNodes: []
};

let lenis;
let sceneObserver;

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const iconSet = { ArrowDown, RotateCcw, Volume2, VolumeX };

function refreshIcons() {
  createIcons({ icons: iconSet, attrs: { 'stroke-width': 1.4 } });
}

function visualMarkup(kind) {
  const common = `
    <span class="visual__grain"></span>
    <span class="visual__corner visual__corner--tl"></span>
    <span class="visual__corner visual__corner--br"></span>
  `;

  const visualMap = {
    letter: `
      <div class="visual__orbit visual__orbit--one"></div>
      <div class="visual__orbit visual__orbit--two"></div>
      <div class="visual__paper-stack">
        <div class="paper paper--back"></div>
        <div class="paper paper--middle"></div>
        <div class="paper paper--front">
          <span class="paper__line paper__line--short"></span>
          <span class="paper__line"></span>
          <span class="paper__line"></span>
          <span class="paper__line paper__line--wide"></span>
          <span class="paper__signature">B</span>
        </div>
      </div>
      <div class="visual__caption">a letter, finally written</div>
    `,
    memory: `
      <div class="memory-orbit memory-orbit--one"></div>
      <div class="memory-orbit memory-orbit--two"></div>
      <div class="memory-card memory-card--one"><span>01</span><strong>hello</strong></div>
      <div class="memory-card memory-card--two"><span>02</span><strong>chance</strong></div>
      <div class="visual__caption">the beginning was unexpected</div>
    `,
    routes: `
      <div class="route-map">
        <span class="route-map__line"></span>
        <span class="route-map__node route-map__node--one"></span>
        <span class="route-map__node route-map__node--two"></span>
        <span class="route-map__node route-map__node--three"></span>
        <span class="route-map__label route-map__label--one">work</span>
        <span class="route-map__label route-map__label--two">Lotte</span>
        <span class="route-map__label route-map__label--three">Hồng Hà</span>
      </div>
      <div class="route-scribble">ordinary<br /><em>is enough</em></div>
      <div class="visual__caption">the places that became ours</div>
    `,
    danang: `
      <div class="sun-disc"></div>
      <div class="wave wave--one"></div>
      <div class="wave wave--two"></div>
      <div class="wave wave--three"></div>
      <div class="danang-note">Đà Nẵng<br /><em>day 04</em></div>
      <div class="visual__caption">somewhere between joy and fog</div>
    `,
    distance: `
      <div class="distance-line"></div>
      <div class="distance-node distance-node--left"><span>HÀ NỘI</span></div>
      <div class="distance-node distance-node--right"><span>TRINH</span></div>
      <div class="distance-heart">♡</div>
      <div class="visual__caption">distance is a shape, not an ending</div>
    `,
    choice: `
      <div class="choice-ring choice-ring--one"></div>
      <div class="choice-ring choice-ring--two"></div>
      <div class="choice-line choice-line--left"></div>
      <div class="choice-line choice-line--right"></div>
      <div class="choice-word choice-word--one">easy</div>
      <div class="choice-word choice-word--two">us</div>
      <div class="visual__caption">the difficult road, chosen gently</div>
    `,
    future: `
      <div class="future-sphere"></div>
      <div class="future-ring future-ring--one"></div>
      <div class="future-ring future-ring--two"></div>
      <div class="future-star future-star--one"></div>
      <div class="future-star future-star--two"></div>
      <div class="future-star future-star--three"></div>
      <div class="future-note">grow<br /><em>together</em></div>
      <div class="visual__caption">two lives, still moving forward</div>
    `,
    airport: `
      <div class="runway">
        <span class="runway__center"></span>
        <span class="runway__light runway__light--one"></span>
        <span class="runway__light runway__light--two"></span>
        <span class="runway__light runway__light--three"></span>
      </div>
      <div class="airport-label airport-label--one">NỘI BÀI</div>
      <div class="airport-label airport-label--two">SYDNEY</div>
      <div class="airport-line"></div>
      <div class="visual__caption">one chapter closes, another begins</div>
    `,
    care: `
      <div class="care-bloom">
        <span></span><span></span><span></span><span></span><span></span>
        <i></i>
      </div>
      <div class="care-note">remember<br /><em>to rest</em></div>
      <div class="care-list"><span>weather</span><span>food</span><span>sleep</span><span>music</span></div>
      <div class="visual__caption">love, in its most practical form</div>
    `,
    return: `
      <div class="return-orbit return-orbit--one"></div>
      <div class="return-orbit return-orbit--two"></div>
      <div class="return-rose">
        <span class="return-rose__petal return-rose__petal--one"></span>
        <span class="return-rose__petal return-rose__petal--two"></span>
        <span class="return-rose__petal return-rose__petal--three"></span>
        <span class="return-rose__center"></span>
      </div>
      <div class="return-note">waiting<br /><em>for you</em></div>
      <div class="visual__caption">here, until you come home</div>
    `
  };

  return `${common}<div class="visual visual--${kind}" data-visual-kind="${kind}">${visualMap[kind] || visualMap.letter}</div>`;
}

function renderScenes() {
  const list = $('#act-list');
  list.innerHTML = letterScenes.map((scene, index) => `
    <section class="scene scene--${scene.visual} ${index % 2 ? 'scene--reverse' : ''}" id="act-${scene.number}" data-scene-index="${index}" aria-labelledby="scene-title-${scene.number}">
      <div class="scene__wash"></div>
      <div class="scene__inner">
        <div class="scene__visual-wrap">
          <div class="scene__visual" data-parallax="${index % 2 ? '-1' : '1'}">
            ${visualMarkup(scene.visual)}
          </div>
        </div>
        <div class="scene__copy-wrap">
          <div class="scene__heading">
            <div class="scene__eyebrow-row">
              <span class="scene__number">${scene.number}</span>
              <span class="scene__chapter" data-reveal>${scene.chapter}</span>
            </div>
            <p class="scene__location" data-reveal>${scene.location}</p>
            <h2 class="scene__title" id="scene-title-${scene.number}" data-split>${scene.title}</h2>
          </div>
          <div class="scene__body">
            ${scene.copy.map((paragraph) => `<p class="scene__paragraph" data-reveal>${paragraph}</p>`).join('')}
          </div>
          <blockquote class="scene__quote" data-reveal>“${scene.quote}”</blockquote>
        </div>
      </div>
    </section>
  `).join('');

  const nav = document.createElement('nav');
  nav.className = 'act-nav';
  nav.setAttribute('aria-label', 'Chọn hồi thư');
  nav.innerHTML = letterScenes.map((scene, index) => `<button type="button" data-act-target="${index}" aria-label="Đến hồi ${scene.number}"><span></span></button>`).join('');
  $('.site-shell').append(nav);
}

function renderPetals() {
  if (prefersReducedMotion) return;
  const field = $('#petal-field');
  const colors = ['#b24b57', '#d78b91', '#e7b5a8', '#f5d5c6', '#8f303d'];
  for (let i = 0; i < 28; i += 1) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    petal.style.setProperty('--x', `${Math.random() * 100}%`);
    petal.style.setProperty('--size', `${3 + Math.random() * 8}px`);
    petal.style.setProperty('--delay', `${Math.random() * -12}s`);
    petal.style.setProperty('--duration', `${10 + Math.random() * 16}s`);
    petal.style.setProperty('--drift', `${-90 + Math.random() * 180}px`);
    petal.style.setProperty('--color', colors[Math.floor(Math.random() * colors.length)]);
    field.appendChild(petal);
  }
}

function initWebGL() {
  const canvas = $('#webgl-canvas');
  if (!canvas || prefersReducedMotion) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 8;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const count = Math.min(760, Math.floor(window.innerWidth * 0.7));
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [new THREE.Color('#d4a2a1'), new THREE.Color('#f2d4c7'), new THREE.Color('#8d3f4a'), new THREE.Color('#fff4e8')];
  for (let i = 0; i < count; i += 1) {
    const radius = 3.4 + Math.random() * 4.5;
    const angle = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius * (0.65 + Math.random() * 0.5);
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = Math.sin(angle) * radius - 1;
    const color = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: 0.025, vertexColors: true, transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending, depthWrite: false });
  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 0.35;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 0.2;
  }, { passive: true });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, { passive: true });

  const clock = new THREE.Clock();
  const render = () => {
    const elapsed = clock.getElapsedTime();
    particles.rotation.y = elapsed * 0.025 + pointer.x;
    particles.rotation.x = Math.sin(elapsed * 0.08) * 0.035 + pointer.y;
    camera.position.x += (pointer.x * 0.7 - camera.position.x) * 0.02;
    camera.position.y += (-pointer.y * 0.5 - camera.position.y) * 0.02;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };
  render();
}

function initAudio() {
  const toggle = $('#audio-toggle');
  const fileAudio = $('#letter-audio');
  const fileAudioSrc = fileAudio?.dataset.src;
  if (fileAudio) fileAudio.volume = 0.2;
  const setIcon = () => {
    toggle.innerHTML = `<i data-lucide="${state.ambient ? 'volume-2' : 'volume-x'}"></i>`;
    toggle.setAttribute('aria-pressed', String(state.ambient));
    toggle.setAttribute('aria-label', state.ambient ? 'Tắt âm thanh nền' : 'Bật âm thanh nền');
    refreshIcons();
  };

  const startSynth = () => {
    if (!state.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      state.audioContext = new AudioContext();
      const master = state.audioContext.createGain();
      master.gain.value = 0.0024;
      master.connect(state.audioContext.destination);
      [174.61, 261.63, 349.23].forEach((frequency, index) => {
        const oscillator = state.audioContext.createOscillator();
        const gain = state.audioContext.createGain();
        oscillator.type = index === 1 ? 'sine' : 'triangle';
        oscillator.frequency.value = frequency;
        gain.gain.value = index === 0 ? 0.15 : 0.07;
        oscillator.connect(gain).connect(master);
        oscillator.start();
        state.audioNodes.push(oscillator, gain);
      });
    }
    state.audioContext.resume();
    state.audioMode = 'synth';
    state.ambient = true;
    setIcon();
  };

  const start = async () => {
    if (fileAudio && fileAudioSrc) {
      try {
        if (!fileAudio.getAttribute('src')) fileAudio.setAttribute('src', fileAudioSrc);
        await fileAudio.play();
        state.audioMode = 'file';
        state.ambient = true;
        setIcon();
        return;
      } catch (error) {
        // Nếu chưa có file / trình duyệt chặn audio, dùng ambient tone làm fallback.
      }
    }
    startSynth();
  };

  toggle.addEventListener('click', () => {
    if (state.ambient) {
      if (state.audioMode === 'file') fileAudio.pause();
      else state.audioContext.suspend();
      state.ambient = false;
    } else {
      start();
    }
    setIcon();
  });

  return start;
}

function initSmoothScroll() {
  lenis = new Lenis({
    lerp: 0.075,
    smoothWheel: true,
    syncTouch: false,
    autoRaf: false
  });
  lenis.stop();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function initSplitText() {
  $$('[data-split]').forEach((element) => {
    const split = new SplitType(element, { types: 'lines, words, chars', tagName: 'span' });
    split.lines.forEach((line) => {
      line.classList.add('split-line');
      line.style.display = 'block';
    });
    gsap.set(split.chars, { yPercent: 110, opacity: 0, rotateX: -65, transformOrigin: '50% 100%' });
    ScrollTrigger.create({
      trigger: element,
      start: 'top 84%',
      once: true,
      onEnter: () => gsap.to(split.chars, { yPercent: 0, opacity: 1, rotateX: 0, duration: 1.05, ease: 'power4.out', stagger: 0.018 })
    });
  });
}

function initRevealMotion() {
  $$('[data-reveal]').forEach((element) => {
    gsap.set(element, { opacity: 0, y: 22 });
    ScrollTrigger.create({
      trigger: element,
      start: 'top 87%',
      once: true,
      onEnter: () => gsap.to(element, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
    });
  });

  $$('.scene').forEach((scene) => {
    const visual = $('.scene__visual', scene);
    const wash = $('.scene__wash', scene);
    gsap.to(visual, {
      yPercent: scene.dataset.sceneIndex % 2 ? -5 : 5,
      rotate: scene.dataset.sceneIndex % 2 ? -1.2 : 1.2,
      ease: 'none',
      scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: 1.2 }
    });
    gsap.to(wash, {
      opacity: 1,
      scale: 1.12,
      ease: 'none',
      scrollTrigger: { trigger: scene, start: 'top bottom', end: 'center center', scrub: 1.6 }
    });
  });
}

function initStoryProgress() {
  const path = $('#story-path');
  const dot = $('#spine-dot');
  const indexLabel = $('#scroll-index');
  const buttons = $$('[data-act-target]');
  const scenes = $$('.scene');

  ScrollTrigger.create({
    trigger: '#top',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const progress = self.progress;
      path.style.strokeDashoffset = String(1 - progress);
      dot.style.top = `${progress * 100}%`;
      const current = Math.min(letterScenes.length - 1, Math.max(0, Math.floor(progress * letterScenes.length)));
      indexLabel.textContent = String(current + 1).padStart(2, '0');
      buttons.forEach((button, buttonIndex) => button.classList.toggle('is-active', buttonIndex === current));
    }
  });

  scenes.forEach((scene, index) => {
    ScrollTrigger.create({
      trigger: scene,
      start: 'top 62%',
      end: 'bottom 38%',
      onToggle: ({ isActive }) => {
        if (isActive) {
          buttons.forEach((button, buttonIndex) => button.classList.toggle('is-active', buttonIndex === index));
        }
      }
    });
  });

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const scene = scenes[Number(button.dataset.actTarget)];
      if (scene) lenis.scrollTo(scene, { offset: -50, duration: 1.5 });
    });
  });
}

function initPointerDetails() {
  const glow = $('.cursor-glow');
  if (window.matchMedia('(pointer: coarse)').matches) return;
  window.addEventListener('pointermove', (event) => {
    gsap.to(glow, { x: event.clientX, y: event.clientY, duration: 0.45, ease: 'power3.out' });
  }, { passive: true });

  $$('.scene__visual, .envelope').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      gsap.to(element, { rotateY: x * 4, rotateX: -y * 4, transformPerspective: 900, duration: 0.6, ease: 'power3.out' });
    });
    element.addEventListener('pointerleave', () => gsap.to(element, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'power3.out' }));
  });
}

function animateOpen() {
  if (state.unlocked) return;
  state.unlocked = true;
  const gate = $('#gate');
  const seal = $('#wax-seal');
  const envelope = $('#envelope');
  const shell = $('#site-shell');
  const trigger = $('#open-letter');
  trigger.disabled = true;
  document.body.classList.remove('is-locked'); 
  document.body.classList.add('is-unlocking');
  window.__startLetterAudio?.();

  const timeline = gsap.timeline({
    defaults: { ease: 'power4.inOut' },
    onComplete: () => {
      gate.setAttribute('aria-hidden', 'true');
      gate.style.pointerEvents = 'none';
      lenis.start();
      ScrollTrigger.refresh();
    }
  });
  timeline
    .to(seal, { scale: 1.14, rotate: -4, duration: 0.35, ease: 'power2.out' })
    .to(seal, { scale: 0.8, opacity: 0, duration: 0.45, ease: 'power3.in' }, '+=0.12')
    .to(envelope, { rotate: -2, yPercent: 5, duration: 0.35 }, '<')
    .to('.envelope__flap', { rotateX: 178, transformOrigin: '50% 0%', duration: 0.85, ease: 'power3.inOut' }, '+=0.1')
    .to(gate, { opacity: 0, duration: 1.2, ease: 'power2.inOut' }, '+=0.12')
    .fromTo(shell, { opacity: 0, scale: 1.02 }, { opacity: 1, scale: 1, duration: 1.6, ease: 'power3.out' }, '-=0.9');
}

function resetLetter() {
  state.unlocked = false;
  lenis.stop();
  window.scrollTo({ top: 0, behavior: 'instant' });
  const gate = $('#gate');
  const shell = $('#site-shell');
  const seal = $('#wax-seal');
  const envelope = $('#envelope');
  const trigger = $('#open-letter');
  document.body.classList.add('is-locked');
  document.body.classList.remove('is-unlocking');
  gate.style.display = 'flex';
  gate.style.pointerEvents = 'auto';
  gate.setAttribute('aria-hidden', 'false');
  trigger.disabled = false;
  gsap.set(gate, { opacity: 1 });
  gsap.set(shell, { opacity: 0, scale: 1.02 });
  gsap.set(seal, { scale: 1, rotate: 0, opacity: 1 });
  gsap.set(envelope, { rotate: 0, yPercent: 0 });
  gsap.set('.envelope__flap', { rotateX: 0 });
}

function boot() {
  renderScenes();
  renderPetals();
  refreshIcons();
  initSmoothScroll();
  window.__startLetterAudio = initAudio();
  initWebGL();
  initSplitText();
  initRevealMotion();
  initStoryProgress();
  initPointerDetails();

  const bar = $('#loading-bar');
  const percent = $('#loading-percent');
  const preloader = $('#preloader');
  let loadProgress = { value: 0 };
  gsap.to(loadProgress, {
    value: 100,
    duration: prefersReducedMotion ? 0.25 : 1.8,
    ease: 'power2.inOut',
    onUpdate: () => {
      const value = Math.round(loadProgress.value);
      bar.style.width = `${value}%`;
      percent.textContent = String(value).padStart(2, '0');
    },
    onComplete: () => {
      gsap.to(preloader, {
        autoAlpha: 0,
        duration: prefersReducedMotion ? 0.2 : 0.9,
        delay: 0.2,
        onComplete: () => preloader.remove()
      });
      gsap.from('.gate__panel', { opacity: 0, y: 24, duration: 1.2, delay: 0.25, ease: 'power3.out' });
    }
  });

  $('#open-letter').addEventListener('click', animateOpen);
  $('#wax-seal').addEventListener('click', animateOpen);
  $('#scroll-cue').addEventListener('click', () => lenis.scrollTo('#act-01', { offset: -50, duration: 1.4 }));
  $('#reset-letter').addEventListener('click', resetLetter);
  document.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && !state.unlocked && document.activeElement === $('#open-letter')) {
      event.preventDefault();
      animateOpen();
    }
  });
}

boot();
