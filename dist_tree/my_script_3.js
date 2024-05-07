//==========================================================================
let countJDY41send = 0
let flagInstrJDY41 = 0
let timeOutOverFlow = 0
let timeOutSendConfig = 0

function readJDY41commands() {
  console.log('readJDY41commands:', flagConnect, flagComConn)
  if (flagConnect) {
    comPort.set({ dtr: true, rts: false })
    typeLabelInfo11('SET = 0', '#00e000')
    countJDY41send = 0
    setTimeout(() => {
      flagInstrJDY41 = 1
      outHex = []
      sendStringHex('0xaa 0xe2 0x0d 0x0a')
      clearBufferArea()
    }, 100)
    timeOutOverFlow = setTimeout(() => {
      comPort.set({ dtr: false, rts: false })
      typeLabelInfo11('SET = 1', '#e00000')
      typeLabelInfo1('Нет ответа от модуля!', '#e00000')
      console.log('Нет ответа от модуля!')
    }, 3000)
  } else {
    console.log('Соединения нет!', flagComConn, flagConnect)
  }
}
//==========================================================================
let paramRD = []
const Names = [
  'Baud rate:',
  'Channel:',
  'Tx power:',
  'CLSS type:',
  'Wireless ID:',
  'ACK respons:',
  'Device ID:',
  'Reset device:',
  'Version:',
]
const Left = [19, 26, 21, 14, 10, 1, 19, 70, 32]

function typeInstrToArea1(arr) {
  let k = 0
  let elem = ''
  for (let i = 2; i < arr.length - 3; i++) {
    if (i < 6 || i == 10) elem = arr[i]
    else {
      elem = arr[i] + arr[i + 1] + arr[i + 2] + arr[i + 3]
      i += 3
    }
    paramRD[k] = {
      name: Names[k],
      left: Left[k++],
      dig: elem,
      old: elem,
      set: false,
    }
  }
  k = 1
  for (const i in paramRD) {
    const strP = '<span class=countStyle> ' + k + '. </span>'
    const strDig =
      '<input class="styleInput" style="margin-left: ' +
      paramRD[i].left +
      'px;" type="text" id="instrId_' +
      k +
      '" oninput="instrChange(' +
      k +
      ')" value="' +
      paramRD[i].dig +
      '">'
    str = '<div> ' + strP + paramRD[i].name + strDig + '</div>'
    k++
    rxStrBuffer += str
  }
  const strSet =
    '<div><a href="#" class="butCell" style="margin-left: 166px;" id="instrClick_1" onclick="instrSet(1)">Set</a></div>'
  rxStrBuffer += strSet
  $('#textArea1').html(startAT + rxStrBuffer)
  //console.log('paramRD:', paramRD)
}
//-----------------------------------------------------------------
function typeDeviceID(arr) {
  let k = 6
  let elem = arr[2] + arr[3] + arr[4] + arr[5]
  for (; k < 9; k++) {
    paramRD[k] = {
      name: Names[k],
      left: Left[k],
      dig: elem,
      old: elem,
      set: false,
    }
    elem = 0
  }
  for (k = 7; k < 10; k++) {
    const strP =
      '<div>-------------------------------------------------</div><span class=countStyle> ' +
      k +
      '. </span>'
    const strDig =
      '<input class="styleInput" style="margin-left: ' +
      paramRD[k - 1].left +
      'px;" type="text" id="instrId_' +
      k +
      '" oninput="instrChange(' +
      k +
      ')" value="' +
      paramRD[k - 1].dig +
      '"/>'
    const strVer =
      '<label class="styleInput" style="margin-left: ' +
      paramRD[k - 1].left +
      'px;" type="text" id="instrId_' +
      k +
      '"></label>'
    const strSet1 =
      '<a href="#" class="butCell" id="instrClick_2" onclick="instrSet(2)">Set</a>'
    const strSet2 =
      '<a href="#" class="butCell1" id="instrClick_3" onclick="instrSet(3)">Reset device</a><label class="styleInput" style="margin-left: 10px;" id="instrId_8"></label>'
    if (k < 8)
      str = '<div> ' + strP + paramRD[k - 1].name + strDig + strSet1 + '</div>'
    else if (k == 8) str = '<div> ' + strP + strSet2 + '</div>'
    else str = '<div> ' + strP + paramRD[k - 1].name + strVer + '</div>'
    rxStrBuffer += str
  }
  $('#textArea1').html(startAT + rxStrBuffer)
  console.log('paramRD:', paramRD)
}
//-----------------------------------------------------------------
let timeoutInstrSet = 0

function instrChange(num) {
  //console.log('instrChange:', num)
  idOld = id = +num
  let flagOk = false
  const data = document.getElementById('instrId_' + id).value
  //console.log('input data:', data)
  switch (id) {
    case 1:
      if (+data < 7) flagOk = true
      break
    case 2:
      if (+data < 128) flagOk = true
    case 3:
      if (+data < 10) flagOk = true
    case 4:
      const tmp = parseInt(data, 16)
      //console.log('hex data:', data, tmp)
      switch (tmp) {
        case 0xa0:
        case 0xc0:
        case 0xc1:
        case 0xc2:
        case 0xc3:
        case 0xc4:
        case 0xc5:
        case 0xc6:
        case 0xc7:
          flagOk = true
          break
        default:
          break
      }
      break
    case 5:
    case 7:
      const thex = parseInt(data, 16)
      //console.log('hex data:', data, thex)
      if (thex <= 0xffffffff) flagOk = true
      break
    case 6:
      if (+data < 2) flagOk = true
      break
    default:
      break
  }
  if (!flagOk) {
    $('#instrId_' + id).css({ color: '#e10000' })
    if (id == 7) $('a#instrClick_2').css({ color: '#000ed3' })
    else $('a#instrClick_1').css({ color: '#000ed3' })
    paramRD[id - 1].set = false
    clearInterval(timeoutInstrSet)
    timeoutInstrSet = setTimeout(() => {
      document.getElementById('instrId_' + idOld).value = paramRD[id - 1].old
      $('#instrId_' + id).css({ color: '#0004df' })
    }, 5000)
  } else {
    $('#instrId_' + id).css({ color: '#00d100' })
    clearInterval(timeoutInstrSet)
    paramRD[id - 1].dig = data
    if (paramRD[id - 1].dig != paramRD[id - 1].old) {
      if (id == 7) $('a#instrClick_2').css({ color: '#e10000' })
      else $('a#instrClick_1').css({ color: '#e10000' })
      paramRD[id - 1].set = true
    } else {
      if (id == 7) $('a#instrClick_2').css({ color: '#000ed3' })
      else $('a#instrClick_1').css({ color: '#000ed3' })
      paramRD[id - 1].set = false
    }
  }
}
//-----------------------------------------------------------------
function instrSet(num) {
  if (num == 1) {
    for (let i = 0; i < paramRD.length; i++) {
      if (paramRD[i].set) {
        $('a#instrClick_1').css({ color: '#000ed3' })
        paramRD[i].set = false
        sendConfigInstr()
        break
      }
    }
  } else if (num == 2) {
    if (paramRD[6].set) {
      $('a#instrClick_2').css({ color: '#000ed3' })
      paramRD[6].set = false
      console.log('instrSet 2:', paramRD[6].dig)
      sendIdDevInstr()
    }
  } else if (num == 3) {
    $('a#instrClick_3').css({ color: '#e10000' })
    if (flagConnect && flagComConn) {
      comPort.set({ dtr: true, rts: false })
      typeLabelInfo11('SET = 0', '#00e000')
      setTimeout(() => {
        flagInstrJDY41 = 4
        respAT = ''
        outHex = []
        sendStringHex('0xab 0xe3 0x0d 0x0a')
      }, 100)
      setTimeout(() => {
        $('a#instrClick_3').css({ color: '#000ed3' })
        $('#instrId_8').prop('innerHTML', '')
        comPort.set({ dtr: false, rts: false })
        typeLabelInfo11('SET = 1', '#e00000')
      }, 3000)
    }
  }
}
//-----------------------------------------------------------------
function sendConfigInstr() {
  const start = '0xa9 0xe1 '
  const end = ' 0x00 0x0d 0x0a'
  const str = paramRD[4].dig
  const id =
    ' 0x' +
    str[0] +
    str[1] +
    ' 0x' +
    str[2] +
    str[3] +
    ' 0x' +
    str[4] +
    str[5] +
    ' 0x' +
    str[6] +
    str[7]
  const body =
    '0x' +
    paramRD[0].dig +
    ' 0x' +
    paramRD[1].dig +
    ' 0x' +
    paramRD[2].dig +
    ' 0x' +
    paramRD[3].dig +
    id +
    ' 0x' +
    paramRD[5].dig
  const packet = start + body + end
  //console.log('packet:', packet)
  sendTimerHexInstr(packet)
}
//-----------------------------------------------------------------
function sendIdDevInstr() {
  const start = '0xf1 0xae '
  const end = ' 0x0d 0x0a'
  const str = paramRD[6].dig
  const body =
    '0x' +
    str[0] +
    str[1] +
    ' 0x' +
    str[2] +
    str[3] +
    ' 0x' +
    str[4] +
    str[5] +
    ' 0x' +
    str[6] +
    str[7]
  const packet = start + body + end
  console.log('packet:', packet)
  sendTimerHexInstr(packet)
}
//-----------------------------------------------------------------
function sendTimerHexInstr(packet) {
  if (flagConnect && flagComConn) {
    comPort.set({ dtr: true, rts: false })
    typeLabelInfo11('SET = 0', '#00e000')
    setTimeout(() => {
      flagInstrJDY41 = 6
      respAT = ''
      outHex = []
      sendStringHex(packet)
    }, 100)
    timeOutSendConfig = setTimeout(() => {
      comPort.set({ dtr: false, rts: false })
      typeLabelInfo11('SET = 1', '#e00000')
    }, 3000)
  }
}
//==========================================================================
