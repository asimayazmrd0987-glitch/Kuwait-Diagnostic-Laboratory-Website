// ─────────────────────────────────────────────────────────────
// ✅ CONFIG
// ─────────────────────────────────────────────────────────────
const WHATSAPP_NUMBER = "923367251204"; // +92 336 7251204
const RATE_LIMIT_MS   = 30000;          // 30 seconds between submissions

// ─────────────────────────────────────────────────────────────
// ✅ SECURITY: Input sanitizer — strips dangerous characters
// ─────────────────────────────────────────────────────────────
function sanitize(str) {
    return String(str)
        .replace(/[<>"'`\\;]/g, '')
        .trim()
        .slice(0, 500);
}

// ─────────────────────────────────────────────────────────────
// ✅ SECURITY: Rate limit state
// ─────────────────────────────────────────────────────────────
let lastSubmitTime = 0;

// ─────────────────────────────────────────────────────────────
// DOM Ready
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Step Navigation
// ─────────────────────────────────────────────────────────────
function goToStep2() {
    const name  = document.getElementById('name');
    const phone = document.getElementById('phone');

    // Validate step 1 fields first
    validateField(name);
    validateField(phone);

    if (name.classList.contains('error') || !name.value.trim()) {
        name.focus();
        shakeField(name);
        return;
    }
    if (phone.classList.contains('error') || !phone.value.trim()) {
        phone.focus();
        shakeField(phone);
        return;
    }

    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
    document.getElementById('step1-indicator').classList.remove('active');
    document.getElementById('step1-indicator').classList.add('done');
    document.getElementById('step2-indicator').classList.add('active');

    // Scroll form into view smoothly
    document.getElementById('book').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function goToStep1() {
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step1').classList.remove('hidden');
    document.getElementById('step2-indicator').classList.remove('active');
    document.getElementById('step1-indicator').classList.remove('done');
    document.getElementById('step1-indicator').classList.add('active');
}

// ─────────────────────────────────────────────────────────────
// Field Validation
// ─────────────────────────────────────────────────────────────
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
        case 'notes':   isValid = true; break; // optional fields
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

// ─────────────────────────────────────────────────────────────
// ✅ Form Submission → WhatsApp
// ─────────────────────────────────────────────────────────────
async function handleSubmit(e) {
    e.preventDefault();

    // ✅ Honeypot check — bots fill hidden field
    const trap = document.getElementById('hp_website');
    if (trap && trap.value.length > 0) {
        console.warn('Bot submission blocked.');
        return;
    }

    // ✅ Rate limit check
    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_MS) {
        const secs = Math.ceil((RATE_LIMIT_MS - (now - lastSubmitTime)) / 1000);
        showFormError(`Please wait ${secs} more second(s) before submitting again.`);
        return;
    }

    // Validate required fields
    const name    = document.getElementById('name');
    const phone   = document.getElementById('phone');
    const service = document.getElementById('service');

    validateField(name);
    validateField(phone);
    validateField(service);

    if (!name.value.trim() || name.classList.contains('error')) {
        goToStep1(); name.focus(); return;
    }
    if (!phone.value.trim() || phone.classList.contains('error')) {
        goToStep1(); phone.focus(); return;
    }
    if (!service.value.trim()) {
        showFormError('Please select a test.'); return;
    }

    // ✅ Sanitize all inputs
    const patientName = sanitize(name.value);
    const patientPhone = sanitize(phone.value);
    const patientAge    = sanitize(document.getElementById('age')?.value || '');
    const patientGender = sanitize(document.getElementById('gender')?.value || '');
    const testSelected  = sanitize(service.value);
    const dateVal       = sanitize(document.getElementById('date')?.value || '');
    const timeVal       = sanitize(document.getElementById('time')?.value || '');
    const notesVal      = sanitize(document.getElementById('notes')?.value || '');

    // Loading state
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Opening WhatsApp...';

    await new Promise(r => setTimeout(r, 800));

    // ✅ Build clean WhatsApp message
    const lines = [
        '🔬 *New Appointment Request — KDL*',
        '──────────────────────────',
        `👤 *Name:* ${patientName}`,
        `📞 *Phone:* ${patientPhone}`,
        patientAge    ? `🎂 *Age:* ${patientAge}` : '',
        patientGender ? `⚧ *Gender:* ${patientGender}` : '',
        '',
        `🧪 *Test:* ${testSelected}`,
        dateVal ? `📅 *Date:* ${dateVal}` : '',
        timeVal ? `⏰ *Time:* ${timeVal}` : '',
        notesVal ? `📝 *Notes:* ${notesVal}` : '',
        '',
        '──────────────────────────',
        '_Sent from KDL website_'
    ].filter(Boolean).join('\n');

    const waURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`;

    // Record submit time
    lastSubmitTime = Date.now();

    // Show success
    const form = document.getElementById('appointmentForm');
    form.style.display = 'none';

    const successEl = document.getElementById('successMessage');
    if (successEl) {
        successEl.classList.add('show');
        successEl.innerHTML = `
            <h4><i class="fas fa-check-circle"></i> Booking Ready!</h4>
            <p>> Thank you, <strong>${patientName}</strong>. Your request has been prepared.</p>
            <p>> <strong>Test:</strong> ${testSelected}</p>
            ${dateVal ? `<p>> <strong>Date:</strong> ${dateVal}${timeVal ? ' at ' + timeVal : ''}</p>` : ''}
            <div style="margin-top:1.5rem; padding-top:1rem; border-top:1px solid rgba(74,222,128,0.3);">
                <p style="font-size:0.9rem; margin-bottom:1rem; color:var(--text-secondary);">
                    <i class="fab fa-whatsapp"></i> Click below to send your booking to our lab on WhatsApp:
                </p>
                <a href="${waURL}" target="_blank" rel="noopener noreferrer"
                   style="display:inline-flex; align-items:center; gap:0.6rem; padding:1rem 2rem;
                          background:linear-gradient(135deg,#25D366,#128C7E); color:#fff;
                          border-radius:6px; font-weight:700; text-decoration:none;
                          text-transform:uppercase; letter-spacing:0.1em; font-size:0.9rem;
                          box-shadow:0 0 25px rgba(37,211,102,0.4);">
                    <i class="fab fa-whatsapp"></i> Confirm via WhatsApp
                </a>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.75rem;">
                    This will open WhatsApp with your details pre-filled.
                </p>
            </div>`;
    }

    // Reset form state
    form.reset();
    document.querySelectorAll('#appointmentForm input, #appointmentForm select')
        .forEach(f => f.classList.remove('valid', 'error'));
    btn.disabled = false;
    btn.innerHTML = '<i class="fab fa-whatsapp"></i> Send Booking via WhatsApp';
}

function showFormError(msg) {
    // Flash an error near the submit area
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

// ─────────────────────────────────────────────────────────────
// Header scroll effect
// ─────────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
    const header = document.querySelector('.site-header');
    header?.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ─────────────────────────────────────────────────────────────
// Smooth scroll anchors
// ─────────────────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ─────────────────────────────────────────────────────────────
// Glitch effect on brand kicker
// ─────────────────────────────────────────────────────────────
const brandKicker = document.querySelector('.brand-kicker');
if (brandKicker) {
    brandKicker.addEventListener('mouseenter', () => brandKicker.style.animation = 'glitch 0.3s ease');
    brandKicker.addEventListener('mouseleave', () => brandKicker.style.animation = '');
}

// ─────────────────────────────────────────────────────────────
// Dynamic styles injected once
// ─────────────────────────────────────────────────────────────
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
