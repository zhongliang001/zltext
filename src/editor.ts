/**
 *
 * @param event 事件
 * @param tagName 操作名成
 * @param root 根节点
 * @returns
 */
const edit = (event: Event, tagName: string, root: Element) => {
  event.preventDefault
  // isCollapsed true 有选择内容 backwards：反着选为true
  const { anchorNode, anchorOffset, focusNode, focusOffset, backwards } = selection()
  if (
    !(isContent(root, anchorNode) && isContent(root, focusNode)) ||
    (anchorNode.isSameNode(focusNode) && anchorOffset === focusOffset)
  ) {
    return
  }
  const doc = anchorNode.parentElement
  const childNodes = doc.childNodes
  console.log(childNodes.length)
  const selChildren: Node[] = []
  // 如果选中的文字是否是当前样式，如果是：则取消样式， 如果不是：则增加此样式
  let isCurrent: boolean = true
  const { startNode, endNode, startOffset, endOffset } = switchStartEnd(
    backwards,
    anchorNode,
    focusNode,
    anchorOffset,
    focusOffset
  )
  let isEnd = false
  let isStart = false
  for (let selIndex = 0; selIndex < childNodes.length; selIndex++) {
    let node = childNodes[selIndex]
    if (!node.hasChildNodes() && node.isSameNode(startNode)) {
      isStart = true
      let parent = node.parentNode,
        nodeName,
        isCurr = false
      if (parent.isSameNode(root)) {
        isCurrent = false
      }
      while (!parent.isSameNode(root)) {
        nodeName = parent.nodeName
        if (nodeName.toLowerCase() === tagName) {
          if (parent.children.length > 0) {
            selChildren.push(parent.children[0])
          } else {
            selChildren.push(parent.childNodes[0])
          }
          isCurr = true
          break
        }
        parent = parent.parentNode
      }
      if (!isCurr) {
        selChildren.push(node)
        isCurrent = false
      }
    } else if (!node.hasChildNodes() && node.isSameNode(endNode)) {
      selChildren.push(node)
      isCurrent = false
      break
    } else if (node.hasChildNodes()) {
      generalSelNode(node, startNode, endNode, selChildren, isStart, tagName, isCurrent, isEnd)
    } else if (selChildren.length > 0) {
      selChildren.push(node)
      const parent = node.parentNode
      const nodeName = parent.nodeName
      if (nodeName.toLowerCase() !== tagName) {
        isCurrent = false
      }
    }
  }
  if (!isCurrent) {
    if (selChildren.length === 1) {
      changeSpecialFont(selChildren[0], tagName, startOffset, endOffset, doc)
    } else {
      for (let index = 0; index < selChildren.length; index++) {
        const child = selChildren[index]
        if (index == 0) {
          changeSpecialFont(child, tagName, startOffset, 0, doc)

        } else if (index < selChildren.length - 1) {
          changeSpecialFont(child, tagName, 0, 0, doc)
        } else {
          changeSpecialFont(child, tagName, 0, endOffset, doc)
        }
      }
    }
  } else {
    if (selChildren.length === 1) {
      const st = selChildren[0]
      // 对当前选中元素的父元素进行拆分
      const pa = st.parentNode
      pa.parentNode.replaceChild(st, pa)
      reselect(st, st)
    }
  }
}

/**
 * 如果存在子元素，则对子元素进行遍历查找到起始节点
 * @param node 需要遍历的元素
 * @param startNode 起始节点
 * @param endNode 结束节点
 * @param selChildren 选择的元素节点集合
 * @param isStart 是否找到起始节点
 * @param tagName 转换后的标签
 * @param isCurrent 是否跟目标标签一致
 * @param isEnd 是否已经找到结束位置
 */
const generalSelNode = (
  node: Node,
  startNode: Node,
  endNode: Node,
  selChildren: Node[],
  isStart: boolean,
  tagName: string,
  isCurrent: boolean,
  isEnd: boolean
) => {
  if (isEnd) {
    return
  }
  const childNode = node.childNodes
  const nodeName = node.nodeName
  if (nodeName.toLocaleLowerCase() !== tagName) {
    isCurrent = false
  }
  for (let index = 0; index < childNode.length; index++) {
    let child = childNode[index]
    if (child.hasChildNodes()) {
      generalSelNode(child, startNode, endNode, selChildren, isStart, tagName, isCurrent, isEnd)
    } else {
      if (child.isSameNode(startNode)) {
        isStart = true
      }
      if (child.isSameNode(endNode)) {
        isEnd = true
        selChildren.push(child)
      }
      // 找到起始节点后的所有元素都放入selChildren 集合
      if (isStart) {
        selChildren.push(child)
      }
    }
  }
}

/**
 * 当选中一个节点时修改样式
 * @param selChildren 被选中的子节点
 * @param tagName 修改后样式
 * @param startOffset 起始编号
 * @param endOffset 结束编号
 * @param doc 父组件
 */
const changeSpecialFont = (
  child: Node,
  tagName: string,
  startOffset: number,
  endOffset: number,
  doc: HTMLElement
) => {
  const udoc = document.createElement(tagName)
  const st = child
  const seld = st.splitText(startOffset)
  let end
  if (endOffset > 0) {
    end = seld.splitText(endOffset - startOffset)
  }
  udoc.appendChild(seld)
  if (!udoc.innerText) {
    udoc.innerText = seld.wholeText
  }
  if (end) {
    doc.insertBefore(end, st)
    doc.insertBefore(udoc, end)
    doc.insertBefore(st, udoc)
    // 清除没有数据的子节点
    clearNodataNode(doc, end)
    clearNodataNode(doc, st)
    reselect(udoc, udoc)
  } else {
    doc.insertBefore(udoc, st)
    // doc.insertBefore(st, udoc)
    clearNodataNode(doc, st)
    reselect(udoc, udoc)
  }
}

/**
 * 清除没有数据的子节点
 * @param parent 父节点
 * @param child 子节点
 */
const clearNodataNode = (parent: Node, child: Node) => {
  if (!child.textContent) {
    parent.removeChild(child)
  }
}

/**
 * @description 重新选取内容
 * @param cNode 起始节点
 * @param end 结束节点
 */
const reselect = (cNode: Node, end: Text | Node) => {
  const range = document.createRange()
  if (cNode.childNodes.length > 0) {
    range.setStart(cNode.childNodes[0], 0)
  } else {
    range.setStart(cNode, 0)
  }
  if (end instanceof Text) {
    if (end.textContent.length > 0) {
      range.setEnd(end, end.textContent.length)
    } else if (cNode.textContent.length > 0) {
      if (cNode.childNodes.length > 0) {
        range.setEnd(cNode.childNodes[0], cNode.textContent.length)
      } else {
        range.setEnd(cNode, cNode.textContent.length)
      }
    }
  } else {
    if (cNode.childNodes.length > 0) {
      range.setEnd(end.childNodes[0], end.textContent.length)
    } else {
      range.setEnd(end, end.textContent.length)
    }
  }
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
}

/**
 *
 * @param backwards 是否反向
 * @param anchorNode 锚点
 * @param focusNode 光标点
 * @param anchorOffset 锚点坐标
 * @param focusOffset 光标坐标
 * @returns
 */
const switchStartEnd = (
  backwards: boolean,
  anchorNode: Node,
  focusNode: Node,
  anchorOffset: number,
  focusOffset: number
) => {
  // 处理用户正向选取和反向选取的问题
  /**
   * startNode 开始节点
   */
  let startNode, endNode, startOffset, endOffset
  if (backwards) {
    startNode = focusNode
    endNode = anchorNode
    startOffset = focusOffset
    endOffset = anchorOffset
  } else {
    endNode = focusNode
    startNode = anchorNode
    endOffset = focusOffset
    startOffset = anchorOffset
  }
  return {
    startNode,
    endNode,
    startOffset,
    endOffset
  }
}

// 阻止点击时选取的内容被取消
const prevent = (event: Event) => {
  event.preventDefault()
}

// 获取选择的内容
const selection = () => {
  const sel = window.getSelection()
  if (sel) {
    const anchorNode = sel.anchorNode
    const anchorOffset = sel.anchorOffset
    const focusNode = sel.focusNode
    const focusOffset = sel.focusOffset
    var backwards = false
    let isCollapsed = sel.isCollapsed
    if (!sel.isCollapsed) {
      var range = document.createRange()
      range.setStart(sel.anchorNode, sel.anchorOffset)
      range.setEnd(sel.focusNode, sel.focusOffset)
      backwards = range.collapsed
      range.detach()
    }
    return {
      anchorNode,
      anchorOffset,
      focusOffset,
      focusNode,
      backwards,
      isCollapsed
    }
  }
}

const isContent = (parent: Node, child: Node) => {
  const browserVersion = getBrowservion()
  if (browserVersion.startsWith('chrome')) {
    if (parent && (parent.contains(child) || parent.isSameNode(child))) {
      return true
    } else {
      return false
    }
  }
}

const getBrowservion = () => {
  var agent = navigator.userAgent.toLowerCase()
  var regStr_ie = /msie [\d.]+/gi
  var regStr_ff = /firefox\/[\d.]+/gi
  var regStr_chrome = /chrome\/[\d.]+/gi
  var regStr_saf = /safari\/[\d.]+/gi
  var browserNV = ''
  //IE
  if (agent.indexOf('msie') > 0) {
    browserNV = agent.match(regStr_ie).toString()
  }
  //firefox
  if (agent.indexOf('firefox') > 0) {
    browserNV = agent.match(regStr_ff).toString()
  }
  //Chrome
  if (agent.indexOf('chrome') > 0) {
    browserNV = agent.match(regStr_chrome).toString()
  }
  //Safari
  if (agent.indexOf('safari') > 0 && agent.indexOf('chrome') < 0) {
    browserNV = agent.match(regStr_saf).toString()
  }
  browserNV = browserNV.toString()
  //other
  if ('' == browserNV) {
    browserNV = 'Is not a standard browser'
  }
  //Here does not display "/"
  if (browserNV.indexOf('firefox') != -1 || browserNV.indexOf('chrome') != -1) {
    browserNV = browserNV.replace('/', '')
  }
  //Here does not display space
  if (browserNV.indexOf('msie') != -1) {
    //msie replace IE & trim space
    browserNV = browserNV.replace('msie', 'ie').replace(/\s/g, '')
  }
  //return eg:ie9.0 firefox34.0 chrome37.0
  return browserNV
}
export { edit, prevent }
