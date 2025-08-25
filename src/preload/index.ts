import { electronAPI } from '@electron-toolkit/preload'
import { IpcChannel } from '@shared/IpcChannel'
import { AppInfo, IDE, IpcResponse, MachineIds } from '@types'
import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  /** 获取应用信息 */
  getAppInfo: () => ipcRenderer.invoke(IpcChannel.App_Info) as Promise<AppInfo>,

  /** 重启应用 */
  reload: () => ipcRenderer.invoke(IpcChannel.App_Reload),

  secrets: {
    /** secrets-加密 */
    encrypt: (data: any) => ipcRenderer.invoke(IpcChannel.Secrets_Encrypt, data),
    /** secrets-解密 */
    decrypt: (data: number[]) => ipcRenderer.invoke(IpcChannel.Secrets_Decrypt, data)
  },
  augment: {
    /** 生成登录链接 */
    generateLoginUrl: (ide: IDE) =>
      ipcRenderer.invoke(IpcChannel.Augment_GenerateLoginUrl, ide) as Promise<string>,
    /** 校验code */
    verifyCode: (code: string, tenantUrl: string, redirectUri: string) =>
      ipcRenderer.invoke(IpcChannel.Augment_VerifyCode, code, tenantUrl, redirectUri)
  },
  machine: {
    /** 获取机器ids */
    getMachineIds: (ide: IDE) =>
      ipcRenderer.invoke(IpcChannel.App_GetMachineIds, ide) as Promise<
        IpcResponse<MachineIds | null>
      >,
    /** 设置随机机器ids */
    setRandomMachineIds: (ide: IDE) =>
      ipcRenderer.invoke(IpcChannel.App_SetRandomMachineIds, ide) as Promise<
        IpcResponse<MachineIds | null>
      >,
    /** 获取注册表guid */
    getRegistryMachineGuid: () =>
      ipcRenderer.invoke(IpcChannel.App_GetRegistryMachineGuid) as Promise<
        IpcResponse<string | null>
      >,
    /** 设置随机注册表guid */
    setRandomRegistryMachineGuid: () =>
      ipcRenderer.invoke(IpcChannel.App_SetRandomRegistryMachineGuid) as Promise<
        IpcResponse<string | null>
      >
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

export type WindowApiType = typeof api
