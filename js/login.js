/* Login Page Interactive Logic - Vikas Automobiles */

let verifiedUser = null;
let captchaToken = null;

function updateLoginProgress() {
  const progressBar = document.getElementById('login-progress-bar');
  if (!progressBar) return;

  const isPasswordFormVisible = !document.getElementById('form-login-password')?.classList.contains('hidden');
  const isOtpFormVisible = !document.getElementById('form-login-otp')?.classList.contains('hidden');

  let progress = 0;

  if (isPasswordFormVisible) {
    const idVal = document.getElementById('login-identifier')?.value.trim() || "";
    const passVal = document.getElementById('login-password')?.value || "";
    
    if (idVal) progress += 50;
    if (passVal) progress += 50;
  } else if (isOtpFormVisible) {
    progress = 80;
    if (captchaToken) {
      progress += 20;
    }
  }

  progressBar.style.width = `${progress}%`;
}

function initLoginPage() {
  // Check if session is already active, redirect if found
  const session = window.AUTH.getCurrentSession();
  if (session) {
    window.AUTH.redirectByRole(session);
  }

  // Set default identifier value if saved
  const remembered = localStorage.getItem('vikas_remembered_identifier');
  if (remembered) {
    const identifierInput = document.getElementById('login-identifier');
    if (identifierInput) {
      identifierInput.value = remembered;
    }
    const rememberMeCheckbox = document.getElementById('remember-me');
    if (rememberMeCheckbox) {
      rememberMeCheckbox.checked = true;
    }
  }

  // Attach dynamic progress bar listeners
  const identifierInput = document.getElementById('login-identifier');
  const passwordInput = document.getElementById('login-password');

  if (identifierInput) {
    identifierInput.addEventListener('input', updateLoginProgress);
  }
  if (passwordInput) {
    passwordInput.addEventListener('input', updateLoginProgress);
  }

  // Run initial progress calculation
  updateLoginProgress();

  // Inject success checkmark CSS animations dynamically
  if (!document.getElementById('btn-checkmark-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'btn-checkmark-styles';
    styleEl.textContent = `
      @keyframes checkmark-stroke {
        100% {
          stroke-dashoffset: 0;
        }
      }
      @keyframes checkmark-scale {
        0%, 100% {
          transform: none;
        }
        50% {
          transform: scale3d(1.1, 1.1, 1);
        }
      }
      .btn-success-overlay {
        animation: checkmark-scale .3s ease-in-out .9s both;
      }
      .btn-checkmark-circle {
        stroke-dasharray: 166;
        stroke-dashoffset: 166;
        stroke-width: 4;
        stroke-miterlimit: 10;
        stroke: rgba(255, 255, 255, 0.4);
        fill: none;
        animation: checkmark-stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
      }
      .btn-checkmark-check {
        transform-origin: 50% 50%;
        stroke-dasharray: 48;
        stroke-dashoffset: 48;
        stroke: #ffffff;
        stroke-width: 4;
        stroke-linecap: round;
        fill: none;
        animation: checkmark-stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
      }
    `;
    document.head.appendChild(styleEl);
  }
}

function animateButtonSuccess(btn) {
  if (!btn) return;

  // Make sure the button has correct positioning
  btn.style.position = 'relative';
  btn.style.overflow = 'hidden';

  // Save original html if not saved already
  if (!btn.hasAttribute('data-original-html')) {
    btn.setAttribute('data-original-html', btn.innerHTML);
  }

  // Create the success overlay
  const overlay = document.createElement('div');
  overlay.className = 'absolute inset-0 bg-emerald-600 flex items-center justify-center text-white z-50 transition-all duration-300 opacity-0 scale-95 btn-success-overlay';
  overlay.id = 'success-checkmark-overlay';

  // Self-drawing SVG checkmark
  overlay.innerHTML = `
    <svg class="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
      <circle class="btn-checkmark-circle" cx="26" cy="26" r="25" />
      <path class="btn-checkmark-check" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
    </svg>
  `;

  btn.appendChild(overlay);

  // Trigger reflow to start the transition
  void overlay.offsetWidth;

  // Fade and scale in
  overlay.classList.remove('opacity-0', 'scale-95');
  overlay.classList.add('opacity-100', 'scale-100');
}

function restoreButton(btn) {
  if (!btn) return;
  const overlay = btn.querySelector('#success-checkmark-overlay');
  if (overlay) {
    overlay.remove();
  }
  if (btn.hasAttribute('data-original-html')) {
    btn.innerHTML = btn.getAttribute('data-original-html');
    btn.removeAttribute('data-original-html');
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = btn.querySelector('i') || btn.querySelector('[data-lucide]');
  
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    if (icon) icon.setAttribute('data-lucide', 'eye');
  }
  if (window.lucide) window.lucide.createIcons();
}

let resendCooldownInterval = null;
let resendSecondsRemaining = 0;

function openForgotPasswordModal() {
  const modal = document.getElementById('forgot-password-modal');
  if (modal) {
    modal.classList.remove('hidden');
    
    // Reset view visibility
    const requestView = document.getElementById('forgot-password-request-view');
    const successView = document.getElementById('forgot-password-success-view');
    if (requestView) requestView.classList.remove('hidden');
    if (successView) successView.classList.add('hidden');
    
    // Reset inputs
    const emailInput = document.getElementById('forgot-email');
    if (emailInput) emailInput.value = '';
    
    // Clear interval/cooldown states
    if (resendCooldownInterval) {
      clearInterval(resendCooldownInterval);
      resendCooldownInterval = null;
    }
    resendSecondsRemaining = 0;
    
    const resendBtn = document.getElementById('btn-resend-reset');
    if (resendBtn) {
      resendBtn.disabled = false;
      resendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    const cooldownSpan = document.getElementById('resend-cooldown');
    if (cooldownSpan) cooldownSpan.innerText = '';
    
    // Re-create lucide icons inside modal just in case
    if (window.lucide) window.lucide.createIcons();
    
    // Sync UI with current translation language
    if (window.I18N && window.I18N.setLanguage) {
      window.I18N.setLanguage(window.I18N.currentLang);
    }
  }
}

function closeForgotPasswordModal() {
  const modal = document.getElementById('forgot-password-modal');
  if (modal) modal.classList.add('hidden');
  
  if (resendCooldownInterval) {
    clearInterval(resendCooldownInterval);
    resendCooldownInterval = null;
  }
}

async function handlePasswordLogin(event) {
  event.preventDefault();
  const alertContainer = document.getElementById('alert-container');
  if (alertContainer) alertContainer.classList.add('hidden');

  const identifier = document.getElementById('login-identifier').value.trim();
  const password = document.getElementById('login-password').value;
  const rememberMe = document.getElementById('remember-me').checked;

  if (!identifier || !password) {
    showLoginAlert("Please fill in all required fields.", "error");
    return;
  }

  window.UTILS.showLoader("Validating credentials...");

  try {
    // 1. Verify username/password & account status
    const user = await window.AUTH.verifyCredentials(identifier, password);
    verifiedUser = user;

    // Save remember me preference
    if (rememberMe) {
      localStorage.setItem('vikas_remembered_identifier', identifier);
    } else {
      localStorage.removeItem('vikas_remembered_identifier');
    }

    window.UTILS.hideLoader();

    // Trigger checkmark animation overlay on login button
    const submitBtn = document.getElementById('btn-password-submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('cursor-not-allowed');
      animateButtonSuccess(submitBtn);
    }

    setTimeout(() => {
      // 2. Reset any prior verification state
      captchaToken = null;

      // 3. Update the verification form's contextual copy
      const maskedMobile = user.mobile && user.mobile.length >= 10
        ? `+91 ******${user.mobile.slice(-4)}`
        : (user.mobile || user.email);

      const maskedMobileEl = document.getElementById('otp-masked-mobile');
      if (maskedMobileEl) {
        maskedMobileEl.innerText = maskedMobile;
      }

      const debugHintEl = document.getElementById('otp-debug-hint');
      if (debugHintEl) {
        debugHintEl.classList.add('hidden');
      }

      const otpSubmitBtn = document.getElementById('btn-otp-submit');
      if (otpSubmitBtn) {
        otpSubmitBtn.disabled = true;
      }

      // 4. Smooth form transition
      document.getElementById('form-login-password').classList.add('hidden');
      document.getElementById('form-login-otp').classList.remove('hidden');
      document.getElementById('login-flow-step-header').classList.remove('hidden');

      const qrSection = document.getElementById('qr-scan-section');
      if (qrSection) qrSection.classList.add('hidden');

      // 5. Render (or reset) the Google reCAPTCHA widget for this verification attempt
      renderLoginCaptcha();

      // Update progress bar
      updateLoginProgress();

      window.UTILS.showToast(`Please complete the verification to continue.`, "success");

      // Restore button for any future display
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('cursor-not-allowed');
        restoreButton(submitBtn);
      }
    }, 1200);

  } catch (error) {
    window.UTILS.hideLoader();
    showLoginAlert(error.message || "Credential authentication failed.", "error");
  }
}

// The reCAPTCHA widget auto-renders on page load via its `g-recaptcha` class and
// `data-sitekey`/`data-callback` attributes in the HTML. This just resets it for a
// fresh attempt whenever the verification step is (re-)shown.
function renderLoginCaptcha() {
  captchaToken = null;

  const tryReset = () => {
    if (!window.grecaptcha || !window.grecaptcha.reset) {
      // Google's script hasn't finished loading/auto-rendering yet - retry shortly.
      setTimeout(tryReset, 300);
      return;
    }
    try {
      window.grecaptcha.reset();
    } catch (e) {
      // Widget not rendered yet on first load - nothing to reset.
    }
    updateLoginProgress();
  };

  tryReset();
}

// Called by Google reCAPTCHA once the user completes the "I'm not a robot" challenge
function onLoginCaptchaSuccess(token) {
  captchaToken = token;
  const otpSubmitBtn = document.getElementById('btn-otp-submit');
  if (otpSubmitBtn) {
    otpSubmitBtn.disabled = false;
  }
  const debugHintEl = document.getElementById('otp-debug-hint');
  if (debugHintEl) {
    debugHintEl.classList.add('hidden');
  }
  updateLoginProgress();
}

// Called by Google reCAPTCHA if a completed challenge times out
function onLoginCaptchaExpired() {
  captchaToken = null;
  const otpSubmitBtn = document.getElementById('btn-otp-submit');
  if (otpSubmitBtn) {
    otpSubmitBtn.disabled = true;
  }
  window.UTILS.showToast("Verification expired. Please complete the challenge again.", "error");
  updateLoginProgress();
}

// Called by Google reCAPTCHA if the widget itself fails to load/verify
function onLoginCaptchaError() {
  captchaToken = null;
  const otpSubmitBtn = document.getElementById('btn-otp-submit');
  if (otpSubmitBtn) {
    otpSubmitBtn.disabled = true;
  }
  const debugHintEl = document.getElementById('otp-debug-hint');
  if (debugHintEl) {
    debugHintEl.innerText = "Verification widget couldn't load. Check your connection and use Reset Verification.";
    debugHintEl.classList.remove('hidden');
  }
}

async function handleOtpVerification(event) {
  if (event) event.preventDefault();

  if (!captchaToken) {
    window.UTILS.showToast("Please complete the verification challenge first.", "error");
    return false;
  }

  if (!verifiedUser) {
    window.UTILS.showToast("Verification session expired. Please log in again.", "error");
    cancelOtpFlow();
    return false;
  }

  window.UTILS.showLoader("Establishing secure session...");

  try {
    // Set active session & add log
    const session = await window.AUTH.establishSession(verifiedUser);

    window.UTILS.hideLoader();

    // Trigger checkmark animation overlay on verify button
    const otpSubmitBtn = document.getElementById('btn-otp-submit');
    if (otpSubmitBtn) {
      otpSubmitBtn.disabled = true;
      otpSubmitBtn.classList.add('cursor-not-allowed');
      animateButtonSuccess(otpSubmitBtn);
    }

    window.UTILS.showToast(`Swagat hai, ${session.fullname}!`, "success");
    
    // Redirect based on role
    setTimeout(() => {
      window.AUTH.redirectByRole(session);
    }, 1200);

  } catch (error) {
    window.UTILS.hideLoader();
    window.UTILS.showToast(error.message || "Failed to establish session.", "error");
  }
}

// "Reset Verification" button handler - resets the reCAPTCHA widget for a fresh attempt
async function handleResendOtp() {
  if (!verifiedUser) {
    window.UTILS.showToast("Verification session expired. Please log in again.", "error");
    cancelOtpFlow();
    return;
  }

  const otpSubmitBtn = document.getElementById('btn-otp-submit');
  if (otpSubmitBtn) {
    otpSubmitBtn.disabled = true;
  }

  renderLoginCaptcha();

  const debugHintEl = document.getElementById('otp-debug-hint');
  if (debugHintEl) {
    debugHintEl.classList.add('hidden');
  }

  window.UTILS.showToast("Verification reset. Please complete the challenge again.", "success");
}

function cancelOtpFlow() {
  captchaToken = null;
  verifiedUser = null;

  if (window.grecaptcha && window.grecaptcha.reset) {
    try { window.grecaptcha.reset(); } catch (e) { /* not rendered yet */ }
  }

  // Swap back forms
  document.getElementById('form-login-otp').classList.add('hidden');
  document.getElementById('login-flow-step-header').classList.add('hidden');
  document.getElementById('form-login-password').classList.remove('hidden');

  const qrSection = document.getElementById('qr-scan-section');
  if (qrSection) qrSection.classList.remove('hidden');

  // Update progress bar
  updateLoginProgress();

  const otpSubmitBtn = document.getElementById('btn-otp-submit');
  if (otpSubmitBtn) otpSubmitBtn.disabled = true;

  const debugHintEl = document.getElementById('otp-debug-hint');
  if (debugHintEl) debugHintEl.classList.add('hidden');
}

function handleForgotPassword(event) {
  event.preventDefault();
  const emailInput = document.getElementById('forgot-email');
  if (!emailInput) return;
  const email = emailInput.value.trim();
  if (!email) return;

  const submitBtn = document.getElementById('btn-forgot-submit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      <span>Sending Link...</span>
    `;
  }

  // Beautiful visual feedback with simulated server dispatch delay
  setTimeout(() => {
    // Hide Form, Show success confirmation screen
    const requestView = document.getElementById('forgot-password-request-view');
    const successView = document.getElementById('forgot-password-success-view');
    
    if (requestView) requestView.classList.add('hidden');
    if (successView) successView.classList.remove('hidden');
    
    const successEmailSpan = document.getElementById('reset-success-email');
    if (successEmailSpan) {
      successEmailSpan.innerText = email;
    }
    
    // Trigger cooldown countdown for resend
    startResendCooldown();
    
    // Restore request button for next opening
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Request Password Reset`;
    }
    
    // Re-run lucide icons to parse new icons like "mail-check" or "arrow-left"
    if (window.lucide) window.lucide.createIcons();
    
    // Sync current translation values
    if (window.I18N && window.I18N.setLanguage) {
      window.I18N.setLanguage(window.I18N.currentLang);
    }
    
    window.UTILS.showToast(`Password reset link has been dispatched to ${email}`, "success");
  }, 1000);
}

function startResendCooldown() {
  const resendBtn = document.getElementById('btn-resend-reset');
  const cooldownSpan = document.getElementById('resend-cooldown');
  if (!resendBtn) return;
  
  // Set cooldown seconds
  resendSecondsRemaining = 30;
  resendBtn.disabled = true;
  resendBtn.classList.add('opacity-50', 'cursor-not-allowed');
  
  if (resendCooldownInterval) {
    clearInterval(resendCooldownInterval);
  }
  
  if (cooldownSpan) {
    cooldownSpan.innerText = `(${resendSecondsRemaining}s)`;
  }
  
  resendCooldownInterval = setInterval(() => {
    resendSecondsRemaining--;
    if (cooldownSpan) {
      cooldownSpan.innerText = `(${resendSecondsRemaining}s)`;
    }
    
    if (resendSecondsRemaining <= 0) {
      clearInterval(resendCooldownInterval);
      resendCooldownInterval = null;
      resendBtn.disabled = false;
      resendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      if (cooldownSpan) {
        cooldownSpan.innerText = '';
      }
    }
  }, 1000);
}

function handleResendResetLink() {
  if (resendSecondsRemaining > 0) return;
  
  const resendBtn = document.getElementById('btn-resend-reset');
  if (!resendBtn) return;
  const originalHtml = resendBtn.innerHTML;
  
  resendBtn.disabled = true;
  resendBtn.innerHTML = `
    <div class="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
    <span>Resending...</span>
  `;
  
  setTimeout(() => {
    resendBtn.innerHTML = originalHtml;
    
    const email = document.getElementById('reset-success-email')?.innerText || 'your email';
    window.UTILS.showToast(`Reset link resent to ${email}!`, "success");
    
    startResendCooldown();
  }, 1000);
}

function showLoginAlert(message, type = "error") {
  const alertContainer = document.getElementById('alert-container');
  if (!alertContainer) return;

  alertContainer.innerText = message;
  alertContainer.classList.remove('hidden');

  if (type === "success") {
    alertContainer.className = "mb-4 p-3 rounded-lg border text-xs font-medium border-emerald-500/20 text-emerald-400 bg-emerald-500/10";
  } else {
    alertContainer.className = "mb-4 p-3 rounded-lg border text-xs font-medium border-red-500/20 text-red-400 bg-red-500/10";
  }
}

function updatePasswordStrength(password) {
  const bar = document.getElementById('password-strength-bar');
  const feedback = document.getElementById('password-strength-feedback');
  const textEl = document.getElementById('password-strength-text');
  const suggestionEl = document.getElementById('password-strength-suggestion');

  if (!bar || !feedback || !textEl || !suggestionEl) return;

  if (!password) {
    feedback.classList.add('hidden');
    bar.style.width = '0%';
    bar.className = 'h-full transition-all duration-500 bg-slate-300';
    return;
  }

  feedback.classList.remove('hidden');

  let score = 0;
  let textKey = '';
  let suggestionKey = '';
  let colorClass = '';
  let width = '';

  if (password.length < 4) {
    textKey = 'strength_too_short';
    suggestionKey = 'strength_suggestion_short';
    colorClass = 'bg-rose-500';
    width = '15%';
  } else {
    // Check criteria
    let criteriaMet = 0;
    if (password.length >= 8) criteriaMet++;
    if (/[A-Z]/.test(password)) criteriaMet++;
    if (/[0-9]/.test(password)) criteriaMet++;
    if (/[^A-Za-z0-9]/.test(password)) criteriaMet++;

    if (criteriaMet <= 1) {
      textKey = 'strength_weak';
      suggestionKey = 'strength_suggestion_weak';
      colorClass = 'bg-rose-500';
      width = '25%';
    } else if (criteriaMet === 2) {
      textKey = 'strength_fair';
      suggestionKey = 'strength_suggestion_fair';
      colorClass = 'bg-amber-500';
      width = '50%';
    } else if (criteriaMet === 3) {
      textKey = 'strength_good';
      suggestionKey = 'strength_suggestion_good';
      colorClass = 'bg-blue-500';
      width = '75%';
    } else {
      textKey = 'strength_strong';
      suggestionKey = 'strength_suggestion_strong';
      colorClass = 'bg-emerald-500';
      width = '100%';
    }
  }

  // Set translation or fallback
  const translatedText = window.I18N && window.I18N.translate ? window.I18N.translate(textKey) : textKey;
  const translatedSuggestion = window.I18N && window.I18N.translate ? window.I18N.translate(suggestionKey) : suggestionKey;

  // Update text
  textEl.innerText = translatedText;
  
  // Update text color of strength text to match strength state
  textEl.className = colorClass.replace('bg-', 'text-');
  
  // Update suggestion
  suggestionEl.innerText = translatedSuggestion;
  
  // Set bar width and style
  bar.style.width = width;
  bar.className = `h-full transition-all duration-500 ${colorClass}`;
}

// --- QR CODE SCANNER LOGIC FOR VIKAS AUTOMOBILES LOYALTY CARD ---
let html5QrCode = null;

function openQrScannerModal() {
  const modal = document.getElementById('qr-scanner-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  const statusEl = document.getElementById('qr-scanner-status');
  if (statusEl) {
    statusEl.innerHTML = `
      <span class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
      ${window.I18N && window.I18N.translate ? window.I18N.translate('qr_scanner_status_init') : 'Initializing camera stream...'}
    `;
    statusEl.className = "text-[10px] text-blue-600 font-mono font-bold uppercase bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 inline-flex items-center gap-1.5";
  }

  // Ensure Html5Qrcode is available globally from CDN
  if (typeof Html5Qrcode === "undefined") {
    console.error("Html5Qrcode library not loaded yet.");
    if (statusEl) {
      statusEl.innerText = "Error: QR Scanner library failed to load.";
      statusEl.className = "text-[10px] text-rose-600 font-mono font-bold uppercase bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 inline-flex items-center gap-1.5";
    }
    return;
  }

  try {
    // If there's an existing instance, stop it first
    if (html5QrCode) {
      html5QrCode.stop().catch(() => {}).finally(() => {
        startCameraScanning(statusEl);
      });
    } else {
      startCameraScanning(statusEl);
    }
  } catch (err) {
    console.error("Scanner setup failed:", err);
  }
}

function startCameraScanning(statusEl) {
  html5QrCode = new Html5Qrcode("qr-reader");
  const config = { fps: 15, qrbox: { width: 220, height: 220 } };

  html5QrCode.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
      handleScannedValue(decodedText);
    }
  ).then(() => {
    if (statusEl) {
      statusEl.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        ${window.I18N && window.I18N.translate ? window.I18N.translate('qr_scanner_status_active') : 'Camera active. Scanning...'}
      `;
      statusEl.className = "text-[10px] text-emerald-600 font-mono font-bold uppercase bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 inline-flex items-center gap-1.5";
    }
  }).catch(err => {
    console.warn("Back camera failed, trying user-facing camera:", err);
    html5QrCode.start(
      { facingMode: "user" },
      config,
      (decodedText) => {
        handleScannedValue(decodedText);
      }
    ).then(() => {
      if (statusEl) {
        statusEl.innerHTML = `
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          ${window.I18N && window.I18N.translate ? window.I18N.translate('qr_scanner_status_active') : 'Camera active. Scanning...'}
        `;
        statusEl.className = "text-[10px] text-emerald-600 font-mono font-bold uppercase bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 inline-flex items-center gap-1.5";
      }
    }).catch(e => {
      console.error("Camera access failed:", e);
      if (statusEl) {
        statusEl.innerHTML = `
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          ${window.I18N && window.I18N.translate ? window.I18N.translate('qr_scanner_status_error') : 'Camera blocked or unsupported.'}
        `;
        statusEl.className = "text-[10px] text-rose-600 font-mono font-bold uppercase bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 inline-flex items-center gap-1.5";
      }
    });
  });
}

function closeQrScannerModal() {
  const modal = document.getElementById('qr-scanner-modal');
  if (modal) modal.classList.add('hidden');

  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      html5QrCode = null;
    }).catch(err => {
      console.warn("Error stopping scanner:", err);
      html5QrCode = null;
    });
  }
}

function handleScannedValue(decodedText) {
  let identifier = decodedText.trim();

  // Parse structured or custom data
  try {
    const parsed = JSON.parse(decodedText);
    identifier = parsed.identifier || parsed.email || parsed.mobile || identifier;
  } catch (e) {
    if (identifier.startsWith("vikas-loyalty:")) {
      identifier = identifier.substring("vikas-loyalty:".length).trim();
    }
  }

  // Look up user in system
  window.API.getUsers().then(users => {
    const user = users.find(u => u.email.toLowerCase() === identifier.toLowerCase() || u.mobile === identifier);
    if (user) {
      if (user.status === "suspended") {
        window.UTILS.showToast("Your partner account is suspended. Contact Vikas corporate desk.", "error");
        return;
      }

      // Close scanner modal
      closeQrScannerModal();

      // Show gorgeous loading overlay
      const loadingOverlay = document.getElementById("loading-overlay");
      const loadingText = document.getElementById("loading-text");
      if (loadingOverlay && loadingText) {
        loadingText.innerText = `Welcome, ${user.fullname}! Loyalty Card detected...`;
        loadingOverlay.classList.remove("hidden");
      }

      // Authenticate & Establish session after elegant delay
      setTimeout(async () => {
        try {
          window.AUTH.setCurrentSession(user);
          await window.API.addLog("AUTH_IN", `Quick Login via Loyalty Card QR Scan: ${user.fullname} [Role: ${user.role.toUpperCase()}]`);
          window.UTILS.showToast(`Logged in successfully as ${user.fullname}!`, "success");

          // Staggered routing to role-specific workflow dashboard
          setTimeout(() => {
            window.AUTH.redirectByRole(user);
          }, 800);
        } catch (err) {
          console.error(err);
          if (loadingOverlay) loadingOverlay.classList.add("hidden");
          window.UTILS.showToast("Failed to secure loyalty session. Try regular login.", "error");
        }
      }, 1200);

    } else {
      window.UTILS.showToast("Loyalty QR Card unrecognized or partner profile not found.", "error");
    }
  }).catch(err => {
    console.error("Failed to load user profiles:", err);
    window.UTILS.showToast("Authentication server offline. Try again.", "error");
  });
}

function simulateQrScan(email) {
  // Directly invoke scanner success with the identifier
  handleScannedValue("vikas-loyalty:" + email);
}

// Bind to window
window.initLoginPage = initLoginPage;
window.togglePasswordVisibility = togglePasswordVisibility;
window.openForgotPasswordModal = openForgotPasswordModal;
window.closeForgotPasswordModal = closeForgotPasswordModal;
window.handlePasswordLogin = handlePasswordLogin;
window.handleOtpVerification = handleOtpVerification;
window.cancelOtpFlow = cancelOtpFlow;
window.handleForgotPassword = handleForgotPassword;
window.handleResendResetLink = handleResendResetLink;
window.handleResendOtp = handleResendOtp;
window.updatePasswordStrength = updatePasswordStrength;
window.onLoginCaptchaSuccess = onLoginCaptchaSuccess;
window.onLoginCaptchaExpired = onLoginCaptchaExpired;
window.onLoginCaptchaError = onLoginCaptchaError;
window.renderLoginCaptcha = renderLoginCaptcha;

// Bind new Loyalty Scanner methods to window
window.openQrScannerModal = openQrScannerModal;
window.closeQrScannerModal = closeQrScannerModal;
window.handleScannedValue = handleScannedValue;
window.simulateQrScan = simulateQrScan;
window.animateButtonSuccess = animateButtonSuccess;
window.restoreButton = restoreButton;
window.updateLoginProgress = updateLoginProgress;
