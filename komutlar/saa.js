const { MessageEmbed } = require("discord.js");

exports.run = async (client, message, args) => {
  let avatar = `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png?size=2048`; //avatar komutu nasıl bulamadım bende böyle bişey yaptım v12 için yanlız bu :d
  let Embed = new MessageEmbed();

  Embed.setTitle(`Senin avatarın!`);
  Embed.setThumbnail(avatar);
  Embed.setColor(`RANDOM`);
  Embed.setDescription(`Lrows Bot`);
  return message.channel.send(Embed);
};

exports.conf = {
  enabled: false,
  guildOnly: false,
  aliases: [],
  permLevel: 0
};

exports.help = {
  name: "avatar",
  description: "",
  usage: ""
};