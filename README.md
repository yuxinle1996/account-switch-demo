## 1. Cursor

### 1.1 重置机器

路径: `C:\Users\dami\AppData\Roaming\Cursor\User\globalStorage\storage.json`

字段:

- `telemetry.macMachineId` -- mac上的字段, 128位字符, 具体生成方式可找github开源项目
- `telemetry.machineId` -- 64位字符, 具体生成方式可找github开源项目
- `telemetry.sqmId` -- 拼接 `{` `随机uuid转大写` `}`
- `telemetry.devDeviceId` - 随机uuid

注册表:

path: `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography`

字段: `MachineGuid` -- 随机uuid

参考代码:

```typescript
/**
 * 生成ids
 * @returns ids
 */
function generateMachineIds(): MachineIds {
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
}
```

注册表读写方案:

1. 原生 `spawn`、`exec`
2. 第三方库如: `regedit`, 和electron使用时注意将 `.wsf` 文件存储在打包的 asar 文件之外的其他地方

**原生读写注册表:**

```typescript
import { v4 as uuidv4 } from 'uuid'
import { WindowsRegistryHelper } from '../utils/registryHelper'

const REGISTRY_PATH = 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography'
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
```

```typescript
import { exec } from 'child_process'
import { promisify } from 'util'
import { mainLogger } from './logger'

const execAsync = promisify(exec)

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
      mainLogger.info(`执行注册表读取命令: ${command}`)
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
      mainLogger.error(`未找到注册表值: ${valueName}`)
      return null
    } catch (error) {
      mainLogger.error(
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
      mainLogger.info(`执行注册表写入命令: ${command}`)
      await execAsync(command)
    } catch (error) {
      mainLogger.error(
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
```

**regedit读写注册表**

electron-builder.yml

```yaml
asarUnpack:
  - resources/**
  - node_modules/regedit/**
```

```typescript
import * as regedit from 'regedit'
import { mainLogger } from './logger'

// 配置 regedit 在打包环境中的工作目录
if (app.isPackaged) {
  // 设置 VBS 脚本的外部路径（在 asarUnpack 目录中）
  const vbsDirectory = path.join(
    process.resourcesPath,
    'app.asar.unpacked',
    'node_modules',
    'regedit',
    'vbs'
  )
  regedit.setExternalVBSLocation(vbsDirectory)
}

const pmsRegedit = regedit.promisified
const REGISTRY_PATH = 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography'

// 读取值
export async function getMachineGuid() {
  try {
    const result = await pmsRegedit.list([REGISTRY_PATH])
    if (!result || !result[REGISTRY_PATH]) {
      throw new Error('注册表路径不存在或无法访问')
    }
    const values = result[REGISTRY_PATH].values
    if (!values || !values['MachineGuid']) {
      throw new Error('MachineGuid 值不存在')
    }
    const machineGuid = values['MachineGuid'].value
    return machineGuid
  } catch (error) {
    mainLogger.error('regedit 读取失败:', {
      error: error.message,
      isPackaged: app.isPackaged,
      resourcesPath: process.resourcesPath
    })
    return null
  }
}

// 写入值
export async function setMachineGuid() {
  try {
    const value = uuidv4()
    await pmsRegedit.putValue({
      [REGISTRY_PATH]: {
        MachineGuid: {
          value,
          type: 'REG_SZ'
        }
      }
    })
    return value
  } catch (error) {
    mainLogger.error('regedit 写入失败:', {
      error: error.message,
      isPackaged: app.isPackaged,
      resourcesPath: process.resourcesPath
    })
  }
}
```

### 1.2 state.vscdb

路径: `C:\Users\username\AppData\Roaming\Cursor\User\globalStorage`

```
cursorAuth/cachedEmail
example@example.com

cursorAuth/cachedSignUpType
Auth_0 固定

cursorAuth/accessToken
token

cursorAuth/refreshToken
token
```

### 1.3 切号流程

网页的 `sessionToken` 只能在网页上用, 在cursor上对话、cursor tab等大部分接口无法使用

而 `accessToken` 既可在cursor上使用, 又可在网页上使用, 有效期也特别长, 所以用来查询余额之类的很方便

1. **复制网页sessionToken**

可省略userId, 从eyxxx开始复制

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzIyWkpSNzdWWUROSzRZNlZRVzJDMlJWIiwidGltZSI6IjE3NTU4MzM2NTkiLCJyYW5kb21uZXNzIjoiZmQ1NmYwZTYtZGM3NC00ZTUyIiwiZXhwIjoxNzYxMDE3NjU5LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.VnLtMyDLVCQaMbOSOcKx9egxg9vFVEqN6OFWZVWzqrA
```

2. **获取accessToken和refreshToken**

首先生成challenge、uuid、verifier字段

```js
import { randomBytes, createHash, randomUUID } from 'crypto'

function getHash(e) {
  return createHash('sha256').update(e).digest()
}

function toUrlSafeBase64(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

const verifier = toUrlSafeBase64(randomBytes(32))
console.log('codeVerifier===', codeVerifier)

const challenge = toUrlSafeBase64(getHash(Buffer.from(codeVerifier)))
console.log('challenge===', codeChallenge)

const uuid = randomUUID()
console.log('uuid===', uuid)
```

校验challenge并生成token

```js
POST https://cursor.com/api/auth/loginDeepCallbackControl

const data = {
    "uuid": uuid,
    "challenge": challenge
}

const headers = {
    "Content-Type": "application/json"
	Cookie: `WorkosCursorSessionToken=::${sessionToken}` // 可省略::前面的userId
}

const response = ""
```

```js
GET https://api2.cursor.sh/auth/poll

const data = {
    "uuid": uuid,
    "verifier": verifier
}

const headers = {
    "Content-Type": "application/json"
}

const response = {
    "accessToken": "eyJhxxx",
    "refreshToken": "eyJhxxx",
    "challenge": "xxx",
    "authId": "auth0|user_01K22ZPBRM5YAPJK2JRX******",
    "uuid": "xxx"
}
```

3. 替换state.vscdb中的 `cursorAuth/accessToken` 和 `cursorAuth/refreshToken` 和 `cursorAuth/cachedEmail`

这样就完成了切号

## 2. AugmentCode

### 2.1 重置机器

路径(取决于在哪个编辑器使用插件): `C:\Users\dami\AppData\Roaming\Code\User\globalStorage\storage.json`

字段:

- `telemetry.macMachineId` -- mac上的字段, 128位字符, 具体可找github开源项目
- `telemetry.machineId` -- 64位字符, 具体可找github开源项目
- `telemetry.sqmId` -- 拼接 `{` `随机uuid转大写` `}`
- `telemetry.devDeviceId` - 随机uuid

参考代码同Cursor

### 2.2 state.vscdb

路径: `C:\Users\username\AppData\Roaming\Code或Cursor\User\globalStorage`

```json
secret://{"extensionId":"augment.vscode-augment","key":"augment.sessions"}
buffer解密后
{
    "accessToken":"d8285e7c9293f9d0515ca4860bf337e5cb7ab2a60477a3dbe00624594e72fee7",
    "tenantURL":"https://d15.api.augmentcode.com/",
    "scopes":["email"]
}
```

### 2.3 切号流程

1. **拼接登录url**

加密方式同cursor

```js
import { randomBytes, createHash, randomUUID } from 'crypto'

function getHash(e) {
  return createHash('sha256').update(e).digest()
}

function toUrlSafeBase64(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

const codeVerifier = toUrlSafeBase64(randomBytes(32))
console.log('codeVerifier===', codeVerifier)

const codeChallenge = toUrlSafeBase64(getHash(Buffer.from(codeVerifier)))
console.log('codeChallenge===', codeChallenge)

const state = randomUUID()
console.log('state===', state)

const openUrl = `https://auth.augmentcode.com/authorize?response_type=code&code_challenge=${codeChallenge}&code_challenge_method=S256&client_id=augment-vscode-extension&redirect_uri=${ide === IDE.VSCode ? 'vscode' : 'cursor'}://augment.vscode-augment/auth/result&state=${state}&scope=email&prompt=login`
console.log(openUrl)
```

2. **复制后去网页登录**, 由于网页上的session和这个登录链接登录的session不通用, 且过程复杂 各种风控和校验 暂时只能手动

登录成功后会让你跳转到编辑器, 这时候不要点跳转, 而是点取消 然后右键点click here, 会获取一个协议链接, 里面包含 `code` 和 `tenant_url`(后续所有接口请求的baseUrl)

vscode://augment.vscode-augment/auth/result?code=\_a7ca33cd7a2f216f3fceffb2afcabf2d&state=70506769-9aa0-42bc-be77-397eed2a1df2&tenant_url=https%3A%2F%2Fd9.api.augmentcode.com%2F

<img src="C:\Users\dami\AppData\Roaming\Typora\typora-user-images\image-20250825160513863.png" alt="image-20250825160513863" style="zoom: 50%;" />

3. **使用 `code` 和 `codeVerifier` 生成access_token**

```js
POST https://${tenant_url}/token

const data = {
  "grant_type": "authorization_code",
  "client_id": "augment-vscode-extension",
  "code_verifier": codeVerifier,
  "redirect_uri": `${ide === IDE.VSCode ? 'vscode' : 'cursor'}://augment.vscode-augment/auth/result`,
  "code": code
}

const response = {
    "access_token": "xxx",
    "expires_in": 0,
    "token_type": "Bearer"
}
```

4. **整合sessions, 并加密成buffer数据**

```json
{
    "accessToken": access_token,
    "tenantURL": tenant_url,
    "scopes":["email"] // 固定
}
```

加密和解密数据有两种方案:

第一种: 做成编辑器插件的形式, 使用vscode库提供的方法:

- 存入: `context.secrets.store('xxx', xxx)`
- 读取: `context.secrets.get('xxx')`

这种方式可以延伸, 就是去魔改AugmentCode插件, 本地起一个node服务, 当做中间层, 把vscode库的存入和读取做成本地接口, 供你自己调用

第二种: 使用electron的 `safeStorage` 方法

- 加密: `safeStorage.encryptString(json)` 先转成json, 在放入
- 解密: `safeStorage.decryptString(Buffer)` 先把buffer字符串变成obj, 取.data后, 转成Buffer, 再放入

因为vscode就是拿electron写的, 通过读vscode的源码不难发现, 它的`context.secrets.store` `context.secrets.get('xxx')` 底层就是调用了electron的 `safeStorage`, 而electron底层, 用的是 `chromium` 的os_scrypt

chromium源码参考: https://github.com/chromium/chromium/blob/main/components/os_crypt/sync/os_crypt.h

vscode源码参考: https://github.com/microsoft/vscode/blob/main/src/vs/platform/encryption/electron-main/encryptionMainService.ts

使用electron的 `safeStorage`, 你随便加密, 插件能够正常登录正常使用, 但是想要把已有的buffer解密成json, 就要注意一下, 你的软件需要与编辑器保持同源, 这样调用 `safeStorage.decryptString(Buffer)` 才能成功, 不然就会报错, 两种方式:

第一种, electron项目启动时, 将`userData` path保持与ide一致

```js
//
const idePath = path.join(app.getPath('appData'), 'Code或者Cursor')
app.setPath('userData', idePath)
```

第二种, electron项目启动时, 将对应ide的`userData` 下面的 `Local State`文件内容复制到你自己的electron项目的 `userData` 路径中, 这样也能保证你的项目和ide同源, 这样随意调用加密解密都不会出错

例如 `C:\Users\username\AppData\Roaming\Code\Local State`, 里面长这样

```
{"os_crypt":{"audit_enabled":true,"encrypted_key":"RFBBUEkBAAAA0Iyd3wEV0RGMegDAT8KX6wEAAAAJzsAIpQ17QLdHVheQOg+oEAAAABIAAABDAGgAcgBvAG0AaQB1AG0AAAAQZgAAAAEAACAAAAA1hUVfeHlHOgJMJ6rhpcrVt9u/RZenstHBQEKB1ROhvwAAAAAOgAAAAAIAACAAAACYwgmTuw54juRI+l9BPmp5KnwkWEb3bk7rumqXw9HUBjAAAACFrXXo9RYGka1Vhjc5UG9g2SSzLutDq62H1gFDg0xoXr+mjGJ2fwJQT4d9xAuAXkVAAAAAnMAvyKUp/twEQoqKoptHAI9aHim6N09hRoWFycVa1QngALhd1crJXOb88GBi0/psQtU167UCMk6OvKo6CLfVww=="}}
```

你的项目的Local State文件在这: `C:\Users\username\AppData\Roaming\augment-assistant\Local State`, 将上面的内容或者整个文件复制到你的项目路径下即可

5. **替换state.vscdb**

上面的json加密完成后会变成这样:

```
{"type":"Buffer","data":[118,49,48,18,46,39,138,161,249,210,72,171,160,193,67,1,223,224,160,204,123,177,3,214,42,214,10,5,79,197,108,175,156,72,240,233,211,203,183,190,107,163,115,74,176,68,134,106,109,165,50,145,209,120,36,209,171,80,220,162,166,233,101,138,37,242,91,245,235,157,214,191,106,140,213,130,59,31,199,251,56,49,129,148,210,93,122,246,114,138,73,81,11,43,87,220,153,58,178,210,254,93,58,217,251,230,179,188,122,73,148,90,199,20,201,13,10,60,230,201,30,3,203,31,183,253,194,25,119,46,135,152,24,57,101,153,16,230,131,11,50,74,240,233,90,190,144,128,56,70,122,15,120,244,54,130,126,125,209,168,214,215,59,182,114,137,232,77,124,18,38,2,220,25,203,203,99,192,6]}
```

存入state.vscdb中, key是 `secret://{"extensionId":"augment.vscode-augment","key":"augment.sessions"}`

这样就完成了切号

## 3. Windsurf

(可选)grpc参考: https://github.com/yuxinle1996/windsurf-grpc, 我还原出了windsurf官网上所有的 `proto` 文件, 使用方式看[README.md](https://github.com/yuxinle1996/windsurf-grpc/blob/master/README.md)

两种发送请求方式:

1. 使用 `@connectrpc/connect` 系列库(简单)

```typescript
import { createClient } from '@connectrpc/connect'
import { SeatManagementService } from './gen/seat_management_pb_connect'
import { createConnectTransport } from '@connectrpc/connect-web'

const transport = createConnectTransport({
  baseUrl: 'https://web-backend.windsurf.com'
})
const client = createClient(SeatManagementService, transport)
const res = await client.getOneTimeAuthToken({
  firebaseIdToken: webToken
})
console.log(res)
```

2. 使用传统 `axios/fetch` 发送请求

```typescript
import axios from 'axios'
import {
  GetOneTimeAuthTokenRequest,
  GetOneTimeAuthTokenResponse
} from '../gen/seat_management_pb_pb'

const data = new GetOneTimeAuthTokenRequest({
  firebaseIdToken: webToken
})
// 序列化请求数据
const binaryData = data.toBinary()
const response = await axios({
  method: 'POST',
  url: 'https://web-backend.windsurf.com/exa.seat_management_pb.SeatManagementService/GetOneTimeAuthToken',
  data: binaryData,
  headers: {
    'Content-Type': 'application/proto'
  },
  responseType: 'arraybuffer'
})
// 反序列化响应数据
const binaryresponse = new Uint8Array(response.data)
const res = GetOneTimeAuthTokenResponse.fromBinary(binaryresponse)
console.log(res)
```

### 3.1 重置机器

路径: `C:\Users\dami\AppData\Roaming\Cursor\User\globalStorage\storage.json`

字段:

- `telemetry.macMachineId` -- mac上的字段, 128位字符, 具体可找github开源项目
- `telemetry.machineId` -- 64位字符, 具体可找github开源项目
- `telemetry.sqmId` -- 拼接 `{` `随机uuid转大写` `}`
- `telemetry.devDeviceId` - 随机uuid

注册表:

path: `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography`

字段: `MachineGuid` -- 随机uuid

参考代码同Cursor

### 3.2 state.vscdb

路径: `C:\Users\username\AppData\Roaming\Windsurf\User\globalStorage`

```json
secret://{"extensionId":"codeium.windsurf","key":"windsurf_auth.sessions"}
buffer解密后
[
    {
        "id":"d4c224ed-ab9a-4a55-bbc8-a2573c13c764",
        "accessToken":"sk-ws-01-QD_mJNBAzYsm4mcecF2wLD8_9exXWGmV-cHz8Goixq_qmt-QxTeM-l9k3UzjaIlJQZHnlN9oB_Qww_WCd3B9y-a2pmNlFQ",
        "account":{
            "label":"da mi",
            "id":"da mi"
        },
        "scopes":[]
    }
]
```

### 3.3 切号流程

1. **使用 `refresh_token` 调接口得到 `access_token`**

```js
POST https://securetoken.googleapis.com/v1/token
const data = {
    grant_type: refresh_token,
    refresh_token: "xxx"
}
const headers = {
    "Content-Type": "application/x-www-form-urlencoded"
}

const response = {
  "access_token": "access_tokenxxx",
  "expires_in": "3600",
  "token_type": "Bearer",
  "refresh_token": "xxx",
  "id_token": "access_tokenxxx",
  "user_id": "jRkHw6jk3lW5ClWam4C33hPgufA3",
  "project_id": "957777847521"
}
```

网页上的token默认时效只有1小时, 过期后就需要使用刷新token重新获取访问token

2. **获取 `api_key`**

这里有两种方式:

第一种: 正常方式, 完全按照ide的流程(需要懂点grpc)

- 获取 `authToken`

```js
POST https://web-backend.windsurf.com/exa.seat_management_pb.SeatManagementService/GetOneTimeAuthToken

// 需要使用.proto文件将请求数据序列化为二进制数据
const data = {
	firebase_id_token: access_token
}

const headers = {
    "Content-Type": "application/proto"
}

// 响应为二进制数据, 需要.proto文件反序列化
// 反序列化之后的数据
const response = {
    auth_token: "xxx"
}
```

![image-20250825170446172](C:\Users\dami\AppData\Roaming\Typora\typora-user-images\image-20250825170446172.png)

- 生成 `api_key`

两个url使用哪个都行, 并且它支持两种请求格式, 分别是 `application/json` 和 `application/proto`

```js
POST https://register.windsurf.com/exa.seat_management_pb.SeatManagementService/RegisterUser
POST https://web-backend.windsurf.com/exa.seat_management_pb.SeatManagementService/RegisterUser
以上url都可以

const data = {
	firebase_id_token: auth_token
}

const headers = {
    "Content-Type": "application/json" 或 "application/proto"
}

const response = {
    "api_key": "sk-ws-xxx",
    "name": "username",
    "api_server_url": "https://server.self-serve.windsurf.com"
}
```

第二种: 取巧方式

省略获取 `authToken` 这一步, 直接将网页上的 `access_token` 放入`https://register.windsurf.com/exa.seat_management_pb.SeatManagementService/RegisterUser` 请求的 `firebase_id_token` 参数上

```js
POST https://register.windsurf.com/exa.seat_management_pb.SeatManagementService/RegisterUser
POST https://web-backend.windsurf.com/exa.seat_management_pb.SeatManagementService/RegisterUser
以上url都可以

const data = {
	firebase_id_token: access_token // 无需authToken
}

const headers = {
    "Content-Type": "application/json" 或 "application/proto"
}

const response = {
    "api_key": "sk-ws-xxx", // 有用的
    "name": "username", // 有用的
    "api_server_url": "https://server.self-serve.windsurf.com" // 可选
}
```

3. **整合sessions, 并加密成buffer数据**

```json
[
  {
    id: "d4c224ed-ab9a-4a55-bbc8-a2573c13c764", // 随机uuid或者写死
    accessToken: api_key,
    account: {
      label: username,
      id: username,
    },
    scopes: [],
  },
]
```

加密方式和AugmentCode一样, 这里略过

4. **替换state.vscdb**

上面的json加密完成后会变成这样:

```
{"type":"Buffer","data":[118,49,48,208,189,49,183,252,20,5,81,99,217,37,25,223,3,150,194,233,19,68,101,170,123,7,2,58,60,108,31,213,151,244,177,31,181,216,190,147,171,18,50,92,251,214,238,116,201,56,205,106,87,94,223,199,190,39,159,71,194,84,20,40,64,50,229,92,60,1,214,124,138,2,176,255,13,70,251,132,52,177,30,2,97,212,118,225,251,126,244,251,3,2,94,133,173,181,5,101,182,57,206,139,242,170,205,158,178,194,187,202,54,170,4,220,118,108,215,138,108,135,41,122,171,149,27,103,63,98,204,240,102,133,74,100,4,135,87,112,115,11,88,170,102,163,60,244,12,198,174,9,29,202,83,56,201,102,97,204,31,191,77,100,158,114,25,157,43,245,115,79,112,34,120,57,65,225,12,41,195,121,30,241,120,8,75,28,179,214,72,222,19,233,234,140,3,225,164,140,50,73,226,16,239,216,65,39,117,34,142,144,27,145,161,139,236,153,218,58,215,238,38,147,219,194,4,93,228,32,135,42,171,71,221,120,28,248,77,34,32,55,172,215,201,251,212,77,64,148,238]}
```

存入state.vscdb中, key是 `secret://{"extensionId":"codeium.windsurf","key":"windsurf_auth.sessions"}`

(可选): 替换 `api_server_url`

上面 **RegisterUser** 接口请求得到了 `api_server_url` 字段, 也可以选择性替换, 当然也可以不用管它

key是 `codeium.windsurf`

value是(将apiServerUrl替换掉):

```json
{
  "codeium.installationId": "6af139ae-4338-4078-b493-eb5a50e7a676",
  "apiServerUrl": "https://server.self-serve.windsurf.com",
  "codeium.hasOneTimeUpdatedUnspecifiedMode": true
}
```

这样就完成了切号
