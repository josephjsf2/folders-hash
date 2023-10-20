import {app, BrowserWindow, screen, ipcMain, dialog, desktopCapturer, nativeImage, webContents} from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let win: BrowserWindow | null = null;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {

  const size = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve),
      contextIsolation: false,
    },
  });
  win.removeMenu();

  if (serve) {
    const debug = require('electron-debug');
    debug();
    win.webContents.openDevTools();

    require('electron-reloader')(module);
    win.loadURL('http://localhost:4200');
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
       // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    const url = new URL(path.join('file:', __dirname, pathIndex));
    win.loadURL(url.href);
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => {
    setTimeout(createWindow, 400)

    ipcMain.handle('open-folder-dialog', async (event, ...args) => {
      const result: any = await dialog.showOpenDialog(win, { properties: ['openDirectory']});
      result['index'] = args[0];
      event.sender.send('open-folder-dialog-reply', result)
    })

    ipcMain.handle('capture-window', async (event, ...args) => {

      const wcs = webContents.getAllWebContents();
      const selfWindws = await Promise.all(
        wcs
          .filter((item) => {
            const win = BrowserWindow.fromWebContents(item);
            return win && win.isVisible();
          })
          .map(async (item) => {
            const win = BrowserWindow.fromWebContents(item);
            const thumbnailString = (await win.capturePage()).toDataURL();

            return {
              id: win.getMediaSourceId(),
              name: win.getTitle(),
              thumbnailString
            };
          }),
      );

      const thumbnailString: string = selfWindws[0].thumbnailString;
      const blob = nativeImage.createFromDataURL(thumbnailString);
      event.sender.send('capture-window-reply', blob)
    })

  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}
