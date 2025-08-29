import { is } from '@electron-toolkit/utils'
import { isLinux, isMac } from '@main/constant'
import { BrowserWindow, shell } from 'electron'
import { join } from 'path'

import icon from '../../../build/icon.png?asset'

/**
 * 窗口管理服务类
 * 负责创建、管理和销毁应用窗口
 */
export class WindowService {
  private static instance: WindowService | null = null
  private mainWindow: BrowserWindow | null = null
  private windows = new Map<string, BrowserWindow>()

  constructor() {
    //
  }

  public static getInstance(): WindowService {
    if (!WindowService.instance) {
      WindowService.instance = new WindowService()
    }
    return WindowService.instance
  }

  /**
   * 创建主窗口
   */
  createMainWindow(): BrowserWindow {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.show()
      this.mainWindow.focus()
      return this.mainWindow
    }
    this.mainWindow = new BrowserWindow({
      width: 500,
      height: 600,
      minWidth: 380,
      minHeight: 400,
      show: false,
      transparent: isMac,
      vibrancy: 'sidebar',
      visualEffectState: 'active',
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        // webSecurity: false, // 将禁用同源策略, 允许跨域请求
        // webviewTag: true,
        // allowRunningInsecureContent: true, // 允许 HTTPS 页面从 HTTP URL 运行 JavaScript、CSS 或插件
        backgroundThrottling: false // 禁用背景处理
      }
    })
    this.mainWindow.setMenuBarVisibility(false)

    // 将主窗口添加到窗口管理器中
    this.windows.set('main', this.mainWindow)

    // 设置窗口事件监听器
    this.setupMainWindowEvents(this.mainWindow)

    // 加载应用内容
    this.loadMainWindowContent()

    // if (is.dev) {
    //   this.mainWindow.webContents.openDevTools({ mode: 'detach' })
    // }

    return this.mainWindow
  }

  /**
   * 获取主窗口
   */
  getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  /**
   * 获取指定窗口
   */
  getWindow(windowId: string): BrowserWindow | undefined {
    return this.windows.get(windowId)
  }

  /**
   * 获取所有窗口
   */
  getAllWindows(): Map<string, BrowserWindow> {
    return this.windows
  }

  /**
   * 移除窗口
   */
  removeWindow(windowId: string): void {
    this.windows.delete(windowId)

    if (windowId === 'main') {
      this.mainWindow = null
    }
  }

  /**
   * 显示主窗口
   */
  showMainWindow(): boolean {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore()
      }
      if (!isLinux) {
        this.mainWindow.setVisibleOnAllWorkspaces(true)
      }
      /**
       * [macOS] 在全屏幕关闭后，当窗口再次显示时，全屏行为会变得奇怪
       * 所以我们需要明确地将其设置为FALSE。
       * 虽然其他平台没有这个问题，但这样做是一个好习惯
       *
       * 检查窗口是否可见，以防止在点击dock图标时中断全屏状态
       */
      if (this.mainWindow.isFullScreen() && !this.mainWindow.isVisible()) {
        this.mainWindow.setFullScreen(false)
      }
      this.mainWindow.show()
      this.mainWindow.focus()
      if (!isLinux) {
        this.mainWindow.setVisibleOnAllWorkspaces(false)
      }
      return true
    }
    return false
  }

  /**
   * 关闭窗口
   */
  closeWindow(window: BrowserWindow): boolean {
    if (window && window !== this.mainWindow) {
      window.close()
      return true
    }
    return false
  }

  /**
   * 隐藏窗口
   */
  hideWindow(window: BrowserWindow): boolean {
    if (window) {
      window.hide()
      return true
    }
    return false
  }

  /**
   * 向指定窗口发送消息
   */
  sendMessageToWindow(windowId: string, message: any): boolean {
    const targetWindow = this.windows.get(windowId)
    if (targetWindow && !targetWindow.isDestroyed()) {
      targetWindow.webContents.send('window:message', message)
      return true
    }
    return false
  }

  /**
   * 广播消息到所有窗口
   */
  broadcastMessage(message: any): boolean {
    try {
      this.windows.forEach((window) => {
        if (!window.isDestroyed()) {
          window.webContents.send('window:message', message)
        }
      })
      return true
    } catch (error) {
      console.error('广播消息失败:', error)
      return false
    }
  }

  /**
   * 设置主窗口事件监听器
   */
  private setupMainWindowEvents(mainWindow: BrowserWindow): void {
    mainWindow.on('ready-to-show', () => {
      console.log('主窗口准备完成')
      mainWindow.show()
    })

    // 添加Escape键退出最大化的支持
    mainWindow.webContents.on('before-input-event', (_event, input) => {
      // 当按下Escape键且窗口处于最大化时退出最大化
      if (input.key === 'Escape' && !input.alt && !input.control && !input.meta && !input.shift) {
        if (mainWindow.isMaximized()) {
          // event.preventDefault()
          mainWindow.unmaximize()
        }
      }
      return
    })

    mainWindow.on('closed', () => {
      this.removeWindow('main')
      this.mainWindow = null
    })

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })

    mainWindow.webContents.on('render-process-gone', (_, details) => {
      console.error(`【主窗口】渲染进程崩溃: ${JSON.stringify(details)}`)
    })
  }

  /**
   * 加载主窗口内容
   */
  private loadMainWindowContent(): void {
    if (!this.mainWindow) return

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }
}

export const windowService = WindowService.getInstance()
