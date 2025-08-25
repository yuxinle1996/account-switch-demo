import { getHash, toUrlSafeBase64 } from '@main/utils'
import { failure, success } from '@main/utils/response'
import { IDE } from '@types'
import axios from 'axios'
import { randomBytes, randomUUID } from 'crypto'
import dayjs from 'dayjs'

let oauthState: any = {}

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
