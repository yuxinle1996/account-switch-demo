import { failure, success } from '@main/utils/response'
import { IDE, IpcResponse, MachineIds } from '@types'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'

import { getIDEStoragePath, readJsonFile, writeJsonFile } from '../utils/paths'
import { WindowsRegistryHelper } from '../utils/registryHelper'

const REGISTRY_PATH = 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography'

/**
 * 生成ids
 * @returns ids
 */
function generateMachineIds(): MachineIds {
  try {
    const machineId = crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex')
    const macMachineId = crypto.createHash('sha512').update(crypto.randomBytes(64)).digest('hex')
    const devDeviceId = uuidv4()
    const sqmId = '{' + uuidv4().toUpperCase() + '}'

    return {
      machineId,
      macMachineId,
      devDeviceId,
      sqmId
    }
  } catch (error) {
    throw new Error(error.message)
  }
}

/**
 * 获取机器ids
 * @param ide ide
 * @returns 机器ids
 */
export function getMachineIds(ide: IDE): IpcResponse<MachineIds | null> {
  try {
    const storagePath = getIDEStoragePath(ide)
    const storageObj = readJsonFile(storagePath) || {}
    return success({
      machineId: storageObj['telemetry.machineId'],
      macMachineId: storageObj['telemetry.macMachineId'],
      devDeviceId: storageObj['telemetry.devDeviceId'],
      sqmId: storageObj['telemetry.sqmId']
    })
  } catch (error) {
    return failure(error.message)
  }
}

/**
 * 设置随机ids
 * @param ide ide
 * @returns 新的机器ids
 */
export function setRandomMachineIds(ide: IDE): IpcResponse<MachineIds | null> {
  try {
    const machineIds = generateMachineIds()
    const storagePath = getIDEStoragePath(ide)
    const storageObj = readJsonFile(storagePath) || {}
    storageObj['telemetry.machineId'] = machineIds.machineId
    storageObj['telemetry.macMachineId'] = machineIds.macMachineId
    storageObj['telemetry.devDeviceId'] = machineIds.devDeviceId
    storageObj['telemetry.sqmId'] = machineIds.sqmId
    writeJsonFile(storagePath, storageObj)
    return success(machineIds)
  } catch (error) {
    return failure(error.message)
  }
}

/**
 * 获取注册表guid
 * @returns 注册表guid
 */
export async function getRegistryMachineGuid(): Promise<IpcResponse<string | null>> {
  try {
    const machineGuid = await WindowsRegistryHelper.getValue(REGISTRY_PATH, 'MachineGuid')
    if (!machineGuid) {
      throw new Error('MachineGuid 不存在')
    }
    return success(machineGuid)
  } catch (error) {
    if (error.message?.includes('Command failed')) {
      return failure('请以管理员身份运行')
    }
    return failure(error.message)
  }
}

/**
 * 设置随机注册表guid
 * @returns 新的注册表guid
 */
export async function setRandomRegistryMachineGuid(): Promise<IpcResponse<string | null>> {
  try {
    const value = uuidv4()
    await WindowsRegistryHelper.setValue(REGISTRY_PATH, 'MachineGuid', value)
    return success(value)
  } catch (error) {
    if (error.message?.includes('Command failed')) {
      return failure('请以管理员身份运行')
    }
    return failure(error.message)
  }
}
