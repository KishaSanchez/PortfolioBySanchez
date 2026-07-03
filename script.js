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
        const nx = baseX + (e.clientX - startX);
        const ny = baseY + (e.clientY - startY);
        el.style.transform = `translate(${nx}px, ${ny}px)`;
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
        '> who_am_i',
        'kisha ann joy m. sanchez',
        '> role',
        'bscs student · app developer',
        '> location',
        'davao del norte, ph',
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

/* ---------- 5b. Scroll reveals ---------- */
const reveals = document.querySelectorAll('.reveal');

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