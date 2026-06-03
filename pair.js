module.exports = async (sock, m, command, args, from, isOwner) => {
    if (command !== 'pair') return
    if (!isOwner) return sock.sendMessage(from, { text: '❌ Owner only' }, { quoted: m })
    
    let number = args[0]
    if (!number) return sock.sendMessage(from, { text: 'Usage: .pair 2547xxxxxxx' }, { quoted: m })
    
    try {
        let code = await sock.requestPairingCode(number.replace(/[^0-9]/g, ''))
        await sock.sendMessage(from, { text: `🔗 Pairing Code for ${number}:\n\n${code}\n\nGo to WhatsApp > Linked Devices > Link with phone number` }, { quoted: m })
    } catch (e) {
        await sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }, { quoted: m })
    }
}