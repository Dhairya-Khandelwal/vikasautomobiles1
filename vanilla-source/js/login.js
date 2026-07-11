/* Login Page Interactive Logic - Vikas Automobiles */

let currentLoginMode = 'password';
let currentGeneratedOtp = null;

function initLoginPage() {
  // Check if session is already active, redirect if found
  const session = window.AUTH.getCurrentSession();
  if (session) {
    window.location.replace(`${session.role}.html`);
  }

  // Bind forms
  const formPassword = document.getElementById('form-login-password');
  const formOtp = document.getElementById('form-login-otp');
  
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
}

function switchLoginMode(mode) {
  currentLoginMode = mode;
  const tabPassword = document.getElementById('tab-password');
  const tabOtp = document.getElementById('tab-otp');
  const formPassword = document.getElementById('form-login-password');
  const formOtp = document.getElementById('form-login-otp');
  const alertContainer = document.getElementById('alert-container');

  if (alertContainer) {
    alertContainer.classList.add('hidden');
  }

  if (mode === 'password') {
    tabPassword.className = "py-2 text-xs font-semibold rounded-md transition-all text-white bg-[#FF6B00]";
    tabOtp.className = "py-2 text-xs font-semibold rounded-md transition-all text-slate-400 hover:text-white";
    formPassword.classList.remove('hidden');
    formOtp.classList.add('hidden');
  } else {
    tabPassword.className = "py-2 text-xs font-semibold rounded-md transition-all text-slate-400 hover:text-white";
    tabOtp.className = "py-2 text-xs font-semibold rounded-md transition-all text-white bg-[#FF6B00]";
    formPassword.classList.add('hidden');
    formOtp.classList.remove('hidden');
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

function openForgotPasswordModal() {
  const modal = document.getElementById('forgot-password-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeForgotPasswordModal() {
  const modal = document.getElementById('forgot-password-modal');
  if (modal) modal.classList.add('hidden');
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

  window.UTILS.showLoader("Authenticating profile securely...");

  try {
    const isMobile = /^\d{10}$/.test(identifier);
    const session = await window.AUTH.login(identifier, password, isMobile ? "mobile" : "email");

    // Handle remember me
    if (rememberMe) {
      localStorage.setItem('vikas_remembered_identifier', identifier);
    } else {
      localStorage.removeItem('vikas_remembered_identifier');
    }

    window.UTILS.showToast(`Swagat hai, ${session.fullname}!`, "success");
    
    // Redirect based on role
    setTimeout(() => {
      window.location.replace(`${session.role}.html`);
    }, 1000);

  } catch (error) {
    window.UTILS.hideLoader();
    showLoginAlert(error.message || "Credential authentication failed.", "error");
  }
}

async function requestOtpCode() {
  const mobileInput = document.getElementById('login-mobile-otp');
  const mobile = mobileInput.value.trim();
  const debugHint = document.getElementById('otp-debug-hint');
  const otpContainer = document.getElementById('otp-code-container');
  const otpSubmitBtn = document.getElementById('btn-otp-submit');

  if (!/^\d{10}$/.test(mobile)) {
    window.UTILS.showToast("Please enter a valid 10-digit mobile number.", "error");
    return;
  }

  window.UTILS.showLoader("Sending secure OTP...");

  try {
    const users = await window.API.getUsers();
    const user = users.find(u => u.mobile === mobile);

    if (!user) {
      throw new Error("Mobile number is not registered in our loyalty database.");
    }

    if (user.status === "suspended") {
      throw new Error("Your profile is suspended. Please contact Vikas corporate desk.");
    }

    // Generate mock 6 digit OTP
    currentGeneratedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    window.UTILS.hideLoader();
    window.UTILS.showToast(`OTP code dispatched to mobile ending with ${mobile.slice(-4)}`, "success");

    // Enable OTP controls
    if (otpContainer) {
      otpContainer.classList.remove('opacity-40', 'pointer-events-none');
    }
    if (otpSubmitBtn) {
      otpSubmitBtn.removeAttribute('disabled');
      otpSubmitBtn.className = "w-full py-3 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-lg font-bold text-sm transition flex justify-center items-center gap-2 shadow-lg shadow-[#FF6B00]/20";
    }

    // Show debug hint so they know what OTP to type in preview mode
    if (debugHint) {
      debugHint.innerText = `DEBUG OTP CODE: ${currentGeneratedOtp} (Use this code to login)`;
      debugHint.classList.remove('hidden');
    }

  } catch (error) {
    window.UTILS.hideLoader();
    window.UTILS.showToast(error.message || "Failed to generate OTP code.", "error");
  }
}

async function handleOtpLogin(event) {
  event.preventDefault();
  const alertContainer = document.getElementById('alert-container');
  if (alertContainer) alertContainer.classList.add('hidden');

  const mobile = document.getElementById('login-mobile-otp').value.trim();
  const enteredOtp = document.getElementById('login-otp-value').value.trim();

  if (!mobile || !enteredOtp) {
    window.UTILS.showToast("Please complete mobile and OTP entry.", "error");
    return;
  }

  if (enteredOtp !== currentGeneratedOtp) {
    window.UTILS.showToast("Verification code mismatch. Please enter the correct OTP.", "error");
    return;
  }

  window.UTILS.showLoader("Verifying secure OTP...");

  try {
    const users = await window.API.getUsers();
    const user = users.find(u => u.mobile === mobile);

    if (!user) {
      throw new Error("Critical error: User session profiles match lost.");
    }

    // Authenticate session
    window.AUTH.setCurrentSession(user);
    await window.API.addLog("AUTH_IN", `Successful session OTP logon: ${user.fullname} [Role: ${user.role.toUpperCase()}]`);

    window.UTILS.showToast(`Swagat hai, ${user.fullname}!`, "success");
    
    setTimeout(() => {
      window.location.replace(`${user.role}.html`);
    }, 1000);

  } catch (error) {
    window.UTILS.hideLoader();
    window.UTILS.showToast(error.message || "OTP verification failed.", "error");
  }
}

function handleForgotPassword(event) {
  event.preventDefault();
  const email = document.getElementById('forgot-email').value.trim();
  if (!email) return;

  closeForgotPasswordModal();
  window.UTILS.showToast(`Password reset link has been dispatched to ${email}`, "success");
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

// Bind to window
window.initLoginPage = initLoginPage;
window.switchLoginMode = switchLoginMode;
window.togglePasswordVisibility = togglePasswordVisibility;
window.openForgotPasswordModal = openForgotPasswordModal;
window.closeForgotPasswordModal = closeForgotPasswordModal;
window.handlePasswordLogin = handlePasswordLogin;
window.requestOtpCode = requestOtpCode;
window.handleOtpLogin = handleOtpLogin;
window.handleForgotPassword = handleForgotPassword;
