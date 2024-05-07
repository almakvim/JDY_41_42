let timeOutRxtail = 0
let respAT = ''
let countP = 1
let countPtx = 1
let startTextA_3 = '<p class="startStyle">After type the text press "Enter"</p>'

const strSetAT =
  '<a href="#" class="instrStyle" onclick="setWindowToArea(1)"><span class=srtTxStyle1>Connect =></span> Read instructions</a>'

const startRX1 =
  '<p><a href="#" class="srtTxStyle1" onclick="setWindowToArea(1)">Connect</a></p>'

const startRX2 =
  '<p><label class="rxStyle">RX:</label><a href="#" class="clearBufferStyle" onclick="clearBufferArea()">[Clear]</a></p><p>----------------------------</p>'

const startAT =
  '<p><a href="#" class="instrStyle" onclick="setWindowToArea(2)">Read instructions</a><a href="#" class="clearBufferStyle" onclick="clearBufferArea()">[Clear]</a></p><p>-------------------------------------------------</p>'

const startTX1 =
  '<div><label class="rxStyle">TX:</label></div><div><ol id = "listTxArea"></ol><textarea id="styleInputTx" oninput="inputTypeArea(this)"></textarea><a href="#" class="srtTxStyle3" onclick="clearTxString()">Clear</a><a href="#" class="srtTxStyle2" onclick="addTxString()">Add</a><a href="#" class="srtTxStyle11" onclick="sendTxString()">Send</a></div>'

//-----------------------------------
let strBuf = ''
let RxBuf = new ArrayBuffer(512)
let RxHex = new ArrayBuffer(512)
let RxFlag = false
let outHex = []

//=================================================== Пакет от устройства
function myFuncPostCOM(msgData) {
  if (flagCheckSel == 2) {
    if (flagStrHexHtml == 1) {
      respAT = respAT.concat(msgData.toString())
      strBuf += respAT
      while (strBuf.includes('\r\n')) strBuf = strBuf.replace('\r\n', '</p><p>')

      $('#textArea1').html(startRX2 + '<p>' + strBuf)
    } else if (flagStrHexHtml == 2) {
      for (let i = 0; i < msgData.length; i++) {
        const hexString = msgData[i].toString(16)
        strBuf += '<span class="typeColor2">0x' + hexString + ' </span>'
      }
      $('#textArea1').html(startRX2 + strBuf)
    }
    respAT = ''
    setTimeout(() => {
      $('#textArea1').scrollTop($('#textArea1')[0].scrollHeight)
    }, 100)
  }
  if (numModule == 1 && flagCheckSel == 1) {
    respAT = respAT.concat(msgData.toString())
    if (respAT == 'OK') {
      clearInterval(timeoutSendInstr)
      readATcommands()
      typeLabelInfo1('AT instruction set OK!', '#00a000')
      console.log('AT instruction set', respAT)
      return
    }
    if (flagEndAT) return
    clearInterval(timeOutATsend)
    timeOutATsend = setInterval(() => {
      if (countATsend > 6) {
        typeTextArea2(respAT)
        //parseATResponse(countATsend - 1, respAT)
        clearInterval(timeOutATsend)
        flagATRead = true
        flagEndAT = true
        countATsend = 1
        comPort.set({ dtr: false, rts: false })
        typeLabelInfo11('SET = 1', '#e00000')
        //console.log('paramAT:', paramAT, respAT)
        respAT = ''
      } else {
        clearInterval(timeOutNoResponce)
        typeTextArea2(respAT)
        //parseATResponse(countATsend - 1, respAT)
        sendATcommands(countATsend++)
        respAT = ''
      }
    }, 100)
  } else if (numModule == 2 && flagCheckSel == 1) {
    respAT = respAT.concat(msgData.toString())
    for (let i = 0; i < msgData.length; i++) {
      const hexString = msgData[i].toString(16)
      if (hexString.length == 1) strBuf = '0' + hexString
      else strBuf = hexString
      outHex.push(strBuf)
      if (flagInstrJDY41 == 1) {
        if (outHex.length == 14) {
          typeInstrToArea1(outHex)
          //console.log('strBuf 1:', outHex)
          flagInstrJDY41 = 2
          outHex = []
          sendStringHex('0xf2 0xad 0x0d 0x0a')
        }
      } else if (flagInstrJDY41 == 2) {
        if (outHex.length == 8) {
          //console.log('strBuf 2:', outHex)
          flagInstrJDY41 = 3
          typeDeviceID(outHex)
          outHex = []
          respAT = ''
          setTimeout(() => {
            sendStringHex('0xab 0xcd 0x0d 0x0a')
          }, 20)
        }
      } else if (flagInstrJDY41 == 3) {
        if (outHex.length == 5) {
          clearInterval(timeOutOverFlow)
          flagInstrJDY41 = 0
          comPort.set({ dtr: false, rts: false })
          typeLabelInfo11('SET = 1', '#e00000')
          $('#instrId_9').prop('innerHTML', respAT).css({ color: '#e00000' })
          //console.log('respAT:', respAT)
        }
      } else if (flagInstrJDY41 == 4) {
        if (outHex.length == 5) {
          $('#instrId_8').prop('innerHTML', respAT).css({ color: '#e00000' })
          flagInstrJDY41 = 5
          respAT = ''
          outHex = []
        }
      } else if (flagInstrJDY41 == 5) {
        if (outHex.length == 6) {
          setTimeout(() => {
            $('#instrId_8').prop('innerHTML', '')
            $('#instrId_8').prop('innerHTML', respAT).css({ color: '#00e000' })
          }, 500)
        }
      } else if (flagInstrJDY41 == 6) {
        if (outHex.length == 5) {
          //console.log('strBuf:', respAT)
          if (respAT.includes('+OK')) {
            sendStringHex('0xab 0xe3 0x0d 0x0a')
            setTimeout(() => {
              clearInterval(timeOutSendConfig)
              readJDY41commands()
            }, 1000)
          }
        }
      }
      //console.log('strBuf:', outHex)
    }
  }
}
//===================================================
function decToHex(dec) {
  if (dec < 0) dec = 0xffffffff + dec + 1
  return '0x' + dec.toString(16).toUpperCase()
}
//==========================================================================
let rxStrBuffer = ''
let paramAT = []

function typeTextArea2(str) {
  if (str.includes('\r\n')) {
    const strP = '<span class=countStyle> ' + countP + '. </span>'
    const digit = parseAtDigit(str)
    let strAT = str.replace(digit, '')
    strAT = strAT.replace('\r\n', '')
    let nameAT = strAT.replace('=', '')
    nameAT = 'AT' + nameAT
    paramAT[countP - 1] = {
      name: nameAT,
      dig: digit,
      old: digit,
      set: false,
    }
    const strDig =
      '<input class="styleInput" type="text" id="inputId_' +
      countP +
      '" oninput="inputChange(' +
      countP +
      ')" value="' +
      digit +
      '"/>'
    const strSet =
      '<a href="#" class="butCell" id="butClick_' +
      countP +
      '" onclick="buttonSet(' +
      countP +
      ')">Set</a>'
    str = '<p> ' + strP + strAT + strDig + strSet + '</p>'
    countP++
    rxStrBuffer += str
    $('#textArea1').html(startAT + rxStrBuffer)
    // setTimeout(() => {
    //   $('#textArea1').scrollTop($('#textArea1')[0].scrollHeight)
    // }, 1000)
  }
}
//-----------------------------------------
function clearBufferArea() {
  if (flagCheckSel == 1) {
    $('#textArea1').html(startAT)
    rxStrBuffer = ''
    paramRD = []
    countP = 1
  } else if (flagCheckSel == 2) {
    $('#textArea1').html(startRX2)
    // if (flagStrHexHtml == 1) strBuf = '<p>'
    // else if (flagStrHexHtml == 2) strBuf = ''
    strBuf = ''
  }
}
//==========================================================================
function startConnect() {
  if (!flagConnect) {
    if (flagComConn) {
      setTimeout(() => {
        if (flagComConn) comPort.close()
        flagComConn = false
        flagATRead = false
        console.log('Соединение T разорвано!')
        setTimeout(() => {
          if (clientConnect(numComPort, numBoudRate)) {
            setTimeout(() => {
              typeLabelInfo1('Соединение установлено!', '#0000e0')
              flagConnect = true
              console.log('Соединение установлено!', flagComConn)
              comPort.set({ dtr: false, rts: false })
              //typeLabelInfo11('SET = 1', '#e00000')
              if (flagCheckSel == 1) {
                if (numModule == 1) readATcommands()
                else if (numModule == 2) readJDY41commands()
              }
            }, 500)
          } else console.log('Соединения нет!', flagComConn)
        }, 500)
      }, 500)
    } else {
      if (clientConnect(numComPort, numBoudRate)) {
        setTimeout(() => {
          typeLabelInfo1('Соединение установлено!', '#0000e0')
          flagConnect = true
          console.log('Соединение установлено!', flagComConn)
          comPort.set({ dtr: false, rts: false })
          //typeLabelInfo11('SET = 1', '#e00000')
          if (flagCheckSel == 1) {
            if (numModule == 1) readATcommands()
            else if (numModule == 2) readJDY41commands()
          }
        }, 500)
      } else {
        console.log('Соединения нет!', flagComConn)
        flagATRead = false
      }
    }
  } else {
    if (flagComConn) {
      //comPort.set({ dtr: false, rts: false })
      comPort.close()
      flagComConn = false
    }
    setTimeout(() => {
      console.log('Соединение разорвано!', flagComConn)
      flagConnect = false
      flagATRead = false
      typeLabelInfo1('Соединение разорвано!', '#e00000')
      if (flagCheckSel == 2) $('#textArea1').html(startRX1)
    }, 500)
  }
}
//===================================================
let timeOutATsend = 0
let timeOutNoResponce = 0
let countATsend = 0
let flagATRead = false

function readATcommands() {
  if (flagConnect) {
    flagATRead = false
    comPort.set({ dtr: true, rts: false })
    typeLabelInfo11('SET = 0', '#00e000')
    countATsend = 1
    setTimeout(() => {
      flagEndAT = false
      sendATcommands(countATsend++)
      clearBufferArea()
    }, 100)
    timeOutNoResponce = setTimeout(() => {
      comPort.set({ dtr: false, rts: false })
      typeLabelInfo11('SET = 1', '#e00000')
      typeLabelInfo1('Нет ответа от модуля!', '#e00000')
      console.log('Нет ответа от модуля!')
    }, 3000)
  } else {
    console.log('Соединения нет!', flagComConn, flagConnect)
  }
}
//---------------------------------------------------
function sendATcommands(index) {
  let str = ''
  switch (index) {
    case 1:
      str = 'AT+BAUD\r\n'
      break
    case 2:
      str = 'AT+RFID\r\n'
      break
    case 3:
      str = 'AT+DVID\r\n'
      break
    case 4:
      str = 'AT+RFC\r\n'
      break
    case 5:
      str = 'AT+POWE\r\n'
      break
    case 6:
      str = 'AT+CLSS\r\n'
      break

    default:
      break
  }
  //console.log('send AT command:', countATsend, str)
  sendDataComPort(str)
}
//---------------------------------------------------
function sendDataComPort(str) {
  const buffer = Buffer.from(str)
  respAT = ''
  comPort.write(buffer, function (err) {
    if (err) {
      console.log('Error COM sending message : ' + err)
      comPort.close()
      flagComConn = false
    }
  })
}
//---------------------------------------------------
function parseAtDigit(data) {
  const Tegs = [
    '+BAUD=',
    '+RFID=',
    '+DVID=',
    '+RFC=',
    '+POWE=',
    '+CLSS=',
    '\r\n',
  ]
  for (const i in Tegs) {
    if (data.includes(Tegs[i])) {
      data = data.replace(Tegs[i], '')
    }
  }
  return data
}
//---------------------------------------------------
function buttonSet(id) {
  if (!flagATRead) {
    typeLabelInfo1('Необходимо соединение с модулем!', '#e00000')
    console.log('Необходимо соединение с модулем!', flagComConn, flagATRead)
    return
  }
  if (paramAT[id - 1].set) {
    const sendStr = paramAT[id - 1].name + paramAT[id - 1].dig + '\r\n'
    console.log('paramAT send:', sendStr)
    //------------------------------------
    flagATRead = false
    comPort.set({ dtr: true, rts: false })
    typeLabelInfo11('SET = 0', '#00e000')
    setTimeout(() => {
      sendDataComPort(sendStr)
    }, 100)
    //------------------------------------
    timeoutSendInstr = setTimeout(() => {
      flagATRead = true
      comPort.set({ dtr: false, rts: false })
      typeLabelInfo11('SET = 1', '#e00000')
      typeLabelInfo1('AT instruction send ERR!', '#e00000')
      console.log('AT instruction send ERR!', respAT)
    }, 5000)
    paramAT[id - 1].set = false
    paramAT[id - 1].old = paramAT[id - 1].dig
    $('a#butClick_' + id).css({ color: '#000ed3' })
  } else console.log('Parameter no changed:', id)
}
//---------------------------------------------------
let timeoutInputSet = 0
let timeoutSendInstr = 0
let idOld = ''

function inputChange(num) {
  idOld = id = +num
  let flagOk = false
  const data = document.getElementById('inputId_' + id).value
  //console.log('input data:', data)
  switch (id) {
    case 1:
      if (+data < 7) flagOk = true
      break
    case 2:
    case 3:
      const tmp = parseInt(data, 16)
      console.log('hex data:', data, tmp)
      if (tmp < 65536) flagOk = true
      break
    case 4:
      if (+data < 129 && data.length == 3) flagOk = true
      break
    case 5:
      if (+data < 10 || data == '0') flagOk = true
      break
    case 6:
      switch (data) {
        case 'A0':
        case 'C0':
        case 'C1':
        case 'C2':
        case 'C3':
        case 'C4':
        case 'C5':
          flagOk = true
          break
        default:
          break
      }
  }
  if (!flagOk) {
    $('a#butClick_' + id).css({ color: '#000ed3' })
    paramAT[id - 1].set = false
    clearInterval(timeoutInputSet)
    timeoutInputSet = setTimeout(() => {
      document.getElementById('inputId_' + idOld).value = paramAT[id - 1].old
    }, 5000)
  } else {
    clearInterval(timeoutInputSet)
    paramAT[id - 1].dig = data
    if (paramAT[id - 1].dig != paramAT[id - 1].old) {
      $('a#butClick_' + id).css({ color: '#e00000' })
      paramAT[id - 1].set = true
    } else {
      $('a#butClick_' + id).css({ color: '#000ed3' })
      paramAT[id - 1].set = false
    }
  }
}
//==========================================================================
function butSendAll() {
  console.log('butSendAll:')
}
//---------------------------------------------------
function butClearAll() {
  console.log('butClearAll:')
  $('#textArea_3').html('')
  flagFirstText = false
  countTx = 0
  tabTxText = []
}
//==========================================================================
