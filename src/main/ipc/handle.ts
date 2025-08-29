import { getHash, toUrlSafeBase64 } from '@main/utils'
import { getConfigPath, getUserDataPath, readJsonFile, writeJsonFile } from '@main/utils/paths'
import { failure, success } from '@main/utils/response'
import { Config, DecryptType, IDE } from '@types'
import axios from 'axios'
import { randomBytes, randomUUID } from 'crypto'
import dayjs from 'dayjs'
import fs from 'fs-extra'
import path from 'path'

let oauthState: any = {}

/** 读取配置 */
export function getConfig() {
  try {
    const configPath = getConfigPath()
    const config = readJsonFile(configPath)
    return success(config)
  } catch (error) {
    return failure(error.message)
  }
}

/** 设置配置 */
export function setConfig(config: Config) {
  try {
    const configPath = getConfigPath()
    const currentConfig: Config = readJsonFile(configPath)
    const newConfig = { ...currentConfig, ...config }
    writeJsonFile(configPath, newConfig)
    if (newConfig.type === DecryptType.KeyFile) {
      const ideKeyFilePath = path.join(getUserDataPath(newConfig.editor), 'Local State')
      // 将目标ide的key文件复制到自身应用用户数据路径
      const myKeyFilePath = path.join(getUserDataPath(), 'Local State')
      fs.copyFileSync(ideKeyFilePath, myKeyFilePath)
    }
    return success(newConfig)
  } catch (error) {
    return failure(error.message)
  }
}

/** 生成登录链接 */
export function generateLoginUrl(ide: IDE) {
  try {
    const codeVerifier = toUrlSafeBase64(randomBytes(32))
    const codeChallenge = toUrlSafeBase64(getHash(Buffer.from(codeVerifier)))
    const state = randomUUID()
    const openUrl = `https://auth.augmentcode.com/authorize?response_type=code&code_challenge=${codeChallenge}&code_challenge_method=S256&client_id=augment-vscode-extension&redirect_uri=${ide}://augment.vscode-augment/auth/result&state=${state}&scope=email&prompt=login`

    oauthState = {
      /** 校验码(生成token时需要) */
      creationTime: dayjs().add(10, 'm').format('YYYY-MM-DD HH:mm:ss'),
      codeVerifier,
      codeChallenge,
      state
    }
    // database.items.set('oauthState', oauthState)
    return success(openUrl)
  } catch (error: any) {
    return failure(error.message)
  }
}

/** 校验codeVerifier */
export async function verifyCode(code: string, tenantUrl: string, redirectUri: string) {
  try {
    // const oauthState = await database.items.get('oauthState')
    if (!oauthState || !oauthState.codeVerifier) return failure('已过期')
    if (dayjs(oauthState.creationTime).isBefore(dayjs())) {
      // database.items.delete('oauthState')
      oauthState = {}
      return failure('已过期')
    }
    tenantUrl = tenantUrl.endsWith('/') ? tenantUrl : tenantUrl + '/'
    const res = await axios.post(`${tenantUrl}token`, {
      grant_type: 'authorization_code',
      client_id: 'augment-vscode-extension',
      code_verifier: oauthState.codeVerifier,
      redirect_uri: redirectUri,
      code: code
    })
    if (res.status !== 200) return failure(res.data?.error || '未知错误')
    const token = res.data?.access_token
    return success({ token })
  } catch (error: any) {
    return failure(error?.response?.data?.error || error.message || '未知错误')
  } finally {
    // database.items.delete('oauthState')
    oauthState = {}
  }
}
