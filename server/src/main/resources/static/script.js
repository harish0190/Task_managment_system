const API_BASE_URL = (window.location.origin === 'null' || window.location.protocol === 'file:') 
    ? 'http://localhost:8080/api' 
    : window.location.origin + '/api';
const TASKS_URL = API_BASE_URL + '/tasks';
const AUTH_URL = API_BASE_URL + '/auth';

// --- State Management ---
let tasks = [];
let token = localStorage.getItem('token');
let currentUser = localStorage.getItem('username');
let currentRole = localStorage.getItem('role');
let currentTheme = localStorage.getItem('theme') || 'light';
let currentView = 'dashboard';
let isRegisterMode = false;

// --- Mapping Helpers ---
const statusMap = {
    'Pending': 'PENDING',
    'In Progress': 'IN_PROGRESS',
    'Completed': 'COMPLETED',
    'Rejected': 'REJECTED',
    'Needs Approval': 'PENDING_APPROVAL',
    'PENDING': 'Pending',
    'IN_PROGRESS': 'In Progress',
    'COMPLETED': 'Completed',
    'REJECTED': 'Rejected',
    'PENDING_APPROVAL': 'Needs Approval'
};

const priorityMap = {
    'low': 'LOW',
    'medium': 'MEDIUM',
    'high': 'HIGH',
    'LOW': 'low',
    'MEDIUM': 'medium',
    'HIGH': 'high'
};

// --- DOM Elements ---
const sidebar = document.getElementById('sidebar');
const mobileToggle = document.getElementById('mobileToggle');
const sidebarClose = document.getElementById('sidebarClose');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const mainView = document.getElementById('mainView');
const viewTitle = document.getElementById('viewTitle');
const taskModal = document.getElementById('taskModal');
const createTaskBtn = document.getElementById('createTaskBtn');
const modalCloseBtns = document.querySelectorAll('.modal-close');
const taskForm = document.getElementById('taskForm');
const micBtn = document.getElementById('micBtn');
const voiceOverlay = document.getElementById('voiceOverlay');
const stopVoiceBtn = document.getElementById('stopVoice');
const speechTranscript = document.getElementById('speechTranscript');

// Auth Elements
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authToggleBtn = document.getElementById('authToggleBtn');
const authToggleText = document.getElementById('authToggleText');
const roleSelectGroup = document.getElementById('roleSelectGroup');
const logoutBtn = document.getElementById('logoutBtn');
const userNameDisplay = document.getElementById('userNameDisplay');
const userRoleDisplay = document.getElementById('userRoleDisplay');
const userAvatar = document.getElementById('userAvatar');

// --- API Implementation ---
async function fetchTasks() {
    if (!token) return;
    try {
        const response = await fetch(TASKS_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) return logout();
        if (!response.ok) throw new Error('API unstable');
        const data = await response.json();
        
        tasks = data.map(t => ({
            id: t.id.toString(),
            title: t.title,
            description: t.description,
            priority: priorityMap[t.priority] || 'medium',
            status: statusMap[t.status] || 'Pending',
            deadline: t.deadline || '',
            assignedTo: t.assignedTo ? t.assignedTo.username : 'Unassigned',
            createdAt: t.createdAt
        }));
        
        renderView(currentView);
    } catch (error) {
        console.error('Fetch error:', error);
        showToast('Connection error', 'error');
    }
}

async function apiCreateTask(taskData) {
    try {
        const response = await fetch(TASKS_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: taskData.title,
                description: taskData.description,
                priority: priorityMap[taskData.priority],
                status: statusMap[taskData.status],
                deadline: taskData.deadline || null
            })
        });
        if (!response.ok) throw new Error('Failed to create task');
        await fetchTasks();
        showToast('Task created successfully!', 'success');
    } catch (error) {
        showToast('Error creating task', 'error');
    }
}

async function apiUpdateTask(id, taskData) {
    try {
        const response = await fetch(`${TASKS_URL}/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: taskData.title,
                description: taskData.description,
                priority: priorityMap[taskData.priority],
                status: statusMap[taskData.status],
                deadline: taskData.deadline || null
            })
        });
        if (!response.ok) throw new Error('Failed to update task');
        await fetchTasks();
        showToast('Task updated!', 'success');
    } catch (error) {
        showToast('Error updating task', 'error');
    }
}

async function apiUpdateStatus(id, newStatus) {
    try {
        const response = await fetch(`${TASKS_URL}/${id}/status`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: statusMap[newStatus] })
        });
        if (!response.ok) throw new Error('Failed to update status');
        await fetchTasks();
        const msg = (newStatus === 'Completed' && currentRole === 'ROLE_EMPLOYEE') 
            ? 'Submitted for Approval' 
            : `Moved to ${newStatus}`;
        showToast(msg, 'success');
    } catch (error) {
        showToast('Error updating status', 'error');
    }
}

async function apiApprovalAction(id, action) {
    try {
        const response = await fetch(`${TASKS_URL}/${id}/${action}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Failed to ${action} task`);
        await fetchTasks();
        showToast(`Task ${action}ed!`, 'success');
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}

async function apiDeleteTask(id) {
    try {
        const response = await fetch(`${TASKS_URL}/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete task');
        await fetchTasks();
        showToast('Task deleted', 'info');
    } catch (error) {
        showToast('Error deleting task', 'error');
    }
}

async function apiVoiceCommand(command) {
    try {
        const response = await fetch(`${TASKS_URL}/voice-command`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ command: command })
        });
        if (!response.ok) throw new Error('Backend error');
        await fetchTasks();
        showToast('Command processed', 'success');
        playBeep(880, 0.2);
    } catch (error) {
        console.error('Voice API error:', error);
        handleLocalVoiceCommand(command);
    }
}

// --- Authentication UI Logic ---
function updateAuthUI() {
    if (token) {
        loginOverlay.style.display = 'none';
        userNameDisplay.textContent = currentUser;
        userRoleDisplay.textContent = currentRole === 'ROLE_MANAGER' ? 'Manager' : 'Employee';
        userAvatar.src = `https://ui-avatars.com/api/?name=${currentUser}&background=6366f1&color=fff`;
        
        // Hide/Show Manager specific features
        createTaskBtn.style.display = (currentRole === 'ROLE_MANAGER' || currentRole === 'ROLE_EMPLOYEE') ? 'flex' : 'none';
        micBtn.style.display = (currentRole === 'ROLE_MANAGER' || currentRole === 'ROLE_EMPLOYEE') ? 'flex' : 'none';
    } else {
        loginOverlay.style.display = 'flex';
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;
    const role = document.getElementById('loginRole').value;

    const endpoint = isRegisterMode ? '/signup' : '/signin';
    const body = isRegisterMode ? { username, password, role } : { username, password };

    try {
        const res = await fetch(AUTH_URL + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(error);
        }

        if (isRegisterMode) {
            showToast('Account created! Please sign in.', 'success');
            toggleAuthMode();
        } else {
            const data = await res.json();
            token = data.token;
            currentUser = data.username;
            currentRole = data.role;
            localStorage.setItem('token', token);
            localStorage.setItem('username', currentUser);
            localStorage.setItem('role', currentRole);
            updateAuthUI();
            fetchTasks();
            showToast('Successfully signed in!', 'success');
        }
    } catch (error) {
        let msg = error.message;
        try {
            const json = JSON.parse(msg);
            msg = json.error || Object.values(json)[0] || msg;
        } catch (e) {}
        showToast(msg, 'error');
    }
}

function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    authTitle.textContent = isRegisterMode ? 'Create Account' : 'Welcome Back';
    authSubtitle.textContent = isRegisterMode ? 'Join our team today' : 'Please sign in to continue';
    authSubmitBtn.textContent = isRegisterMode ? 'Sign Up' : 'Sign In';
    authToggleText.textContent = isRegisterMode ? 'Already have an account?' : "Don't have an account?";
    authToggleBtn.textContent = isRegisterMode ? 'Sign In' : 'Sign Up';
    roleSelectGroup.style.display = isRegisterMode ? 'block' : 'none';
    loginForm.reset();
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    updateAuthUI();
    showToast('Logged out successfully', 'info');
}

// --- Initialization ---
function init() {
    applyTheme(currentTheme);
    setupEventListeners();
    updateAuthUI();
    if (token) fetchTasks();
}

// --- Theme Management ---
function applyTheme(theme) {
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
    themeIcon.setAttribute('data-lucide', theme === 'dark' ? 'moon' : 'sun');
    lucide.createIcons();
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    showToast(`Switched to ${currentTheme} mode`, 'success');
}

// --- Navigation & Routing ---
function renderView(view) {
    currentView = view;
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });

    switch(view) {
        case 'dashboard':
            renderDashboard();
            viewTitle.textContent = 'Dashboard';
            break;
        case 'tasks':
            renderTaskList();
            viewTitle.textContent = 'My Tasks';
            break;
        case 'workflow':
            renderWorkflow();
            viewTitle.textContent = 'Workflow';
            break;
        default:
            mainView.innerHTML = `<h2>Coming Soon</h2>`;
    }
    lucide.createIcons();
}

// --- View Renderers ---
function renderDashboard() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pendingApproval = tasks.filter(t => t.status === 'Needs Approval').length;

    mainView.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon total"><i data-lucide="layers"></i></div>
                <div class="stat-info">
                    <span class="value">${total}</span>
                    <span class="label">Total Tasks</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon complete"><i data-lucide="check-circle"></i></div>
                <div class="stat-info">
                    <span class="value">${completed}</span>
                    <span class="label">Completed</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon pending" style="background: #e0e7ff; color: #4338ca;"><i data-lucide="eye"></i></div>
                <div class="stat-info">
                    <span class="value">${pendingApproval}</span>
                    <span class="label">Pending Approval</span>
                </div>
            </div>
        </div>

        <section class="recent-section">
            <div class="section-header">
                <h3>Recent Tasks</h3>
                <button class="btn btn-outline" id="viewAllTasks">View All</button>
            </div>
            <div class="task-grid" id="recentTasks">
                ${tasks.length === 0 ? '<p class="empty-msg">No tasks yet. Create one or try saying "Add task"!</p>' : ''}
            </div>
        </section>
    `;

    if (tasks.length > 0) {
        renderTaskCards(tasks.slice(-3), 'recentTasks');
    }

    document.getElementById('viewAllTasks')?.addEventListener('click', () => renderView('tasks'));
}

function renderTaskList() {
    mainView.innerHTML = `
        <div class="task-filters">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="Pending">Pending</button>
            <button class="filter-btn" data-filter="In Progress">In Progress</button>
            <button class="filter-btn" data-filter="Needs Approval">Needs Approval</button>
            <button class="filter-btn" data-filter="Completed">Done</button>
        </div>
        <div class="task-grid" id="allTasksList"></div>
    `;
    renderTaskCards(tasks, 'allTasksList');
}

function renderTaskCards(taskArray, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = taskArray.map(task => {
        const isManager = currentRole === 'ROLE_MANAGER';
        const needsApproval = task.status === 'Needs Approval';
        const canEdit = isManager;
        
        return `
            <div class="task-card" data-id="${task.id}" draggable="${task.status !== 'Completed'}">
                <div class="task-card-header">
                    <span class="priority-badge ${task.priority}">${task.priority}</span>
                    <div class="task-actions" style="display: ${canEdit ? 'flex' : 'none'}">
                        <button class="task-action-btn edit-task"><i data-lucide="edit-2"></i></button>
                        <button class="task-action-btn delete-task"><i data-lucide="trash-2"></i></button>
                    </div>
                </div>
                <h4 class="task-card-title">${task.title}</h4>
                <p class="task-card-desc">${task.description || 'No description'}</p>
                
                ${isManager && needsApproval ? `
                    <div class="approval-actions">
                        <button class="btn btn-sm btn-success approve-task"><i data-lucide="check"></i> Approve</button>
                        <button class="btn btn-sm btn-danger reject-task"><i data-lucide="x"></i> Reject</button>
                    </div>
                ` : ''}

                <div class="task-card-footer">
                    <span class="status-tag status-${task.status.toLowerCase().replace(' ', '_')}">${task.status}</span>
                    <span class="deadline">${task.assignedTo ? '<i data-lucide="user"></i> ' + task.assignedTo : ''}</span>
                </div>
            </div>
        `;
    }).join('');
    
    // Add drag event listeners
    container.querySelectorAll('.task-card').forEach(card => {
        card.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', card.dataset.id);
            card.style.opacity = '0.5';
        };
        card.ondragend = () => card.style.opacity = '1';
    });
    
    lucide.createIcons();
}

function renderWorkflow() {
    mainView.innerHTML = `
        <div class="workflow-board" style="grid-template-columns: repeat(${currentRole === 'ROLE_MANAGER' ? 4 : 3}, 1fr)">
            <div class="workflow-column" data-status="Pending">
                <div class="column-header">Pending <span class="badge" id="count-pending">0</span></div>
                <div class="column-content" id="col-pending"></div>
            </div>
            <div class="workflow-column" data-status="In Progress">
                <div class="column-header">In Progress <span class="badge" id="count-progress">0</span></div>
                <div class="column-content" id="col-progress"></div>
            </div>
            <div class="workflow-column" data-status="Needs Approval">
                <div class="column-header">Approval <span class="badge" id="count-needs_approval">0</span></div>
                <div class="column-content" id="col-needs_approval"></div>
            </div>
            ${currentRole === 'ROLE_MANAGER' ? `
                <div class="workflow-column" data-status="Completed">
                    <div class="column-header">Done <span class="badge" id="count-completed">0</span></div>
                    <div class="column-content" id="col-completed"></div>
                </div>
            ` : ''}
        </div>
    `;

    const cols = currentRole === 'ROLE_MANAGER' ? 
        ['Pending', 'In Progress', 'Needs Approval', 'Completed'] : 
        ['Pending', 'In Progress', 'Needs Approval'];
        
    const ids = currentRole === 'ROLE_MANAGER' ? 
        ['col-pending', 'col-progress', 'col-needs_approval', 'col-completed'] : 
        ['col-pending', 'col-progress', 'col-needs_approval'];
        
    const countIds = currentRole === 'ROLE_MANAGER' ? 
        ['count-pending', 'count-progress', 'count-needs_approval', 'count-completed'] : 
        ['count-pending', 'count-progress', 'count-needs_approval'];

    cols.forEach((status, i) => {
        const filtered = tasks.filter(t => t.status === status);
        renderTaskCards(filtered, ids[i]);
        document.getElementById(countIds[i]).textContent = filtered.length;

        const col = document.getElementById(ids[i]).parentElement;
        col.ondragover = (e) => {
            e.preventDefault();
            col.style.background = 'var(--bg-secondary)';
        };
        col.ondragleave = () => col.style.background = 'var(--bg-primary)';
        col.ondrop = (e) => {
            e.preventDefault();
            col.style.background = 'var(--bg-primary)';
            const taskId = e.dataTransfer.getData('text/plain');
            const task = tasks.find(t => t.id === taskId);
            if (task && task.status !== status) {
                apiUpdateStatus(taskId, status); // Call API
            }
        };
    });
}

// --- Voice Interaction (Web Speech API) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

// Audio Feedback
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq = 440, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
        voiceOverlay.style.display = 'flex';
        micBtn.classList.add('listening');
        speechTranscript.textContent = 'Listening...';
        playBeep(660);
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        speechTranscript.textContent = transcript;
        
        if (event.results[0].isFinal) {
            handleVoiceCommand(transcript);
        }
    };

    recognition.onend = () => {
        voiceOverlay.style.display = 'none';
        micBtn.classList.remove('listening');
    };
}

function handleVoiceCommand(transcript) {
    // Try Backend processing first
    apiVoiceCommand(transcript);
}

function handleLocalVoiceCommand(command) {
    const lowerCommand = command.toLowerCase().trim();
    console.log('Voice Command (Local):', lowerCommand);

    if (lowerCommand.includes('add task') || lowerCommand.includes('create task')) {
        let taskTitle = '';
        if (lowerCommand.includes('add task')) taskTitle = lowerCommand.split('add task')[1].trim();
        else taskTitle = lowerCommand.split('create task')[1].trim();

        let priority = 'medium';
        if (lowerCommand.includes('high priority') || lowerCommand.includes('urgent')) {
            priority = 'high';
            taskTitle = taskTitle.replace('with high priority', '').replace('urgent', '').trim();
        } else if (lowerCommand.includes('low priority')) {
            priority = 'low';
            taskTitle = taskTitle.replace('with low priority', '').trim();
        }

        if (taskTitle) {
            const newTask = {
                title: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
                description: 'Created via voice (Local Fallback)',
                priority: priority,
                deadline: '',
                status: 'Pending',
                createdAt: new Date().toISOString()
            };
            apiCreateTask(newTask);
            playBeep(880, 0.2);
        }
    } else if (lowerCommand.includes('show tasks') || lowerCommand.includes('go to tasks')) {
        renderView('tasks');
    } else if (lowerCommand.includes('show dashboard') || lowerCommand.includes('go to dashboard')) {
        renderView('dashboard');
    } else if (lowerCommand.includes('dark mode')) {
        applyTheme('dark');
        showToast('Dark mode enabled', 'success');
    } else if (lowerCommand.includes('light mode')) {
        applyTheme('light');
        showToast('Light mode enabled', 'success');
    }
}

// --- UI Helpers ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}"></i>
        </div>
        <div class="toast-content">${message}</div>
    `;
    container.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function openModal() {
    taskModal.style.display = 'flex';
}

function closeModal() {
    taskModal.style.display = 'none';
    taskForm.reset();
}

// --- Event Listeners ---
function setupEventListeners() {
    mobileToggle.addEventListener('click', () => sidebar.classList.add('open'));
    sidebarClose.addEventListener('click', () => sidebar.classList.remove('open'));
    themeToggle.addEventListener('click', toggleTheme);
    logoutBtn.addEventListener('click', logout);
    authToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });
    loginForm.addEventListener('submit', handleAuthSubmit);
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            renderView(item.dataset.view);
            if (window.innerWidth < 768) sidebar.classList.remove('open');
        });
    });

    createTaskBtn.addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'Create New Task';
        taskForm.dataset.mode = 'create';
        openModal();
    });

    modalCloseBtns.forEach(btn => btn.addEventListener('click', closeModal));
    
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const mode = taskForm.dataset.mode;
        const id = taskForm.dataset.id;
        
        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDesc').value,
            priority: document.getElementById('taskPriority').value,
            deadline: document.getElementById('taskDeadline').value,
            status: 'Pending'
        };

        if (mode === 'create') {
            apiCreateTask(taskData);
        } else {
            apiUpdateTask(id, taskData);
        }

        closeModal();
    });

    micBtn.addEventListener('click', () => {
        if (recognition) {
            try {
                recognition.start();
            } catch (e) {
                recognition.stop();
            }
        } else {
            showToast('Speech Recognition not supported', 'error');
        }
    });

    stopVoiceBtn.addEventListener('click', () => recognition.stop());

    // Delegate actions
    mainView.addEventListener('click', (e) => {
        const card = e.target.closest('.task-card');
        if (!card) {
            if (e.target.classList.contains('filter-btn')) {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const filter = e.target.dataset.filter;
                const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
                renderTaskCards(filteredTasks, 'allTasksList');
            }
            return;
        }

        const id = card.dataset.id;
        const task = tasks.find(t => t.id === id);

        if (e.target.closest('.delete-task')) {
            apiDeleteTask(id);
        } else if (e.target.closest('.edit-task')) {
            taskForm.dataset.mode = 'edit';
            taskForm.dataset.id = id;
            document.getElementById('modalTitle').textContent = 'Edit Task';
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDesc').value = task.description;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskDeadline').value = task.deadline || '';
            openModal();
        } else if (e.target.closest('.approve-task')) {
            apiApprovalAction(id, 'approve');
        } else if (e.target.closest('.reject-task')) {
            apiApprovalAction(id, 'reject');
        } else if (e.target.closest('.status-tag')) {
            if (currentRole !== 'ROLE_EMPLOYEE' && currentRole !== 'ROLE_MANAGER') return;
            const statuses = ['Pending', 'In Progress', 'Completed'];
            let nextIndex = (statuses.indexOf(task.status) + 1) % statuses.length;
            apiUpdateStatus(id, statuses[nextIndex]);
        }
    });
}

function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Start App
init();
