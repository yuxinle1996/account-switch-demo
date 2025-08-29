import { APP_NAME, APP_NAME_DEV, isDev } from '@main/constant'
import { IDE } from '@types'
import { app } from 'electron'
import fs from 'fs-extra'
import path from 'path'

/**
 * 确保目录存在
 * @param dir 目录路径
 */
export function makeSureDirExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * 获取指定项目用户数据目录
 * @param appName 项目名称 默认本应用名称
 * @returns 用户数据目录
 */
export function getUserDataPath(appName?: typeof APP_NAME | typeof APP_NAME_DEV | IDE) {
  if (!appName) {
    appName = isDev ? APP_NAME_DEV : APP_NAME
  }
  const userDataPath = path.join(app.getPath('appData'), appName)
  makeSureDirExists(userDataPath)
  return userDataPath
}

/**
 * 设置指定项目用户数据目录
 * @param appName 项目名称 默认本应用名称
 */
export function setUserDataPath(appName?: typeof APP_NAME | typeof APP_NAME_DEV | IDE) {
  if (!appName) {
    appName = isDev ? APP_NAME_DEV : APP_NAME
  }
  const userDataPath = getUserDataPath(appName)
  app.setPath('userData', userDataPath)
}

/**
 * 获取配置文件路径
 */
export function getConfigPath() {
  return path.join(getUserDataPath(), 'config.json')
}

/**
 * 获取IDE storage路径
 * @param ide 指定IDE
 */
export function getIDEStoragePath(ide: IDE) {
  return path.join(getUserDataPath(ide), 'User', 'globalStorage', 'storage.json')
}

/**
 * 读取json文件
 * @param filePath 文件路径
 * @param options 选项
 * @returns 文件内容
 */
export function readJsonFile(filePath: string, options?: fs.ReadOptions): any {
  return fs.readJSONSync(filePath, { throws: false, encoding: 'utf-8', ...options })
}

/**
 * 写入json文件
 * @param filePath 文件路径
 * @param data 数据
 * @param options 选项
 */
export function writeJsonFile(filePath: string, data: object, options?: fs.WriteOptions) {
  fs.writeJSONSync(filePath, data, { encoding: 'utf-8', spaces: 4, ...options })
}
