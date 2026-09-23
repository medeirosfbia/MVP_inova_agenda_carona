// ============================================
// CONFIGURAÇÕES FÁCEIS DE ALTERAR
// ============================================

// Número do WhatsApp do motorista (formato internacional sem +)
const DRIVER_WHATSAPP = "5511999999999";

// Lista de horários disponíveis
const RIDES = [
    {
        id: 1,
        time: "06:30",
        driver: "João Silva",
        car: "Honda Civic - Prata",
        price: "R$ 5,00",
        totalSeats: 4,
        availableSeats: 2
    },
    {
        id: 2,
        time: "07:15",
        driver: "Maria Santos",
        car: "Toyota Corolla - Branco",
        price: "R$ 5,00",
        totalSeats: 4,
        availableSeats: 3
    },
    {
        id: 3,
        time: "08:00",
        driver: "Pedro Oliveira",
        car: "Volkswagen Gol - Azul",
        price: "R$ 5,00",
        totalSeats: 4,
        availableSeats: 1
    }
];

// ============================================
// LÓGICA DO APLICATIVO
// ============================================

// Renderizar cards de carona
function renderRides() {
    const ridesList = document.getElementById('ridesList');
    ridesList.innerHTML = '';

    RIDES.forEach(ride => {
        const seatsClass = ride.availableSeats === 0 ? 'full' : 
                          ride.availableSeats <= 1 ? 'low' : '';
        
        const seatsText = ride.availableSeats === 0 ? 'Lotação Completa' :
                         `${ride.availableSeats} de ${ride.totalSeats} vagas`;

        const isDisabled = ride.availableSeats === 0;

        const card = document.createElement('div');
        card.className = 'ride-card';
        card.innerHTML = `
            <div class="ride-header">
                <div class="ride-time">${ride.time}</div>
                <div class="ride-price">${ride.price}</div>
            </div>
            
            <div class="ride-info">
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <div>
                        <div class="info-label">Motorista</div>
                        <div class="info-value">${ride.driver}</div>
                    </div>
                </div>
                
                <div class="info-item">
                    <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path>
                    </svg>
                    <div>
                        <div class="info-label">Veículo</div>
                        <div class="info-value">${ride.car}</div>
                    </div>
                </div>
            </div>
            
            <div class="seats-available ${seatsClass}">
                ${seatsText}
            </div>
            
            <button 
                class="btn btn-primary" 
                onclick="openModal(${ride.id})"
                ${isDisabled ? 'disabled' : ''}
            >
                ${isDisabled ? 'Sem Vagas' : 'Reservar Vaga'}
            </button>
        `;

        ridesList.appendChild(card);
    });
}

// Abrir modal
function openModal(rideId) {
    const ride = RIDES.find(r => r.id === rideId);
    if (!ride) return;

    document.getElementById('selectedRideId').value = ride.id;
    document.getElementById('selectedRideTime').value = ride.time;
    document.getElementById('selectedDriverPhone').value = DRIVER_WHATSAPP;
    
    document.getElementById('modalOverlay').classList.add('active');
    document.getElementById('passengerName').focus();
}

// Fechar modal
function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('reservationForm').reset();
}

// Formatr WhatsApp para link
function formatWhatsAppNumber(number) {
    return number.replace(/\D/g, '');
}

// Enviar reserva para WhatsApp
function sendToWhatsApp(name, whatsapp, time, driverPhone) {
    const message = `Olá! Sou ${name}, quero reservar 1 vaga para a carona das ${time} de hoje. Como faço o Pix?`;
    const encodedMessage = encodeURIComponent(message);
    const formattedPhone = formatWhatsAppNumber(driverPhone);
    
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    // Redirecionar para WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Fechar modal após redirecionamento
    setTimeout(() => {
        closeModal();
    }, 500);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    renderRides();

    // Fechar modal
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalOverlay')) {
            closeModal();
        }
    });

    // Submit do formulário
    document.getElementById('reservationForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('passengerName').value.trim();
        const whatsapp = document.getElementById('passengerWhatsApp').value.trim();
        const time = document.getElementById('selectedRideTime').value;
        const driverPhone = document.getElementById('selectedDriverPhone').value;

        if (name && whatsapp) {
            sendToWhatsApp(name, whatsapp, time, driverPhone);
        }
    });

    // Máscara para WhatsApp
    document.getElementById('passengerWhatsApp').addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        
        if (value.length >= 10) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        } else if (value.length >= 6) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}-${value.slice(6)}`;
        } else if (value.length >= 2) {
            value = `(${value.slice(0, 2)})${value.slice(2)}`;
        }
        
        e.target.value = value;
    });
});

// Expor função openModal globalmente
window.openModal = openModal;
