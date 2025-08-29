import { electronApp, optimizer } from '@electron-toolkit/utils'
import { DecryptType, IDE } from '@types'
import { app, BrowserWindow } from 'electron'
import fs from 'fs-extra'

import { APP_NAME } from './constant'
import { registerIPCHandlers } from './ipc'
import { windowService } from './services/WindowService'
import { getConfigPath, readJsonFile, setUserDataPath, writeJsonFile } from './utils/paths'

const initConfig = {
  type: DecryptType.UserDataPath,
  editor: IDE.VSCode
}

const configPath = getConfigPath()
if (!fs.existsSync(configPath)) {
  writeJsonFile(configPath, initConfig)
}
const config = readJsonFile(configPath)
if (config.type === DecryptType.UserDataPath) {
  setUserDataPath(config.editor)
} else {
  setUserDataPath() // 为空时 设置为自身应用路径,开发环境(account-switch-demo-dev)/生产环境(account-switch-demo)
}
// setUserDataPath(xx)等同于下面
// const idePath = path.join(app.getPath('appData'), xx)
// app.setPath('userData', idePath)
console.log('初始化时用户数据路径: ', app.getPath('userData'))

app.whenReady().then(() => {
  setUserDataPath() // 修正回自身应用路径
  console.log('修正后的用户数据路径: ', app.getPath('userData'))
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
