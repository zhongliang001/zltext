import icons from '../icons/icon.png'
import { prevent } from './editor'

type ToolMap = Map<string, HTMLElement>

const toolName = [
  'bold',
  'italic',
  'hyphenated',
  'subscript',
  'superscript',
  'underline',
  'addwhitespace',
  'delwhitespace',
  'quotation',
  'copy',
  'copy1',
  'cut',
  'cut1',
  'paste',
  'paste1',
  'backgroundcolor',
  'no-backgroundcolor',
  'copystyle',
  'search',
  'search1'
]

const getAllTools = () => {
  const toolMap: ToolMap = new Map<string, HTMLElement>()
  for (let n: number = 0; n < 100; n++) {
    const icon = new Image()
    icon.src = icons
    const i: HTMLElement = document.createElement('div')
    i.style.backgroundImage = 'url(' + icon.src + ')'
    i.style.backgroundRepeat = 'no-repeat'
    i.style.height = '24px'
    i.style.width = '24px'
    i.style.float = 'left'
    i.title = toolName[n]
    i.addEventListener('mousedown', prevent)
    i.addEventListener('mouseup', prevent)
    i.style.backgroundPosition = '0 ' + (4 - n * 24) + 'px'
    toolMap.set(toolName[n], i)
  }
  return toolMap
}

export { getAllTools }
