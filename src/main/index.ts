import { electronApp, optimizer } from '@electron-toolkit/utils'
import { IDE } from '@types'
import { app, BrowserWindow } from 'electron'
import path from 'path'

import { APP_NAME, APP_NAME_DEV } from './constant'
import { registerIPCHandlers } from './ipc'
import { windowService } from './services/WindowService'
import { setUserDataPath } from './utils/paths'

// setUserDataPath(IDE.VSCode)
// const idePath = path.join(app.getPath('appData'), IDE.VSCode)
// app.setPath('userData', idePath)

setUserDataPath(APP_NAME_DEV)
// const idePath = path.join(app.getPath('appData'), APP_NAME_DEV)
// console.log('idePath', idePath)
// app.setPath('userData', idePath)

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.dami.' + APP_NAME)

  windowService.createMainWindow()

  registerIPCHandlers()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) windowService.createMainWindow()
  })
})

app.on('browser-window-created', (_, window) => {
  optimizer.watchWindowShortcuts(window)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  console.log('will-quit')
})
