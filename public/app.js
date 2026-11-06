const state = {
  publicData: null,
  token: localStorage.getItem('ipasme-beneficiary-token') || '',
  currentUser: JSON.parse(localStorage.getItem('ipasme-beneficiary-user') || 'null')
};

const validators = {
  onlyLetters: (value) => /^[A-Za-zÁÉÍÓÚáéíóúñÑüÜ\s'-]+$/.test(String(value).trim()),
  onlyNumbers: (value) => /^\d+$/.test(String(value).trim()),
  alphaNumeric: (value) => /^[A-Za-z0-9\s\-/]+$/.test(String(value).trim()),
  password: (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(String(value)),
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim()),
  phone: (value) => /^\+?[0-9\s-]{7,15}$/.test(String(value).trim()),
  symptom: (value) => /^[A-Za-z0-9ÁÉÍÓÚáéíóúñÑüÜ\s.,;:-]+$/.test(String(value).trim())
};

function validateField(name, value, rules) {
  if (!rules || !rules.length) return '';

  for (const rule of rules) {
    if (rule.type === 'required' && (!value || !String(value).trim())) {
      return rule.message;
    }
    if (rule.type === 'pattern' && value && !rule.validator(String(value))) {
      return rule.message;
    }
  }

  return '';
}

const els = {
  addressInfo: document.getElementById('addressInfo'),
  hoursInfo: document.getElementById('hoursInfo'),
  phoneInfo: document.getElementById('phoneInfo'),
  faxInfo: document.getElementById('faxInfo'),
  mapsLink: document.getElementById('mapsLink'),
  institutionSummary: document.getElementById('institutionSummary'),
  servicesGrid: document.getElementById('servicesGrid'),
  specialtiesGrid: document.getElementById('specialtiesGrid'),
  doctorsGrid: document.getElementById('doctorsGrid'),
  requirementsList: document.getElementById('requirementsList'),
  faqsList: document.getElementById('faqsList'),
  newsGrid: document.getElementById('newsGrid'),
  specialtySelect: document.getElementById('specialtySelect'),
  doctorSelect: document.getElementById('doctorSelect'),
  appointmentDate: document.getElementById('appointmentDate'),
  turnoSelect: document.getElementById('turnoSelect'),
  hourSelect: document.getElementById('hourSelect'),
  symptomInput: document.getElementById('symptomInput'),
  appointmentPanel: document.getElementById('appointmentPanel'),
  userAppointments: document.getElementById('userAppointments'),
  toast: document.getElementById('toast')
};

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('visible');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => els.toast.classList.remove('visible'), 3500);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Se produjo un error.');
  }
  return payload;
}

function renderInstitution(data) {
  const institution = data.institution;
  els.addressInfo.textContent = institution.address;
  els.hoursInfo.textContent = `${institution.attentionHours} · ${institution.openingHours.morning} / ${institution.openingHours.afternoon}`;
  els.phoneInfo.textContent = institution.phone;
  els.faxInfo.textContent = institution.fax;
  els.mapsLink.href = institution.mapUrl;
  els.institutionSummary.textContent = `${institution.name} promueve salud, prevención y atención integral para la comunidad IPASME.`;
  document.getElementById('footerAddress').textContent = institution.address;
  document.getElementById('footerPhone').textContent = institution.phone;
  document.getElementById('footerFax').textContent = institution.fax;
  document.getElementById('footerHours').textContent = institution.attentionHours;

}

function renderServices(data) {
  const services = [
    { title: 'Atención primaria', text: 'Consulta general, valoración inicial y seguimiento de salud.' },
    { title: 'Especialidades clínicas', text: 'Medicina interna, cardiología, ginecología, pediatría y más.' },
    { title: 'Prevención y programas', text: 'Inmunización, orientación y campañas sanitarias en beneficio de la comunidad.' },
    { title: 'Laboratorio y radiología', text: 'Diagnóstico de apoyo para mejores decisiones clínicas.' },
    { title: 'Salud de la familia', text: 'Atención integral de acuerdo con la necesidad y perfil del beneficiario.' },
    { title: 'Soporte administrativo', text: 'Programación, información y atención orientada a los usuarios.' }
  ];

  els.servicesGrid.innerHTML = services.map((service) => `
    <article class="card mini-card">
      <span class="chip">Servicio</span>
      <h3>${service.title}</h3>
      <p>${service.text}</p>
    </article>
  `).join('');
}

function renderSpecialties(data) {
  const specialtyIcons = {
    'medicina-general': '🩺',
    'medicina-interna': '💊',
    pediatria: '👶',
    odontologia: '🦷',
    cardiologia: '❤️',
    ginecologia: '🩺',
    traumatologia: '🦴',
    dermatologia: '✨',
    oftalmologia: '👁️',
    psicologia: '🧠',
    psiquiatria: '🌿',
    fisioterapia: '🏃',
    laboratorio: '🧪',
    radiologia: '📷',
    inmunizacion: '💉'
  };

  const specialtiesCount = document.getElementById('specialtiesCount');
  if (specialtiesCount) specialtiesCount.textContent = data.specialties.length;
  els.specialtiesGrid.innerHTML = data.specialties.map((item) => `
    <article class="card mini-card specialty-card">
      <div class="specialty-icon" aria-hidden="true">${specialtyIcons[item.id] || '🩺'}</div>
      <span class="chip">${item.active ? 'Disponible' : 'No disponible'}</span>
      <h3>${item.name}</h3>
      <p>${item.description}</p>
    </article>
  `).join('');

  const options = data.specialties.map((item) => `<option value="${item.id}">${item.name}</option>`).join('');
  if (els.specialtySelect) {
    els.specialtySelect.innerHTML = `<option value="">Seleccione especialidad</option>${options}`;
  }

  const doctorSpecialtyField = document.getElementById('doctorSpecialtyField');
  if (doctorSpecialtyField) {
    doctorSpecialtyField.innerHTML = `<option value="">Seleccione especialidad</option>${options}`;
  }

  if (els.specialtyAdminList) {
    els.specialtyAdminList.innerHTML = data.specialties.map((item) => `
      <div class="list-item">
        <strong>${item.name}</strong> — ${item.active ? 'Activa' : 'Inactiva'}
      </div>
    `).join('');
  }
}

function renderDoctors(data) {
  const doctorsCount = document.getElementById('doctorsCount');
  if (doctorsCount) doctorsCount.textContent = data.doctors.length;
  els.doctorsGrid.innerHTML = data.doctors.map((doctor) => `
    <article class="card mini-card">
      <span class="chip">${doctor.status}</span>
      <h3>${doctor.name}</h3>
      <p><strong>Especialidad:</strong> ${data.specialties.find((s) => s.id === doctor.specialtyId)?.name || 'General'}</p>
      <p><strong>Consultorio:</strong> ${doctor.consultorio}</p>
      <p><strong>Turnos:</strong> ${doctor.schedule.morning ? 'Mañana' : ''}${doctor.schedule.morning && doctor.schedule.afternoon ? ' / ' : ''}${doctor.schedule.afternoon ? 'Tarde' : ''}</p>
    </article>
  `).join('');

  if (els.doctorSelect) {
    els.doctorSelect.innerHTML = `<option value="">Seleccione médico (opcional)</option>${data.doctors
      .map((doctor) => `<option value="${doctor.id}">${doctor.name}</option>`)
      .join('')}`;
  }

  if (els.doctorAdminList) {
    els.doctorAdminList.innerHTML = data.doctors.map((doctor) => `
      <div class="list-item">
        <strong>${doctor.name}</strong> · ${data.specialties.find((s) => s.id === doctor.specialtyId)?.name || 'Sin especialidad'} · ${doctor.consultorio}
      </div>
    `).join('');
  }
}

function renderRequirements(data) {
  els.requirementsList.innerHTML = data.requirements.map((item) => `<li>${item}</li>`).join('');
  els.faqsList.innerHTML = data.faqs.map((item) => `
    <div class="faq-item">
      <h4>${item.question}</h4>
      <p>${item.answer}</p>
    </div>
  `).join('');
}

function renderNews(data) {
  els.newsGrid.innerHTML = data.news.map((item) => `
    <article class="card mini-card">
      <span class="chip">Aviso</span>
      <h3>${item.title}</h3>
      <p>${item.text}</p>
      <small>${item.date}</small>
    </article>
  `).join('');
}

function renderPublicData() {
  const data = state.publicData;
  if (!data) return;
  renderInstitution(data);
  renderServices(data);
  renderSpecialties(data);
  renderDoctors(data);
  renderRequirements(data);
  renderNews(data);
  document.getElementById('appointmentsCount').textContent = data.stats.totalAppointments;
}

function setAppointmentSlots() {
  const date = els.appointmentDate.value;
  const turno = els.turnoSelect.value;
  const startTimes = turno === 'mañana' ? ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] : ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

  els.hourSelect.innerHTML = `<option value="">Seleccione horario</option>${startTimes.map((slot) => `<option value="${slot}">${slot}</option>`).join('')}`;

  if (!date || !turno) {
    return;
  }
}

function renderAppointmentsList(items) {
  if (!items || !items.length) {
    els.userAppointments.innerHTML = '<div class="mini-item">No tienes citas registradas.</div>';
    return;
  }

  els.userAppointments.innerHTML = items.map((appointment) => `
    <div class="mini-item">
      <strong>${appointment.appointmentNumber}</strong><br />
      ${appointment.specialtyName} · ${appointment.date} · ${appointment.turno} · ${appointment.hour}<br />
      <small>Estado: ${appointment.status}</small>
    </div>
  `).join('');
}

async function loadPublicData() {
  const data = await fetchJson('/api/public');
  state.publicData = data;
  renderPublicData();
}

async function registerUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());

  const errors = [
    validateField('firstName', payload.firstName, [{ type: 'required', message: 'Los nombres son obligatorios.' }, { type: 'pattern', validator: validators.onlyLetters, message: 'Los nombres solo deben contener letras, espacios y acentos.' }]),
    validateField('lastName', payload.lastName, [{ type: 'required', message: 'Los apellidos son obligatorios.' }, { type: 'pattern', validator: validators.onlyLetters, message: 'Los apellidos solo deben contener letras, espacios y acentos.' }]),
    validateField('cedula', payload.cedula, [{ type: 'required', message: 'La cédula es obligatoria.' }, { type: 'pattern', validator: validators.onlyNumbers, message: 'La cédula debe contener solo números.' }]),
    validateField('email', payload.email, [{ type: 'required', message: 'El correo es obligatorio.' }, { type: 'pattern', validator: validators.email, message: 'El correo electrónico no es válido.' }]),
    validateField('phone', payload.phone, [{ type: 'required', message: 'El teléfono es obligatorio.' }, { type: 'pattern', validator: validators.phone, message: 'El teléfono solo puede llevar números, espacios, + y guiones.' }]),
    validateField('birthDate', payload.birthDate, [{ type: 'required', message: 'La fecha de nacimiento es obligatoria.' }]),
    validateField('password', payload.password, [{ type: 'required', message: 'La contraseña es obligatoria.' }, { type: 'pattern', validator: validators.password, message: 'La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y un símbolo.' }]),
    validateField('fileNumber', payload.fileNumber, [{ type: 'pattern', validator: validators.alphaNumeric, message: 'El expediente solo puede contener letras, números, guion, barra o espacios.' }])
  ].filter(Boolean);

  if (errors.length) {
    showToast(errors[0]);
    return;
  }

  try {
    const result = await fetchJson('/api/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    state.token = result.token;
    localStorage.setItem('ipasme-beneficiary-token', result.token);
    localStorage.setItem('ipasme-beneficiary-user', JSON.stringify({ id: result.beneficiaryId, email: result.email }));
    form.reset();
    showToast(result.message);
    document.getElementById('loginEmail').value = result.email;
    document.getElementById('loginPassword').value = payload.password;
  } catch (error) {
    showToast(error.message);
  }
}

async function loginUser(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const result = await fetchJson('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    state.token = result.token;
    state.currentUser = result.user;
    localStorage.setItem('ipasme-beneficiary-token', result.token);
    localStorage.setItem('ipasme-beneficiary-user', JSON.stringify(result.user));
    showToast(result.message);
    renderAuthenticatedState();
    await loadUserAppointments();
  } catch (error) {
    showToast(error.message);
  }
}

async function verifyEmail() {
  const code = document.getElementById('verificationCode').value.trim();
  if (!code) {
    showToast('Ingresa el código de verificación.');
    return;
  }

  try {
    const result = await fetchJson('/api/verify-email', {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.token}` },
      body: JSON.stringify({ code })
    });
    state.currentUser = result.user;
    localStorage.setItem('ipasme-beneficiary-user', JSON.stringify(result.user));
    showToast(result.message);
    renderAuthenticatedState();
  } catch (error) {
    showToast(error.message);
  }
}

async function loadUserAppointments() {
  if (!state.token) {
    els.appointmentPanel.classList.add('hidden');
    return;
  }
  try {
    const result = await fetchJson('/api/appointments', {
      headers: { Authorization: `Bearer ${state.token}` }
    });
    renderAppointmentsList(result.appointments);
  } catch (error) {
    showToast(error.message);
  }
}

function renderAuthenticatedState() {
  const isLoggedIn = !!state.token && !!state.currentUser;
  if (!isLoggedIn) {
    els.appointmentPanel.classList.add('hidden');
    return;
  }

  els.appointmentPanel.classList.remove('hidden');
  if (state.currentUser.emailVerified) {
    document.getElementById('verificationCode').closest('.verification-box').style.display = 'none';
  }
}

async function createAppointment(event) {
  event.preventDefault();
  if (!state.token) {
    showToast('Debes iniciar sesión para agendar la cita.');
    return;
  }

  const symptom = (els.symptomInput.value || '').trim();
  if (!symptom) {
    showToast('El motivo o síntoma es obligatorio.');
    return;
  }
  if (!validators.symptom(symptom)) {
    showToast('El motivo solo puede contener letras, números y signos básicos de puntuación.');
    return;
  }

  const payload = {
    specialtyId: els.specialtySelect.value,
    doctorId: els.doctorSelect.value || null,
    date: els.appointmentDate.value,
    turno: els.turnoSelect.value,
    hour: els.hourSelect.value,
    symptom
  };

  try {
    const result = await fetchJson('/api/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.token}` },
      body: JSON.stringify(payload)
    });
    showToast(result.message);
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
      appointmentForm.reset();
    }
    loadUserAppointments();
  } catch (error) {
    showToast(error.message);
  }
}

function initUserState() {
  if (state.token && state.currentUser) {
    renderAuthenticatedState();
    loadUserAppointments();
  }
}

document.getElementById('registerForm').addEventListener('submit', registerUser);
document.getElementById('loginForm').addEventListener('submit', loginUser);
document.getElementById('verifyEmailBtn').addEventListener('click', verifyEmail);
document.getElementById('appointmentForm').addEventListener('submit', createAppointment);
document.getElementById('openBookingBtn').addEventListener('click', () => {
  document.getElementById('auth').scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('heroRequestBtn').addEventListener('click', () => {
  document.getElementById('auth').scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('showInfoBtn').addEventListener('click', () => {
  document.getElementById('servicios').scrollIntoView({ behavior: 'smooth' });
});
els.turnoSelect.addEventListener('change', setAppointmentSlots);
els.appointmentDate.addEventListener('change', setAppointmentSlots);

(async function bootstrap() {
  try {
    await loadPublicData();
    initUserState();
  } catch (error) {
    showToast(error.message);
  }
})();
