const {ipcMain} = require('electron')
const { SerialPort } = require('serialport')

async function listPorts() {
  const ports = await SerialPort.list()
  return ports
}

ipcMain.handle('gps:serial', async (event, args) => {
    console.log('[check-serial-gps] called ')
    const result = await listPorts()
    if (result instanceof Array) { 
        console.log('[check-serial-gps] found ports: ', result);
        return { success: true, portsarray: result };
    } else {
        console.error('[check-serial-gps] error: ', result);
        return { success: false, message : 'Failed to retrieve serial ports' };
    }
  return result
})