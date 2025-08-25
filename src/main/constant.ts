export const isMac = process.platform === 'darwin'
export const isWin = process.platform === 'win32'
export const isLinux = process.platform === 'linux'
export const isDev = process.env.NODE_ENV === 'development'
export const isPortable = isWin && 'PORTABLE_EXECUTABLE_DIR' in process.env

/** 应用名称 */
export const APP_NAME = 'account-switch-demo'
/** 应用名称-开发环境 */
export const APP_NAME_DEV = 'account-switch-demo-dev'
/** 协议名称 */
export const PROTOCOL_NAME = 'account-switch-demo'

/** 标题栏样式-暗色 */
export const titleBarOverlayDark = {
  height: 40,
  color: 'rgba(255,255,255,0)',
  symbolColor: '#fff'
}

/** 标题栏样式-亮色 */
export const titleBarOverlayLight = {
  height: 40,
  color: 'rgba(255,255,255,0)',
  symbolColor: '#000'
}

/** augment版本 */
let AUGMENT_VERSION = '0.522.0'
/** vscode版本 */
let VSCODE_VERSION = '1.102.5'
/** cursor版本 */
let CURSOR_VERSION = '1.4.5'

/** 设置augment版本 */
export const setAugmentVersion = (version: string | null) => {
  if (version) {
    AUGMENT_VERSION = version
  }
}

/** 设置vscode版本 */
export const setIdeVersion = (vscodeVersion: string | null, cursorVersion: string | null) => {
  if (vscodeVersion) {
    VSCODE_VERSION = vscodeVersion
  }
  if (cursorVersion) {
    CURSOR_VERSION = cursorVersion
  }
}

/** 获取augment UserAgent */
export const getAugmentUserAgent = () => {
  return `Augment.vscode-augment/${AUGMENT_VERSION} (win32; x64; 10.0.26100) vscode/${VSCODE_VERSION}`
}

/** 获取cursor UserAgent */
export const getCursorUserAgent = () => {
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/${CURSOR_VERSION} Chrome/132.0.6834.210 Electron/34.5.8 Safari/537.36`
}
