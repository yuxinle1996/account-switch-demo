import { Button } from '@heroui/react'
import { useEffect } from 'react'

function App(): React.JSX.Element {
  useEffect(() => {
    document.title = '账号切换演示'
  }, [])

  async function encrypt() {
    const data = {
      accessToken: 'f51de68ebb97515c3e04f655da293325e787d14ecf20d9cf1fd78e522acc5f2e',
      tenantURL: 'https://d9.api.augmentcode.com',
      scopes: ['email']
    }
    const res = await window.api.secrets.encrypt(data)
    console.log('加密res', res)
  }
  async function decrypt() {
    const str = `{"type":"Buffer","data":[118,49,48,157,199,131,163,241,93,98,109,34,9,185,105,207,86,141,168,124,201,141,10,4,56,214,240,4,181,135,83,160,204,129,213,251,54,181,133,42,94,14,20,16,16,116,160,92,252,238,60,30,50,159,130,248,199,242,112,114,253,206,102,78,167,140,31,199,66,103,99,33,111,80,103,153,192,228,194,16,171,58,237,202,230,58,37,43,51,228,252,71,228,174,236,76,32,189,112,162,111,119,17,15,15,138,67,95,18,65,207,232,91,7,145,31,29,4,142,119,83,69,3,195,207,71,152,175,167,24,113,17,11,25,63,49,29,38,217,226,193,32,169,198,111,68,36,90,47,173,51,48,93,206,18,13,205,47,12,157,145,70,49,176,203,161,151,134,91,125,125,102,197,144,220,221,143]}`
    const obj = JSON.parse(str)
    const res = await window.api.secrets.decrypt(obj.data)
    console.log('解密res', res)
  }

  return (
    <div className="h-screen">
      <Button color="primary" onPress={encrypt}>
        加密
      </Button>
      <Button color="primary" onPress={decrypt}>
        解密
      </Button>
    </div>
  )
}

export default App
