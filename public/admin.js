const state = {
  adminToken: localStorage.getItem('ipasme-admin-token') || '',
  adminUser: JSON.parse(localStorage.getItem('ipasme-admin-user') || 'null')
};

const els = {
  loginCard: document.getElementById('loginCard'),
  adminDashboard: document.getElementById('adminDashboard'),
  dashboardStats: document.getElementById('dashboardStats'),
  adminAppointmentsList: document.getElementById('adminAppointmentsList'),
  reportStats: document.getElementById('reportStats'),
  specialtyAdminList: document.getElementById('specialtyAdminList'),
  doctorAdminList: document.getElementById('doctorAdminList'),
  institutionName: document.getElementById('institutionName'),
  institutionMission: document.getElementById('institutionMission'),
  institutionVision: document.getElementById('institutionVision'),
  institutionNotice: document.getElementById('institutionNotice'),
  specialtyName: document.getElementById('specialtyName'),
  specialtyDescription: document.getElementById('specialtyDescription'),
  doctorName: document.getElementById('doctorName'),
  doctorSpecialtyField: document.getElementById('doctorSpecialtyField'),
  doctorOffice: document.getElementById('doctorOffice'),
  doctorCapacity: document.getElementById('doctorCapacity'),
  doctorMorning: document.getElementById('doctorMorning'),
  doctorAfternoon: document.getElementById('doctorAfternoon'),
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
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Error en la operación.');
  }
  return payload;
}

function setLoggedInState() {
  if (state.adminToken && state.adminUser) {
    els.loginCard.classList.add('hidden');
    els.adminDashboard.classList.remove('hidden');
  } else {
    els.loginCard.classList.remove('hidden');
    els.adminDashboard.classList.add('hidden');
  }
}

async function loadPublicData() {
  try {
    const data = await fetchJson('/api/public');
    els.institutionName.value = data.institution.name;
    els.institutionMission.value = data.institution.mission;
    els.institutionVision.value = data.institution.vision;
    els.institutionNotice.value = data.institution.noticeText;

    els.doctorSpecialtyField.innerHTML = `<option value="">Seleccione especialidad</option>${data.specialties.map((s) => `<option value="${s.id}">${s.name}</option>`).join('')}`;
    els.specialtyAdminList.innerHTML = data.specialties.map((item) => `
      <div class="list-item"><strong>${item.name}</strong> — ${item.active ? 'Activa' : 'Inactiva'}</div>
    `).join('');
    els.doctorAdminList.innerHTML = data.doctors.map((doctor) => `
      <div class="list-item"><strong>${doctor.name}</strong> · ${data.specialties.find((s) => s.id === doctor.specialtyId)?.name || 'Sin especialidad'} · ${doctor.consultorio}</div>
    `).join('');
  } catch (error) {
    showToast(error.message);
  }
}

async function loadAdminDashboard() {
  try {
    const data = await fetchJson('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${state.adminToken}` }
    });
    const { dashboard } = data;
    els.dashboardStats.innerHTML = `
      <div class="stat-mini"><strong>${dashboard.total}</strong><br />Total</div>
      <div class="stat-mini"><strong>${dashboard.pendientes}</strong><br />Pendientes</div>
      <div class="stat-mini"><strong>${dashboard.confirmadas}</strong><br />Confirmadas</div>
      <div class="stat-mini"><strong>${dashboard.atendidas}</strong><br />Atendidas</div>
      <div class="stat-mini"><strong>${dashboard.canceladas}</strong><br />Canceladas</div>
      <div class="stat-mini"><strong>${dashboard.nuevos}</strong><br />Beneficiarios</div>
    `;

    els.adminAppointmentsList.innerHTML = (data.appointments || []).map((item) => `
      <div class="list-item">
        <strong>${item.appointmentNumber}</strong> · ${item.fullName}<br />
        ${item.specialtyName} · ${item.date} · ${item.turno} · ${item.hour}<br />
        Estado: ${item.status}
      </div>
    `).join('');

    const reports = await fetchJson('/api/admin/reports', {
      headers: { Authorization: `Bearer ${state.adminToken}` }
    });
    const reportData = reports.reports;
    els.reportStats.innerHTML = `
      <div><strong>Total:</strong> ${reportData.total}</div>
      <div><strong>Pendientes:</strong> ${reportData.pendientes}</div>
      <div><strong>Confirmadas:</strong> ${reportData.confirmadas}</div>
      <div><strong>Atendidas:</strong> ${reportData.atendidas}</div>
      <div><strong>Canceladas:</strong> ${reportData.canceladas}</div>
      <div><strong>Turno mañana:</strong> ${reportData.byTurno.mañana}</div>
      <div><strong>Turno tarde:</strong> ${reportData.byTurno.tarde}</div>
      <div><strong>Especialidades:</strong> ${Object.entries(reportData.bySpecialty).map(([name, value]) => `${name}: ${value}`).join(', ')}</div>
    `;
  } catch (error) {
    showToast(error.message);
  }
}

async function loginAdmin(event) {
  event.preventDefault();
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;

  try {
    const result = await fetchJson('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    state.adminToken = result.token;
    state.adminUser = result.user;
    localStorage.setItem('ipasme-admin-token', result.token);
    localStorage.setItem('ipasme-admin-user', JSON.stringify(result.user));
    setLoggedInState();
    await loadPublicData();
    await loadAdminDashboard();
    showToast('Sesión administrativa iniciada.');
  } catch (error) {
    showToast(error.message);
  }
}

async function updateInstitutionContent(event) {
  event.preventDefault();
  try {
    const payload = {
      name: els.institutionName.value,
      mission: els.institutionMission.value,
      vision: els.institutionVision.value,
      noticeText: els.institutionNotice.value
    };
    const result = await fetchJson('/api/admin/content', {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.adminToken}` },
      body: JSON.stringify(payload)
    });
    showToast(result.message);
    await loadPublicData();
  } catch (error) {
    showToast(error.message);
  }
}

async function saveSpecialty(event) {
  event.preventDefault();
  const payload = {
    id: crypto.randomUUID(),
    name: els.specialtyName.value,
    description: els.specialtyDescription.value,
    active: true
  };

  try {
    const result = await fetchJson('/api/admin/specialties', {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.adminToken}` },
      body: JSON.stringify(payload)
    });
    showToast(result.message);
    els.specialtyName.value = '';
    els.specialtyDescription.value = '';
    await loadPublicData();
    await loadAdminDashboard();
  } catch (error) {
    showToast(error.message);
  }
}

async function saveDoctor(event) {
  event.preventDefault();
  const payload = {
    name: els.doctorName.value,
    specialtyId: els.doctorSpecialtyField.value,
    consultorio: els.doctorOffice.value,
    status: 'activo',
    shiftCapacity: els.doctorCapacity.value,
    morning: els.doctorMorning.checked,
    afternoon: els.doctorAfternoon.checked
  };

  try {
    const result = await fetchJson('/api/admin/doctors', {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.adminToken}` },
      body: JSON.stringify(payload)
    });
    showToast(result.message);
    els.doctorName.value = '';
    els.doctorOffice.value = '';
    await loadPublicData();
    await loadAdminDashboard();
  } catch (error) {
    showToast(error.message);
  }
}

function logoutAdmin() {
  state.adminToken = '';
  state.adminUser = null;
  localStorage.removeItem('ipasme-admin-token');
  localStorage.removeItem('ipasme-admin-user');
  setLoggedInState();
  showToast('Sesión cerrada.');
}

document.getElementById('adminLoginForm').addEventListener('submit', loginAdmin);
document.getElementById('contentForm').addEventListener('submit', updateInstitutionContent);
document.getElementById('specialtyAdminForm').addEventListener('submit', saveSpecialty);
document.getElementById('doctorAdminForm').addEventListener('submit', saveDoctor);
document.getElementById('logoutAdminBtn').addEventListener('click', logoutAdmin);

setLoggedInState();
if (state.adminToken && state.adminUser) {
  loadPublicData();
  loadAdminDashboard();
}
