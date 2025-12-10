const { ipcRenderer } = require('electron');

// State
let tasks = [];
let currentTaskId = null;
let currentFilter = {
    active: 'all',
    completed: 'all',
    deleted: 'all'
};

// DOM Elements
const newTaskBtn = document.getElementById('newTaskBtn');
const newTaskModal = document.getElementById('newTaskModal');
const taskDetailModal = document.getElementById('taskDetailModal');
const newTaskForm = document.getElementById('newTaskForm');
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanes = document.querySelectorAll('.tab-pane');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadTasks();
    setupEventListeners();
    renderTasks();
});

// Load tasks from storage
async function loadTasks() {
    tasks = await ipcRenderer.invoke('get-tasks');
}

// Setup event listeners
function setupEventListeners() {
    // New Task Button
    newTaskBtn.addEventListener('click', () => {
        openModal(newTaskModal);
    });

    // Close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal);
        });
    });

    // Cancel button
    document.getElementById('cancelNewTask').addEventListener('click', () => {
        closeModal(newTaskModal);
    });

    // Close detail modal button
    document.getElementById('closeDetailModal').addEventListener('click', () => {
        closeModal(taskDetailModal);
    });

    // Complete task button
    document.getElementById('completeTaskBtn').addEventListener('click', async () => {
        await completeTask(currentTaskId);
        closeModal(taskDetailModal);
    });

    // Delete task button
    document.getElementById('deleteTaskBtn').addEventListener('click', async () => {
        await deleteTask(currentTaskId);
        closeModal(taskDetailModal);
    });

    // Form submit
    newTaskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createTask();
    });

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });

    // Filter listeners
    document.getElementById('activeFilter').addEventListener('change', (e) => {
        currentFilter.active = e.target.value;
        renderTasks();
    });

    document.getElementById('completedFilter').addEventListener('change', (e) => {
        currentFilter.completed = e.target.value;
        renderTasks();
    });

    document.getElementById('deletedFilter').addEventListener('change', (e) => {
        currentFilter.deleted = e.target.value;
        renderTasks();
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });
}

// Modal functions
function openModal(modal) {
    modal.classList.add('show');
}

function closeModal(modal) {
    modal.classList.remove('show');
    if (modal === newTaskModal) {
        newTaskForm.reset();
    }
}

// Tab switching
function switchTab(tabName) {
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    tabPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === `${tabName}-tasks`) {
            pane.classList.add('active');
        }
    });
}

// Create new task
async function createTask() {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const priority = document.getElementById('taskPriority').value;
    const category = document.getElementById('taskCategory').value;

    const task = {
        id: Date.now(),
        title,
        description,
        priority,
        category: category || 'Genel',
        createdAt: new Date().toISOString(),
        completed: false,
        completedAt: null
    };

    tasks = await ipcRenderer.invoke('save-task', task);
    renderTasks();
    closeModal(newTaskModal);
}

// Complete task
async function completeTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = true;
        task.completedAt = new Date().toISOString();
        tasks = await ipcRenderer.invoke('update-task', task);
        renderTasks();
    }
}

// Delete task
async function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
        task.deleted = true;
        task.deletedAt = new Date().toISOString();
        tasks = await ipcRenderer.invoke('update-task', task);
        renderTasks();
    }
}

// Render tasks
function renderTasks() {
    const activeTasks = tasks.filter(t => !t.completed && !t.deleted);
    const completedTasks = tasks.filter(t => t.completed && !t.deleted);
    const deletedTasks = tasks.filter(t => t.deleted);

    // Filter by category
    const filteredActiveTasks = currentFilter.active === 'all' 
        ? activeTasks 
        : activeTasks.filter(t => t.category === currentFilter.active);
    
    const filteredCompletedTasks = currentFilter.completed === 'all' 
        ? completedTasks 
        : completedTasks.filter(t => t.category === currentFilter.completed);
    
    const filteredDeletedTasks = currentFilter.deleted === 'all' 
        ? deletedTasks 
        : deletedTasks.filter(t => t.category === currentFilter.deleted);

    renderTaskList(filteredActiveTasks, 'activeTasksList', false, false);
    renderTaskList(filteredCompletedTasks, 'completedTasksList', true, false);
    renderTaskList(filteredDeletedTasks, 'deletedTasksList', false, true);

    // Update filter dropdowns
    updateFilterDropdowns();
}

// Render task list
function renderTaskList(taskList, containerId, isCompleted, isDeleted) {
    const container = document.getElementById(containerId);
    
    if (taskList.length === 0) {
        let emptyMessage = 'Henüz aktif görev yok';
        let emptyDescription = 'Yeni görev oluşturmak için sağ üstteki butona tıklayın';
        
        if (isCompleted) {
            emptyMessage = 'Henüz tamamlanmış görev yok';
            emptyDescription = 'Tamamlanan görevler burada görünecek';
        } else if (isDeleted) {
            emptyMessage = 'Henüz silinmiş görev yok';
            emptyDescription = 'Silinen görevler burada görünecek';
        }
        
        container.innerHTML = `
            <div class="empty-state">
                <h3>${emptyMessage}</h3>
                <p>${emptyDescription}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = taskList.map(task => `
        <div class="task-card ${task.completed ? 'completed' : ''} priority-${task.priority}" data-task-id="${task.id}">
            <div class="task-header">
                <div class="task-actions">
                    <span class="priority-badge ${task.priority}">${getPriorityText(task.priority)}</span>
                </div>
            </div>
            <h3 class="task-title">${escapeHtml(task.title)}</h3>
            <p class="task-description">${escapeHtml(task.description) || 'Açıklama yok'}</p>
            <div class="task-meta">
                <span class="task-category">${escapeHtml(task.category)}</span>
                <span class="task-date">${formatDate(task.createdAt)}</span>
            </div>
        </div>
    `).join('');

    // Add click listeners to task cards
    container.querySelectorAll('.task-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const taskId = parseInt(card.dataset.taskId);
            showTaskDetail(taskId);
        });
    });
}

// Show task detail
function showTaskDetail(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    currentTaskId = taskId;

    document.getElementById('detailTaskTitle').textContent = task.title;
    document.getElementById('detailPriority').textContent = getPriorityText(task.priority);
    document.getElementById('detailPriority').className = `priority-badge ${task.priority}`;
    document.getElementById('detailCategory').textContent = task.category;
    document.getElementById('detailCreatedDate').textContent = formatDateTime(task.createdAt);
    document.getElementById('detailDescription').textContent = task.description || 'Açıklama yok';

    // Show/hide completed date and deleted date
    const completedDateSection = document.getElementById('completedDateSection');
    const completeTaskBtn = document.getElementById('completeTaskBtn');
    const deleteTaskBtn = document.getElementById('deleteTaskBtn');
    
    if (task.completed) {
        completedDateSection.style.display = 'block';
        document.getElementById('detailCompletedDate').textContent = formatDateTime(task.completedAt);
        completeTaskBtn.style.display = 'none';
        deleteTaskBtn.style.display = 'none';
    } else if (task.deleted) {
        completedDateSection.style.display = 'none';
        completeTaskBtn.style.display = 'none';
        deleteTaskBtn.style.display = 'none';
    } else {
        completedDateSection.style.display = 'none';
        completeTaskBtn.style.display = 'block';
        deleteTaskBtn.style.display = 'block';
    }

    openModal(taskDetailModal);
}

// Utility functions
function getPriorityText(priority) {
    const priorities = {
        low: 'Düşük',
        medium: 'Orta',
        high: 'Yüksek'
    };
    return priorities[priority] || priority;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Update filter dropdowns with available categories
function updateFilterDropdowns() {
    const categories = ['all', ...new Set(tasks.map(t => t.category))];
    
    const activeFilter = document.getElementById('activeFilter');
    const completedFilter = document.getElementById('completedFilter');
    const deletedFilter = document.getElementById('deletedFilter');
    
    updateFilterDropdown(activeFilter, categories, currentFilter.active);
    updateFilterDropdown(completedFilter, categories, currentFilter.completed);
    updateFilterDropdown(deletedFilter, categories, currentFilter.deleted);
}

function updateFilterDropdown(dropdown, categories, currentValue) {
    const currentSelected = currentValue || 'all';
    dropdown.innerHTML = categories.map(cat => {
        if (cat === 'all') {
            return `<option value="all" ${currentSelected === 'all' ? 'selected' : ''}>Tümü</option>`;
        }
        return `<option value="${cat}" ${currentSelected === cat ? 'selected' : ''}>${cat}</option>`;
    }).join('');
}
