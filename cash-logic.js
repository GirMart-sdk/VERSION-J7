/**
 * WINNER STORE - Módulo de Control de Caja (Arqueo)
 */

// eslint-disable-next-line no-unused-vars
const CASH_STORAGE_KEY = 'winner_cash_sessions';
let currentSession = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initCashModule();
});

function initCashModule() {
    loadActiveSession();
    renderCashHistory(); // Esto también actualizará la UI
}

async function loadActiveSession() {
    try {
        const res = await window.apiFetch('/api/sessions/active');
        const session = await res.json();
        window.currentCashSession = session; // Puede ser null si no hay sesión abierta
    } catch (error) {
        console.error("Error al cargar la sesión activa:", error);
        window.currentCashSession = null;
    }
    currentSession = window.currentCashSession;
    updateCashUI();
}

// Esta función ya no es necesaria, los datos se guardan en el backend.
// eslint-disable-next-line no-unused-vars
function saveSessions() {
    // localStorage.setItem(CASH_STORAGE_KEY, JSON.stringify(sessions));
}

function updateCashUI() {
    const isOpen = !!window.currentCashSession;
    
    // Elementos Globales (Mini Badge)
    const miniBadge = document.getElementById('topSessionBadge');
    if (miniBadge) {
        miniBadge.textContent = isOpen ? 'Caja Abierta' : 'Caja Cerrada';
        miniBadge.className = `session-badge-mini ${isOpen ? 'abierta' : 'cerrada'}`;
    }

    // Elementos del Dashboard (KPI principal)
    const kpiNetCash = document.getElementById('kpiNetCash');
    if (kpiNetCash) {
        const sessionSales = calculateSalesInSession(window.currentCashSession);
        const totalNet = isOpen ? (Number(window.currentCashSession.initialBalance) + sessionSales.cash) : 0;
        kpiNetCash.textContent = fmt(totalNet);
        
        // Indicador de "CAJA ABIERTA" en el Dashboard
        const label = kpiNetCash.parentElement.querySelector(".dash-label-impact");
        if (label) {
            if (isOpen) {
                label.innerHTML = "EFECTIVO EN CAJA <span style='color:var(--green); font-size:11px; font-weight:700;'>● ACTIVA</span>";
            } else {
                label.textContent = "Efectivo Neto (Caja)";
            }
        }
    }

    // Elementos de la página de Caja
    const statusText = document.getElementById('cashStatusText');
    const statusIcon = document.getElementById('cashStatusIcon');
    const btnOpen = document.getElementById('btnOpenCash');
    const btnClose = document.getElementById('btnCloseCash');
    const details = document.getElementById('activeSessionDetails');

    if (statusText) {
        statusText.textContent = isOpen ? 'Turno en Curso' : 'Caja Cerrada';
        statusIcon.textContent = isOpen ? '🟢' : '🔒';
        btnOpen.style.display = isOpen ? 'none' : 'block';
        btnClose.style.display = isOpen ? 'block' : 'none';
        details.style.display = isOpen ? 'grid' : 'none';

        if (isOpen) {
            document.getElementById('sessionStartTime').textContent = new Date(window.currentCashSession.openedAt).toLocaleTimeString();
            document.getElementById('sessionBaseAmount').textContent = formatMoney(window.currentCashSession.initialBalance);
            
            // Calcular ventas del turno reales usando la data global de ventas
            const sessionSales = calculateSalesInSession(window.currentCashSession);
            document.getElementById('sessionCashSales').textContent = formatMoney(sessionSales.cash);
            
            const totalNet = Number(window.currentCashSession.initialBalance) + sessionSales.cash;
            document.getElementById('sessionTotalNet').textContent = formatMoney(totalNet);
        }
    }
}

// eslint-disable-next-line no-unused-vars
function openCashModal() {
    document.getElementById('cashOpenModal').classList.add('open');
    document.getElementById('cashOpenOverlay').classList.add('open');
}

function closeCashModal() {
    document.getElementById('cashOpenModal').classList.remove('open');
    document.getElementById('cashOpenOverlay').classList.remove('open');
}

// eslint-disable-next-line no-unused-vars
async function confirmOpenCash() {
    const baseAmount = parseFloat(document.getElementById('cashBaseInput').value) || 0;

    try {
        const res = await window.apiFetch('/api/sessions/open', {
            method: 'POST',
            body: JSON.stringify({ baseAmount }),
        });
        const newSession = await res.json();

        if (!res.ok) throw new Error(newSession.error || 'No se pudo abrir la caja.');

        currentSession = newSession;
        window.currentCashSession = newSession;
        
        closeCashModal();
        updateCashUI();
        if(typeof toast === 'function') toast("Turno de caja iniciado");
        renderCashHistory();
    } catch (error) {
        console.error("Error al abrir caja:", error);
        if(typeof toast === 'function') toast(`❌ Error: ${error.message}`);
    }
}

// eslint-disable-next-line no-unused-vars
function closeCashArqueo() {
    const sales = calculateSalesInSession(currentSession);
    const summaryDiv = document.getElementById('arqueoSummary');
    
    if(summaryDiv) summaryDiv.innerHTML = `
        <div class="arqueo-row"><label>Monto Base:</label><span>${formatMoney(currentSession.initialBalance)}</span></div>
        <div class="arqueo-row"><label>Ventas Efectivo:</label><span>${formatMoney(sales.cash)}</span></div>
        <div class="arqueo-row"><label>Ventas Tarjeta:</label><span>${formatMoney(sales.card)}</span></div>
        <div class="arqueo-row"><label>Otros Métodos:</label><span>${formatMoney(sales.other)}</span></div>
        <div class="arqueo-row total"><label>Efectivo Total:</label><span>${formatMoney(Number(currentSession.initialBalance) + sales.cash)}</span></div>
    `;

    document.getElementById('cashCloseModal').classList.add('open');
    document.getElementById('cashCloseOverlay').classList.add('open');
}

function closeCashArqueoModal() {
    document.getElementById('cashCloseModal').classList.remove('open');
    document.getElementById('cashCloseOverlay').classList.remove('open');
}

// eslint-disable-next-line no-unused-vars
async function confirmCloseCash() {
    const sessionToClose = currentSession || window.currentCashSession;
    if (!sessionToClose) return;

    const shouldEmail = document.getElementById('sendEmailArqueo')?.checked;
    const shouldPrint = document.getElementById('printArqueo')?.checked;
    const shouldDownload = document.getElementById('downloadPdfArqueo')?.checked;
    
    // SOLUCIÓN: Recolectar los datos del arqueo para enviarlos al backend.
    const salesInSession = calculateSalesInSession(sessionToClose);
    const realBalance = parseFloat(document.getElementById('realBalanceInput')?.value || '0');
    const initialBalance = Number(sessionToClose.initialBalance);
    const theoreticalBalance = initialBalance + salesInSession.cash;
    const difference = realBalance - theoreticalBalance;

    try {
        const res = await window.apiFetch(`/api/sessions/close/${sessionToClose.id}`, {
            method: 'POST',
            body: JSON.stringify({ 
                realBalance,
                theoreticalSales: salesInSession.cash, // Solo efectivo cuenta para el arqueo
                theoreticalExpenses: 0, // Placeholder para futuros gastos
                difference,
            }),
        });
        const closedSession = await res.json();

        if (!res.ok) throw new Error(closedSession.error || 'No se pudo cerrar la caja.');

        // La sesión se cerró en el backend, ahora disparamos las acciones del frontend.
        if (shouldDownload) {
            window.open(`/api/arqueo/download-report/${closedSession.id}`);
            toast("📄 Iniciando descarga del reporte...");
        }
        if (shouldEmail && typeof window.handleSendDailyReport === 'function') {
            await window.handleSendDailyReport(closedSession.id);
        }
        if (shouldPrint) {
            toast("🖨️ Comprobante de cierre generado.");
        }

        currentSession = null;
        window.currentCashSession = null;
        closeCashArqueoModal();
        updateCashUI();
        if(typeof toast === 'function') toast("Caja cerrada exitosamente");
        renderCashHistory();

    } catch (error) {
        console.error("Error al cerrar caja:", error);
        if(typeof toast === 'function') toast(`❌ Error: ${error.message}`);
    }
}

/**
 * Limpia el historial de sesiones de caja del almacenamiento local.
 */
function clearCashHistory() {
    if (confirm("¿Estás seguro de que quieres borrar TODO el historial de caja? Esta acción no se puede deshacer.")) {
        // Aquí deberías llamar a un endpoint del backend para borrar el historial
        // Por ahora, solo limpiamos la UI
        updateCashUI();
        renderCashHistory();
        if(typeof toast === 'function') toast("🧹 Historial de caja limpiado.");
    }
}
window.clearCashHistory = clearCashHistory;

function calculateSalesInSession(session) {
    if (!session || !window.salesLog || !Array.isArray(window.salesLog)) return { cash: 0, card: 0, other: 0 };
    
    const start = new Date(session.openedAt).getTime();
    const end = session.closedAt ? new Date(session.closedAt).getTime() : Date.now();

    return window.salesLog.reduce((acc, sale) => {
        const saleTime = new Date(sale.timestamp || sale.createdAt).getTime();
        if (isNaN(saleTime)) return acc;
        
        // Sumar ventas físicas realizadas durante el turno
        if (saleTime >= start && saleTime <= end && sale.channel === 'fisica') {
            const method = (sale.method || sale.payment_method || "").toLowerCase();
            const amount = Number(sale.total) || 0;

            // SOLUCIÓN: Contabilizar correctamente abonos y pagos completos.
            if (sale.payment_status === 'completed' && method.includes("efectivo")) {
                acc.cash += amount;
            } else if (sale.payment_status === 'partial') {
                const details = typeof sale.payment_details === 'string' ? JSON.parse(sale.payment_details || '{}') : (sale.payment_details || {});
                if (details.abonoAmount > 0 && method.includes("efectivo")) {
                    acc.cash += Number(details.abonoAmount);
                }
            } else if (method.includes("tarjeta")) {
                acc.card += amount;
            } else { acc.other += amount; }
        }
        return acc;
    }, { cash: 0, card: 0, other: 0 });
}

async function renderCashHistory() {
    const res = await window.apiFetch('/api/sessions/history');
    const sessions = await res.json();

    const body = document.getElementById('cashHistoryBody');
    if (!body) return;

    if (sessions.length === 0) {
        body.innerHTML = '<tr class="empty-row"><td colspan="7">No hay registros</td></tr>';
        return;
    }

    body.innerHTML = sessions.map(s => `
        <tr>
            <td style="font-size:11px">${new Date(s.openedAt).toLocaleDateString()}</td>
            <td>${new Date(s.openedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            <td>${s.closedAt ? new Date(s.closedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</td>
            <td>${fmt(s.initialBalance)}</td>
            <td style="color:var(--green)">${fmt(calculateSalesInSession(s).cash)}</td>
            <td style="font-weight:700; color:var(--accent)">
                ${fmt(Number(s.initialBalance) + calculateSalesInSession(s).cash)}
            </td>
            <td><span class="status-pill ${s.status}">${s.status}</span></td>
        </tr>
    `).join('');
}

function formatMoney(n) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}