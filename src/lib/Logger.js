import browser from '../lib/browser-api'
import AccountStorage from './AccountStorage'
import util from 'util'

export default class Logger {
  static log() {
    const logMsg = arguments

    // log to console
    console.log.apply(console, logMsg)
    this.messages.push(util.format.apply(util, logMsg))
  }

  static async persist() {
    await AccountStorage.changeEntry(
      'log',
      log => {
        return log.concat(this.messages).slice(-5000) // rotate log to max of 5000 entries
      },
      []
    )
  }

  static async getLogs() {
    return AccountStorage.getEntry('log')
  }

  static async downloadLogs() {
    const logs = await this.getLogs()
    console.log(logs)
    let blob = new Blob([logs.join('\n')], {
      type: 'text/plain',
      endings: 'native'
    })
    this.download('floccus.log', blob)
  }

  static download(filename, blob) {
    var element = document.createElement('a')

    let objectUrl = URL.createObjectURL(blob)
    element.setAttribute('href', objectUrl)
    element.setAttribute('download', filename)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    URL.revokeObjectURL(objectUrl)
    document.body.removeChild(element)
  }
}

Logger.messages = []
