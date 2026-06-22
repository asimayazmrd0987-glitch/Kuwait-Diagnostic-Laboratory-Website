const WHATSAPP_NUMBER = "923451590694";
const RATE_LIMIT_MS   = 30000;

function sanitize(str) {
    return String(str)
        .replace(/[<>"'`\\;]/g, '')
        .trim()
        .slice(0, 500);
}

let lastSubmitTime = 0;

document.addEventListener('DOMContentLoaded', () => {

    // Set minimum date to today
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        dateInput.min = `${y}-${m}-${d}`;
    }

    // Hero entrance animations
    const heroElements = document.querySelectorAll('.hero-copy > *, .hero-metrics, .hero-panel');
    heroElements.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 300 + i * 150);
    });

    // Scroll reveal observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 120);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll(
        '.section-head, .test-category, .gallery-item, .contact-card, .book-copy, .manager-card'
    ).forEach(el => observer.observe(el));

    // Real-time validation
    document.querySelectorAll('#appointmentForm input, #appointmentForm select').forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
            if (field.classList.contains('error') || field.classList.contains('valid')) {
                validateField(field);
            }
        });
    });

    // Form submit
    const form = document.getElementById('appointmentForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

function goToStep2() {
    const name  = document.getElementById('name');
    const phone = document.getElementById('phone');

    validateField(name);
    validateField(phone);

    if (!name.value.trim() || name.classList.contains('error')) {
        name.focus();
        shakeField(name);
        return;
    }
    if (!phone.value.trim() || phone.classList.contains('error')) {
        phone.focus();
        shakeField(phone);
        return;
    }

    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
    document.getElementById('step1-indicator').classList.remove('active');
    document.getElementById('step1-indicator').classList.add('done');
    document.getElementById('step2-indicator').classList.add('active');

    document.getElementById('book').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function goToStep1() {
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step1').classList.remove('hidden');
    document.getElementById('step2-indicator').classList.remove('active');
    document.getElementById('step1-indicator').classList.remove('done');
    document.getElementById('step1-indicator').classList.add('active');
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = false;

    switch (field.id) {
        case 'name':    isValid = value.length >= 2; break;
        case 'phone':   isValid = /^[\d\s\-+()]{7,15}$/.test(value); break;
        case 'service': isValid = value !== ''; break;
        case 'date':
        case 'time':
        case 'age':
        case 'gender':
        case 'notes':   isValid = true; break;
        default:        isValid = value !== '';
    }

    field.classList.remove('error', 'valid');
    if (value && !isValid) field.classList.add('error');
    else if (value && isValid && field.id !== 'notes') field.classList.add('valid');
}

function shakeField(field) {
    field.style.animation = 'shake 0.4s ease';
    setTimeout(() => field.style.animation = '', 400);
}

// ─── Build WhatsApp URL (pure function, no side effects) ───────────────────
function buildWhatsAppURL(data) {
    const lines = [
        '🔬 *New Appointment Request — KDL*',
        '──────────────────────────',
        `👤 *Name:* ${data.name}`,
        `📞 *Phone:* ${data.phone}`,
        data.age    ? `🎂 *Age:* ${data.age}`       : '',
        data.gender ? `⚧ *Gender:* ${data.gender}`  : '',
        '',
        `🧪 *Test:* ${data.test}`,
        data.date   ? `📅 *Date:* ${data.date}`     : '',
        data.time   ? `⏰ *Time:* ${data.time}`      : '',
        data.notes  ? `📝 *Notes:* ${data.notes}`   : '',
        '',
        '──────────────────────────',
        '_Sent from KDL website_'
    ].filter(Boolean).join('\n');

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`;
}

// ─── Show success state ────────────────────────────────────────────────────
function showSuccess(data, waURL) {
    // Hide the form fields, keep the success message div visible
    const form = document.getElementById('appointmentForm');

    // Hide only step divs, not the whole form (keeps successMessage visible)
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const stepsIndicator = document.querySelector('.form-steps');
    if (step1) step1.style.display = 'none';
    if (step2) step2.style.display = 'none';
    if (stepsIndicator) stepsIndicator.style.display = 'none';

    const successEl = document.getElementById('successMessage');
    if (!successEl) return;

    // Build the WhatsApp button as a real DOM element — avoids CSP innerHTML issues
    successEl.innerHTML = '';

    const heading = document.createElement('h4');
    heading.innerHTML = '<i class="fas fa-check-circle"></i> Booking Ready!';

    const p1 = document.createElement('p');
    p1.innerHTML = `&gt; Thank you, <strong>${data.name}</strong>. Your request has been prepared.`;

    const p2 = document.createElement('p');
    p2.innerHTML = `&gt; <strong>Test:</strong> ${data.test}`;

    successEl.appendChild(heading);
    successEl.appendChild(p1);
    successEl.appendChild(p2);

    if (data.date) {
        const p3 = document.createElement('p');
        p3.innerHTML = `&gt; <strong>Date:</strong> ${data.date}${data.time ? ' at ' + data.time : ''}`;
        successEl.appendChild(p3);
    }

    // Divider section
    const divider = document.createElement('div');
    divider.style.cssText = 'margin-top:1.5rem; padding-top:1rem; border-top:1px solid rgba(74,222,128,0.3);';

    const hint = document.createElement('p');
    hint.style.cssText = 'font-size:0.9rem; margin-bottom:1rem; color:var(--text-secondary);';
    hint.innerHTML = '<i class="fab fa-whatsapp"></i> Click below to send your booking to our lab on WhatsApp:';

    // The actual WhatsApp link — real <a> tag, not injected HTML
    const waBtn = document.createElement('a');
    waBtn.href   = waURL;
    waBtn.target = '_blank';
    waBtn.rel    = 'noopener noreferrer';
    waBtn.style.cssText = [
        'display:inline-flex', 'align-items:center', 'gap:0.6rem',
        'padding:1rem 2rem',
        'background:linear-gradient(135deg,#25D366,#128C7E)',
        'color:#fff', 'border-radius:6px', 'font-weight:700',
        'text-decoration:none', 'text-transform:uppercase',
        'letter-spacing:0.1em', 'font-size:0.9rem',
        'box-shadow:0 0 25px rgba(37,211,102,0.4)'
    ].join(';');
    waBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Confirm via WhatsApp';

    const finePrint = document.createElement('p');
    finePrint.style.cssText = 'font-size:0.75rem; color:var(--text-muted); margin-top:0.75rem;';
    finePrint.textContent = 'This will open WhatsApp with your details pre-filled.';

    // "Book another" link
    const resetLink = document.createElement('p');
    resetLink.style.cssText = 'margin-top:1.25rem; font-size:0.85rem;';
    resetLink.innerHTML = '<a href="#book" id="bookAnother" style="color:var(--accent-cyan); cursor:pointer; text-decoration:underline;">Book another appointment</a>';

    divider.appendChild(hint);
    divider.appendChild(waBtn);
    divider.appendChild(finePrint);
    divider.appendChild(resetLink);
    successEl.appendChild(divider);

    successEl.classList.add('show');

    // Wire up "book another"
    document.getElementById('bookAnother')?.addEventListener('click', () => {
        resetForm();
    });

    // Scroll success into view
    successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ─── Reset entire form back to step 1 ─────────────────────────────────────
function resetForm() {
    const form = document.getElementById('appointmentForm');
    form.reset();

    document.querySelectorAll('#appointmentForm input, #appointmentForm select')
        .forEach(f => f.classList.remove('valid', 'error'));

    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const stepsIndicator = document.querySelector('.form-steps');
    if (step1) step1.style.display = '';
    if (step2) { step2.style.display = ''; step2.classList.add('hidden'); }
    if (stepsIndicator) stepsIndicator.style.display = '';

    document.getElementById('step1-indicator').classList.add('active');
    document.getElementById('step1-indicator').classList.remove('done');
    document.getElementById('step2-indicator').classList.remove('active');

    const successEl = document.getElementById('successMessage');
    if (successEl) {
        successEl.classList.remove('show');
        successEl.innerHTML = '';
    }

    const btn = document.getElementById('submitBtn');
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fab fa-whatsapp"></i> Send Booking via WhatsApp';
    }
}

// ─── Main submit handler ───────────────────────────────────────────────────
async function handleSubmit(e) {
    e.preventDefault();

    // Honeypot check
    const trap = document.getElementById('hp_website');
    if (trap && trap.value.length > 0) {
        console.warn('Bot submission blocked.');
        return;
    }

    // Rate limit check
    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_MS) {
        const secs = Math.ceil((RATE_LIMIT_MS - (now - lastSubmitTime)) / 1000);
        showFormError(`Please wait ${secs} more second(s) before submitting again.`);
        return;
    }

    // Validate required fields
    const nameEl    = document.getElementById('name');
    const phoneEl   = document.getElementById('phone');
    const serviceEl = document.getElementById('service');

    validateField(nameEl);
    validateField(phoneEl);
    validateField(serviceEl);

    if (!nameEl.value.trim() || nameEl.classList.contains('error')) {
        goToStep1();
        nameEl.focus();
        shakeField(nameEl);
        return;
    }
    if (!phoneEl.value.trim() || phoneEl.classList.contains('error')) {
        goToStep1();
        phoneEl.focus();
        shakeField(phoneEl);
        return;
    }
    if (!serviceEl.value.trim()) {
        showFormError('Please select a test.');
        shakeField(serviceEl);
        return;
    }

    // Collect + sanitize
    const data = {
        name   : sanitize(nameEl.value),
        phone  : sanitize(phoneEl.value),
        age    : sanitize(document.getElementById('age')?.value    || ''),
        gender : sanitize(document.getElementById('gender')?.value || ''),
        test   : sanitize(serviceEl.value),
        date   : sanitize(document.getElementById('date')?.value   || ''),
        time   : sanitize(document.getElementById('time')?.value   || ''),
        notes  : sanitize(document.getElementById('notes')?.value  || ''),
    };

    // Loading state
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Opening WhatsApp...';

    // Brief delay so spinner is visible (UX feedback)
    await new Promise(r => setTimeout(r, 600));

    const waURL = buildWhatsAppURL(data);

    // Record submit time BEFORE opening — prevents double-tap
    lastSubmitTime = Date.now();

    // ── Open WhatsApp directly ──────────────────────────────────────────────
    // window.open inside a submit handler IS a trusted user gesture,
    // so browsers will NOT block this as a popup.
    const waWindow = window.open(waURL, '_blank', 'noopener,noreferrer');

    // Fallback: if popup was blocked anyway (some mobile browsers),
    // the button in showSuccess() gives the user a manual path.
    if (!waWindow) {
        console.warn('Popup blocked — user will use the WhatsApp button instead.');
    }

    // Show success UI with the same URL as a backup button
    showSuccess(data, waURL);
}

// ─── Inline form error ─────────────────────────────────────────────────────
function showFormError(msg) {
    let el = document.getElementById('form-error-inline');
    if (!el) {
        el = document.createElement('p');
        el.id = 'form-error-inline';
        el.style.cssText = 'color:#ef4444; font-size:0.85rem; margin-top:0.5rem; text-align:center;';
        document.getElementById('submitBtn')?.parentElement?.appendChild(el);
    }
    el.textContent = msg;
    setTimeout(() => { if (el) el.textContent = ''; }, 4000);
}

// ─── Header scroll effect ──────────────────────────────────────────────────
window.addEventListener('scroll', () => {
    const header = document.querySelector('.site-header');
    header?.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ─── Smooth scroll anchors ─────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ─── Glitch effect on brand kicker ────────────────────────────────────────
const brandKicker = document.querySelector('.brand-kicker');
if (brandKicker) {
    brandKicker.addEventListener('mouseenter', () => brandKicker.style.animation = 'glitch 0.3s ease');
    brandKicker.addEventListener('mouseleave', () => brandKicker.style.animation = '');
}

// ─── Dynamic styles ────────────────────────────────────────────────────────
const dynamicStyles = document.createElement('style');
dynamicStyles.textContent = `
    @keyframes shake {
        0%,100% { transform: translateX(0); }
        20%      { transform: translateX(-8px); }
        40%      { transform: translateX(8px); }
        60%      { transform: translateX(-8px); }
        80%      { transform: translateX(8px); }
    }
    @keyframes glitch {
        0%   { transform: translate(0); }
        20%  { transform: translate(-2px, 2px); }
        40%  { transform: translate(-2px, -2px); }
        60%  { transform: translate(2px, 2px); }
        80%  { transform: translate(2px, -2px); }
        100% { transform: translate(0); }
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    .site-header.scrolled {
        background: rgba(10,10,15,0.97) !important;
        box-shadow: 0 4px 30px rgba(151,117,250,0.12);
    }
    form input.error, form select.error {
        border-color: #ef4444 !important;
        box-shadow: 0 0 10px rgba(239,68,68,0.3) !important;
    }
    form input.valid, form select.valid {
        border-color: var(--accent-green) !important;
        box-shadow: 0 0 10px rgba(74,222,128,0.3) !important;
    }
    .spinner {
        display: inline-block;
        width: 16px; height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-right: 8px;
        vertical-align: middle;
    }
    .test-category, .gallery-item, .manager-card, .contact-card {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
`;
document.head.appendChild(dynamicStyles);
