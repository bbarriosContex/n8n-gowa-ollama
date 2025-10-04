// Variables globales
let webhookConfig = {};
let webhookStats = {};

// Función para realizar peticiones autenticadas
async function apiRequest(url, options = {}) {
    const auth = btoa('admin:playhunt2024'); // Usar las credenciales configuradas
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + auth
        }
    };
    
    return fetch('/urls/api' + url, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });
}

// Funciones de navegación por tabs
function showTab(tabName) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover clase active de todos los botones
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar el tab seleccionado
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
}

// Cargar configuración inicial
async function loadConfig() {
    try {
        const response = await apiRequest('/config');
        if (response.ok) {
            webhookConfig = await response.json();
            updateConfigUI();
        }
    } catch (error) {
        console.error('Error cargando configuración:', error);
    }
}

// Actualizar interfaz con la configuración
function updateConfigUI() {
    document.getElementById('webhook-enabled').value = webhookConfig.enabled?.toString() || 'true';
    document.getElementById('webhook-secret').value = webhookConfig.secret || '';
    document.getElementById('retry-attempts').value = webhookConfig.retryAttempts || 3;
    document.getElementById('retry-delay').value = webhookConfig.retryDelay || 1000;
    
    updateWebhookUrls();
}

// Actualizar lista de URLs de webhook
function updateWebhookUrls() {
    const container = document.getElementById('webhook-urls-container');
    
    if (!webhookConfig.urls || webhookConfig.urls.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No hay URLs configuradas</p>';
        return;
    }
    
    container.innerHTML = webhookConfig.urls.map((url, index) => `
        <div class="webhook-item">
            <div class="webhook-url">${url}</div>
            <div class="webhook-actions">
                <button class="btn btn-secondary" onclick="testWebhookUrl('${url}')">
                    🧪 Probar
                </button>
                <button class="btn btn-danger" onclick="removeWebhookUrl(${index})">
                    🗑️ Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

// Guardar configuración general
async function saveGeneralConfig() {
    const config = {
        enabled: document.getElementById('webhook-enabled').value === 'true',
        secret: document.getElementById('webhook-secret').value,
        retryAttempts: parseInt(document.getElementById('retry-attempts').value),
        retryDelay: parseInt(document.getElementById('retry-delay').value),
        urls: webhookConfig.urls || []
    };
    
    try {
        const response = await apiRequest('/config', {
            method: 'POST',
            body: JSON.stringify(config)
        });
        
        if (response.ok) {
            webhookConfig = config;
            showAlert('✅ Configuración guardada correctamente', 'success');
            loadStats();
        } else {
            showAlert('❌ Error guardando configuración', 'error');
        }
    } catch (error) {
        console.error('Error guardando configuración:', error);
        showAlert('❌ Error guardando configuración', 'error');
    }
}

// Añadir nueva URL de webhook
async function addWebhookUrl() {
    const url = document.getElementById('new-webhook-url').value.trim();
    
    if (!url) {
        showAlert('❌ Por favor ingresa una URL válida', 'error');
        return;
    }
    
    if (!webhookConfig.urls) {
        webhookConfig.urls = [];
    }
    
    if (webhookConfig.urls.includes(url)) {
        showAlert('❌ Esta URL ya está configurada', 'error');
        return;
    }
    
    webhookConfig.urls.push(url);
    
    try {
        const response = await apiRequest('/config', {
            method: 'POST',
            body: JSON.stringify(webhookConfig)
        });
        
        if (response.ok) {
            document.getElementById('new-webhook-url').value = '';
            updateWebhookUrls();
            loadStats();
            showAlert('✅ URL añadida correctamente', 'success');
        } else {
            webhookConfig.urls.pop(); // Revertir cambio
            showAlert('❌ Error añadiendo URL', 'error');
        }
    } catch (error) {
        console.error('Error añadiendo URL:', error);
        webhookConfig.urls.pop(); // Revertir cambio
        showAlert('❌ Error añadiendo URL', 'error');
    }
}

// Eliminar URL de webhook
async function removeWebhookUrl(index) {
    if (!confirm('¿Estás seguro de eliminar esta URL?')) {
        return;
    }
    
    const removedUrl = webhookConfig.urls[index];
    webhookConfig.urls.splice(index, 1);
    
    try {
        const response = await apiRequest('/config', {
            method: 'POST',
            body: JSON.stringify(webhookConfig)
        });
        
        if (response.ok) {
            updateWebhookUrls();
            loadStats();
            showAlert('✅ URL eliminada correctamente', 'success');
        } else {
            webhookConfig.urls.splice(index, 0, removedUrl); // Revertir cambio
            showAlert('❌ Error eliminando URL', 'error');
        }
    } catch (error) {
        console.error('Error eliminando URL:', error);
        webhookConfig.urls.splice(index, 0, removedUrl); // Revertir cambio
        showAlert('❌ Error eliminando URL', 'error');
    }
}

// Cargar estadísticas
async function loadStats() {
    try {
        const response = await apiRequest('/stats');
        if (response.ok) {
            webhookStats = await response.json();
            updateStatsUI();
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Actualizar estadísticas en la UI
function updateStatsUI() {
    document.getElementById('total-received').textContent = webhookStats.totalReceived || 0;
    document.getElementById('total-sent').textContent = webhookStats.totalSent || 0;
    document.getElementById('total-errors').textContent = webhookStats.errors || 0;
    document.getElementById('webhook-count').textContent = (webhookConfig.urls || []).length;
}

// Cargar logs
async function loadLogs() {
    try {
        const response = await apiRequest('/logs');
        if (response.ok) {
            const logs = await response.json();
            updateLogsUI(logs);
        }
    } catch (error) {
        console.error('Error cargando logs:', error);
    }
}

// Actualizar logs en la UI
function updateLogsUI(logs) {
    const container = document.getElementById('logs-container');
    
    if (!logs || logs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No hay logs disponibles</p>';
        return;
    }
    
    container.innerHTML = logs.reverse().map(log => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const statusClass = log.status === 'success' ? 'log-success' : (log.status === 'error' ? 'log-error' : 'log-info');
        const statusIcon = log.status === 'success' ? '✅' : (log.status === 'error' ? '❌' : 'ℹ️');
        
        return `
            <div class="log-entry">
                <div class="log-timestamp">${timestamp}</div>
                <div class="log-message ${statusClass}">
                    ${statusIcon} ${log.type}: ${log.url || 'Sistema'} 
                    ${log.error ? '- ' + log.error : ''}
                    ${log.statusCode ? '(HTTP ' + log.statusCode + ')' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Limpiar logs
async function clearLogs() {
    if (!confirm('¿Estás seguro de limpiar todos los logs?')) {
        return;
    }
    
    try {
        const response = await apiRequest('/logs', {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadLogs();
            showAlert('✅ Logs limpiados correctamente', 'success');
        } else {
            showAlert('❌ Error limpiando logs', 'error');
        }
    } catch (error) {
        console.error('Error limpiando logs:', error);
        showAlert('❌ Error limpiando logs', 'error');
    }
}

// Enviar webhook de prueba
async function sendTestWebhook() {
    let payload;
    try {
        const payloadText = document.getElementById('test-payload').value.trim();
        payload = payloadText ? JSON.parse(payloadText) : {
            test: true,
            message: "Webhook de prueba",
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        showAlert('❌ JSON inválido en el payload', 'error');
        return;
    }
    
    try {
        const response = await apiRequest('/test', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            const result = await response.json();
            document.getElementById('test-results').innerHTML = `
                <div class="alert alert-success">
                    ✅ <strong>Webhook enviado correctamente</strong><br>
                    Timestamp: ${result.timestamp}<br>
                    URLs configuradas: ${result.config?.urls || 0}<br>
                    Estado: ${result.config?.enabled ? 'Habilitado' : 'Deshabilitado'}
                </div>
            `;
            loadLogs();
            loadStats();
        } else {
            const error = await response.json();
            document.getElementById('test-results').innerHTML = `
                <div class="alert alert-error">
                    ❌ <strong>Error enviando webhook</strong><br>
                    ${error.error || 'Error desconocido'}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error enviando webhook de prueba:', error);
        document.getElementById('test-results').innerHTML = `
            <div class="alert alert-error">
                ❌ <strong>Error enviando webhook</strong><br>
                ${error.message}
            </div>
        `;
    }
}

// Probar URL específica
async function testWebhookUrl(url) {
    const payload = {
        test: true,
        message: "Prueba individual de URL",
        timestamp: new Date().toISOString(),
        targetUrl: url
    };
    
    try {
        const response = await apiRequest('/test', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            showAlert(`✅ Webhook enviado correctamente a ${url}`, 'success');
            loadLogs();
        } else {
            showAlert(`❌ Error enviando webhook a ${url}`, 'error');
        }
    } catch (error) {
        console.error('Error probando URL:', error);
        showAlert(`❌ Error probando ${url}`, 'error');
    }
}

// Mostrar alertas
function showAlert(message, type) {
    // Remover alerta anterior si existe
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Crear nueva alerta
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = message;
    
    // Insertar al principio del contenedor
    const container = document.querySelector('.container');
    container.insertBefore(alert, container.firstChild.nextSibling);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos iniciales
    loadConfig();
    loadStats();
    loadLogs();
    
    // Configurar payload de prueba por defecto
    document.getElementById('test-payload').value = JSON.stringify({
        test: true,
        message: "Webhook de prueba desde configurador",
        timestamp: new Date().toISOString(),
        source: "webhook-configurator"
    }, null, 2);
    
    // Auto-refresh cada 30 segundos
    setInterval(() => {
        loadStats();
        if (document.getElementById('logs-tab').classList.contains('active')) {
            loadLogs();
        }
    }, 30000);
});