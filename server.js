require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'data', 'store.json');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return {
    url: SUPABASE_URL.replace(/\/$/, ''),
    key: SUPABASE_SERVICE_ROLE_KEY
  };
}

function supabaseRequest(method, endpoint, body) {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  const args = [
    '-sS',
    '-X',
    method,
    endpoint,
    '-H',
    `apikey: ${config.key}`,
    '-H',
    'Authorization: Bearer ' + config.key,
    '-H',
    'Accept: application/json'
  ];

  if (body) {
    args.push('-H', 'Content-Type: application/json');
    args.push('--data', JSON.stringify(body));
  }

  try {
    const response = execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
    if (!response || response.trim() === '') {
      return null;
    }
    return JSON.parse(response);
  } catch (error) {
    console.warn('Supabase request failed:', error.message);
    return null;
  }
}

function readSupabaseStore() {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  const endpoint = `${config.url}/rest/v1/app_data?id=eq.main&select=payload`;
  const data = supabaseRequest('GET', endpoint, null);
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  return data[0].payload || null;
}

function writeSupabaseStore(store) {
  const config = getSupabaseConfig();
  if (!config) {
    return false;
  }

  const endpoint = `${config.url}/rest/v1/app_data?id=eq.main`;
  const current = readSupabaseStore();

  if (current === null) {
    const result = supabaseRequest('POST', `${config.url}/rest/v1/app_data`, { id: 'main', payload: store });
    return result !== null;
  }

  const result = supabaseRequest('PATCH', endpoint, { payload: store });
  return result !== null;
}

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function defaultStore() {
  return {
    institution: {
      name: 'Unidad MÃ©dica IPASME Rubio',
      address: 'Av. Manuel Pulido MÃ©ndez, frente al Estadio Leonardo AlarcÃ³n, N.Âº 19-73, parroquia Rubio, municipio JunÃ­n, estado TÃ¡chira, Venezuela.',
      phone: '0276-7621723',
      fax: '0276-7623121 / 7622102',
      attentionHours: 'MaÃ±ana y tarde',
      mission: 'Promover la salud, la prevenciÃ³n y la atenciÃ³n integral de la comunidad IPASME con calidad, calidez y enfoque humano.',
      vision: 'Ser una instituciÃ³n lÃ­der en medicina preventiva y atenciÃ³n primaria, reconocida por la calidad y accesibilidad de sus servicios.',
      values: ['Calidez humana', 'Respeto', 'Solidaridad', 'Profesionalismo', 'Responsabilidad social'],
      services: 'AtenciÃ³n primaria, especialidades clÃ­nicas, odontologÃ­a, laboratorio, radiologÃ­a, inmunizaciÃ³n y programas de salud preventiva.',
      mapUrl: 'https://maps.google.com/?q=Unidad+MÃ©dica+IPASME+Rubio',
      emergencyText: 'Si presenta sÃ­ntomas de urgencia, dirÃ­jase al servicio de atenciÃ³n inmediata o al centro asistencial mÃ¡s cercano.',
      privacyText: 'Los datos personales se manejan con confidencialidad y solo se usan para la atenciÃ³n, administraciÃ³n y comunicaciÃ³n de citas.',
      noticeText: 'La atenciÃ³n mÃ©dica se realiza bajo cita previa y disponibilidad programada.',
      openingHours: {
        morning: '8:00 AM - 12:00 PM',
        afternoon: '2:00 PM - 5:00 PM'
      }
    },
    news: [
      { id: 'n1', title: 'CampaÃ±a de prevenciÃ³n cardiovascular', text: 'Consulta gratuita y orientaciÃ³n para pacientes con riesgo cardiovascular. Centro de salud en horario de maÃ±ana.', date: '2026-11-06' },
      { id: 'n2', title: 'InmunizaciÃ³n infantil', text: 'Se habilita agenda para vacunaciÃ³n de rutina en coordinaciÃ³n con la Unidad.', date: '2026-11-04' }
    ],
    faqs: [
      { question: 'Â¿Necesito registrarme para consultar especialidades?', answer: 'No. Puedes explorar la informaciÃ³n de especialidades y disponibilidad sin crear cuenta. Para solicitar una cita, debes registrarte e iniciar sesiÃ³n.' },
      { question: 'Â¿QuÃ© documentos necesito?', answer: 'La cÃ©dula de identidad, datos personales y, si aplica, nÃºmero de expediente o cÃ³digo IPASME.' },
      { question: 'Â¿Puedo reprogramar una cita?', answer: 'SÃ­. Desde la secciÃ³n de historial y gestiÃ³n de citas puedes solicitar la reprogramaciÃ³n si la cita aÃºn estÃ¡ activa.' }
    ],
    requirements: [
      'Presentar cÃ©dula de identidad al momento de la atenciÃ³n.',
      'Llegar con 10 minutos de anticipaciÃ³n.',
      'Traer medicamentos habituales o indicaciones previas si se requieren.',
      'Si es primera vez, informar su nÃºmero de expediente o cÃ³digo IPASME.'
    ],
    specialties: [
      { id: 'medicina-general', name: 'Medicina General', active: true, description: 'AtenciÃ³n integral y preventiva.' },
      { id: 'medicina-interna', name: 'Medicina Interna', active: true, description: 'Control y manejo de enfermedades crÃ³nicas.' },
      { id: 'pediatria', name: 'PediatrÃ­a', active: true, description: 'AtenciÃ³n para niÃ±as y niÃ±os.' },
      { id: 'odontologia', name: 'OdontologÃ­a', active: true, description: 'Consulta odontolÃ³gica general y preventiva.' },
      { id: 'cardiologia', name: 'CardiologÃ­a', active: true, description: 'AtenciÃ³n cardÃ­aca y evaluaciÃ³n integral.' },
      { id: 'ginecologia', name: 'GinecologÃ­a y Obstetricia', active: true, description: 'Control y atenciÃ³n de salud femenina.' },
      { id: 'traumatologia', name: 'TraumatologÃ­a', active: true, description: 'EvaluaciÃ³n ortopÃ©dica y traumatolÃ³gica.' },
      { id: 'dermatologia', name: 'DermatologÃ­a', active: true, description: 'AtenciÃ³n clÃ­nica y estÃ©tica cutÃ¡nea.' },
      { id: 'oftalmologia', name: 'OftalmologÃ­a', active: true, description: 'AtenciÃ³n visual y revisiÃ³n ocular.' },
      { id: 'psicologia', name: 'PsicologÃ­a', active: true, description: 'AcompaÃ±amiento terapÃ©utico y evaluaciÃ³n.' },
      { id: 'psiquiatria', name: 'PsiquiatrÃ­a', active: true, description: 'AtenciÃ³n de salud mental y seguimiento.' },
      { id: 'fisioterapia', name: 'Fisioterapia', active: true, description: 'RehabilitaciÃ³n funcional y prevenciÃ³n.' },
      { id: 'laboratorio', name: 'Laboratorio', active: true, description: 'ExÃ¡menes de laboratorio y control de salud.' },
      { id: 'radiologia', name: 'RadiologÃ­a e ImagenologÃ­a', active: true, description: 'Estudios de diagnÃ³stico por imagen.' },
      { id: 'inmunizacion', name: 'InmunizaciÃ³n', active: true, description: 'Programas de vacunaciÃ³n y control.' }
    ],
    doctors: [
      { id: 'doc-1', name: 'Dra. Ana PÃ©rez', specialtyId: 'medicina-general', consultorio: 'Sala 1', status: 'activo', shiftCapacity: 10, schedule: { morning: true, afternoon: true }, phone: '0414-0000001' },
      { id: 'doc-2', name: 'Dr. Carlos Rojas', specialtyId: 'medicina-interna', consultorio: 'Sala 2', status: 'activo', shiftCapacity: 8, schedule: { morning: true, afternoon: false }, phone: '0414-0000002' },
      { id: 'doc-3', name: 'Dra. Lucia Medina', specialtyId: 'pediatria', consultorio: 'Sala 3', status: 'activo', shiftCapacity: 9, schedule: { morning: true, afternoon: true }, phone: '0414-0000003' },
      { id: 'doc-4', name: 'Dr. AndrÃ©s LeÃ³n', specialtyId: 'odontologia', consultorio: 'Sala 4', status: 'activo', shiftCapacity: 7, schedule: { morning: false, afternoon: true }, phone: '0414-0000004' }
    ],
    beneficiaries: [],
    appointments: [],
    adminUsers: [
      { id: 'admin-1', username: 'admin', password: 'Admin123!', role: 'superadmin', name: 'AdministraciÃ³n IPASME', token: null },
      { id: 'admin-2', username: 'coordinador', password: 'Coordinador123!', role: 'coordinador', name: 'Coordinador MÃ©dico', token: null }
    ],
    notifications: [],
    auditLog: []
  };
}

function ensureStore() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(defaultStore(), null, 2));
  }
}

function readStore() {
  const supabaseStore = readSupabaseStore();
  if (supabaseStore) {
    return supabaseStore;
  }

  ensureStore();
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function writeStore(store) {
  const saved = writeSupabaseStore(store);
  if (saved) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2));
    return;
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2));
}

function randomToken() {
  return crypto.randomBytes(24).toString('hex');
}

function createNotification(store, type, destination, message, meta = {}) {
  const record = {
    id: crypto.randomUUID(),
    type,
    destination,
    message,
    meta,
    createdAt: new Date().toISOString()
  };
  store.notifications.unshift(record);
  return record;
}

function audit(store, actor, action, details) {
  store.auditLog.unshift({
    id: crypto.randomUUID(),
    actor,
    action,
    details,
    createdAt: new Date().toISOString()
  });
}

function statusResponse(status, data) {
  return { status, data };
}

function requireAdminToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Debe iniciar sesiÃ³n como administrador.' });
  }

  const store = readStore();
  const admin = store.adminUsers.find((user) => user.token === token);
  if (!admin) {
    return res.status(401).json({ message: 'Token de administrador invÃ¡lido.' });
  }

  req.admin = admin;
  next();
}

function requireBeneficiaryToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Debe iniciar sesiÃ³n para continuar.' });
  }

  const store = readStore();
  const beneficiary = store.beneficiaries.find((item) => item.token === token);
  if (!beneficiary) {
    return res.status(401).json({ message: 'Token de usuario invÃ¡lido.' });
  }

  req.beneficiary = beneficiary;
  next();
}

function validateBeneficiaryPayload(payload) {
  const errors = [];
  const onlyLetters = /^[A-Za-zÃÃ‰ÃÃ“ÃšÃ¡Ã©Ã­Ã³ÃºÃ±Ã‘Ã¼Ãœ\s'-]+$/;
  const onlyNumbers = /^\d+$/;
  const alphaNumeric = /^[A-Za-z0-9\s\-/]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[0-9\s-]{7,15}$/;

  if (!payload.firstName || !onlyLetters.test(String(payload.firstName).trim())) {
    errors.push('Los nombres solo deben contener letras, espacios y acentos.');
  }
  if (!payload.lastName || !onlyLetters.test(String(payload.lastName).trim())) {
    errors.push('Los apellidos solo deben contener letras, espacios y acentos.');
  }
  if (!payload.cedula || !onlyNumbers.test(String(payload.cedula).trim())) {
    errors.push('La cÃ©dula debe contener solo nÃºmeros.');
  }
  if (!payload.email || !emailRegex.test(String(payload.email).trim())) {
    errors.push('El correo electrÃ³nico no es vÃ¡lido.');
  }
  if (!payload.phone || !phoneRegex.test(String(payload.phone).trim())) {
    errors.push('El telÃ©fono solo puede llevar nÃºmeros, espacios, + y guiones.');
  }
  if (!payload.birthDate) {
    errors.push('La fecha de nacimiento es obligatoria.');
  }
  if (!payload.password || !passwordRegex.test(String(payload.password))) {
    errors.push('La contraseÃ±a debe tener mÃ­nimo 8 caracteres, mayÃºscula, minÃºscula, nÃºmero y un sÃ­mbolo.');
  }
  if (payload.fileNumber && !alphaNumeric.test(String(payload.fileNumber).trim())) {
    errors.push('El expediente solo puede contener letras, nÃºmeros, guion, barra o espacios.');
  }

  return errors;
}

app.get('/api/public', (req, res) => {
  const store = readStore();
  const activeSpecialties = store.specialties.filter((item) => item.active).map((item) => ({ ...item }));
  const activeDoctors = store.doctors.filter((item) => item.status === 'activo').map((item) => ({ ...item }));

  res.json({
    institution: store.institution,
    specialties: activeSpecialties,
    doctors: activeDoctors,
    news: store.news,
    faqs: store.faqs,
    requirements: store.requirements,
    appointments: store.appointments,
    stats: {
      totalSpecialties: activeSpecialties.length,
      totalDoctors: activeDoctors.length,
      totalAppointments: store.appointments.length
    }
  });
});

app.post('/api/register', (req, res) => {
  const store = readStore();
  const payload = req.body || {};
  const required = [
    'firstName', 'lastName', 'cedula', 'email', 'phone', 'birthDate', 'sex', 'beneficiaryType', 'password'
  ];

  for (const field of required) {
    if (!payload[field] || String(payload[field]).trim() === '') {
      return res.status(400).json({ message: `Falta el campo ${field}.` });
    }
  }

  const validationErrors = validateBeneficiaryPayload(payload);
  if (validationErrors.length) {
    return res.status(400).json({ message: validationErrors[0] });
  }

  const cedula = String(payload.cedula).trim();
  const email = String(payload.email).trim().toLowerCase();
  const phone = String(payload.phone).trim();

  if (!/^[0-9]{6,9}$/.test(cedula)) {
    return res.status(400).json({ message: 'La cÃ©dula de identidad no es vÃ¡lida.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'El correo electrÃ³nico no es vÃ¡lido.' });
  }
  if (!/^\+?[0-9\s-]{7,15}$/.test(phone)) {
    return res.status(400).json({ message: 'El telÃ©fono no es vÃ¡lido.' });
  }
  if (String(payload.password).length < 8) {
    return res.status(400).json({ message: 'La contraseÃ±a debe tener al menos 8 caracteres.' });
  }

  if (store.beneficiaries.some((item) => item.email === email || item.cedula === cedula || item.phone === phone)) {
    return res.status(409).json({ message: 'Ya existe un beneficiario con esos datos.' });
  }

  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
  const beneficiary = {
    id: crypto.randomUUID(),
    firstName: String(payload.firstName).trim(),
    lastName: String(payload.lastName).trim(),
    cedula,
    email,
    phone,
    birthDate: payload.birthDate,
    sex: payload.sex,
    beneficiaryType: payload.beneficiaryType,
    fileNumber: payload.fileNumber || '',
    password: String(payload.password),
    emailVerified: false,
    token: randomToken(),
    verificationCode,
    createdAt: new Date().toISOString(),
    active: true
  };

  store.beneficiaries.push(beneficiary);
  createNotification(store, 'verification', email, 'Se ha enviado un cÃ³digo de verificaciÃ³n a tu correo.', { verificationCode });
  audit(store, 'beneficiary', 'register', `${beneficiary.email} registrÃ³ la cuenta.`);
  writeStore(store);

  res.status(201).json({
    message: 'Registro exitoso. Revisa tu correo para verificar la cuenta.',
    email,
    verificationCode,
    beneficiaryId: beneficiary.id,
    token: beneficiary.token
  });
});

app.post('/api/login', (req, res) => {
  const store = readStore();
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Credenciales incompletas.' });
  }

  const beneficiary = store.beneficiaries.find((item) => item.email.toLowerCase() === String(email).toLowerCase().trim());
  if (!beneficiary || beneficiary.password !== String(password)) {
    return res.status(401).json({ message: 'Correo o contraseÃ±a incorrectos.' });
  }

  beneficiary.token = randomToken();
  writeStore(store);

  res.json({
    message: 'Inicio de sesiÃ³n exitoso.',
    token: beneficiary.token,
    user: {
      id: beneficiary.id,
      firstName: beneficiary.firstName,
      lastName: beneficiary.lastName,
      email: beneficiary.email,
      cedula: beneficiary.cedula,
      emailVerified: beneficiary.emailVerified
    }
  });
});

app.post('/api/verify-email', requireBeneficiaryToken, (req, res) => {
  const store = readStore();
  const { code } = req.body || {};
  const beneficiary = store.beneficiaries.find((item) => item.id === req.beneficiary.id);

  if (!beneficiary) {
    return res.status(404).json({ message: 'Beneficiario no encontrado.' });
  }

  if (String(code) !== String(beneficiary.verificationCode)) {
    return res.status(400).json({ message: 'El cÃ³digo de verificaciÃ³n es incorrecto.' });
  }

  beneficiary.emailVerified = true;
  beneficiary.verificationCode = null;
  createNotification(store, 'verification', beneficiary.email, 'Tu cuenta ha sido verificada correctamente.', { status: 'verified' });
  audit(store, beneficiary.email, 'verify_email', `Cuenta verificada para ${beneficiary.email}.`);
  writeStore(store);

  res.json({ message: 'Correo verificado correctamente.', user: { ...beneficiary, password: undefined } });
});

app.get('/api/appointments', requireBeneficiaryToken, (req, res) => {
  const store = readStore();
  const appointments = store.appointments.filter((item) => item.userId === req.beneficiary.id);
  res.json({ appointments });
});

app.post('/api/appointments', requireBeneficiaryToken, (req, res) => {
  const store = readStore();
  const user = store.beneficiaries.find((item) => item.id === req.beneficiary.id);

  if (!user.emailVerified) {
    return res.status(403).json({ message: 'Debes verificar tu correo para agendar una cita.' });
  }

  const payload = req.body || {};
  const { specialtyId, doctorId, date, turno, hour, symptom } = payload;

  if (!specialtyId || !date || !turno || !hour || !symptom) {
    return res.status(400).json({ message: 'Faltan datos para agendar la cita.' });
  }

  if (!/^[A-Za-z0-9ÃÃ‰ÃÃ“ÃšÃ¡Ã©Ã­Ã³ÃºÃ±Ã‘Ã¼Ãœ\s.,;:-]+$/.test(String(symptom).trim())) {
    return res.status(400).json({ message: 'El motivo solo puede contener letras, nÃºmeros y signos bÃ¡sicos de puntuaciÃ³n.' });
  }

  const specialty = store.specialties.find((item) => item.id === specialtyId && item.active);
  if (!specialty) {
    return res.status(404).json({ message: 'La especialidad seleccionada no estÃ¡ disponible.' });
  }

  const doctor = store.doctors.find((item) => item.id === doctorId && item.status === 'activo');
  if (doctorId && !doctor) {
    return res.status(404).json({ message: 'El mÃ©dico seleccionado no estÃ¡ disponible.' });
  }

  const duplicate = store.appointments.some((item) => {
    const sameUser = item.userId === user.id;
    const sameDate = item.date === date;
    const sameHour = item.hour === hour;
    const sameTurno = item.turno === turno;
    const sameDoctor = item.doctorId === doctorId;
    return sameUser && sameDate && sameHour && sameTurno && sameDoctor;
  });

  if (duplicate) {
    return res.status(409).json({ message: 'Ya registraste una cita duplicada para ese horario y mÃ©dico.' });
  }

  const appointmentNumber = `CITA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
  const appointment = {
    id: crypto.randomUUID(),
    appointmentNumber,
    userId: user.id,
    fullName: `${user.firstName} ${user.lastName}`,
    specialtyId,
    specialtyName: specialty.name,
    doctorId: doctorId || null,
    doctorName: doctor ? doctor.name : 'Sin mÃ©dico asignado',
    date,
    turno,
    hour,
    symptom,
    status: 'pendiente',
    createdAt: new Date().toISOString()
  };

  store.appointments.push(appointment);
  createNotification(store, 'appointment', user.email, `Tu cita ${appointmentNumber} ha sido creada correctamente.`, {
    appointmentId: appointment.id,
    specialty: specialty.name,
    date,
    turno,
    hour
  });
  audit(store, user.email, 'appointment_create', `Cita creada ${appointmentNumber} para ${specialty.name}.`);
  writeStore(store);

  res.status(201).json({ message: 'Cita registrada con Ã©xito.', appointment });
});

app.post('/api/admin/login', (req, res) => {
  const store = readStore();
  const { username, password } = req.body || {};
  const admin = store.adminUsers.find((item) => item.username === username && item.password === password);

  if (!admin) {
    return res.status(401).json({ message: 'Credenciales de administrador incorrectas.' });
  }

  admin.token = randomToken();
  writeStore(store);

  res.json({
    token: admin.token,
    user: {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role
    }
  });
});

app.get('/api/admin/dashboard', requireAdminToken, (req, res) => {
  const store = readStore();
  const appointments = store.appointments;

  const grouped = {
    total: appointments.length,
    pendientes: appointments.filter((item) => item.status === 'pendiente').length,
    confirmadas: appointments.filter((item) => item.status === 'confirmada').length,
    atendidas: appointments.filter((item) => item.status === 'atendida').length,
    canceladas: appointments.filter((item) => item.status === 'cancelada').length,
    nuevos: store.beneficiaries.length
  };

  res.json({ dashboard: grouped, appointments: appointments.slice(-10) });
});

app.get('/api/admin/beneficiaries', requireAdminToken, (req, res) => {
  const store = readStore();
  res.json({ beneficiaries: store.beneficiaries });
});

app.get('/api/admin/appointments', requireAdminToken, (req, res) => {
  const store = readStore();
  res.json({ appointments: store.appointments });
});

app.post('/api/admin/content', requireAdminToken, (req, res) => {
  const store = readStore();
  const payload = req.body || {};
  store.institution = { ...store.institution, ...payload };
  writeStore(store);
  audit(store, req.admin.username, 'update_content', 'Se actualizÃ³ la informaciÃ³n institucional.');
  res.json({ message: 'Contenido institucional actualizado.', institution: store.institution });
});

app.post('/api/admin/specialties', requireAdminToken, (req, res) => {
  const store = readStore();
  const payload = req.body || {};
  const specialty = {
    id: payload.id || crypto.randomUUID(),
    name: payload.name,
    description: payload.description || '',
    active: payload.active !== false
  };
  if (!specialty.name) {
    return res.status(400).json({ message: 'El nombre de la especialidad es obligatorio.' });
  }

  const index = store.specialties.findIndex((item) => item.id === specialty.id);
  if (index >= 0) {
    store.specialties[index] = { ...store.specialties[index], ...specialty };
  } else {
    store.specialties.push(specialty);
  }
  writeStore(store);
  res.json({ message: 'Especialidad guardada.', specialty });
});

app.post('/api/admin/doctors', requireAdminToken, (req, res) => {
  const store = readStore();
  const payload = req.body || {};
  const doctor = {
    id: payload.id || crypto.randomUUID(),
    name: payload.name,
    specialtyId: payload.specialtyId,
    consultorio: payload.consultorio || 'Sin consultorio',
    status: payload.status || 'activo',
    shiftCapacity: Number(payload.shiftCapacity || 8),
    schedule: { morning: !!payload.morning, afternoon: !!payload.afternoon },
    phone: payload.phone || ''
  };

  if (!doctor.name || !doctor.specialtyId) {
    return res.status(400).json({ message: 'El nombre del mÃ©dico y la especialidad son obligatorios.' });
  }

  const index = store.doctors.findIndex((item) => item.id === doctor.id);
  if (index >= 0) {
    store.doctors[index] = { ...store.doctors[index], ...doctor };
  } else {
    store.doctors.push(doctor);
  }
  writeStore(store);
  res.json({ message: 'MÃ©dico guardado.', doctor });
});

app.patch('/api/admin/appointments/:id/status', requireAdminToken, (req, res) => {
  const store = readStore();
  const appointment = store.appointments.find((item) => item.id === req.params.id);
  if (!appointment) {
    return res.status(404).json({ message: 'Cita no encontrada.' });
  }

  const status = req.body?.status;
  if (!['pendiente', 'confirmada', 'reprogramada', 'atendida', 'cancelada'].includes(status)) {
    return res.status(400).json({ message: 'Estado de cita invÃ¡lido.' });
  }

  appointment.status = status;
  writeStore(store);
  res.json({ message: 'Estado actualizado.', appointment });
});

app.get('/api/admin/reports', requireAdminToken, (req, res) => {
  const store = readStore();
  const appointmentData = store.appointments;
  const bySpecialty = {};
  appointmentData.forEach((item) => {
    bySpecialty[item.specialtyName] = (bySpecialty[item.specialtyName] || 0) + 1;
  });

  res.json({
    reports: {
      total: appointmentData.length,
      pendientes: appointmentData.filter((item) => item.status === 'pendiente').length,
      confirmadas: appointmentData.filter((item) => item.status === 'confirmada').length,
      atendidas: appointmentData.filter((item) => item.status === 'atendida').length,
      canceladas: appointmentData.filter((item) => item.status === 'cancelada').length,
      bySpecialty,
      byTurno: {
        mañana: appointmentData.filter((item) => item.turno === 'mañana').length,
        tarde: appointmentData.filter((item) => item.turno === 'tarde').length
      }
    }
  });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});





