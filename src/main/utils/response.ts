import { IpcResponse } from '@types'

export function success<T>(data: T, message?: string): IpcResponse<T> {
  return {
    success: true,
    data,
    message
  }
}

export function failure(message: string, flag?: string): IpcResponse<null> {
  console.error('ipc failure:', flag ? `${flag}: ${message}` : message)
  return {
    success: false,
    data: null,
    message
  }
}
