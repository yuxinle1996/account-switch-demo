import { arch } from 'node:os'

import { isWin } from '@main/constant'
import secrets from '@main/utils/secrets'
import { IpcChannel } from '@shared/IpcChannel'
import { Config, IDE } from '@types'
import { app, ipcMain } from 'electron'

import { generateLoginUrl, getConfig, setConfig, verifyCode } from './handle'
import {
  getMachineIds,
  getRegistryMachineGuid,
  setRandomMachineIds,
  setRandomRegistryMachineGuid
} from './machine'

export function registerIPCHandlers() {
  // 获取应用信息
  ipcMain.handle(IpcChannel.App_Info, () => ({
    // 1.0.0
    version: app.getVersion(),
    // 是否被打包
    isPackaged: app.isPackaged,
    // x64
    arch: arch(),
    // 是否为便携版
    isPortable: isWin && 'PORTABLE_EXECUTABLE_DIR' in process.env,
    // E:\\code\\electron\\account-switch-demo
    appPath: app.getAppPath(),
    // E:\\code\\electron\\account-switch-demo\\node_modules\\electron\\dist\\electron.exe
    exePath: app.getPath('exe'),
    // E:\\code\\electron\\account-switch-demo\\node_modules\\electron\\dist\\electron.exe
    // modulePath: app.getPath('module'),
    // C:\\Users\\dami
    // homePath: app.getPath('home'),
    // C:\\Users\\dami\\Desktop
    // desktopPath: app.getPath('desktop'),
    // C:\\Users\\dami\\Documents
    // documentsPath: app.getPath('documents'),
    // C:\\Users\\dami\\Downloads
    // downloadsPath: app.getPath('downloads'),
    // C:\\Users\\dami\\Music
    // musicPath: app.getPath('music'),
    // C:\\Users\\dami\\Pictures
    // picturesPath: app.getPath('pictures'),
    // C:\\Users\\dami\\Videos
    // videosPath: app.getPath('videos'),
    // C:\\Users\\dami\\AppData\\Roaming
    // dataPath: app.getPath('appData'),
    // C:\\Users\\dami\\AppData\\Roaming\\account-switch-demo-dev
    userDataPath: app.getPath('userData'),
    // C:\\Users\\dami\\AppData\\Roaming\\account-switch-demo-dev
    sessionPath: app.getPath('sessionData'),
    // C:\\Users\\dami\\AppData\\Roaming\\account-switch-demo-dev\\logs
    logsPath: app.getPath('logs'),
    // C:\\Users\\dami\\AppData\\Roaming\\account-switch-demo-dev\\Crashpad
    crashDumpsPath: app.getPath('crashDumps')
    // C:\\Users\\dami\\AppData\\Local\\Temp
    // tempPath: app.getPath('temp'),
    // C:\\Users\\dami\\AppData\\Roaming\\Microsoft\\Windows\\Recent
    // recentPath: app.getPath('recent'),
  }))

  // 重启应用
  ipcMain.handle(IpcChannel.App_Reload, () => {
    app.relaunch()
    app.exit(0)
  })

  // 获取配置
  ipcMain.handle(IpcChannel.App_GetConfig, () => {
    return getConfig()
  })

  // 设置配置
  ipcMain.handle(IpcChannel.App_SetConfig, (_, config: Config) => {
    return setConfig(config)
  })

  // secrets-加密
  ipcMain.handle(IpcChannel.Secrets_Encrypt, (_, data: any) => {
    return secrets.encrypt(data)
  })

  // secrets-解密
  ipcMain.handle(IpcChannel.Secrets_Decrypt, (_, data: number[]) => {
    return secrets.decrypt(data)
  })

  // 生成登录链接
  ipcMain.handle(IpcChannel.Augment_GenerateLoginUrl, (_, ide: IDE) => {
    return generateLoginUrl(ide)
  })

  // 校验code
  ipcMain.handle(
    IpcChannel.Augment_VerifyCode,
    (_, code: string, tenantUrl: string, redirectUri: string) => {
      return verifyCode(code, tenantUrl, redirectUri)
    }
  )

  // 获取机器ids
  ipcMain.handle(IpcChannel.App_GetMachineIds, (_, ide: IDE) => {
    return getMachineIds(ide)
  })

  // 设置随机机器ids
  ipcMain.handle(IpcChannel.App_SetRandomMachineIds, (_, ide: IDE) => {
    return setRandomMachineIds(ide)
  })

  // 获取注册表guid
  ipcMain.handle(IpcChannel.App_GetRegistryMachineGuid, () => {
    return getRegistryMachineGuid()
  })

  // 设置随机注册表guid
  ipcMain.handle(IpcChannel.App_SetRandomRegistryMachineGuid, () => {
    return setRandomRegistryMachineGuid()
  })
}
