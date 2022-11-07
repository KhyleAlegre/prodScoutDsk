const { app, BrowserWindow, ipcMain, desktopCapturer, Menu, webContents, contextBridge, ipcRenderer, Notification } = require("electron");
const url = require("url");
const path = require("path");
const activeWindows = require('electron-active-window');
const log = require('electron-log');


activeWindows().getActiveWindow().then((result) => {
  console.log(result)
})

let appWin;
const notif_title = "Deskty has a message!"
const notif_body = "We are watching you, please focus on your studies / activities"

createWindow = () => {
  appWin = new BrowserWindow({
    width: 500,
    height: 750,
    title: "Deskty - prodScout Watcher for Windows",
    resizable: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  });

  appWin.loadURL(
    url.format({
      pathname: path.join(__dirname, `/dist/index.html`),
      protocol: "file:",
      slashes: true,
    })
  );

  
  appWin.on("close", (e) => {
    e.preventDefault();
    appWin.hide();
  });

  
  //appWindow.setMenu(null);
}

app.on("ready",createWindow);
app.on("window-all-closed", ()=>{
 // if (process.platform !== "darwin") {
  //  app.quit();
 // }
  app.hide();
})

// Send Reply on Ping
ipcMain.on("message", (event) => event.reply("reply", "We're Scouting this device"));

// Nudge
ipcMain.on("watch", () => {
  showNotif();
})
function showNotif() {
  new Notification({title: notif_title, body: notif_body}).show()
}

// Create Local Logs
log.transports.file.level = 'logs';
log.transports.file.resolvePath = () => path.join(__dirname, 'logs/eventLog.log');


// Check running Windows
ipcMain.on("check", () =>{
  activeWindows().getActiveWindow().then((result) => {
    console.log(result)
    log.info(result)
    appWin.webContents.send("appLogs", result)
  })
})

// Screenshot
ipcMain.on("screenshot", () => {
  desktopCapturer
  .getSources({
    types: ["screen"],
    thumbnailSize: { width: 1080, height: 720 },
  }).then((sources) => {
    let image = sources[0].thumbnail.toDataURL();
    appWin.webContents.send("capture", image);
  });
})



