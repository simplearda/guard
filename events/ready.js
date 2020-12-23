const chalk = require('chalk'); 
const moment = require('moment');
const Discord = require('discord.js');
const ayarlar = require('../ayarlar.json');
var prefix = ayarlar.prefix;

module.exports = client => {
  console.log(`[${client.user.username}] İle Giriş Yapıldı`)
 setInterval(function() {
}, 8000);
client.user.setPresence({
        game: {
            name: `Lrows V12 Guard`,
            type: 'WATCHING'  
        },
        status: 'online'
    })
    console.log(`Bot başarıyla aktif edildi.`);
}
