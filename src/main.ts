/* eslint global-require: "off" */

import {
  app, BrowserWindow, Menu, MenuItem, dialog, ipcMain,
} from 'electron';
import * as path from 'path';
import ZoneFileLoader from './ZoneFileLoader';

let mainWindow: BrowserWindow;
let databaseModal: BrowserWindow;
let cwd: string;

function openZone(): void {
  dialog.showOpenDialog({
    title: 'Open Zone File',
    filters: [
      {
        name: 'S3D Zone File',
        extensions: ['s3d'],
      },
    ],
  }).then(async (files) => {
    if (files.canceled) return;

    const scene = await ZoneFileLoader.load(files.filePaths[0]);
    cwd = path.dirname(files.filePaths[0]);

    mainWindow.webContents.send('load_zone', scene);
  });
}

function openDatabaseModal(): void {
  databaseModal = new BrowserWindow({
    width: 400,
    height: 550,
    x: mainWindow.getPosition()[0] + mainWindow.getSize()[0] / 2.0 - 200,
    y: mainWindow.getPosition()[1] + mainWindow.getSize()[1] / 2.0 - 200,
    modal: true,
    parent: mainWindow,
    show: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    }
  });
  databaseModal.loadFile(path.join(__dirname, "../databaseModal.html"));
  databaseModal.on('ready-to-show', () => databaseModal.show());
  //openDatabaseModal.webContents.openDevTools();
  mainWindow.blur();
}

function createWindow(): void {
  const { screen } = require('electron');
  const display = screen.getAllDisplays()[0]; // secondary display DEBUG
  // screen.getPrimaryDisplay()
  const displayArea = display.workArea;

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: displayArea.width,
    height: displayArea.height,
    x: displayArea.x,
    y: displayArea.y,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // DEBUG
  /*mainWindow.webContents.on('dom-ready', () => {
    ZoneFileLoader.load('C:\\Users\\amalk\\Documents\\Projects\\EQTools\\crushbone.s3d').then((scene) => {
      mainWindow.webContents.send('load_zone', scene);
    });
  });*/
  // END DEBUG

  const isMac = process.platform === 'darwin';

  const menuTemplate = [
    new MenuItem({
      label: 'File',
      submenu: [
        {
          label: 'Open Zone',
          click: () => openZone(),
        },
        {
          label: 'Database Settings',
          click: () => openDatabaseModal(),
        },
        {
          role: isMac ? 'close' : 'quit',
        },
      ],
    }),
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it"s common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('request_objects', (event, zone: string) => {
  ZoneFileLoader.load(path.join(cwd, `${zone.slice(0, zone.length - 4)}_obj.s3d`)).then((scene) => {
    mainWindow.webContents.send('load_objects', scene);
  });
});

ipcMain.on('close_database_modal', (event, zone: string) => {
  if (databaseModal && !databaseModal.isDestroyed()) {
    databaseModal.destroy();
    mainWindow.focus();
  }
});

ipcMain.on('test', (event, text: string) => {
  console.log(text);
});

ipcMain.on('connect_database', (event, host, port, database, username, password) => {
  mainWindow.webContents.send('connect_database', host, port, database, username, password);
});

ipcMain.on('connected_database', (event, success, message) => {
  if (databaseModal && !databaseModal.isDestroyed()) databaseModal.webContents.send('connected_database', success, message);
});

ipcMain.on('disconnect_database', () => {
  mainWindow.webContents.send('disconnect_database')
});

ipcMain.on('database_modal_is_database_connected', () => {
  mainWindow.webContents.send('is_database_connected');
});

ipcMain.on('is_database_connected_response', (event, connected) => {
  if (databaseModal && !databaseModal.isDestroyed()) databaseModal.webContents.send('is_database_connected_response', connected);
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
