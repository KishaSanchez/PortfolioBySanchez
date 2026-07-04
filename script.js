/* =========================================================
   KISHA ✦ — interactions
   1. Custom cursor + magnetic buttons
   2. Drag engine (pointer events, works on touch too)
   3. Parallax — mouse (hero letters/stickers) + scroll (data-speed)
   4. Typing terminal
   5. Count-up stats + scroll reveals
   ========================================================= */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- 1. Custom cursor ---------- */
const dot = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');

if (finePointer && !reduceMotion) {
    let mx = 0, my = 0, rx = 0, ry = 0;

    window.addEventListener('mousemove', (e) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    }, { passive: true });

    (function ringLoop() {
        rx += (mx - rx) * 0.16;
        ry += (my - ry) * 0.16;
        ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
        requestAnimationFrame(ringLoop);
    })();

    document.querySelectorAll('a, button, .drag').forEach((el) => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
}

/* ---------- Magnetic buttons ---------- */
if (finePointer && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach((el) => {
        el.addEventListener('mousemove', (e) => {
            const r = el.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height / 2);
            el.style.transform = `translate(${dx * 0.25}px, ${dy * 0.25}px)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
        });
    });
}

/* ---------- 2. Drag engine ---------- */
let zTop = 100;

document.querySelectorAll('.drag').forEach((el) => {
    let startX = 0, startY = 0, baseX = 0, baseY = 0, dragging = false;

    // read any existing drag translation from transform
    const getXY = () => {
        const m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(el.style.transform || '');
        return m ? [parseFloat(m[1]), parseFloat(m[2])] : [0, 0];
    };

    el.addEventListener('pointerdown', (e) => {
        // don't hijack link clicks inside draggables
        if (e.target.closest('a')) return;
        dragging = true;
        el.setPointerCapture(e.pointerId);
        delete el.dataset.moved;
        [baseX, baseY] = getXY();
        startX = e.clientX;
        startY = e.clientY;
        el.classList.add('lifted');
        el.dataset.dragged = '1'; // hands ownership to the user; parallax lets go
        el.style.zIndex = ++zTop;
        document.body.classList.add('cursor-drag');
        el.style.animation = 'none'; // stop floating while held
    });

    el.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.hypot(dx, dy) > 8) el.dataset.moved = '1';
        el.style.transform = `translate(${baseX + dx}px, ${baseY + dy}px)`;
    });

    const drop = () => {
        if (!dragging) return;
        dragging = false;
        el.classList.remove('lifted');
        document.body.classList.remove('cursor-drag');
    };
    el.addEventListener('pointerup', drop);
    el.addEventListener('pointercancel', drop);
});

/* ---------- 3a. Mouse parallax (hero) ---------- */
const hero = document.querySelector('.hero');
const depthEls = document.querySelectorAll('.hero [data-depth]');

if (finePointer && !reduceMotion && hero) {
    let hx = 0, hy = 0, cx = 0, cy = 0;

    hero.addEventListener('mousemove', (e) => {
        const r = hero.getBoundingClientRect();
        hx = (e.clientX - r.left) / r.width - 0.5;
        hy = (e.clientY - r.top) / r.height - 0.5;
    }, { passive: true });

    (function heroLoop() {
        cx += (hx - cx) * 0.06;
        cy += (hy - cy) * 0.06;
        depthEls.forEach((el) => {
            // once the user drags something, it's theirs — parallax lets go
            if (el.dataset.dragged) { el.style.translate = ''; return; }
            const d = parseFloat(el.dataset.depth) || 0;
            // `translate` composes with animated/dragged `transform`, so no conflicts
            el.style.translate = `${(cx * d * 2.4).toFixed(1)}px ${(cy * d * 2.4).toFixed(1)}px`;
        });
        requestAnimationFrame(heroLoop);
    })();
}

/* ---------- 3b. Scroll parallax (data-speed) ---------- */
const speedEls = document.querySelectorAll('[data-speed]');

if (!reduceMotion && speedEls.length) {
    let ticking = false;

    const applyParallax = () => {
        speedEls.forEach((el) => {
            if (el.dataset.dragged) return; // user owns it now
            const rect = el.getBoundingClientRect();
            const mid = rect.top + rect.height / 2 - window.innerHeight / 2;
            const speed = parseFloat(el.dataset.speed) || 0;
            el.style.translate = `0 ${(-mid * speed).toFixed(1)}px`;
        });
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(applyParallax);
        }
    }, { passive: true });

    applyParallax();
}

/* ---------- 4. Typing terminal ---------- */
const termBody = document.getElementById('term-body');

if (termBody) {
    const lines = [
        '> whoami',
        'kisha ann joy m. sanchez',
        '> role',
        'bscs student · app developer',
        '> location',
        'davao del norte, ph 🇵🇭',
        '> status',
        'building things that matter ✦'
    ];

    if (reduceMotion) {
        termBody.textContent = lines.join('\n');
    } else {
        let li = 0, ci = 0;
        (function type() {
            if (li >= lines.length) return;
            const line = lines[li];
            if (ci <= line.length) {
                const done = lines.slice(0, li).join('\n');
                termBody.textContent = (done ? done + '\n' : '') + line.slice(0, ci);
                ci++;
                setTimeout(type, line.startsWith('>') ? 55 : 26);
            } else {
                li++; ci = 0;
                setTimeout(type, 420);
            }
        })();
    }
}

/* ---------- 5a. Count-up stats ---------- */
const counters = document.querySelectorAll('.stat-n[data-count]');

const runCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    if (reduceMotion) { el.textContent = target; return; }
    const dur = 1200;
    const t0 = performance.now();
    (function tick(t) {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
    })(t0);
};

/* ---------- 5b. Split-letter titles + scroll reveals ---------- */
function splitLetters(el) {
    let idx = 0;
    const walk = (node) => {
        [...node.childNodes].forEach((n) => {
            if (n.nodeType === 3) {
                const frag = document.createDocumentFragment();
                [...n.textContent].forEach((ch) => {
                    const s = document.createElement('span');
                    s.className = 'ch';
                    s.style.setProperty('--i', idx++);
                    s.textContent = ch;
                    frag.appendChild(s);
                });
                n.replaceWith(frag);
            } else if (n.nodeType === 1 && n.tagName !== 'BR' && !n.classList.contains('trophy')) {
                walk(n);
            }
        });
    };
    walk(el);
}

if (!reduceMotion) {
    document.querySelectorAll('[data-split]').forEach(splitLetters);
}

const reveals = document.querySelectorAll('.reveal, .wipe, [data-split]');

if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
    counters.forEach(runCount);
} else {
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('in');
            entry.target.querySelectorAll('.stat-n[data-count]').forEach(runCount);
            io.unobserve(entry.target);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    reveals.forEach((el) => io.observe(el));
}

/* ---------- 6. Scene panels — backgrounds wake up on scroll ---------- */
const scenes = document.querySelectorAll('.scene');

if (!('IntersectionObserver' in window)) {
    scenes.forEach((s) => s.classList.add('live'));
} else {
    const sceneIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('live');
                sceneIO.unobserve(entry.target);
            }
        });
    }, { threshold: 0.35 });

    scenes.forEach((s) => sceneIO.observe(s));
}

/* ---------- 7. CAT DASH — the Game Boy mini game ---------- */
(function catDash() {
    const canvas = document.getElementById('cat-game');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const GROUND = H - 26;

    // palette: game-boy-ish greens + accents
    const C = { bg: '#9BE564', dark: '#1d3a12', mid: '#3f6d22', accent: '#c23a6b' };

    let state = 'idle'; // idle | run | over
    let cat, obstacles, speed, score, best = 0, spawnIn, raf = null, last = 0;

    function reset() {
        cat = { x: 54, y: GROUND, vy: 0, w: 30, h: 22, jumping: false, leg: 0 };
        obstacles = [];
        speed = 4.2;
        score = 0;
        spawnIn = 0;
    }

    /* --- pixel cat, drawn with rects (8px grid feel) --- */
    function drawCat() {
        const x = cat.x, y = cat.y - cat.h;
        ctx.fillStyle = C.dark;
        // body
        ctx.fillRect(x, y + 6, 26, 12);
        // head
        ctx.fillRect(x + 18, y, 12, 12);
        // ears
        ctx.fillRect(x + 18, y - 5, 4, 5);
        ctx.fillRect(x + 26, y - 5, 4, 5);
        // tail (waves with legs)
        ctx.fillRect(x - 7, y + 4 + (cat.leg > 2 ? 2 : 0), 7, 4);
        // legs (simple 2-frame run cycle)
        if (cat.jumping) {
            ctx.fillRect(x + 3, y + 18, 4, 4);
            ctx.fillRect(x + 19, y + 18, 4, 4);
        } else if (cat.leg > 2) {
            ctx.fillRect(x + 2, y + 18, 4, 6);
            ctx.fillRect(x + 20, y + 18, 4, 6);
        } else {
            ctx.fillRect(x + 6, y + 18, 4, 6);
            ctx.fillRect(x + 16, y + 18, 4, 6);
        }
        // eye
        ctx.fillStyle = C.bg;
        ctx.fillRect(x + 25, y + 3, 3, 3);
    }

    function drawYarn(o) {
        ctx.fillStyle = C.accent;
        ctx.beginPath();
        ctx.arc(o.x + o.w / 2, GROUND - o.h / 2, o.h / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = C.dark;
        ctx.lineWidth = 2;
        ctx.stroke();
        // yarn strands
        ctx.beginPath();
        ctx.moveTo(o.x + 3, GROUND - o.h / 2);
        ctx.quadraticCurveTo(o.x + o.w / 2, GROUND - o.h, o.x + o.w - 3, GROUND - o.h / 2);
        ctx.stroke();
    }

    function draw() {
        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, W, H);

        // ground
        ctx.fillStyle = C.dark;
        ctx.fillRect(0, GROUND, W, 2);
        ctx.fillStyle = C.mid;
        for (let i = 0; i < 10; i++) {
            ctx.fillRect(((i * 60) - (score * speed * 0.6) % 60), GROUND + 8, 18, 2);
        }

        obstacles.forEach(drawYarn);
        drawCat();

        // score
        ctx.fillStyle = C.dark;
        ctx.font = '12px "IBM Plex Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(String(Math.floor(score)).padStart(5, '0'), W - 10, 18);
        if (best) ctx.fillText('HI ' + String(Math.floor(best)).padStart(5, '0'), W - 10, 32);

        ctx.textAlign = 'center';
        if (state === 'idle') {
            ctx.fillText('CAT DASH — tap / space to start', W / 2, H / 2 - 8);
        } else if (state === 'over') {
            ctx.fillText('meowch! game over', W / 2, H / 2 - 14);
            ctx.fillText('tap / space to try again', W / 2, H / 2 + 4);
        }
    }

    function step(t) {
        const dt = Math.min((t - last) / 16.7, 2.5);
        last = t;

        // cat physics
        if (cat.jumping) {
            cat.vy += 0.62 * dt;
            cat.y += cat.vy * dt;
            if (cat.y >= GROUND) { cat.y = GROUND; cat.jumping = false; cat.vy = 0; }
        } else {
            cat.leg = (cat.leg + 0.35 * dt) % 5;
        }

        // obstacles
        spawnIn -= dt;
        if (spawnIn <= 0) {
            const h = 18 + Math.random() * 14;
            obstacles.push({ x: W + 20, w: h, h });
            spawnIn = 55 + Math.random() * 65 - Math.min(speed * 3, 30);
        }
        obstacles.forEach((o) => { o.x -= speed * dt; });
        obstacles = obstacles.filter((o) => o.x + o.w > -10);

        // collision (forgiving hitbox)
        const cx = cat.x + 4, cw = cat.w - 8, cy = cat.y - cat.h + 4, ch = cat.h - 6;
        for (const o of obstacles) {
            if (cx < o.x + o.w - 4 && cx + cw > o.x + 4 && cy + ch > GROUND - o.h + 4) {
                state = 'over';
                best = Math.max(best, score);
            }
        }

        score += 0.12 * dt * speed;
        speed = Math.min(speed + 0.0009 * dt, 9);

        draw();
        if (state === 'run') raf = requestAnimationFrame(step);
    }

    function action() {
        if (state === 'run') {
            if (!cat.jumping) { cat.jumping = true; cat.vy = -10.4; }
        } else {
            reset();
            state = 'run';
            last = performance.now();
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(step);
        }
    }

    canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); action(); });
    window.addEventListener('keydown', (e) => {
        if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
        // only hijack the key while the Game Boy is on screen
        const r = canvas.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
            e.preventDefault();
            action();
        }
    });

    reset();
    draw();
})();

/* =========================================================
   v3 — curtain, sky journey, KISHA·VISION TV, desk lamp,
   bookshelf speaker
   ========================================================= */

/* ---------- 8. Curtain preloader ---------- */
(function curtain() {
    const c = document.getElementById('curtain');
    if (!c) return;
    if (reduceMotion) { c.remove(); return; }
    const open = () => {
        document.body.classList.add('loaded');
        setTimeout(() => c.remove(), 1400);
    };
    if (document.readyState === 'complete') {
        setTimeout(open, 350);
    } else {
        window.addEventListener('load', () => setTimeout(open, 350));
        // safety: never trap the user behind the curtain
        setTimeout(open, 2600);
    }
})();

/* ---------- 9. THE SKY JOURNEY — day → dusk → deep space ---------- */
(function skyJourney() {
    const journey = document.getElementById('sky-journey');
    if (!journey) return;

    const grad = document.getElementById('sky-grad');
    const clouds = document.getElementById('l-clouds');
    const space = document.getElementById('l-space');
    const sun = document.getElementById('sky-sun');
    const asteroid = document.getElementById('sky-asteroid');

    const DAY   = ['#ff9a3d', '#ff6b2c', '#e8541f'];
    const DUSK  = ['#ff5e7a', '#a83a8e', '#3b1f66'];
    const SPACE = ['#1b1450', '#0e0e2e', '#050311'];

    const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const mix = (a, b, t) => {
        const A = hex(a), B = hex(b);
        return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
    };
    const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

    function paint(p) {
        const stops = p < 0.5
            ? DAY.map((c, i) => mix(c, DUSK[i], p * 2))
            : DUSK.map((c, i) => mix(c, SPACE[i], (p - 0.5) * 2));
        grad.style.background = `linear-gradient(180deg, ${stops[0]}, ${stops[1]}, ${stops[2]})`;

        const vh = window.innerHeight;
        // clouds burn away as the day ends
        clouds.style.opacity = clamp01(1 - p * 2.1);
        clouds.style.transform = `translateY(${(-p * 0.22 * vh).toFixed(1)}px)`;
        // the cosmos fades in, drifting slower (parallax depth)
        space.style.opacity = clamp01((p - 0.4) / 0.3);
        space.style.transform = `translateY(${((1 - p) * 0.12 * vh).toFixed(1)}px)`;
        // sun sets upward and shrinks
        if (sun) {
            sun.style.opacity = clamp01(1 - (p - 0.26) / 0.18); // fully gone by ~0.44
            sun.style.transform = `translateY(${(-p * 0.6 * vh).toFixed(1)}px) scale(${(1 - p * 0.35).toFixed(3)})`;
        }
        // asteroid rises in from below once we reach space
        if (asteroid) {
            asteroid.style.opacity = clamp01((p - 0.72) / 0.18); // only deep in space
            asteroid.style.transform = `translateY(${((1 - p) * 0.9 * vh).toFixed(1)}px) rotate(${(p * 14).toFixed(1)}deg)`;
        }
    }

    if (reduceMotion) {
        // static space scene, everything readable
        paint(1);
        return;
    }

    let ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const total = journey.offsetHeight - window.innerHeight;
            const p = clamp01(-journey.getBoundingClientRect().top / Math.max(total, 1));
            paint(p);
            ticking = false;
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
})();

/* ---------- 10. KISHA·VISION — SolarKapitBahay TV ---------- */
(function kishaVision() {
    const screen = document.getElementById('tv-screen');
    if (!screen) return;

    const img = document.getElementById('tv-img');
    const stat = document.getElementById('tv-static');
    const chan = document.getElementById('tv-channel');
    const cap = document.getElementById('tv-caption');
    const tag = document.getElementById('tv-tag');
    const dial = document.getElementById('tv-dial');

    const slides = [
        { src: 'images/s1.png',  tag: 'web app',       cap: 'Sign in — "Sharing the sun, together"' },
        { src: 'images/s2.png',  tag: 'web app',       cap: 'Operator dashboard — savings, grid reduction & fairness (Gini)' },
        { src: 'images/s3.png',  tag: 'web app',       cap: 'Battery clustering — K-means on 16 households, live MQTT overlay' },
        { src: 'images/s4.png',  tag: 'web app',       cap: 'Household dashboard — your share of community savings' },
        { src: 'images/s5.png',  tag: 'web app',       cap: 'Live energy routing — the greedy algorithm at work' },
        { src: 'images/s8.png',  tag: 'web app',       cap: 'Registered ESP32 devices & recent transfers over MQTT' },
        { src: 'images/s9.png',  tag: 'web app',       cap: 'Simulation planner — tune households, battery & tariffs, then run' },
        { src: 'images/s10.jpg', tag: 'documentation', cap: 'The build — two houses of wiring, breadboards & LCDs' },
        { src: 'images/s11.jpg', tag: 'documentation', cap: 'Solar rig — panels, buck converters & a lot of jumper wires' },
        { src: 'images/s12.jpg', tag: 'final output',  cap: 'The kapitbahay houses — sari-sari store details included' }
    ];

    let cur = 0;
    let busy = false;

    // build the dial
    slides.forEach((s, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.textContent = String(i + 1).padStart(2, '0') + (s.tag !== 'web app' ? ' ·' + (s.tag === 'documentation' ? ' docs' : ' final') : '');
        b.addEventListener('click', () => show(i));
        dial.appendChild(b);
    });

    function sync() {
        [...dial.children].forEach((b, i) => b.classList.toggle('on', i === cur));
        chan.textContent = 'CH ' + String(cur + 1).padStart(2, '0');
        tag.textContent = slides[cur].tag;
        cap.textContent = slides[cur].cap;
    }

    function show(i) {
        if (busy) return;
        cur = (i + slides.length) % slides.length;
        if (reduceMotion) {
            img.src = slides[cur].src;
            sync();
            return;
        }
        busy = true;
        stat.classList.add('zap'); // channel-change static
        setTimeout(() => {
            img.src = slides[cur].src;
            sync();
        }, 120);
        setTimeout(() => {
            stat.classList.remove('zap');
            busy = false;
        }, 340);
    }

    document.getElementById('tv-next').addEventListener('click', () => show(cur + 1));
    document.getElementById('tv-prev').addEventListener('click', () => show(cur - 1));
    screen.addEventListener('click', () => show(cur + 1));
    screen.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(cur + 1); }
        if (e.key === 'ArrowRight') show(cur + 1);
        if (e.key === 'ArrowLeft') show(cur - 1);
    });

    sync();
})();

/* ---------- 11. The desk lamp — let there be (dramatic) light ---------- */
(function lamp() {
    const btn = document.getElementById('lamp-btn');
    if (!btn) return;
    const wall = document.getElementById('wall');

    btn.addEventListener('click', () => {
        const lit = wall.classList.toggle('lit');
        btn.classList.toggle('on', lit);
        btn.setAttribute('aria-pressed', String(lit));
    });
})();

/* ---------- 12. Bookshelf speaker ---------- */
(function speaker() {
    const btn = document.getElementById('speaker-btn');
    if (!btn) return;
    const audio = document.getElementById('waiting-audio');

    btn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().then(() => {
                btn.classList.add('playing');
                btn.setAttribute('aria-pressed', 'true');
            }).catch(() => { /* file missing or autoplay blocked — stay quiet */ });
        } else {
            audio.pause();
            audio.currentTime = 0;
            btn.classList.remove('playing');
            btn.setAttribute('aria-pressed', 'false');
        }
    });
    audio.addEventListener('ended', () => {
        btn.classList.remove('playing');
        btn.setAttribute('aria-pressed', 'false');
    });
})();

/* =========================================================
   v8 — visibility failsafe, certificate magnifier,
   SVG desk-item dragging, the meow
   ========================================================= */

/* ---------- 13. Failsafe: nothing stays hidden ---------- */
setTimeout(() => {
    document.querySelectorAll('.reveal, .wipe, [data-split]').forEach((el) => el.classList.add('in'));
}, 2000);

/* ---------- 14. Certificate magnifier ---------- */
(function certMagnifier() {
    const box = document.getElementById('cert-lightbox');
    if (!box) return;
    const img = document.getElementById('cert-lightbox-img');
    const cap = document.getElementById('cert-lightbox-cap');
    const closeBtn = document.getElementById('cert-lightbox-close');
    let lastFocus = null;

    function open(src, alt, caption) {
        lastFocus = document.activeElement;
        img.src = src;
        img.alt = alt || 'Certificate, magnified';
        cap.textContent = caption || '';
        box.hidden = false;
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
    }
    function close() {
        box.hidden = true;
        img.src = '';
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus();
    }

    document.querySelectorAll('.pin-card').forEach((card) => {
        card.addEventListener('click', () => {
            if (card.dataset.moved) { delete card.dataset.moved; return; } // that was a drag
            const im = card.querySelector('img');
            const b = card.querySelector('figcaption b');
            const s = card.querySelector('figcaption span');
            if (im) open(im.src, im.alt, [b && b.textContent, s && s.textContent].filter(Boolean).join(' — '));
        });
    });

    closeBtn.addEventListener('click', close);
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) close(); });
})();

/* ---------- 15. Desk items: drag the books, mug, pencil, trophy, notes ---------- */
(function svgDrag() {
    const svg = document.querySelector('.desk-scene svg');
    if (!svg) return;

    svg.querySelectorAll('.svg-drag').forEach((g) => {
        g.dataset.base = g.getAttribute('transform') || '';
        let sx = 0, sy = 0, held = false;

        const toSvg = (e) => {
            const pt = svg.createSVGPoint();
            pt.x = e.clientX; pt.y = e.clientY;
            const m = svg.getScreenCTM();
            return m ? pt.matrixTransform(m.inverse()) : pt;
        };

        g.addEventListener('pointerdown', (e) => {
            held = true;
            g.classList.add('held');
            g.setPointerCapture(e.pointerId);
            const p = toSvg(e);
            sx = p.x - (parseFloat(g.dataset.ox) || 0);
            sy = p.y - (parseFloat(g.dataset.oy) || 0);
            e.preventDefault();
        });
        g.addEventListener('pointermove', (e) => {
            if (!held) return;
            const p = toSvg(e);
            g.dataset.ox = (p.x - sx).toFixed(1);
            g.dataset.oy = (p.y - sy).toFixed(1);
            g.setAttribute('transform', `translate(${g.dataset.ox} ${g.dataset.oy}) ${g.dataset.base}`);
        });
        const drop = () => { held = false; g.classList.remove('held'); };
        g.addEventListener('pointerup', drop);
        g.addEventListener('pointercancel', drop);
    });
})();

/* ---------- 16. The cat meows. Of course it does. ---------- */
(function catMeow() {
    const cat = document.getElementById('cat-btn');
    if (!cat) return;
    let actx = null;

    function meow() {
        try {
            actx = actx || new (window.AudioContext || window.webkitAudioContext)();
            const t = actx.currentTime;
            const o = actx.createOscillator();
            const g = actx.createGain();
            o.type = 'triangle';
            // a tiny "mrrow": rise, hold, droop
            o.frequency.setValueAtTime(520, t);
            o.frequency.linearRampToValueAtTime(860, t + 0.09);
            o.frequency.linearRampToValueAtTime(700, t + 0.22);
            o.frequency.linearRampToValueAtTime(340, t + 0.42);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.28, t + 0.05);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
            o.connect(g).connect(actx.destination);
            o.start(t);
            o.stop(t + 0.5);
        } catch (err) { /* audio blocked — the cat stays silent, as cats do */ }
        cat.classList.remove('meow');
        void cat.getBBox && cat.getBoundingClientRect(); // restart animation
        cat.classList.add('meow');
        setTimeout(() => cat.classList.remove('meow'), 550);
    }

    cat.addEventListener('click', meow);
    cat.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); meow(); }
    });
})();

/* =========================================================
   v9 — tilt-and-glare imagery + scroll-velocity skew
   ========================================================= */

/* ---------- 17. Screenshots tilt toward your cursor ---------- */
(function tiltGlare() {
    if (!finePointer || reduceMotion) return;

    document.querySelectorAll('.panel-shot, .award-cert, .solar-snap').forEach((fig) => {
        const img = fig.querySelector('img');
        if (!img) return;

        const glare = document.createElement('span');
        glare.className = 'shot-glare';
        glare.setAttribute('aria-hidden', 'true');
        fig.appendChild(glare);

        fig.addEventListener('pointermove', (e) => {
            if (fig.dataset.moved || fig.classList.contains('lifted')) return; // not while dragging
            const r = fig.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            fig.classList.add('tilting');
            img.style.transform =
                `perspective(950px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 11).toFixed(2)}deg) scale(1.035)`;
            glare.style.background =
                `radial-gradient(circle at ${(px + 0.5) * 100}% ${(py + 0.5) * 100}%, rgba(255,255,255,0.9), transparent 55%)`;
        });

        fig.addEventListener('pointerleave', () => {
            fig.classList.remove('tilting');
            img.style.transform = '';
        });
    });
})();

/* ---------- 18. Scroll-velocity skew — the page leans into speed ---------- */
(function velocitySkew() {
    if (reduceMotion) return;
    const targets = document.querySelectorAll('.panel-body');
    if (!targets.length) return;

    let lastY = window.scrollY;
    let skew = 0;

    (function loop() {
        const y = window.scrollY;
        const v = y - lastY;
        lastY = y;
        const target = Math.max(-3.2, Math.min(3.2, v * 0.05));
        skew += (target - skew) * 0.12;

        if (Math.abs(skew) > 0.03) {
            targets.forEach((el) => { el.style.transform = `skewY(${skew.toFixed(2)}deg)`; });
        } else {
            targets.forEach((el) => { el.style.transform = ''; });
        }
        requestAnimationFrame(loop);
    })();
})();

/* =========================================================
   v10 — sky-object timing, mega-fill title, deck stacking
   ========================================================= */

/* ---------- 19. Mega title inks itself in as you scroll ---------- */
(function megaFill() {
    const el = document.getElementById('work-mega');
    if (!el) return;

    function update() {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // fill from when it enters (bottom) to when it sits 30% up the screen
        const p = Math.min(Math.max((vh - r.top) / (vh * 0.85), 0), 1);
        el.style.backgroundSize = `${(p * 100).toFixed(1)}% 100%`;
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
})();

/* ---------- 20. The deck: covered cards sink back ---------- */
(function deck() {
    const cards = [...document.querySelectorAll('.deck-card')];
    if (!cards.length) return;

    function update() {
        const vh = window.innerHeight;
        cards.forEach((card, i) => {
            const next = cards[i + 1];
            if (!next) { card.style.transform = ''; card.style.filter = ''; return; }
            const cover = Math.min(Math.max(1 - next.getBoundingClientRect().top / vh, 0), 1);
            if (cover > 0.001 && !reduceMotion) {
                card.style.transform = `scale(${(1 - cover * 0.06).toFixed(4)})`;
                card.style.filter = `brightness(${(1 - cover * 0.32).toFixed(3)})`;
            } else {
                card.style.transform = '';
                card.style.filter = '';
            }
        });
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
})();

/* ---------- 21. Reset the wall — cards & desk back to tidy ---------- */
(function wallReset() {
    const btn = document.getElementById('wall-reset');
    if (!btn) return;
    btn.addEventListener('click', () => {
        document.querySelectorAll('#wall .pin-card').forEach((card) => {
            card.style.transform = '';
            card.style.zIndex = '';
            delete card.dataset.moved;
            delete card.dataset.dragged;
        });
        document.querySelectorAll('.desk-scene .svg-drag').forEach((g) => {
            g.setAttribute('transform', g.dataset.base || '');
            delete g.dataset.ox;
            delete g.dataset.oy;
        });
    });
})();