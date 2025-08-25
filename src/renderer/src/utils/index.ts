import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** 类名合并 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 判断是否为空
 * @param {any} param
 */
export function isEmpty(param: any) {
  return [undefined, null, ''].includes(param)
}

/**
 * 生成枚举数据组
 * @param rest 参数, 参数数量必须为偶数, 奇数为id, 偶数为label
 * @returns 枚举数据组
 */
export function generatorDataGroup(...rest: any[]) {
  if (!rest) {
    return []
  }

  if (rest.length % 2 !== 0) {
    throw new Error('参数数量不匹配')
  }
  const list: { id: any; label: any }[] = []
  const map = {}
  for (let i = 0; i < rest.length; i += 2) {
    const id = rest[i]
    const label = rest[i + 1]
    list.push({ id, label })
    Object.assign(map, { [id]: label })
  }
  return [list, map]
}
