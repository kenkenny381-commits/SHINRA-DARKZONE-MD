const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const path = require('path')
const pino = require('pino')
const { logger } = require('./logger')

require('dotenv').config()

global.db = global.db || {}
global.db.anti = global.db.anti || {}

const startSock = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: logger,
        printQRInTerminal:!process.env.SESSION_ID,
        auth: state,
        browser: ['Ultraviolet-MD', 'Chrome', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode
            if (reason === DisconnectReason.loggedOut) {
                console.log('Logged out, delete session and scan again')
                process.exit(0)
            } else {
                startSock()
            }
        } else if (connection === 'open') {
            console.log('✅ Connected to WhatsApp')
        }
    })

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return

        const from = msg.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
        const prefix = process.env.PREFIX || '.'
        const command = body.startsWith(prefix)? body.slice(prefix.length).split(' ')[0].toLowerCase() : ''
        const args = body.trim().split(/ +/).slice(1)

        // Load plugins
        const pluginsPath = path.join(__dirname, 'plugins')
        if (fs.existsSync(pluginsPath)) {
            fs.readdirSync(pluginsPath).forEach(file => {
                if (file.endsWith('.js')) {
                    require(path.join(pluginsPath, file))(sock, msg, command, args, from, isGroup)
                }
            })
        }
    })
}

startSock()