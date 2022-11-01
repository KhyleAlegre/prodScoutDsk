const { app, BrowserWindow } = require("electron");
const url = require("url");
const path = require("path");

app.on("ready", onReady);
app.on("window-all-closed", closeWindow);
app.on("activate", activate);

function onReady() {
  appWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
    },
    icon: `file>// ${__dirname}/dist/assets/ps16.png`,
  });

  appWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `/dist/index.html`),
      protocol: "file:",
      slashes: true,
    })
  );

  appWindow.on("close", (e) => {
    e.preventDefault();
    appWindow.hide();
  });
}

function activate() {
  if (win === null) {
    initWindow();
  }
}

function closeWindow() {
  if (process.platform !== "darwin") {
    app.quit();
  }
  app.hide();
  //process.exit(0);
}
