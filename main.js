const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets/icon.ico')
  });

  mainWindow.loadFile('index.html');
  
  // Geliştirme için DevTools'u açabilirsiniz
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for data management
ipcMain.handle('get-tasks', () => {
  return store.get('tasks', []);
});

ipcMain.handle('save-task', (event, task) => {
  const tasks = store.get('tasks', []);
  tasks.push(task);
  store.set('tasks', tasks);
  return tasks;
});

ipcMain.handle('update-task', (event, updatedTask) => {
  const tasks = store.get('tasks', []);
  const index = tasks.findIndex(t => t.id === updatedTask.id);
  if (index !== -1) {
    tasks[index] = updatedTask;
    store.set('tasks', tasks);
  }
  return tasks;
});

ipcMain.handle('delete-task', (event, taskId) => {
  const tasks = store.get('tasks', []);
  const filteredTasks = tasks.filter(t => t.id !== taskId);
  store.set('tasks', filteredTasks);
  return filteredTasks;
});
