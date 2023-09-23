import './css/base.css'
import { getAllTools } from './tools'
import data from './data.json'
import { edit } from './editor'

const deTemp =
  "<div class='edit content'></div><div class='editarea'  contenteditable style='width: 100%; height: 100px; background-color: white; color:black'></div>"

export class ZlText {
  zl: string
  root: Element
  constructor(zl: string) {
    this.zl = zl
    if (zl.startsWith('#')) {
      this.root = document.getElementById(zl.replace('#', ''))
    } else if (zl.startsWith('.')) {
      if (document.getElementsByClassName(zl.replace('.', ''))) {
        this.root = document.getElementsByClassName(zl.replace('.', ''))[0]
      }
    }
    this.root.innerHTML = deTemp
    const e = this.root.getElementsByClassName('edit')[0]
    const toolMap = getAllTools()
    data.forEach((tool) => {
      e.appendChild(toolMap.get(tool.name))
      toolMap.get(tool.name).onclick = () =>
        edit(event, tool.tagName, this.root.getElementsByClassName('editarea')[0])
    })
  }
}
