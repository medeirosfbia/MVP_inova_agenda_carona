// ============================================
// Carona Bairro - Frontend (Supabase como banco + autenticação)
// ============================================
// Tela do USUÁRIO: lista caronas e reserva vaga -> abre WhatsApp do motorista
// Tela do MOTORISTA: conta Supabase (login/cadastro por e-mail) + agendamentos
// Dados ficam no Postgres do Supabase, protegidos por Row Level Security (RLS).

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
let currentDriver = null; // { id, name, whatsapp, car } do motorista logado

// ---------- Cliente Supabase ----------
// window.SUPABASE_URL / window.SUPABASE_ANON_KEY vêm de config.browser.js
// (gerado pelo build a partir do .env local ou das Environment Variables da Vercel)
if (!window.SUPABASE_URL || !window.supabase) {
    alert('Configure o Supabase: copie .env.example para .env, preencha e rode "npm run build" (ou adicione as variáveis na Vercel).');
}
const sb = window.supabase
    ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
    : null;

// ---------- Helpers de formatação ----------
function formatPrice(value) {
    return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
}

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// Normaliza telefone brasileiro para formato internacional (ex: 5511988887777)
function normalizePhone(input) {
    let digits = String(input || '').replace(/\D/g, '');
    if (!digits) return '';
    if (!digits.startsWith('55') || digits.length <= 11) {
        digits = digits.replace(/^0+/, '');
        digits = '55' + digits;
    }
    return digits;
}

function applyPhoneMask(input) {
    input.addEventListener('input', () => {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        if (value.length >= 11) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
        } else if (value.length >= 6) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
        } else if (value.length >= 2) {
            value = `(${value.slice(0, 2)})${value.slice(2)}`;
        }
        input.value = value;
    });
}

function showError(elId, message) {
    const el = document.getElementById(elId);
    el.textContent = message;
    el.style.display = message ? 'block' : 'none';
}

function supaError(err, fallback) {
    return new Error((err && err.message) ? err.message : fallback);
}

// ============================================
// TELA DO USUÁRIO (PASSAGEIRO)
// ============================================
async function loadAndRenderRides() {
    try {
        const rides = await fetchActiveRides();
        renderRides(rides);
    } catch (err) {
        console.error(err);
        renderRides([]);
    }
}

// Busca viagens ativas junto com o perfil do motorista
async function fetchActiveRides() {
    const { data, error } = await sb
        .from('rides')
        .select('*, driver_profiles ( name, whatsapp, car_model )')
        .eq('active', true)
        .order('time_of_day');
    if (error) throw supaError(error, 'Erro ao carregar caronas.');
    return (data || []).map(mapRide);
}

// Converte a linha do banco para o formato usado na tela
function mapRide(row) {
    const p = row.driver_profiles || {};
    return {
        id: row.id,
        time: row.time_of_day,
        price: Number(row.price || 0),
        totalSeats: row.seats,
        bookedSeatCount: row.booked,
        notes: row.notes || '',
        days: row.days || [],
        driver: p.name || 'Motorista',
        car: p.car_model || '',
        _raw: row
    };
}

function renderRides(rides) {
    const ridesList = document.getElementById('ridesList');
    const emptyState = document.getElementById('emptyState');
    ridesList.innerHTML = '';
    emptyState.style.display = rides.length === 0 ? 'block' : 'none';

    rides.forEach((ride) => {
        const booked = ride.bookedSeatCount || 0;
        const available = Math.max(0, ride.totalSeats - booked);
        const seatsClass = available === 0 ? 'full' : available <= 1 ? 'low' : '';
        const seatsText = available === 0 ? 'Lotação Completa' : `${available} de ${ride.totalSeats} vagas`;
        const isDisabled = available === 0;
        const daysText = (ride.days && ride.days.length) ? ride.days.join(' · ') : 'Todos os dias';

        const card = document.createElement('div');
        card.className = 'ride-card';
        card.innerHTML = `
            <div class="ride-header">
                <div class="ride-time">${escapeHtml(ride.time)}</div>
                <div class="ride-price">${formatPrice(ride.price)}</div>
            </div>

            <div class="ride-info">
                <div class="info-item">
                    <div>
                        <div class="info-label">Motorista</div>
                        <div class="info-value">${escapeHtml(ride.driver)}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div>
                        <div class="info-label">Veículo</div>
                        <div class="info-value">${escapeHtml(ride.car)}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div>
                        <div class="info-label">Dias</div>
                        <div class="info-value">${escapeHtml(daysText)}</div>
                    </div>
                </div>
                ${ride.notes ? `
                <div class="info-item">
                    <div>
                        <div class="info-label">Observações</div>
                        <div class="info-value">${escapeHtml(ride.notes)}</div>
                    </div>
                </div>` : ''}
            </div>

            <div class="seats-available ${seatsClass}">${seatsText}</div>

            <button class="btn btn-primary" data-ride-id="${ride.id}" ${isDisabled ? 'disabled' : ''}>
                ${isDisabled ? 'Sem Vagas' : 'Reservar Vaga'}
            </button>
        `;
        ridesList.appendChild(card);
    });
}

function openModal(rideId) {
    fetchActiveRides().then((rides) => {
        const ride = rides.find((r) => r.id === rideId);
        if (!ride) return;
        document.getElementById('selectedRideId').value = ride.id;
        document.getElementById('rideSummary').textContent =
            `Carona das ${ride.time} com ${ride.driver}${ride.car ? ' (' + ride.car + ')' : ''}`;
        document.getElementById('modalOverlay').classList.add('active');
        showError('bookError', '');
        document.getElementById('passengerName').focus();
    }).catch((err) => showError('bookError', err.message));
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('reservationForm').reset();
}

async function handleReservation(e) {
    e.preventDefault();
    const name = document.getElementById('passengerName').value.trim();
    const whatsapp = normalizePhone(document.getElementById('passengerWhatsApp').value);
    const rideId = document.getElementById('selectedRideId').value;
    const submitBtn = document.getElementById('bookSubmitBtn');

    if (!name || !whatsapp || !rideId) return;

    submitBtn.disabled = true;
    try {
        // RPC atômica no Supabase: grava a reserva, controla vagas
        // e devolve o WhatsApp do motorista (sem overbooking)
        const { data, error } = await sb.rpc('book_ride', {
            p_ride_id: rideId,
            p_passenger_name: `${name}|${whatsapp}`
        });
        if (error) throw supaError(error, 'Não foi possível reservar.');
        if (!data || !data.ok) throw new Error((data && data.error) || 'Não foi possível reservar.');

        closeModal();
        // Monta a mensagem pré-preenchida e leva o usuário direto
        // para o WhatsApp do motorista
        const msg = encodeURIComponent(
            `Olá ${data.driver_name || ''}! Gostaria de confirmar a carona das ${document.getElementById('rideSummary').textContent.replace('Carona das ', '')}`
        );
        window.location.href = `https://wa.me/${data.whatsapp}?text=${msg}`;
    } catch (err) {
        showError('bookError', err.message);
    } finally {
        submitBtn.disabled = false;
    }
}

// ============================================
// TELA DO MOTORISTA (AUTH SUPABASE)
// ============================================
function showDriverView() {
    document.getElementById('passengerView').style.display = 'none';
    document.querySelector('footer').style.display = 'none';
    document.getElementById('driverView').style.display = 'block';
    document.getElementById('btnDriverMode').style.display = 'none';
    renderAuthOrDashboard();
}

function showPassengerView() {
    document.getElementById('driverView').style.display = 'none';
    document.getElementById('passengerView').style.display = 'block';
    document.querySelector('footer').style.display = 'block';
    document.getElementById('btnDriverMode').style.display = 'inline-block';
    loadAndRenderRides();
}

function renderAuthOrDashboard() {
    document.getElementById('authPanel').style.display = currentDriver ? 'none' : 'block';
    document.getElementById('dashboardPanel').style.display = currentDriver ? 'block' : 'none';
    if (currentDriver) {
        document.getElementById('driverGreetingName').textContent = currentDriver.name;
        loadDriverDashboard();
    }
}

function switchAuthTab(tab) {
    document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
    document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
    showError('loginError', '');
    showError('registerError', '');
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw supaError(error, 'E-mail ou senha incorretos.');
        await finishDriverSession(data.user);
        document.getElementById('loginForm').reset();
    } catch (err) {
        showError('loginError', err.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = normalizePhone(document.getElementById('regPhone').value);
    const car = document.getElementById('regCar').value.trim();
    const password = document.getElementById('regPassword').value;

    try {
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw supaError(error, 'Não foi possível criar a conta.');

        if (!data.session) {
            // Confirmação de e-mail ativada no projeto: o motorista precisa
            // confirmar o e-mail antes de entrar.
            showError('registerError', 'Conta criada! Verifique seu e-mail para confirmar o cadastro e depois faça login.');
            switchAuthTab('login');
            return;
        }

        // Cria o perfil do motorista na tabela driver_profiles
        const { error: profileErr } = await sb.from('driver_profiles').insert({
            id: data.user.id, name, whatsapp: phone, car_model: car
        });
        if (profileErr) throw supaError(profileErr, 'Erro ao salvar o perfil do motorista.');

        await finishDriverSession(data.user);
        document.getElementById('registerForm').reset();
    } catch (err) {
        showError('registerError', err.message);
    }
}

// Carrega o perfil e entra no painel do motorista
async function finishDriverSession(user) {
    const { data: profile, error } = await sb
        .from('driver_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        // Autenticado mas sem perfil (conta antiga, por exemplo)
        currentDriver = { id: user.id, name: user.email.split('@')[0], whatsapp: '', car: '' };
    } else {
        currentDriver = { id: profile.id, name: profile.name, whatsapp: profile.whatsapp, car: profile.car_model };
    }
    renderAuthOrDashboard();
}

async function handleLogout() {
    await sb.auth.signOut();
    currentDriver = null;
    renderAuthOrDashboard();
}

// ============================================
// AGENDAMENTOS DO MOTORISTA
// ============================================
function buildDaysPicker() {
    const picker = document.getElementById('daysPicker');
    picker.innerHTML = '';
    DAYS.forEach((day) => {
        const label = document.createElement('label');
        label.className = 'day-chip';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = day.toLowerCase();
        checkbox.addEventListener('change', () => label.classList.toggle('checked', checkbox.checked));
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(day));
        picker.appendChild(label);
    });
}

function getSelectedDays() {
    return Array.from(document.querySelectorAll('#daysPicker input:checked')).map((i) => i.value);
}

async function handleSchedule(e) {
    e.preventDefault();
    if (!currentDriver) return;
    try {
        const { error } = await sb.from('rides').insert({
            driver_id: currentDriver.id,
            from_place: document.getElementById('schedFrom').value.trim(),
            to_place: document.getElementById('schedTo').value.trim(),
            time_of_day: document.getElementById('schedTime').value,
            days: getSelectedDays(),
            price: parseFloat(document.getElementById('schedPrice').value) || 0,
            seats: parseInt(document.getElementById('schedSeats').value, 10),
            notes: document.getElementById('schedNotes').value.trim()
        });
        if (error) throw supaError(error, 'Não foi possível criar o agendamento.');

        document.getElementById('scheduleForm').reset();
        buildDaysPicker();
        showError('scheduleError', '');
        loadDriverDashboard();
        alert('Agendamento criado com sucesso! 🚗');
    } catch (err) {
        showError('scheduleError', err.message);
    }
}

async function loadDriverDashboard() {
    try {
        const { data: rides, error } = await sb
            .from('rides')
            .select('*')
            .eq('driver_id', currentDriver.id)
            .order('created_at', { ascending: false });
        if (error) throw supaError(error, 'Erro ao carregar suas viagens.');

        const ids = (rides || []).map((r) => r.id);
        let bookings = [];
        if (ids.length) {
            const res = await sb.from('bookings').select('*').in('ride_id', ids).order('created_at', { ascending: false });
            if (res.error) throw supaError(res.error, 'Erro ao carregar reservas.');
            bookings = res.data || [];
        }
        renderMyRides(rides || []);
        renderBookings(bookings, rides || []);
    } catch (err) {
        console.error(err);
    }
}

function renderMyRides(rides) {
    const list = document.getElementById('myRidesList');
    const empty = document.getElementById('myRidesEmpty');
    list.innerHTML = '';
    empty.style.display = rides.length === 0 ? 'block' : 'none';

    [...rides]
        .sort((a, b) => (a.time_of_day || '').localeCompare(b.time_of_day || ''))
        .forEach((ride) => {
            const booked = ride.booked || 0;
            const available = Math.max(0, ride.seats - booked);
            const daysText = (ride.days && ride.days.length)
                ? ride.days.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(' · ')
                : 'Todos os dias';
            const route = `${ride.from_place} → ${ride.to_place}`;

            const card = document.createElement('div');
            card.className = `ride-card ${ride.active === false ? 'inactive' : ''}`;
            card.innerHTML = `
                <div class="ride-header">
                    <div class="ride-time">${escapeHtml(ride.time_of_day)}</div>
                    <div class="ride-price">${formatPrice(ride.price)}</div>
                </div>
                <div class="ride-info">
                    <div class="info-item"><div>
                        <div class="info-label">Trajeto</div>
                        <div class="info-value">${escapeHtml(route)}</div>
                    </div></div>
                    <div class="info-item"><div>
                        <div class="info-label">Dias</div>
                        <div class="info-value">${escapeHtml(daysText)}</div>
                    </div></div>
                    <div class="info-item"><div>
                        <div class="info-label">Vagas</div>
                        <div class="info-value">${available} livres de ${ride.seats} (${booked} reservadas)</div>
                    </div></div>
                </div>
                ${ride.active === false ? '<div class="seats-available full">Cancelada (invisível para passageiros)</div>' : ''}
                <div class="card-actions">
                    <button class="btn btn-secondary btn-sm" data-action="toggle" data-id="${ride.id}" data-active="${ride.active !== false}">
                        ${ride.active === false ? 'Reativar' : 'Cancelar Viagem'}
                    </button>
                    <button class="btn btn-danger btn-sm" data-action="delete" data-id="${ride.id}">Excluir</button>
                </div>
            `;
            list.appendChild(card);
        });
}

function renderBookings(bookings, rides) {
    const list = document.getElementById('bookingsList');
    const empty = document.getElementById('bookingsEmpty');
    list.innerHTML = '';
    empty.style.display = bookings.length === 0 ? 'block' : 'none';

    const rideById = Object.fromEntries(rides.map((r) => [r.id, r]));
    bookings.forEach((b) => {
        const ride = rideById[b.ride_id];
        const date = new Date(b.created_at).toLocaleDateString('pt-BR');
        // passenger_name tem o formato "Nome|telefone" salvo pela RPC book_ride
        const [pname, pphone] = String(b.passenger_name || '').split('|');
        const item = document.createElement('div');
        item.className = 'booking-item';
        item.innerHTML = `
            <div>
                <strong>${escapeHtml(pname || 'Passageiro')}</strong> — carona das
                ${escapeHtml(ride ? ride.time_of_day : '?')} (${date})
            </div>
            ${pphone ? `<a class="btn btn-whatsapp btn-sm" href="https://wa.me/${escapeHtml(pphone)}" target="_blank" rel="noopener">
                WhatsApp do passageiro
            </a>` : ''}
        `;
        list.appendChild(item);
    });
}

async function handleMyRidesClick(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;

    if (btn.dataset.action === 'toggle') {
        const isActive = btn.dataset.active === 'true';
        try {
            const { error } = await sb.from('rides').update({ active: !isActive }).eq('id', id);
            if (error) throw supaError(error, 'Erro ao atualizar a viagem.');
            loadDriverDashboard();
        } catch (err) { alert(err.message); }
    } else if (btn.dataset.action === 'delete') {
        if (!confirm('Excluir definitivamente esta viagem?')) return;
        try {
            const { error } = await sb.from('rides').delete().eq('id', id);
            if (error) throw supaError(error, 'Erro ao excluir a viagem.');
            loadDriverDashboard();
        } catch (err) { alert(err.message); }
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    buildDaysPicker();

    // Restaura sessão do motorista (o Supabase guarda o token em localStorage)
    const { data: { session } } = await sb.auth.getSession();
    if (session && session.user) {
        const { data: profile } = await sb
            .from('driver_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
        if (profile) {
            currentDriver = { id: profile.id, name: profile.name, whatsapp: profile.whatsapp, car: profile.car_model };
        }
    }

    // Listagem pública de caronas (tela do usuário)
    loadAndRenderRides();

    // Botões de navegação entre telas
    document.getElementById('btnDriverMode').addEventListener('click', showDriverView);
    document.getElementById('backToPassengerBtn1').addEventListener('click', showPassengerView);
    document.getElementById('backToPassengerBtn2').addEventListener('click', showPassengerView);

    // Modal de reserva do passageiro
    document.getElementById('ridesList').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-ride-id]');
        if (btn && !btn.disabled) openModal(btn.dataset.rideId);
    });
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalOverlay')) closeModal();
    });
    document.getElementById('reservationForm').addEventListener('submit', handleReservation);

    // Autenticação do motorista (Supabase Auth)
    document.getElementById('tabLogin').addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('tabRegister').addEventListener('click', () => switchAuthTab('register'));
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Agendamentos do motorista
    document.getElementById('scheduleForm').addEventListener('submit', handleSchedule);
    document.getElementById('myRidesList').addEventListener('click', handleMyRidesClick);

    // Máscaras de telefone
    ['passengerWhatsApp', 'regPhone'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) applyPhoneMask(el);
    });
});
