const Discord = require("discord.js");
const client = new Discord.Client();
const ayarlar = require("./ayarlar.json");
const chalk = require("chalk");
const moment = require("moment");
var Jimp = require("jimp");
const { Client, Util } = require("discord.js");
const fs = require("fs");
const db = require("croxydb");
const http = require("http");
const express = require("express");
require("./util/eventLoader.js")(client);
const path = require("path");
const snekfetch = require("snekfetch");
const app = express();

app.get("/", (request, response) => {
  response.sendStatus(200);
});

app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

var prefix = ayarlar.prefix;

const log = message => {
  console.log(`Lrows V12 Guard Aktif`);
};

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir("./komutlar/", (err, files) => {
  if (err) console.error(err);
  log(`${files.length} komut yüklenecek.`);
  files.forEach(f => {
    let props = require(`./komutlar/${f}`);
    log(`Yüklenen komut: ${props.help.name}.`);
    client.commands.set(props.help.name, props);
    props.conf.aliases.forEach(alias => {
      client.aliases.set(alias, props.help.name);
    });
  });
});

client.reload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.load = command => {
  return new Promise((resolve, reject) => {
    try {
      let cmd = require(`./komutlar/${command}`);
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.unload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.elevation = message => {
  if (!message.guild) {
    return;
  }
  let permlvl = 0;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
  if (message.author.id === ayarlar.sahip) permlvl = 4;
  return permlvl;
};

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
// client.on('debug', e => {
//   lrowsconsole.log(chalk.bgBlue.green(e.replace(regToken, 'that was redacted')));
// });lrows

client.on("warn", e => {
  console.log(chalk.bgYellow(e.replace(regToken, "that was redacted")));
});

client.on("error", e => {
  console.log(chalk.bgRed(e.replace(regToken, "that was redacted")));
});

client.login(ayarlar.token);

//------------------------KANAL KORUMA-----------------------------\\

client.on("channelDelete", async channel => {
  const entry = await channel.guild
    .fetchAuditLogs({ type: "CHANNEL_DELETE" })
    .then(audit => audit.entries.first());
  if (entry.executor.id === client.user.id) return;
//  if (entry.executor.id === channel.guild.owner.id) return
  if(ayarlar.korumakanal) {
    const embed = new Discord.MessageEmbed();
    embed.setTitle("Bir Kanal Silindi!");
    embed.addField("Kanalı Silen", "> `" + entry.executor.tag + "`");
    embed.addField("Kanalı Silen İD", "> `" + entry.executor.id + "`");
    embed.addField("Silinen Kanal", "> `" + channel.name + "`");
    embed.addField("Sonuç;", "Kanal Tekrar Açıldı");
    embed.setThumbnail(entry.executor.avatarURL());
    embed.setFooter(channel.guild.name, channel.guild.iconURL());
    embed.setColor("RED");
    embed.setTimestamp();
    client.channels.cache
      .get(ayarlar.korumakanal)
      .send(embed)
      .then(channel.clone().then(x => x.setPosition(channel.position)));
  }
});

//---------------------------ROL KORUMA------------------------------\\

client.on("roleDelete", async role => {
  const entry = await role.guild
    .fetchAuditLogs({ type: "ROLE_DELETE" })
    .then(audit => audit.entries.first());
  if (entry.executor.id === client.user.id) return;
 // if (entry.executor.id === role.guild.owner.id) return
  if (ayarlar.korumakanal) {
    const embed = new Discord.MessageEmbed();
    embed.setTitle("Bir Rol Silindi!");
    embed.addField("Rolü Silen", "> `" + entry.executor.tag + "`");
    embed.addField("Rolü Silen İD", "> `" + entry.executor.id + "`");
    embed.addField("Silinen Rol", "> `" + role.name + "`");
    embed.addField("Sonuç;", "Rol Tekrar Açıldı");
    embed.setThumbnail(entry.executor.avatarURL());
    embed.setFooter(role.guild.name, role.guild.iconURL());
    embed.setColor("RED");
    embed.setTimestamp();
    client.channels.cache
      .get(ayarlar.korumakanal)
      .send(embed)
      .then(
        role.guild.roles.create({
          data: {
            name: role.name,
            color: role.color,
            hoist: role.hoist,
            permissions: role.permissions,
            mentionable: role.mentionable,
            position: role.position
          },
          reason: "Silinen Rol Açıldı."
        })
      );
  }
});

//-----------------------LOG------------------------\\

client.on("messageDelete", function(msg) {
  let Embed = new Discord.MessageEmbed()
    .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ dynamic: true }))
    .setDescription(`
    Mesaj Sahibi:
    > <@${msg.author.id}>
    Mesaj İçeriği:
    > ${msg.content}
    `)
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter("User: " + msg.author.id + " | Guild: " + msg.guild.id);
  client.channels.cache.get(ayarlar.kanal).send(Embed);
});
client.on("messageUpdate", function(oldMsg, newMsg) {
  if(newMsg.author.bot) return
  let Embed = new Discord.MessageEmbed()
    .setAuthor(newMsg.author.tag, newMsg.author.displayAvatarURL({ dynamic: true }))
    .setDescription(`
    Mesaj Sahibi:
    > <@${newMsg.author.id}>
    Mesaj Linki:
    > [Tıkla](${newMsg.url})
    Eski Mesaj: 
    > ${oldMsg.content}
    Yeni Mesaj: 
    > ${newMsg.content}
    `)
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter("User: " + newMsg.author.id + " | Guild: " + newMsg.guild.id);
  client.channels.cache.get(ayarlar.kanal).send(Embed);
});
client.on("channelCreate", function(channel) {
  let Embed = new Discord.MessageEmbed()
    .setAuthor(channel.guild.name, "https://cdn.discordapp.com/avatars/" +channel.guild.id +"/" + channel.guild.icon)
    .setDescription(`
   **Bir Kanal Oluşturuldu**
   
   > Adı: \`${channel.name}\`
   > IDsi: \`${channel.id}\`
   > Pozisyonu: \`${channel.position}\`
    `)
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter("Guild: " + channel.guild.name);
  client.channels.cache.get(ayarlar.kanal).send(Embed);
});

client.on("guildBanAdd", function(guild, member) {
  let Embed = new Discord.MessageEmbed()
    .setAuthor(guild.name, guild.iconURL({ dynamic: true }))
    .setDescription("**Kişi Banlandı:**:\n" + member.tag)
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter("User: " + member.id + " | Guild: " + guild.id);
  client.channels.cache.get(ayarlar.kanal).send(Embed);
});
client.on("guildBanRemove", function(guild, member) {
  let Embed = new Discord.MessageEmbed()
    .setAuthor(guild.name, guild.iconURL({ dynamic: true }))
    .setDescription("**Kişinin Banı Açıldı:**:\n" + member.tag)
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter("User: " + member.id + " | Guild: " + guild.id);
  client.channels.cache.get(ayarlar.kanal).send(Embed);
});
client.on("inviteCreate", function(invite) {
  let sınır = invite.temporary
  if(sınır === false) {
  sınır = "Hayır"
    } else if(sınır === true) {
  sınır = "Evet"
      }
  let Embed = new Discord.MessageEmbed()
    .setAuthor(invite.guild.name, invite.guild.iconURL({ dynamic: true }))
    .setDescription("**Oluşturulan Davet:** " + invite.url)
    .addField("Açan:", "```" + invite.inviter.tag + "```", true)
    .addField("Kanal:", "```" + invite.channel.name + "```", true)
   // .addField(":", "```" + invite.memberCount + "```", true)
    .addField("Kullanım Sayısı:", "```" + invite.uses + "```", true)
    .addField("Max Age:", "```" + invite.maxAge + "```", true)
    .addField("Sınırsız mı", "```" + sınır + "```", true)
    .addField("Bitiş Tarihi:", "```" + invite.expiresAt + "```")
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter(
      "Oluşturan: " + invite.inviter.tag + " | Guild: " + invite.guild.id,
      invite.inviter.displayAvatarURL({ dynamic: true })
    );
  client.channels.cache.get(ayarlar.kanal).send(Embed);
});

client.on("roleUpdate", function(oldRole, newRole) {
  console.log(oldRole.permissions)
  let Embed = new Discord.MessageEmbed()
    .setAuthor(newRole.guild.name, newRole.guild.iconURL({ dynamic: true }))
    .setDescription(`
    **Bir Rol Güncellendi**
    
    > **Eski Hali**
    Adı: \`${oldRole.name}\`
    Rengi: \`${oldRole.color}\`
    Yetkileri: \`${oldRole.permissions.bitfield}\`
    
    > **Yeni Hali**
    Adı: \`${newRole.name}\`
    Rengi: \`${newRole.color}\`
    Yetkileri: \`${newRole.permissions.bitfield}\`
    `)
    //.addField("Changes:", "Will be done soon")
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter("Guild: " + newRole.guild.id);
  client.channels.cache.get(ayarlar.kanal).send(Embed);
});

client.on("roleCreate", function(role) {
  let Embed = new Discord.MessageEmbed()
    .setAuthor(role.guild.name, role.guild.iconURL({ dynamic: true }))
    .setDescription(`
    **Bir Rol Oluşturuldu**
    Adı: \`${role.name}\`
    Rengi: \`${role.color}\`
    Yetkileri: \`${role.permissions.bitfield}\`
    `)
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter("Guild: " + role.guild.id);
  client.channels.cache.get(ayarlar.kanal).send(Embed);
});

client.on("emojiDelete", async emoji => {
  const embed = new Discord.MessageEmbed()
  .setDescription(`
  **Bir Emoji Silindi**
  
  Emoji Adı:
  > ${emoji.name}
  Emoji:
  > ${emoji}
  Emoji Linki:
  > [Tıkla](${emoji.url})
  Emoji ID:
  > ${emoji.id}
  `)
  .setThumbnail(emoji.url)
  .setColor(ayarlar.embed_color)
  client.channels.cache.get(ayarlar.kanal).send(embed)
  })

client.on("emojiCreate", async emoji => {
  const embed = new Discord.MessageEmbed()
  .setDescription(`
  **Bir Emoji Oluşturuldı**
  
  Emoji Adı:
  > ${emoji.name}
  Emoji:
  > ${emoji}
  Emoji Linki:
  > [Tıkla](${emoji.url})
  Emoji ID:
  > ${emoji.id}
  `)
  .setThumbnail(emoji.url)
  .setColor(ayarlar.embed_color)
  client.channels.cache.get(ayarlar.kanal).send(embed)
  })
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          