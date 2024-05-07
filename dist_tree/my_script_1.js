var $ = (jQuery = require('jquery'))
const fs = require('fs')
const path = require('path')
//const ipcRend = require('electron').ipcRenderer
const storage = require('electron-json-storage')
//==========================================================================
let flagComConn = false
var comPorts = []
//==========================================================================
var { SerialPort } = require('serialport')
var comPort = 0
async function listSerialPorts() {
  await SerialPort.list().then((ports, err) => {
    if (err) {
      console.log(err.message)
      return
    } else {
      //console.log('no err')
    }
    if (ports.length === 0) {
      console.log('No ports discovered')
    }
    var selComPort = document.getElementById('selComPort')
    let num = selComPort.options.length
    if (num) {
      while (num) {
        num = num - 1
        selComPort.removeChild(selComPort.childNodes[num])
      }
    }
    for (const i in ports) {
      comPorts[i] = ports[i].path
    }
    for (let i = 0; i < ports.length; i++) {
      let newOption = new Option(ports[i].path, ports[i].path)
      selComPort.add(newOption, undefined)
    }
    // console.log('ports', ports)
    // console.log('comPorts', comPorts)
  })
}
//==========================================================================
let flagConnect = false
let flagFirstText = false
let numComPort = ''
let numBoudRate = 0
let numModule = 0
let perOprs = 0
let flagCheckSel = 1
let flagStrHexHtml = 1
let flagStartEnter = false
let flagEndAT = false
let flagSendErr = false
var listStore = [
  {
    data: '',
    type: 1,
  },
]
//---------------------------------------------------
listSerialPorts()
loadConfigInit()
//===================================================
function selectComPort(selectObject) {
  if (flagConnect) startConnect()
  var value = selectObject.value
  numComPort = value
  //--------------------------------------
  storage.get('config', function (error, data) {
    if (error) throw error
    storage.set(
      'config',
      {
        com: value,
        boud: data.boud,
        module: data.module,
        perOpros: data.perOpros,
      },
      function (error) {
        if (error) throw error
      }
    )
    console.log('selectComPort', numComPort)
    loadConfigInit()
  })
}
//------------------------------------
function updataComPort() {
  console.log('updataComPort', numComPort)
  listSerialPorts()
  const selConPort = document.getElementById('selComPort')
  selectComPort(selConPort)
}
//------------------------------------
function selectBoudRate(selectObject) {
  if (flagConnect) startConnect()
  var value = selectObject.value
  numBoudRate = value
  //--------------------------------------
  storage.get('config', function (error, data) {
    if (error) throw error
    storage.set(
      'config',
      {
        com: data.com,
        boud: value,
        module: data.module,
        perOpros: data.perOpros,
      },
      function (error) {
        if (error) throw error
      }
    )
    console.log('selectBoudRate', numBoudRate)
  })
}
//------------------------------------
function selectModules(selectObject) {
  if (flagConnect) startConnect()
  var value = selectObject.value
  numModule = value
  //--------------------------------------
  storage.get('config', function (error, data) {
    if (error) throw error
    storage.set(
      'config',
      {
        com: data.com,
        boud: data.boud,
        module: value,
        perOpros: data.perOpros,
      },
      function (error) {
        if (error) throw error
      }
    )
    console.log('save module number:', numModule)
    if (flagCheckSel == 1) {
      $('#select1').prop('checked', true)
      $('#select2').prop('checked', false)
      $('#select3').attr('disabled', true)
      $('#select4').attr('disabled', true)
    } else if (flagCheckSel == 2) {
      $('#select1').prop('checked', false)
      $('#select2').prop('checked', true)
      $('#select3').removeAttr('disabled')
      $('#select4').removeAttr('disabled')
      $('#select3').prop('checked', true)
      $('#select4').prop('checked', false)
    }
    loadConfigModule(numModule)
  })
}
//===================================================
function clientConnect(com, boud) {
  comPort = new SerialPort(
    {
      path: com,
      baudRate: +boud,
      databits: 8,
      parity: 'none',
      // dtr: true,
    },
    function (err) {
      if (err) {
        //if (flagConnect) startConnect()
        console.log('Port Error: ', err.message)
        // if (flagCheckSel == 1) $('#textArea1').html(strSetAT)
        if (flagCheckSel == 2) $('#textArea1').html(startRX1)
        flagComConn = false
        flagConnect = false
        return false
      }
    }
  )
  // comPort.on('readable', function () {
  //   console.log('Data readable:', port.read())
  // })
  comPort.on('data', function (data) {
    try {
      myFuncPostCOM(data)
    } catch (err) {
      console.log('Oops', err)
      // flagComConn = false
      // return false
    }
  })
  flagComConn = true
  return true
}

//================================================ json Save To File
function jsonSaveToFile(data, filePath) {
  //console.log('filePath: ' + filePath)
  fs.writeFileSync(filePath, data)
  const dt = fs.statSync(filePath)
  //console.log('dt: ', dt.mtime)
  const str = `${dt.mtime}`
  const dataStr = str.substr(4, 21)
  return dataStr
}
//=================================================== Загрузка и сохранение установок
function loadConfigInit() {
  //storage.setDataPath(os.tmpdir())
  //const filePath = 'E:\\VSC_projects\\terminal_device_test\\init'

  let filePath = path.join(__dirname, 'init')
  if (filePath.includes('\\app.asar\\'))
    filePath = filePath.replace('\\app.asar\\', '\\')
  //console.log('FilePath:', filePath)

  storage.setDataPath(filePath)
  //console.log('filePath:', filePath)

  storage.has('config', function (error, hasKey) {
    if (error) throw error
    //console.log('hasKey:', hasKey)
    if (!hasKey) {
      setStorageData()
      return
    }
  })
  storage.get('config', function (error, data) {
    if (error) throw error
    numComPort = data.com
    numBoudRate = data.boud
    numModule = data.module
    perOprs = data.perOpros

    selectElement('selComPort', data.com)
    selectElement('selBoudRate', data.boud)
    selectElement('selModules', data.module)
    //console.log('get conf:', numComPort, numBoudRate, numModule)
    $('#select1').prop('checked', true)
    $('#select3').attr('disabled', true)
    $('#select4').attr('disabled', true)
    loadConfigModule(numModule)
  })
  //----------------------------------------------
  storage.has('list', function (error, hasKey) {
    if (error) throw error
    //console.log('hasKey:', hasKey)
    if (!hasKey) {
      setStorageList()
      return
    }
  })
  storage.get('list', function (error, data) {
    if (error) throw error
    listStore = data.list
    console.log('load list store:', listStore)
  })
}
//--------------------------------------------------------------------
function selectElement(id, valueToSelect) {
  let element = document.getElementById(id)
  element.value = valueToSelect
}
//--------------------------------------------------------------------
function setStorageData() {
  console.log('setStorageData:')
  if (flagConnect) startConnect()
  //----------------------------------------------------
  storage.set(
    'config',
    {
      com: numComPort,
      boud: numBoudRate,
      module: numModule,
      perOpros: perOprs,
    },
    function (error) {
      if (error) throw error
    }
  )
}
//--------------------------------------------------------------------
function setStorageList() {
  storage.set(
    'list',
    {
      list: listStore,
    },
    function (error) {
      if (error) throw error
    }
  )
  console.log('setStorageList:', listStore)
}
//=================================================== Загрузить конфигурацию модуля
function loadConfigModule(module) {
  //console.log('module:', module)
  if (flagCheckSel == 1) {
    $('#textArea1').html(strSetAT)
  } else if (flagCheckSel == 2) {
    if (!flagComConn) $('#textArea1').html(startRX1)
    else $('#textArea1').html(startRX2)
  }
  if (module == 1) {
    console.log('module:', module)
  } else if (module == 2) {
    console.log('module:', module)
  }
}
//--------------------------------------------------------
function setWindowToArea(sel) {
  //console.log('setWindowToArea:', sel)
  if (sel == 1) {
    startConnect()
    if (flagCheckSel == 1) $('#textArea1').html(startAT)
    else if (flagCheckSel == 2) $('#textArea1').html(startRX2)
  } else if (sel == 2) {
    if (numModule == 1) readATcommands()
    else if (numModule == 2) readJDY41commands()
  }
}
//=========================================================
function typeLabelInfo1(info, color) {
  $('#loadInfo1').prop('innerHTML', info).css({ color: color })
}
//=========================================================
function typeLabelInfo11(info, color) {
  $('#loadInfo11').prop('innerHTML', info).css({ color: color })
}
//===================================================
function selectCheck(sel) {
  switch (sel) {
    case 1:
      $('#select2').prop('checked', false)
      $('#select1').prop('checked', true)
      $('#select3').prop('checked', false)
      $('#select4').prop('checked', false)
      $('#select3').attr('disabled', true)
      $('#select4').attr('disabled', true)
      flagCheckSel = 1
      clearBufferArea()
      if (flagConnect) {
        if (numModule == 1) readATcommands()
        else if (numModule == 2) readJDY41commands()
      } else loadConfigModule(numModule)
      $('#textArea2').html('')
      break
    case 2:
      $('#select2').prop('checked', true)
      $('#select1').prop('checked', false)
      $('#select3').removeAttr('disabled')
      $('#select4').removeAttr('disabled')
      $('#select3').prop('checked', true)
      $('#select4').prop('checked', false)
      flagCheckSel = 2
      flagStrHexHtml = 1
      clearBufferArea()
      console.log('flagConnect', flagConnect, flagComConn)
      if (!flagComConn || !flagConnect) {
        $('#textArea1').html(startRX1)
      } else {
        $('#textArea1').html(startRX2)
      }
      $('#textArea2').html(startTX1)
      loadListToStore()
      // const txTextArea = document.getElementById('textArea2')
      // txTextArea.addEventListener('click', setClickArea2, false)
      // txTextArea.onkeydown = (evt) => {
      //   if (evt.key == 'Enter') {
      //     convertTextArea2()
      //   } else if (evt.key == 'Escape') {
      //     escapeTextArea2()
      //   }
      // }
      break
    case 3:
      $('#select4').prop('checked', false)
      $('#select3').prop('checked', true)
      flagStrHexHtml = 1
      if (!flagSendErr) convertHexToString()
      break
    case 4:
      $('#select4').prop('checked', true)
      $('#select3').prop('checked', false)
      flagStrHexHtml = 2
      convertStringToHex()
      break
      break

    default:
      break
  }
}
//---------------------------------------------------------
function convertHexToString() {
  let str = document.getElementById('styleInputTx').value
  while (str.includes('0x')) {
    str = str.replace('0x', '')
  }
  //console.log('HexToString:', str)
  let output = []
  let len = str.length
  let k = 0
  for (var i = 0; i < len; i++) {
    const index = str.indexOf(' ')
    const hex = str.slice(0, index)
    k = index + 1
    str = str.slice(k, len)
    if (index == -1) {
      output.push(parseInt(str, 16))
      break
    }
    output.push(parseInt(hex, 16))
  }
  //console.log('output:', output)
  var buf = new Uint8Array(output.length)
  for (let i = 0; i < len; i++) {
    buf[i] = output[i]
  }
  let td = new TextDecoder('cp1251')
  str = td.decode(buf)
  $('#styleInputTx').prop('value', str).css({ color: '#000000' })
  inputTypeArea(document.getElementById('styleInputTx'))
  $('#styleInputTx').cursorToEnd()
}
//---------------------------------------------------------
function convertStringToHex() {
  let str = document.getElementById('styleInputTx').value
  const hexdt = text2Binary(str)
  //console.log('digit:', hexdt)
  $('#styleInputTx').prop('value', hexdt)
  inputTypeArea(document.getElementById('styleInputTx'))
  $('#styleInputTx').cursorToEnd()
}
//---------------------------------------------------------
function text2Binary(text) {
  let len = text.length
  let output = []
  let i = 0
  for (; i < len - 1; i++) {
    const bin = text[i].charCodeAt().toString(16)
    output.push('0x' + bin + ' ')
  }
  if (!text.length) return
  const bin = text[i].charCodeAt().toString(16)
  output.push('0x' + bin)
  return output.join('')
}
//=========================================================
function setClickArea2() {
  console.log('setClickArea2')
}
//---------------------------------------------------------
function escapeTextArea2() {
  console.log('escapeTextArea2:')
}
//=========================================================
function inputTypeArea(elem) {
  //  console.log('elem:', elem.scrollHeight)
  elem.style.height = '1px'
  elem.style.height = `${elem.scrollHeight - 6}px`
  if (flagStrHexHtml == 2) {
    checkCorrectString()
  }
}
//-------------------------------------------------------------
function checkCorrectString() {
  let color = '#000000'
  let str = document.getElementById('styleInputTx').value
  const strIn = str
  let cou = 0
  let output = []
  let len = str.length
  let k = 0
  while (str.includes('0x')) {
    str = str.replace('0x', '')
    cou++
  }
  if (cou && len) {
    for (var i = 0; i < len; i++) {
      const index = str.indexOf(' ')
      const hex = str.slice(0, index)
      k = index + 1
      str = str.slice(k, len)
      if (index == -1) {
        output.push(str)
        break
      }
      output.push(hex)
    }
  } else {
    flagSendErr = true
    color = '#000000'
    $('#styleInputTx').prop('value', strIn).css({ color: color })
    return
  }
  for (const i in output) {
    const st = output[i]
    if (st.length > 2) {
      color = '#000000'
      break
    }
    for (const i in str) {
      const bin = parseInt(str[i].charCodeAt().toString(16), 16)
      //console.log('bin:', str[i], bin)
      switch (bin) {
        case 48:
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
          color = '#001aff'
          flagSendErr = false
          break
        default:
          flagSendErr = true
          color = '#000000'
          break
      }
      if (color == '#000000') break
    }
  }
  $('#styleInputTx').prop('value', strIn).css({ color: color })
}
//-------------------------------------------------------------
function setClickArea_3() {
  if (flagStartEnter) {
    $('#textArea_3').html('')
    flagStartEnter = false
    console.log('Clear Area 3')
  }
}
//-------------------------------------------------------------
function addTxString() {
  if (listStore.length == 10) {
    typeWarnInfo('Maximum 10 rows!', '#e00000', 2000)
    return
  }
  let str = document.getElementById('styleInputTx').value
  let len = str.length
  if (len) {
    const lenList = listStore.length
    const dt = {
      data: str,
      type: flagStrHexHtml,
    }
    listStore[lenList] = dt
    setStorageList()
    if (len > 52) str = str.slice(0, 52) + ' ... ' + str.slice(len - 16, len)
    if (flagStrHexHtml == 1)
      str = '<textarea class="styleTextArea" readonly>' + str + '</textarea>'
    //console.log('str:', str)
    $('ol').append(
      '<li><span class=typeColor' +
        flagStrHexHtml +
        '>' +
        str +
        '</span><button class="buttList2" onclick="deletRowToList(' +
        lenList +
        ')">x</button><button class="buttList1" onclick="addRowToInput(' +
        lenList +
        ')">+</button></li>'
    )
  }
}
//--------------------------------------------------------------------
function loadListToStore() {
  for (const i in listStore) {
    let str = listStore[i].data
    const type = listStore[i].type
    const len = str.length
    if (len > 52) str = str.slice(0, 52) + ' ... ' + str.slice(len - 16, len)
    if (type == 1) {
      str = '<textarea class="styleTextArea" readonly>' + str + '</textarea>'
    }
    $('ol').append(
      '<li><span class=typeColor' +
        type +
        '>' +
        str +
        '</span><button class="buttList2" onclick="deletRowToList(' +
        i +
        ')">x</button><button class="buttList1" onclick="addRowToInput(' +
        i +
        ')">+</button></li>'
    )
  }
}
//---------------------------------------------------------
function addRowToInput(num) {
  let str = listStore[num].data
  let color = '#000000'
  flagStrHexHtml = listStore[num].type
  $('#select4').prop('checked', false)
  $('#select3').prop('checked', false)
  switch (flagStrHexHtml) {
    case 1:
      $('#select3').prop('checked', true)
      break
    case 2:
      $('#select4').prop('checked', true)
      color = '#001aff'
      break
    default:
      $('#select3').prop('checked', true)
      break
  }
  $('#styleInputTx').prop('value', str).css({ color: color })
  inputTypeArea(document.getElementById('styleInputTx'))
  $('#styleInputTx').cursorToEnd()
}
//---------------------------------------------------------
$.fn.cursorToEnd = function () {
  var start, end
  start = end = this.val().length
  return this.each(function () {
    if (this.setSelectionRange) {
      this.focus()
      this.setSelectionRange(start, end)
    } else if (this.createTextRange) {
      var range = this.createTextRange()
      range.collapse(true)
      range.moveEnd('character', end)
      range.moveStart('character', start)
      range.select()
    }
  })
}
//---------------------------------------------------------
function deletRowToList(num) {
  listStore.splice(num, 1)
  setStorageList()
  //console.log('deletRowToList:', num, listStore)
  const listTxArea = document.getElementById('listTxArea')
  listTxArea.removeChild(listTxArea.childNodes[num])
}
//-------------------------------------------------------------
function sendTxString() {
  let str = document.getElementById('styleInputTx').value
  let len = str.length
  let output = []
  if (flagStrHexHtml == 1) {
    let i = 0
    for (; i < len; i++) {
      const bin = str[i].charCodeAt().toString(16)
      output.push(parseInt(bin, 16))
    }
    //console.log('output:', output)
    sendToComPort(output)
  } else if (flagStrHexHtml == 2) {
    if (flagSendErr) {
      typeWarnInfo('Не корректный формат данных!', '#e00000', 2000)
      return
    }
    sendStringHex(str)
    // while (str.includes('0x')) {
    //   str = str.replace('0x', '')
    // }
    //console.log('HexToString:', str)
  } else {
    typeLabelInfo1('Соединение не установлено!', '#e00000')
    console.log('Соединения нет!', flagComConn, flagConnect)
  }
}
//-------------------------------------------------------------
function sendStringHex(str) {
  let k = 0
  let output = []
  let len = str.length
  for (var i = 0; i < len; i++) {
    const index = str.indexOf(' ')
    const hex = str.slice(0, index)
    k = index + 1
    str = str.slice(k, len)
    if (index == -1) {
      output.push(parseInt(str, 16))
      break
    }
    output.push(parseInt(hex, 16))
  }
  //console.log('output:', output)
  sendToComPort(output)
}
//-------------------------------------------------------------
function sendToComPort(output) {
  var buf = new Uint8Array(output.length)
  for (const i in output) {
    buf[i] = output[i]
    }
  
  // for (let i = 0; i < len; i++) {
  //   buf[i] = output[i]
  // }
  //console.log('send Tx: ', buf)
  if (flagConnect && flagComConn) {
    comPort.write(buf, function (err) {
      if (err) {
        console.log('Error COM sending message : ' + err)
        comPort.close()
        flagComConn = false
      }
    })
  }
}
//-------------------------------------------------------------
function typeWarnInfo(str, color, time) {
  const strOld = document.getElementById('styleInputTx').value
  $('#styleInputTx').prop('value', str).css({ color: color })
  setTimeout(() => {
    if (flagStrHexHtml == 1) color = '#000000'
    else color = '#001aff'
    $('#styleInputTx').prop('value', strOld).css({ color: color })
  }, time)
}
//-------------------------------------------------------------
function clearTxString() {
  //console.log('clearTxString: ')
  $('#styleInputTx').prop('value', '')
}
//==========================================================================
