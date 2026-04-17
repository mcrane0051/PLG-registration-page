// ── DEV SHORTCUTS — uncomment to re-enable (also uncomment links in index.html) ──
/*
document.getElementById('devSuccessLink').addEventListener('click', () => {
  document.getElementById('successEmail').textContent = 'demo@example.com';
  document.getElementById('screen1').classList.remove('active');
  document.getElementById('screen2').classList.remove('active');
  document.getElementById('screen3').classList.add('active');
});

document.getElementById('devExpireLink').addEventListener('click', () => {
  document.getElementById('chipEmail').textContent = 'demo@example.com';
  document.getElementById('codeInput').value = '';
  document.getElementById('codeSuccess').classList.remove('success');
  document.getElementById('codeError').classList.remove('error-msg');
  document.getElementById('submitBtn').disabled = true;
  document.getElementById('screen1').classList.remove('active');
  document.getElementById('screen2').classList.add('active');
  if (expiryInterval) clearInterval(expiryInterval);
  triggerExpiredState();
});

document.getElementById('devSkipLink').addEventListener('click', () => {
  document.getElementById('chipEmail').textContent = 'demo@example.com';
  document.getElementById('codeInput').value = '';
  document.getElementById('codeSuccess').classList.remove('success');
  document.getElementById('codeError').classList.remove('error-msg');
  document.getElementById('submitBtn').disabled = true;
  document.getElementById('screen1').classList.remove('active');
  document.getElementById('screen2').classList.add('active');
  startExpiryTimer();
});
*/


// ── LABEL FOCUS STATE ──
document.querySelectorAll('.field input').forEach(input => {
  input.addEventListener('focus', () => input.closest('.field').classList.add('focused'));
  input.addEventListener('blur',  () => input.closest('.field').classList.remove('focused'));
});


// ── SUPPRESS BROWSER AUTOFILL ──
// Inputs start as readonly so Chrome won't populate them on page load.
// readonly is removed the instant the user focuses, making them fully editable.
document.querySelectorAll('input[readonly]').forEach(input => {
  input.addEventListener('focus', () => input.removeAttribute('readonly'), { once: true });
});


// ── ADDRESS AUTOCOMPLETE (OpenStreetMap Nominatim) ──

const PIN_SVG = `<svg class="suggestion-pin" width="13" height="17" viewBox="0 0 13 17" fill="none">
  <path d="M6.5 0C2.91 0 0 2.91 0 6.5c0 4.875 6.5 10.5 6.5 10.5S13 11.375 13 6.5C13 2.91 10.09 0 6.5 0zm0 8.75A2.25 2.25 0 1 1 6.5 4.25a2.25 2.25 0 0 1 0 4.5z" fill="#b0b8c1"/>
</svg>`;

const addressInput  = document.getElementById('address');
const suggestionsEl = document.getElementById('suggestions');
let activeIdx       = -1;
let currentMatches  = [];
let debounceTimer   = null;

function formatAddress(result) {
  const a = result.address || {};
  const parts = [
    result.name !== a.road ? result.name : null,
    a.house_number && a.road ? `${a.house_number} ${a.road}` : a.road,
    a.city || a.town || a.village || a.county,
    a.state,
    a.postcode,
  ].filter(Boolean);
  return parts.join(', ');
}

function renderSuggestions(results) {
  currentMatches = results.map(formatAddress);
  suggestionsEl.innerHTML = '';
  activeIdx = -1;

  if (!results.length) {
    suggestionsEl.classList.remove('open');
    return;
  }

  currentMatches.forEach((addr) => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.innerHTML = `${PIN_SVG}<div class="suggestion-addr">${addr}</div>`;
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      addressInput.value = addr;
      suggestionsEl.classList.remove('open');
      updateSendBtn();
    });
    suggestionsEl.appendChild(item);
  });

  suggestionsEl.classList.add('open');
}

function showLoadingState() {
  suggestionsEl.innerHTML = `
    <div class="suggestion-loading">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="spin">
        <circle cx="8" cy="8" r="6" stroke="#d4d4d4" stroke-width="2"/>
        <path d="M8 2a6 6 0 0 1 6 6" stroke="#6b6b6b" stroke-width="2" stroke-linecap="round"/>
      </svg>
      Searching…
    </div>`;
  suggestionsEl.classList.add('open');
}

async function fetchSuggestions(query) {
  const params = new URLSearchParams({
    q:              query,
    format:         'json',
    addressdetails: '1',
    limit:          '6',
    countrycodes:   'us',
  });

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    renderSuggestions(data);
  } catch {
    suggestionsEl.classList.remove('open');
  }
}

addressInput.addEventListener('input', () => {
  const val = addressInput.value.trim();
  clearTimeout(debounceTimer);

  if (val.length < 3) {
    suggestionsEl.classList.remove('open');
    updateSendBtn();
    return;
  }

  // Show loading state immediately, then fire the API request after 350ms
  showLoadingState();
  debounceTimer = setTimeout(() => {
    fetchSuggestions(val);
    updateSendBtn();
  }, 350);
});

addressInput.addEventListener('keydown', (e) => {
  const items = suggestionsEl.querySelectorAll('.suggestion-item');
  if (!items.length || !suggestionsEl.classList.contains('open')) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIdx = Math.min(activeIdx + 1, items.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIdx = Math.max(activeIdx - 1, 0);
  } else if (e.key === 'Enter' && activeIdx >= 0) {
    e.preventDefault();
    addressInput.value = currentMatches[activeIdx];
    suggestionsEl.classList.remove('open');
    updateSendBtn();
    return;
  } else if (e.key === 'Escape') {
    suggestionsEl.classList.remove('open');
    return;
  }

  items.forEach((it, i) => it.classList.toggle('kbd-active', i === activeIdx));
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.address-wrap')) {
    suggestionsEl.classList.remove('open');
  }
});


// ── FORM VALIDATION ──

const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'aol.com', 'yahoo.com', 'icloud.com', 'mac.com',
]);


const VALID_TLDS = new Set([
  'com','net','org','io','co','edu','gov','uk','us','ca','au',
  'de','fr','jp','ai','app','dev','tech','info','biz','me','tv',
  'cc','ly','be','it','es','nl','se','no','dk','fi','pl','sg',
  'hk','tw','nz','za','mx','br','in','cn','ru',
]);

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function validateEmailFull(raw) {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { valid: false, type: 'format', message: 'Enter a valid email address' };
  }

  const atIdx = trimmed.lastIndexOf('@');
  if (atIdx < 1 || atIdx === trimmed.length - 1) {
    return { valid: false, type: 'format', message: 'Enter a valid email address' };
  }

  const local  = trimmed.slice(0, atIdx);
  const domain = trimmed.slice(atIdx + 1).toLowerCase();

  if (!local || !domain) {
    return { valid: false, type: 'format', message: 'Enter a valid email address' };
  }

  const dotIdx = domain.lastIndexOf('.');
  if (dotIdx < 1) {
    return { valid: false, type: 'incomplete', message: 'Email address appears incomplete' };
  }

  const tld = domain.slice(dotIdx + 1);
  if (!tld || tld.length < 2) {
    return { valid: false, type: 'incomplete', message: 'Email address appears incomplete' };
  }

  if (PERSONAL_DOMAINS.has(domain)) {
    return { valid: false, type: 'personal', message: 'Please use your work email' };
  }

  return { valid: true };
}

const WARNING_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style="flex-shrink:0">
  <path d="M7.25 1.75a.87.87 0 0 1 1.5 0l6.37 11a.87.87 0 0 1-.75 1.31H2.63a.87.87 0 0 1-.75-1.31l6.37-11Z" fill="#DE350B"/>
  <path d="M8 6.5v3M8 11v.5" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
</svg>`;

function showEmailError(result) {
  const wrapper   = document.getElementById('emailFieldWrapper');
  const input     = document.getElementById('email');
  const errorDiv  = document.getElementById('emailError');

  wrapper.classList.add('has-error');
  input.setAttribute('aria-invalid', 'true');
  errorDiv.classList.add('visible');

  errorDiv.innerHTML = `${WARNING_ICON}${result.message}`;
}

function clearEmailError() {
  const wrapper  = document.getElementById('emailFieldWrapper');
  const input    = document.getElementById('email');
  const errorDiv = document.getElementById('emailError');

  wrapper.classList.remove('has-error');
  input.setAttribute('aria-invalid', 'false');
  errorDiv.classList.remove('visible');
  errorDiv.innerHTML = '';
}

function updateSendBtn() {
  const allFilled = ['company', 'firstName', 'lastName', 'address'].every(
    id => document.getElementById(id).value.trim()
  );
  const validEmail = isValidEmail(document.getElementById('email').value.trim());
  document.getElementById('sendCodeBtn').disabled = !(allFilled && validEmail);
}

['company', 'firstName', 'lastName', 'email'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateSendBtn);
});

document.getElementById('email').addEventListener('blur', () => {
  const val = document.getElementById('email').value;
  if (!val.trim()) {
    showEmailError({ type: 'format', message: 'Enter a valid email address' });
    return;
  }
  const result = validateEmailFull(val);
  if (!result.valid) {
    showEmailError(result);
  } else {
    clearEmailError();
  }
});

document.getElementById('email').addEventListener('input', () => {
  if (document.getElementById('emailFieldWrapper').classList.contains('has-error')) {
    const result = validateEmailFull(document.getElementById('email').value);
    if (result.valid) clearEmailError();
  }
});


// ── SCREEN NAVIGATION ──

document.getElementById('sendCodeBtn').addEventListener('click', goToVerify);
document.getElementById('backLink').addEventListener('click', goBack);
document.getElementById('chipChange').addEventListener('click', goBack);
document.getElementById('resendLink').addEventListener('click', resendCode);
document.getElementById('resendLinkExpired').addEventListener('click', resendCode);
document.getElementById('submitBtn').addEventListener('click', handleSubmit);
document.getElementById('codeInput').addEventListener('input', checkCode);

function goToVerify() {
  const email = document.getElementById('email').value.trim();
  document.getElementById('chipEmail').textContent = email;
  document.getElementById('codeInput').value = '';
  document.getElementById('codeSuccess').classList.remove('success');
  document.getElementById('codeError').classList.remove('error-msg');
  document.querySelector('.code-field').classList.remove('has-error');
  document.getElementById('submitBtn').disabled = true;

  document.getElementById('screen1').classList.remove('active');
  document.getElementById('screen2').classList.add('active');

  startExpiryTimer();
}

function goBack() {
  document.getElementById('screen2').classList.remove('active');
  document.getElementById('screen1').classList.add('active');
  if (expiryInterval) clearInterval(expiryInterval);
}


// ── EXPIRY TIMER ──

const FAKE_CODE    = '847291';
let expiryInterval = null;

function startExpiryTimer() {
  if (expiryInterval) clearInterval(expiryInterval);
  clearExpiredState();
  let seconds = 9 * 60 + 47;
  updateExpiry(seconds);
  expiryInterval = setInterval(() => {
    seconds--;
    updateExpiry(seconds);
    if (seconds <= 0) {
      clearInterval(expiryInterval);
      triggerExpiredState();
    }
  }, 1000);
}

function updateExpiry(s) {
  const m  = Math.floor(s / 60).toString().padStart(2, '0');
  const sc = (s % 60).toString().padStart(2, '0');
  document.getElementById('expiryTimer').textContent = `${m}:${sc}`;
}

function triggerExpiredState() {
  document.getElementById('expiryResendRow').style.display = 'none';
  document.getElementById('expiredBanner').classList.add('show');
  document.getElementById('codeInput').disabled            = true;
  document.getElementById('codeInput').value               = '';
  document.querySelector('.code-field').classList.remove('has-error');
  document.getElementById('codeSuccess').classList.remove('success');
  document.getElementById('codeError').classList.remove('error-msg');
  document.getElementById('submitBtn').disabled            = true;
}

function clearExpiredState() {
  document.getElementById('expiryResendRow').style.display = '';
  document.getElementById('expiredBanner').classList.remove('show');
  document.getElementById('codeInput').disabled            = false;
}


// ── RESEND CODE ──

function resendCode() {
  const link = document.getElementById('resendLink');
  if (link.classList.contains('disabled')) return;

  document.getElementById('codeInput').value = '';
  document.getElementById('codeSuccess').classList.remove('success');
  document.getElementById('codeError').classList.remove('error-msg');
  document.querySelector('.code-field').classList.remove('has-error');
  document.getElementById('submitBtn').disabled = true;

  clearExpiredState();
  startExpiryTimer();

  // Brief disabled state to prevent rapid re-sends
  link.classList.add('disabled');
  setTimeout(() => link.classList.remove('disabled'), 30000);
}


// ── CODE VERIFICATION ──

function checkCode() {
  const val       = document.getElementById('codeInput').value.trim();
  const ok        = document.getElementById('codeSuccess');
  const err       = document.getElementById('codeError');
  const codeField = document.querySelector('.code-field');

  if (val.length < 6) {
    ok.classList.remove('success');
    err.classList.remove('error-msg');
    codeField.classList.remove('has-error');
    document.getElementById('submitBtn').disabled = true;
    return;
  }

  if (val === FAKE_CODE) {
    ok.classList.add('success');
    err.classList.remove('error-msg');
    codeField.classList.remove('has-error');
    document.getElementById('submitBtn').disabled = false;
    clearInterval(expiryInterval);
  } else {
    err.classList.add('error-msg');
    ok.classList.remove('success');
    codeField.classList.add('has-error');
    document.getElementById('submitBtn').disabled = true;
  }
}


// ── SUBMIT ──

function handleSubmit() {
  const email = document.getElementById('email').value.trim();
  document.getElementById('successEmail').textContent = email;
  if (expiryInterval) clearInterval(expiryInterval);
  document.getElementById('screen2').classList.remove('active');
  document.getElementById('screen3').classList.add('active');
}
