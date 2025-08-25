import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * 使用 Windows REG 命令行工具作为备用方案
 * 这个方法不依赖第三方库，直接使用系统命令
 */
export class WindowsRegistryHelper {
  /**
   * 读取注册表值
   * @param keyPath 注册表键路径
   * @param valueName 值名称
   * @returns 注册表值或 null
   */
  static async getValue(keyPath: string, valueName: string): Promise<string | null> {
    try {
      const command = `reg query "${keyPath}" /v "${valueName}"`
      console.log(`执行注册表读取命令: ${command}`)
      const { stdout } = await execAsync(command)
      // 解析输出，格式类似：
      // HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography
      //     MachineGuid    REG_SZ    {12345678-1234-1234-1234-123456789012}
      const lines = stdout.split('\n')
      for (const line of lines) {
        if (line.includes(valueName)) {
          const parts = line.trim().split(/\s+/)
          if (parts.length >= 3 && parts[0] === valueName) {
            const value = parts.slice(2).join(' ').trim()
            return value
          }
        }
      }
      console.error(`未找到注册表值: ${valueName}`)
      return null
    } catch (error) {
      console.error(
        'Windows Registry 读取失败:',
        JSON.stringify(
          {
            error: error.message,
            path: keyPath,
            name: valueName
          },
          null,
          2
        )
      )
      throw new Error(error.message)
    }
  }

  /**
   * 设置注册表值
   * @param keyPath 注册表键路径
   * @param valueName 值名称
   * @param value 值内容
   * @param valueType 值类型，默认 REG_SZ
   */
  static async setValue(
    keyPath: string,
    valueName: string,
    value: string,
    valueType: string = 'REG_SZ'
  ) {
    try {
      const command = `reg add "${keyPath}" /v "${valueName}" /t ${valueType} /d "${value}" /f`
      console.log(`执行注册表写入命令: ${command}`)
      await execAsync(command)
    } catch (error) {
      console.error(
        'Windows Registry 写入失败:',
        JSON.stringify(
          {
            error: error.message,
            path: keyPath,
            name: valueName,
            value
          },
          null,
          2
        )
      )
      throw new Error(error.message)
    }
  }
}
