import { safeStorage } from 'electron'

/**
 * 加密数据
 * @param {any} data 需要加密的数据
 * @returns {string} 加密后的数据JSON.stringify(Buffer)
 */
const encrypt = (data: any) => {
  try {
    const value = typeof data === 'string' ? data : JSON.stringify(data)
    const buffer = safeStorage.encryptString(value)
    return JSON.stringify(buffer)
  } catch (error: any) {
    console.error('encrypt error:', error.message)
    return null
  }
}

/**
 * 解密数据
 * @param {number[]} data 需要解密的数据
 * @returns {string | null} 解密后的数据
 */
const decrypt = (data: number[]): string | null => {
  try {
    const result = safeStorage.decryptString(Buffer.from(data))
    return result
  } catch (error: any) {
    console.error('decrypt error:', error.message)
    return null
  }
}

const secrets = {
  encrypt,
  decrypt
}

export default secrets
