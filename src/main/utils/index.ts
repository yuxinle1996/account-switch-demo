import { type BinaryLike, createHash } from 'node:crypto'

/**
 * 判断是否为空
 * @param {any} param
 */
export function isEmpty(param: any) {
  return [undefined, null, ''].includes(param)
}

export function getHash(data: BinaryLike) {
  return createHash('sha256').update(data).digest()
}

export function toUrlSafeBase64(buffer: Buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
