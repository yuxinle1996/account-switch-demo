export enum IpcChannel {
  /** ipc-获取应用信息 */
  App_Info = 'app:info',
  /** ipc-重启应用 */
  App_Reload = 'app:reload',
  /** ipc-获取配置 */
  App_GetConfig = 'app:get-config',
  /** ipc-设置配置 */
  App_SetConfig = 'app:set-config',
  /** ipc-secrets-加密 */
  Secrets_Encrypt = 'secrets:encrypt',
  /** ipc-secrets-解密 */
  Secrets_Decrypt = 'secrets:decrypt',
  /** ipc-获取机器ids */
  App_GetMachineIds = 'app:get-machine-ids',
  /** ipc-设置随机机器ids */
  App_SetRandomMachineIds = 'app:set-random-machine-ids',
  /** ipc-获取注册表guid */
  App_GetRegistryMachineGuid = 'app:get-registry-machine-guid',
  /** ipc-设置随机注册表guid */
  App_SetRandomRegistryMachineGuid = 'app:set-random-registry-machine-guid',
  /** ipc-生成登录链接 */
  Augment_GenerateLoginUrl = 'augment:generate-login-url',
  /** ipc-校验code */
  Augment_VerifyCode = 'augment:verify-code'
}
