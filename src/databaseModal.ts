import { ipcRenderer } from "electron";

document.addEventListener("keydown", (ev) => {
  if (ev.code === "Escape") {
    ipcRenderer.send('close_database_modal');
  }
});

interface Data {
  host: string,
  port: string,
  database: string,
  username: string,
  password: string,
  connected: boolean,
  err?: string
}

let storageData = JSON.parse(localStorage.getItem("databaseConnectFormData")) as Data;

let formData: Data = {
  host: storageData?.host || "localhost",
  port: storageData?.port || "3306",
  database: storageData?.database || "peq",
  username: storageData?.username || "root",
  password: storageData?.password || "peq",
  connected: false
};

let form = document.getElementById('form');
let hostInput = document.getElementById('host') as HTMLInputElement;
let portInput = document.getElementById('port') as HTMLInputElement;
let databaseInput = document.getElementById('database') as HTMLInputElement;
let usernameInput = document.getElementById('username') as HTMLInputElement;
let passwordInput = document.getElementById('password') as HTMLInputElement;
let databaseStatus = document.getElementsByClassName('database-status')[0];
let connectButton = document.getElementById('connect') as HTMLButtonElement;
let closeButton = document.getElementById('close') as HTMLButtonElement;

form.addEventListener('submit', ev => submitForm(ev, false));
connectButton.addEventListener('click', ev => submitForm(ev, true));
closeButton.addEventListener('click', () => ipcRenderer.send('close_database_modal'));
hostInput.addEventListener('input', ev => changeFormData(ev, "host", hostInput));
portInput.addEventListener('input', ev => changeFormData(ev, "port", portInput));
databaseInput.addEventListener('input', ev => changeFormData(ev, "database", databaseInput));
usernameInput.addEventListener('input', ev => changeFormData(ev, "username", usernameInput));
passwordInput.addEventListener('input', ev => changeFormData(ev, "password", passwordInput));

updateView();
ipcRenderer.send('database_modal_is_database_connected');

function submitForm(ev: Event, canDisconnect: boolean) {
  ev.preventDefault();
  if (formData.connected) {
    if (canDisconnect) {
      ipcRenderer.send('disconnect_database');
      updateStatusDisconnect();
    }
  } else {
    saveFormData();
    databaseStatus.innerHTML = `Connecting to database...`
    let width = connectButton.offsetWidth;
    connectButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
    connectButton.style.width = `${width}px`;
    connectButton.disabled = true;
    closeButton.disabled = true;
    hostInput.disabled = true;
    portInput.disabled = true;
    databaseInput.disabled = true;
    usernameInput.disabled = true;
    passwordInput.disabled = true
    ipcRenderer.send('connect_database', formData.host, formData.port, formData.database, formData.username, formData.password);
  }
}

function changeFormData(ev: Event, fieldName: string, el: HTMLInputElement) {
  let data: Data = Object.assign({}, formData, {
    [fieldName]: el.value,
    connected: false
  });
  setFormData(data);
}

function setFormData(data: Data) {
  formData = data;
  updateView();
}

function updateView() {
  hostInput.value = formData.host;
  portInput.value = formData.port;
  databaseInput.value = formData.database;
  usernameInput.value = formData.username;
  passwordInput.value = formData.password;
  let width = connectButton.offsetWidth;
  if (formData.connected) {
    connectButton.innerHTML = "Disconnect";
    hostInput.disabled = true;
    portInput.disabled = true;
    databaseInput.disabled = true;
    usernameInput.disabled = true;
    passwordInput.disabled = true
  }
  else {
    hostInput.disabled = false;
    portInput.disabled = false;
    databaseInput.disabled = false;
    usernameInput.disabled = false;
    passwordInput.disabled = false
    connectButton.innerHTML = "Connect";
    if (formData.err) {
      databaseStatus.innerHTML = formData.err;
    } else {
      databaseStatus.innerHTML = 'Not connected to Database';
    }
  }
  connectButton.style.width = `${width}px`;
}

function saveFormData() {
  localStorage.setItem("databaseConnectFormData", JSON.stringify(formData));
}

function updateStatus(success: boolean, message?: string) {
  if (formData.err) delete formData.err;
  if (success) databaseStatus.innerHTML = `<b class="success">Successfully</b> connected to database`;
  closeButton.disabled = false;
  connectButton.disabled = false;
  setFormData(Object.assign({}, formData, { connected: success, ...( message ? { err: `<b class="failure">Failed</b> to connect to database with message<br />${message}` } : {} ) }));
  updateView();
}

function updateStatusDisconnect() {
  setFormData(Object.assign({}, formData, {
    connected: false
  }));
  ipcRenderer.send('disconnect_database');
}

ipcRenderer.on('connected_database', (event, success, message) => updateStatus(success, message));

ipcRenderer.on('is_database_connected_response', (event, connected) => {
  if (connected) {
    setFormData(Object.assign({}, formData, {
      connected: true
    }));
    databaseStatus.innerHTML = `<b class="success">Connected</b> to Database`;
  }
})