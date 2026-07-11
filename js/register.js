/* Registration Page Flow & Uploads - Vikas Automobiles */

let currentStep = 1;
let uploadedPhotoBase64 = "";

function updateRegisterProgress() {
  const progressBar = document.getElementById('register-progress-bar');
  if (!progressBar) return;

  const fullname = document.getElementById('reg-fullname')?.value.trim() || "";
  const email = document.getElementById('reg-email')?.value.trim() || "";
  const mobile = document.getElementById('reg-mobile')?.value.trim() || "";
  const password = document.getElementById('reg-password')?.value || "";
  const confirmPass = document.getElementById('reg-confirm-password')?.value || "";

  const firmName = document.getElementById('reg-firmname')?.value.trim() || "";
  const address = document.getElementById('reg-address')?.value.trim() || "";
  const city = document.getElementById('reg-city')?.value.trim() || "";
  
  const termsChecked = document.getElementById('reg-terms')?.checked || false;

  let totalItems = 9;
  let filledItems = 0;

  if (fullname) filledItems++;
  if (email) filledItems++;
  if (mobile) filledItems++;
  if (password) filledItems++;
  if (confirmPass) filledItems++;

  if (firmName) filledItems++;
  if (address) filledItems++;
  if (city) filledItems++;

  if (termsChecked) filledItems++;

  const progressPercent = Math.min(100, Math.round((filledItems / totalItems) * 100));
  progressBar.style.width = `${progressPercent}%`;
}

function initRegisterPage() {
  // If user is already logged in, redirect them
  const session = window.AUTH.getCurrentSession();
  if (session) {
    window.location.replace(`${session.role}.html`);
  }

  // Setup drag and drop events
  setupDragAndDrop();
  toggleUserTypeFields();
  setupPasswordStrengthValidation();

  // Setup progress bar listeners
  const inputsToTrack = [
    'reg-fullname', 'reg-email', 'reg-mobile', 'reg-password', 
    'reg-confirm-password', 'reg-firmname', 'reg-address', 'reg-city'
  ];
  inputsToTrack.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateRegisterProgress);
    }
  });

  const changesToTrack = ['reg-usertype', 'reg-terms'];
  changesToTrack.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', updateRegisterProgress);
    }
  });

  updateRegisterProgress();
}

function setupPasswordStrengthValidation() {
  const passwordInput = document.getElementById('reg-password');
  const confirmInput = document.getElementById('reg-confirm-password');
  const strengthContainer = document.getElementById('password-strength-container');
  const matchIndicator = document.getElementById('password-match-indicator');

  if (!passwordInput) return;

  const updateStrength = () => {
    const val = passwordInput.value;
    if (val.length === 0) {
      strengthContainer.classList.add('hidden');
      return;
    }
    strengthContainer.classList.remove('hidden');

    // Validation Criteria
    const checks = {
      length: val.length >= 8,
      upper: /[A-Z]/.test(val),
      number: /[0-9]/.test(val),
      special: /[^A-Za-z0-9]/.test(val)
    };

    // Update Checklist UI
    updateCriterionUI('crit-length', checks.length);
    updateCriterionUI('crit-upper', checks.upper);
    updateCriterionUI('crit-number', checks.number);
    updateCriterionUI('crit-special', checks.special);

    // Calculate score
    let score = 0;
    if (checks.length) score++;
    if (checks.upper) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    // Update Strength meter bars and text
    const bar1 = document.getElementById('strength-bar-1');
    const bar2 = document.getElementById('strength-bar-2');
    const bar3 = document.getElementById('strength-bar-3');
    const strengthText = document.getElementById('strength-text');

    if (!bar1 || !bar2 || !bar3 || !strengthText) return;

    // Reset bars
    bar1.className = "h-full bg-slate-700 transition-all duration-300";
    bar2.className = "h-full bg-slate-700 transition-all duration-300";
    bar3.className = "h-full bg-slate-700 transition-all duration-300";

    if (score === 0) {
      strengthText.innerText = "Too Short";
      strengthText.className = "text-[9px] font-bold font-mono uppercase text-slate-500 tracking-wider";
    } else if (score <= 2) {
      strengthText.innerText = "Weak";
      strengthText.className = "text-[9px] font-bold font-mono uppercase text-red-500 tracking-wider";
      bar1.className = "h-full bg-red-500 transition-all duration-300";
    } else if (score === 3) {
      strengthText.innerText = "Medium";
      strengthText.className = "text-[9px] font-bold font-mono uppercase text-blue-500 tracking-wider";
      bar1.className = "h-full bg-blue-500 transition-all duration-300";
      bar2.className = "h-full bg-blue-500 transition-all duration-300";
    } else {
      strengthText.innerText = "Strong";
      strengthText.className = "text-[9px] font-bold font-mono uppercase text-emerald-500 tracking-wider";
      bar1.className = "h-full bg-emerald-500 transition-all duration-300";
      bar2.className = "h-full bg-emerald-500 transition-all duration-300";
      bar3.className = "h-full bg-emerald-500 transition-all duration-300";
    }

    updateConfirmMatch();
  };

  const updateConfirmMatch = () => {
    const password = passwordInput.value;
    const confirmPassword = confirmInput ? confirmInput.value : '';

    if (!confirmInput || confirmPassword.length === 0) {
      if (matchIndicator) matchIndicator.classList.add('hidden');
      return;
    }

    if (matchIndicator) matchIndicator.classList.remove('hidden');
    const matchText = document.getElementById('match-text');
    const matchIcon = matchIndicator.querySelector('i') || matchIndicator.querySelector('[data-lucide]');

    if (password === confirmPassword && password.length > 0) {
      matchIndicator.className = "mt-2.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400";
      if (matchText) matchText.innerText = "Passwords match";
      if (matchIcon) {
        matchIcon.setAttribute('data-lucide', 'check-circle-2');
        matchIcon.className = "w-3 h-3 text-emerald-400 transition-colors";
      }
    } else {
      matchIndicator.className = "mt-2.5 flex items-center gap-1 text-[10px] font-medium text-red-400";
      if (matchText) matchText.innerText = "Passwords do not match";
      if (matchIcon) {
        matchIcon.setAttribute('data-lucide', 'x-circle');
        matchIcon.className = "w-3 h-3 text-red-400 transition-colors";
      }
    }
    if (window.lucide) window.lucide.createIcons();
  };

  passwordInput.addEventListener('input', updateStrength);
  if (confirmInput) {
    confirmInput.addEventListener('input', updateConfirmMatch);
  }
}

function updateCriterionUI(id, isValid) {
  const elem = document.getElementById(id);
  if (!elem) return;
  const icon = elem.querySelector('i') || elem.querySelector('[data-lucide]');

  if (isValid) {
    elem.className = "flex items-center gap-1 text-emerald-400 transition-all";
    if (icon) {
      icon.setAttribute('data-lucide', 'check-circle-2');
      icon.className = "w-3 h-3 text-emerald-400 transition-colors";
    }
  } else {
    elem.className = "flex items-center gap-1 text-slate-500 transition-all";
    if (icon) {
      icon.setAttribute('data-lucide', 'circle');
      icon.className = "w-3 h-3 text-slate-600 transition-colors";
    }
  }
  if (window.lucide) window.lucide.createIcons();
}

function toggleUserTypeFields() {
  // Update progress bar as required fields changed
  if (typeof updateRegisterProgress === 'function') {
    updateRegisterProgress();
  }
}

function validateStep(step) {
  if (step === 1) {
    const fullname = document.getElementById('reg-fullname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const mobile = document.getElementById('reg-mobile').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPass = document.getElementById('reg-confirm-password').value;

    if (!fullname || !mobile || !password || !confirmPass) {
      showRegisterAlert("Please fill in all required fields.");
      return false;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showRegisterAlert("Please enter a valid email address.");
      return false;
    }

    if (!/^\d{10}$/.test(mobile)) {
      showRegisterAlert("Mobile number must be exactly 10 digits.");
      return false;
    }

    if (password.length < 6) {
      showRegisterAlert("Password must be at least 6 characters long.");
      return false;
    }

    if (password !== confirmPass) {
      showRegisterAlert("Passwords do not match.");
      return false;
    }
  }

  if (step === 2) {
    const firmName = document.getElementById('reg-firmname').value.trim();
    const address = document.getElementById('reg-address').value.trim();
    const city = document.getElementById('reg-city').value.trim();

    if (!firmName || !address || !city) {
      showRegisterAlert("Please fill in all business details.");
      return false;
    }
  }

  hideRegisterAlert();
  return true;
}

function nextStep(step) {
  // If moving forward, validate current step first
  if (step > currentStep) {
    if (!validateStep(currentStep)) return;
  }

  // Update step tracker
  currentStep = step;

  // Swap sections visibility
  document.getElementById('step-section-1').classList.add('hidden');
  document.getElementById('step-section-2').classList.add('hidden');
  document.getElementById('step-section-3').classList.add('hidden');
  document.getElementById(`step-section-${step}`).classList.remove('hidden');

  // Update step indicators active styling
  const badge1 = document.getElementById('badge-step-1');
  const badge2 = document.getElementById('badge-step-2');
  const badge3 = document.getElementById('badge-step-3');
  const progressLine = document.getElementById('step-line-progress');

  if (step === 1) {
    badge1.className = "w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold font-mono border-4 border-white shadow-sm transition-all";
    badge2.className = "w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold font-mono border-4 border-white shadow-sm transition-all";
    badge3.className = "w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold font-mono border-4 border-white shadow-sm transition-all";
    if (progressLine) progressLine.style.width = "0%";
  } else if (step === 2) {
    badge1.className = "w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold font-mono border-4 border-white shadow-sm transition-all";
    badge2.className = "w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold font-mono border-4 border-white shadow-sm transition-all";
    badge3.className = "w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold font-mono border-4 border-white shadow-sm transition-all";
    if (progressLine) progressLine.style.width = "50%";
  } else if (step === 3) {
    badge1.className = "w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold font-mono border-4 border-white shadow-sm transition-all";
    badge2.className = "w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold font-mono border-4 border-white shadow-sm transition-all";
    badge3.className = "w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold font-mono border-4 border-white shadow-sm transition-all";
    if (progressLine) progressLine.style.width = "100%";
  }

  // Scroll back to top of container
  const container = document.querySelector('.my-8');
  if (container) container.scrollIntoView({ behavior: 'smooth' });
}

function setupDragAndDrop() {
  const dropZone = document.getElementById('drop-zone');
  if (!dropZone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('border-blue-500', 'bg-blue-50');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500', 'bg-blue-50');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length) {
      const fileInput = document.getElementById('reg-photo-file');
      if (fileInput) {
        fileInput.files = files;
        handlePhotoFileSelected(fileInput);
      }
    }
  }, false);
}

function handlePhotoFileSelected(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    
    if (file.size > 2 * 1024 * 1024) {
      window.UTILS.showToast("Profile image exceeds 2MB limit.", "error");
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      uploadedPhotoBase64 = e.target.result;
      const preview = document.getElementById('img-profile-preview');
      const clearBtn = document.getElementById('btn-clear-photo');
      
      if (preview) {
        preview.src = uploadedPhotoBase64;
        preview.classList.remove('hidden');
      }
      if (clearBtn) {
        clearBtn.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);
  }
}

function clearProfilePhoto(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const input = document.getElementById('reg-photo-file');
  const preview = document.getElementById('img-profile-preview');
  const clearBtn = document.getElementById('btn-clear-photo');

  if (input) input.value = "";
  if (preview) {
    preview.src = "";
    preview.classList.add('hidden');
  }
  if (clearBtn) clearBtn.classList.add('hidden');
  uploadedPhotoBase64 = "";
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

async function handleRegistrationSubmit(event) {
  event.preventDefault();
  
  // Final checks
  const terms = document.getElementById('reg-terms').checked;
  if (!terms) {
    showRegisterAlert("You must agree to the Terms & Verification Certifications.");
    return;
  }

  window.UTILS.showLoader("Registering loyalty account...");

  try {
    const fullname = document.getElementById('reg-fullname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const mobile = document.getElementById('reg-mobile').value.trim();
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-usertype').value;
    const firmName = document.getElementById('reg-firmname').value.trim();
    const referral = document.getElementById('reg-referral').value.trim();
    const gstin = "";
    const panCard = "";
    const addressLine = document.getElementById('reg-address').value.trim();
    const city = document.getElementById('reg-city').value.trim();

    const fullAddress = `${addressLine}, ${city}`;

    const userData = {
      fullname,
      email,
      mobile,
      password,
      role,
      firmName,
      address: fullAddress,
      pincode: "",
      gstin: "",
      panCard: "",
      photo: uploadedPhotoBase64 || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop"
    };

    const response = await window.AUTH.register(userData);
    
    window.UTILS.hideLoader();
    window.UTILS.showToast("Registration submitted successfully!", "success");

    // Display long form alert
    const alertContainer = document.getElementById('register-alert');
    if (alertContainer) {
      alertContainer.innerHTML = `
        <div class="space-y-2">
          <p class="text-emerald-400 font-bold">✓ Account Created Successfully!</p>
          <p class="text-slate-700">Your profile is currently <span class="text-blue-600 font-bold">PENDING APPROVAL</span> from the Vikas Automobiles corporate team.</p>
          <p class="text-slate-400">Once approved (typically within 2-4 business hours), you will be able to sign in and redeem points.</p>
        </div>
      `;
      alertContainer.className = "mb-6 p-4 rounded-lg border border-emerald-500/20 text-xs font-semibold bg-emerald-500/10";
      alertContainer.classList.remove('hidden');
    }

    // Hide registration form fields
    const form = document.getElementById('form-register');
    if (form) {
      form.classList.add('hidden');
    }

    // Redirect to login after 5 seconds
    setTimeout(() => {
      window.location.replace("login.html");
    }, 5000);

  } catch (error) {
    window.UTILS.hideLoader();
    showRegisterAlert(error.message || "Failed to register profile account.");
  }
}

function showRegisterAlert(message) {
  const alertContainer = document.getElementById('register-alert');
  if (!alertContainer) return;

  alertContainer.innerText = message;
  alertContainer.className = "mb-6 p-4 rounded-lg border border-red-500/20 text-xs font-semibold bg-red-500/10 text-red-400";
  alertContainer.classList.remove('hidden');
  
  // Scroll to alert
  alertContainer.scrollIntoView({ behavior: 'smooth' });
}

function hideRegisterAlert() {
  const alertContainer = document.getElementById('register-alert');
  if (alertContainer) alertContainer.classList.add('hidden');
}

// Bind to window
window.initRegisterPage = initRegisterPage;
window.toggleUserTypeFields = toggleUserTypeFields;
window.nextStep = nextStep;
window.handlePhotoFileSelected = handlePhotoFileSelected;
window.clearProfilePhoto = clearProfilePhoto;
window.togglePasswordVisibility = togglePasswordVisibility;
window.handleRegistrationSubmit = handleRegistrationSubmit;
window.updateRegisterProgress = updateRegisterProgress;
