/** 开发环境 */
export enum IDE {
  VSCode = 'Code',
  Cursor = 'Cursor'
}

/** ipc响应类型 */
export interface IpcResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface AppInfo {
  /** 版本 */
  version: string
  /** 是否打包 */
  isPackaged: boolean
  /** 架构 */
  arch: string
  /** 是否便携 */
  isPortable: boolean
  /** 应用路径 */
  appPath: string
  /** 资源路径 */
  resourcesPath: string
  /** 可执行文件路径 */
  exePath: string
  /** 用户数据路径 */
  userDataPath: string
  /** 会话数据路径(和userDataPath一样) */
  sessionPath: string
  /** 日志路径 */
  logsPath: string
  /** 崩溃转储路径 */
  crashDumpsPath: string
  /** 文件路径 */
  filesPath: string
  /** (当前ide)扩展路径 如xxx/.vscode/extensions */
  extensionsPath: string
  /** 会话备份路径 */
  backupsPath: string
}

export interface MachineIds {
  machineId: string
  macMachineId: string
  devDeviceId: string
  sqmId: string
}
