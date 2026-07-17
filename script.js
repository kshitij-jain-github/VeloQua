

/* ═══════════════════════════════════════════════
   OFFICE WHATSAPP NUMBER — used everywhere for orders
   ═══════════════════════════════════════════════ */
const OFFICE_WA = '919211278080';

/* ─── PRELOADER ─── */
window.addEventListener('load', () => {
    setTimeout(() => {
        const pre = document.getElementById('preloader');
        pre.style.opacity = '0';
        pre.style.visibility = 'hidden';
        pre.style.pointerEvents = 'none';
    }, 2500);
});

/* ─── MOBILE MENU ─── */
let menuOpen = false;
function toggleMenu() {
    menuOpen = !menuOpen;
    document.getElementById('mobileMenu').classList.toggle('hidden', !menuOpen);
}
function closeMenu() {
    menuOpen = false;
    document.getElementById('mobileMenu').classList.add('hidden');
}

/* ─── NAV SCROLL ─── */
const navInner = document.getElementById('navInner');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) navInner.classList.add('nav-scrolled');
    else navInner.classList.remove('nav-scrolled');
}, { passive: true });

/* ─── REVEAL ON SCROLL ─── */
const revEls = document.querySelectorAll('.reveal:not(.in)');
const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
    });
}, { threshold: 0.08 });
revEls.forEach(el => obs.observe(el));

/* ─── WHATSAPP TOOLTIP ─── */
const waTooltip = document.getElementById('waTooltip');
let waTimeout = setTimeout(() => { if (waTooltip) waTooltip.style.display = 'none'; }, 6000);

/* ─── HERO CANVAS ─── */
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
let W, H;
function resizeCanvas() {
    W = canvas.width = canvas.parentElement.offsetWidth;
    H = canvas.height = canvas.parentElement.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas, { passive: true });

const parts = Array.from({ length: 55 }, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 2.2 + 0.4,
    vy: Math.random() * 0.00018 + 0.00004,
    vx: (Math.random() - .5) * 0.0002,
    o: Math.random() * .32 + .06
}));
const waves = [
    { amp: 22, freq: 0.0022, spd: 0.00042, yp: 0.8, c: 'rgba(77,168,255,0.09)' },
    { amp: 14, freq: 0.0034, spd: 0.0008, yp: 0.87, c: 'rgba(139,233,255,0.07)' },
    { amp: 30, freq: 0.0015, spd: 0.00028, yp: 0.74, c: 'rgba(13,35,70,0.6)' },
];
function drawWave(t, w) {
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 5) ctx.lineTo(x, H * w.yp + Math.sin(x * w.freq + t * w.spd) * w.amp);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = w.c; ctx.fill();
}
function raf(t) {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * .75, H * .35, 0, W * .75, H * .35, W * .55);
    g.addColorStop(0, 'rgba(139,233,255,0.08)'); g.addColorStop(1, 'rgba(139,233,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    parts.forEach(p => {
        p.y -= p.vy; p.x += p.vx;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02) p.x = -0.02;
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,233,255,${p.o})`; ctx.fill();
    });
    waves.forEach(w => drawWave(t, w));
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

/* ═══════════════════════════════════════════════
   PRODUCT & PRICING CONFIG — EXACT AS SPECIFIED
   ═══════════════════════════════════════════════
   Bottle logic: direct price per bottle, no MRP.
   Discount unlocks when order reaches the carton-size
   threshold (in multiples of 12), applied to the WHOLE
   bottle order at that tier.
*/
const PRODUCTS = {
    q1: { key: 'q1', size: '200ml', name: 'Event & Travel Bottle', price: 6, threshold: 48, discPct: 13.19, unit: 'bottle' },
    q2: { key: 'q2', size: '500ml', name: 'Daily Companion Bottle', price: 10, threshold: 24, discPct: 20.8, unit: 'bottle' },
    q3: { key: 'q3', size: '1000ml', name: 'Family & Office Bottle', price: 20, threshold: 12, discPct: 37.5, unit: 'bottle' },
    q4: { key: 'q4', size: '1000ml Premium', name: 'Premium Family & Office Bottle', price: 50, threshold: 12, discPct: 30, unit: 'bottle' },
};

// Cartons: MRP per carton, discounted price per carton, pieces per carton
const CARTONS = {
    cq1: { key: 'cq1', size: '200ml', name: 'Event & Travel Bottle', mrp: 288, price: 250, pcs: 48, savePct: 13.19 },
    cq2: { key: 'cq2', size: '500ml', name: 'Daily Companion Bottle', mrp: 240, price: 190, pcs: 24, savePct: 20.8 },
    cq3: { key: 'cq3', size: '1000ml', name: 'Family & Office Bottle', mrp: 240, price: 150, pcs: 12, savePct: 37.5 },
    cq4: { key: 'cq4', size: '1000ml Premium', name: 'Premium Family & Office Bottle', mrp: 600, price: 420, pcs: 12, savePct: 30 },
};

/* ═══════════════════════════════════════════════
   CART STATE
   ═══════════════════════════════════════════════ */
let CART = []; // { type:'bottle'|'carton', key, size, name, qty, unitPrice, mrpUnit, lineTotal, lineMrp, saving }

function fmt(n) {
    return Math.round(n).toLocaleString('en-IN');
}

/* ─── BOTTLE QTY FUNCTIONS ─── */
function changeQty(id, delta) {
    const inp = document.getElementById(id);
    let val = Math.max(12, Math.round(((parseInt(inp.value) || 12) + delta) / 12) * 12);
    inp.value = val;
    updateProduct(id, val);
}
function onQtyInput(id) {
    const inp = document.getElementById(id);
    let raw = parseInt(inp.value) || 12;
    raw = Math.max(12, Math.round(raw / 12) * 12);
    updateProduct(id, raw);
}

function calcBottleLine(prod, qty) {
    qty = Math.max(12, Math.round(qty / 12) * 12);
    const mrpTotal = qty * prod.price;
    let discPct = 0;
    if (qty >= prod.threshold) discPct = prod.discPct;
    const total = mrpTotal * (1 - discPct / 100);
    const saving = mrpTotal - total;
    return { qty, mrpTotal, total, discPct, saving, pricePerUnit: total / qty };
}

function updateProduct(id, val) {
    const prod = PRODUCTS[id];
    const num = id.replace('q', '');
    const pill = document.getElementById('disc' + num);
    const dtxt = document.getElementById('d' + num);
    const sub = document.getElementById('sub' + num);

    const calc = calcBottleLine(prod, val);

    if (calc.discPct > 0 && pill) {
        pill.classList.add('show');
        if (dtxt) dtxt.textContent = calc.discPct + '% discount unlocked — ' + calc.qty + ' bottles at Rs.' + calc.pricePerUnit.toFixed(2) + '/bottle';
    } else if (pill) {
        pill.classList.remove('show');
        const remaining = prod.threshold - calc.qty;
        if (dtxt) dtxt.textContent = remaining > 0 ? ('Add ' + remaining + ' more to unlock ' + prod.discPct + '% off') : '';
    }

    if (sub) {
        sub.textContent = 'Subtotal: Rs.' + fmt(calc.total) + (calc.saving > 0 ? '  (Save Rs.' + fmt(calc.saving) + ')' : '');
    }
}

/* ─── CARTON QTY FUNCTIONS ─── */
function changeCartonQty(id, delta) {
    const inp = document.getElementById(id);
    let val = Math.max(1, (parseInt(inp.value) || 1) + delta);
    inp.value = val;
    updateCarton(id, val);
}
function onCartonInput(id) {
    const inp = document.getElementById(id);
    const raw = Math.max(1, parseInt(inp.value) || 1);
    updateCarton(id, raw);
}
function calcCartonLine(c, cartons) {
    cartons = Math.max(1, cartons);
    const totalBottles = cartons * c.pcs;
    const mrpTotal = cartons * c.mrp;
    const total = cartons * c.price;
    const saving = mrpTotal - total;
    return { cartons, totalBottles, mrpTotal, total, saving };
}
function updateCarton(id, val) {
    const c = CARTONS[id];
    const calc = calcCartonLine(c, val);
    const totalEl = document.getElementById(id + '-total');
    const subEl = document.getElementById('csub' + id.replace('cq', ''));

    if (totalEl) totalEl.textContent = '= ' + calc.totalBottles + ' bottles';
    if (subEl) subEl.textContent = 'Subtotal: Rs.' + fmt(calc.total) + '  (Save Rs.' + fmt(calc.saving) + ')';
}

/* ═══════════════════════════════════════════════
   CART OPERATIONS
   ═══════════════════════════════════════════════ */
function addToCart(id) {
    const prod = PRODUCTS[id];
    const inp = document.getElementById(id);
    const qty = Math.max(12, Math.round((parseInt(inp.value) || 12) / 12) * 12);
    const calc = calcBottleLine(prod, qty);

    const existing = CART.find(i => i.type === 'bottle' && i.key === id);
    if (existing) {
        existing.qty = qty;
        existing.mrpTotal = calc.mrpTotal;
        existing.total = calc.total;
        existing.saving = calc.saving;
        existing.discPct = calc.discPct;
    } else {
        CART.push({
            type: 'bottle', key: id, size: prod.size, name: prod.name, unit: 'bottle',
            qty: qty, unitPrice: prod.price, mrpTotal: calc.mrpTotal, total: calc.total,
            saving: calc.saving, discPct: calc.discPct
        });
    }
    renderCart();
    flashButton(id);
}

function addCartonToCart(id) {
    const c = CARTONS[id];
    const inp = document.getElementById(id);
    const cartons = Math.max(1, parseInt(inp.value) || 1);
    const calc = calcCartonLine(c, cartons);

    const existing = CART.find(i => i.type === 'carton' && i.key === id);
    if (existing) {
        existing.qty = cartons;
        existing.totalBottles = calc.totalBottles;
        existing.mrpTotal = calc.mrpTotal;
        existing.total = calc.total;
        existing.saving = calc.saving;
    } else {
        CART.push({
            type: 'carton', key: id, size: c.size, name: c.name, unit: 'carton',
            qty: cartons, totalBottles: calc.totalBottles, mrpUnit: c.mrp, priceUnit: c.price,
            mrpTotal: calc.mrpTotal, total: calc.total, saving: calc.saving, savePct: c.savePct
        });
    }
    renderCart();
    flashButton(id, true);
}

function flashButton(id, isCarton) {
    const cartBar = document.getElementById('cartBar');
    cartBar.classList.remove('hidden-bar');
}

function removeFromCart(type, key) {
    CART = CART.filter(i => !(i.type === type && i.key === key));
    renderCart();
}

function clearCart() {
    CART = [];
    renderCart();
}

function renderCart() {
    const cartBar = document.getElementById('cartBar');
    const cartCount = document.getElementById('cartCount');
    const cartSummaryText = document.getElementById('cartSummaryText');
    const cartTotalText = document.getElementById('cartTotalText');
    const cartItemsWrap = document.getElementById('cartItemsWrap');

    if (CART.length === 0) {
        cartBar.classList.add('hidden-bar');
        cartItemsWrap.innerHTML = '';
        return;
    }

    cartBar.classList.remove('hidden-bar');
    cartCount.textContent = CART.length;

    let grandTotal = 0;
    let totalPieces = 0;
    CART.forEach(i => {
        grandTotal += i.total;
        totalPieces += (i.type === 'bottle') ? i.qty : i.totalBottles;
    });

    cartSummaryText.textContent = CART.length + ' item' + (CART.length > 1 ? 's' : '') + ' · ' + totalPieces + ' bottles';
    cartTotalText.textContent = 'Rs.' + fmt(grandTotal);

    cartItemsWrap.innerHTML = CART.map(i => {
        const qtyLabel = i.type === 'bottle' ? (i.qty + ' bottles') : (i.qty + ' carton' + (i.qty > 1 ? 's' : '') + ' (' + i.totalBottles + ' bottles)');
        return `
            <div class="cart-line-item flex items-center justify-between gap-3 py-2 border-b border-ink/6 last:border-0">
                <div class="flex-1 min-w-0">
                    <div class="text-[13px] font-semibold text-ocean truncate">${i.size} — ${i.name}</div>
                    <div class="text-[11.5px] text-ink/50">${qtyLabel}${i.discPct > 0 || i.savePct ? ' · Save Rs.' + fmt(i.saving) : ''}</div>
                </div>
                <div class="text-sm font-bold text-ocean flex-shrink-0">Rs.${fmt(i.total)}</div>
                <button onclick="removeFromCart('${i.type}','${i.key}')" class="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-ink/5 hover:bg-red-50 hover:text-red-500 text-ink/40 border-none cursor-pointer transition-all" aria-label="Remove">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
            </div>`;
    }).join('');
}

let cartExpanded = false;
function toggleCartExpand() {
    cartExpanded = !cartExpanded;
    const wrap = document.getElementById('cartItemsWrap');
    const chevron = document.getElementById('cartChevron');
    wrap.classList.toggle('hidden', !cartExpanded);
    chevron.style.transform = cartExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
}

function checkoutCart() {
    if (CART.length === 0) return;

    let grandTotal = 0;
    let grandMrp = 0;
    let totalSaving = 0;
    let totalPieces = 0;

    const lines = [
        'VELOQUA Drinking Water — Order Request',
        '=========================================',
        ''
    ];

    CART.forEach((i, idx) => {
        grandTotal += i.total;
        grandMrp += i.mrpTotal;
        totalSaving += i.saving;

        if (i.type === 'bottle') {
            totalPieces += i.qty;
            lines.push((idx + 1) + '. ' + i.size + ' — ' + i.name);
            lines.push('   Order Type: Loose Bottles');
            lines.push('   Quantity: ' + i.qty + ' bottles');
            lines.push('   Price per Bottle: Rs.' + PRODUCTS[i.key].price);
            if (i.discPct > 0) {
                lines.push('   Discount Applied: ' + i.discPct + '%');
                lines.push('   Effective Price/Bottle: Rs.' + (i.total / i.qty).toFixed(2));
            }
            lines.push('   Line Total: Rs.' + fmt(i.total));
            if (i.saving > 0) lines.push('   Line Saving: Rs.' + fmt(i.saving));
        } else {
            totalPieces += i.totalBottles;
            lines.push((idx + 1) + '. ' + i.size + ' — ' + i.name);
            lines.push('   Order Type: Carton (' + (i.totalBottles / i.qty) + ' bottles/carton)');
            lines.push('   Number of Cartons: ' + i.qty);
            lines.push('   Total Bottles: ' + i.totalBottles);
            lines.push('   MRP per Carton: Rs.' + i.mrpUnit);
            lines.push('   Price per Carton: Rs.' + i.priceUnit + ' (Save ' + i.savePct + '%)');
            lines.push('   Line Total: Rs.' + fmt(i.total));
            lines.push('   Line Saving: Rs.' + fmt(i.saving));
        }
        lines.push('');
    });

    lines.push('=========================================');
    lines.push('ORDER SUMMARY');
    lines.push('Total Items: ' + CART.length);
    lines.push('Total Bottles: ' + totalPieces);
    lines.push('Total MRP Value: Rs.' + fmt(grandMrp));
    lines.push('Total Payable: Rs.' + fmt(grandTotal));
    lines.push('Total You Save: Rs.' + fmt(totalSaving));
    lines.push('=========================================');
    lines.push('');
    lines.push('Please confirm product availability, delivery address, and expected delivery timeline.');
    lines.push('');
    lines.push('Thank you — VELOQUA, Pure Water. Pure Trust.');

    const msg = encodeURIComponent(lines.join('\n'));
    window.open('https://wa.me/' + OFFICE_WA + '?text=' + msg, '_blank');
}

/* ─── CONTACT FORM → WHATSAPP (OFFICE NUMBER) ─── */
function submitContactForm() {
    const name = (document.getElementById('cf-name').value || '').trim();
    const phone = (document.getElementById('cf-phone').value || '').trim();
    const type = (document.getElementById('cf-type').value || '').trim();
    const city = (document.getElementById('cf-city').value || '').trim();
    const qty = (document.getElementById('cf-qty').value || '').trim();
    const msg = (document.getElementById('cf-msg').value || '').trim();

    if (!name || !phone) {
        alert('Please fill in your name and phone number before submitting.');
        return;
    }

    const lines = [
        'VELOQUA - New Inquiry from Website',
        '---',
        'Name: ' + name,
        'Phone: ' + phone,
        'Inquiry Type: ' + type,
        city ? 'City: ' + city : '',
        qty ? 'Required Quantity: ' + qty : '',
        msg ? '' : '',
        msg ? 'Message:' : '',
        msg ? msg : '',
        '---',
        'Sent via veloqua.in contact form'
    ].filter(l => l !== null && l !== undefined);

    const waMsg = encodeURIComponent(lines.join('\n'));
    const waUrl = 'https://wa.me/' + OFFICE_WA + '?text=' + waMsg;

    window.open(waUrl, '_blank');

    // Visual feedback
    const btn = document.getElementById('cf-submit');
    btn.textContent = 'Opening WhatsApp...';
    btn.style.background = 'linear-gradient(135deg,#25D366,#128C7E)';
    setTimeout(() => {
        btn.textContent = 'Send Message via WhatsApp';
        btn.style.background = '';
    }, 3000);
}

/* ─── INIT ALL QTY CONTROLS ─── */
['q1', 'q2', 'q3', 'q4'].forEach(id => updateProduct(id, 12));
['cq1', 'cq2', 'cq3', 'cq4'].forEach(id => updateCarton(id, 1));
renderCart();
