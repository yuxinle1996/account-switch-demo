import { addToast, Button, closeAll, Radio, RadioGroup, Tab, Tabs, Textarea } from '@heroui/react'
import { useEffect, useState } from 'react'

import { Config, DecryptType, IDE } from './types'

const editorList = [
  {
    label: 'VSCode',
    value: IDE.VSCode
  },
  {
    label: 'Cursor',
    value: IDE.Cursor
  },
  {
    label: 'Windsurf',
    value: IDE.Windsurf
  }
]

function App() {
  const [init, setInit] = useState(false)
  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const [config, setConfig] = useState<Config>({})

  async function getConfig() {
    try {
      const res = await window.api.getConfig()
      if (!res.success) {
        throw new Error(res.message)
      }
      setConfig(res.data)
    } catch (error) {
      addToast({
        title: '获取配置失败',
        description: error.message?.replace('Error invoking remote method ', '') || error,
        color: 'danger'
      })
    } finally {
      setInit(true)
    }
  }

  useEffect(() => {
    document.title = '加密/解密演示'
    getConfig()
  }, [])

  async function encrypt() {
    try {
      const res = await window.api.secrets.encrypt(data)
      setResult(res)
    } catch (error) {
      addToast({
        title: '加密失败',
        description: error.message.replace('Error invoking remote method ', ''),
        color: 'danger'
      })
    }
  }
  async function decrypt() {
    try {
      const obj = JSON.parse(data)
      const res = await window.api.secrets.decrypt(obj.data)
      setResult(res)
    } catch (error) {
      addToast({
        title: '解密失败',
        description: error.message.replace('Error invoking remote method ', ''),
        color: 'danger'
      })
    }
  }

  async function setConfigAndNotify(data: Config) {
    if (!init) return
    try {
      const res = await window.api.setConfig(data)
      if (!res.success) {
        throw new Error(res.message)
      }
      setConfig(res.data)
      closeAll()
      addToast({
        title: '配置更新',
        description: '需要重启应用才能生效',
        color: 'primary',
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        hideIcon: true,
        endContent: (
          <Button color="primary" variant="flat" size="sm" onPress={window.api.reload}>
            立刻重启
          </Button>
        )
      })
    } catch (error) {
      addToast({
        title: '配置更新失败',
        description: error.message.replace('Error invoking remote method ', ''),
        color: 'danger'
      })
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="relative flex h-screen flex-1 flex-col">
        <div className="flex flex-col gap-2 p-2">
          <div className="flex items-center gap-2">
            <Button color="primary" size="sm" onPress={encrypt}>
              加密
            </Button>
            <Button color="secondary" size="sm" onPress={decrypt}>
              解密
            </Button>
            <Button
              color="danger"
              size="sm"
              variant="ghost"
              onPress={() => {
                setData('')
                setResult('')
              }}
            >
              清空
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroup
              orientation="horizontal"
              size="sm"
              value={config.type}
              onValueChange={(value) => setConfigAndNotify({ type: value as DecryptType })}
            >
              <Radio value={DecryptType.UserDataPath}>用户数据路径</Radio>
              <Radio value={DecryptType.KeyFile}>秘钥文件</Radio>
            </RadioGroup>
            <Tabs
              size="sm"
              selectedKey={config.editor}
              onSelectionChange={(value) => setConfigAndNotify({ editor: value as IDE })}
            >
              {editorList.map((item) => (
                <Tab key={item.value} title={item.label} value={item.value} />
              ))}
            </Tabs>
          </div>
        </div>
        <Textarea
          classNames={{
            base: 'flex-1',
            inputWrapper: 'rounded-none flex-1',
            input: 'h-full'
          }}
          variant="bordered"
          disableAutosize
          placeholder="请输入要加密或解密的内容"
          value={data}
          onValueChange={setData}
        />
      </div>
      <div className="h-screen flex-1">
        <Textarea
          classNames={{
            base: 'h-full',
            inputWrapper: 'rounded-none border-0  flex-1',
            input: 'h-full'
          }}
          label="结果"
          readOnly
          variant="faded"
          disableAutosize
          value={result}
          onValueChange={setResult}
        />
      </div>
    </div>
  )
}

export default App
