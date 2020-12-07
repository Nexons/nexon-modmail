const Discord = require('discord.js')
const client = new Discord.Client()
const config = require("./config.json")
const Sequelize = require('sequelize');
const { INTEGER, STRING, where } = require('sequelize');
const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});
const userMail = sequelize.define('userMail', {
    serverid: {
        type: STRING,
    },
    userid: {
        type: INTEGER,
        unique: true
    },
    blacklisted: {
        type: STRING,
        default: 'no'
    },
    warnings: {
        type: INTEGER,
        default: 0
    }
}, {
    timestamps: false,
})
const modmail = sequelize.define('modmail', {
    serverid: {
        type: STRING,
    },
    modmailCategory: {
        type: STRING,
    }
})
client.on('ready', async () => {
    console.log(`${client.user.username} is online`)
    modmail.sync()
    userMail.sync()
    client.user.setStatus('online')
    client.user.setActivity('DM me for help!')
})

client.on('message', async msg => {
    const modmailServer = client.guilds.cache.get('746956636807102525')
    const modmailCategory = client.channels.cache.get('785465099522801694')
    if(msg.author.bot) return
    if(msg.channel.type == 'dm') {
        //incoming DM
        try {
            // equivalent to: INSERT INTO tags (name, (commands), username) values (string(id), bool);
            let user = await userMail.create({
                serverid: modmailServer.id,
                userid: msg.author.id,
                blacklisted: false,
                warnings: 0
            })
            console.log(`${user.userid} was added`)
        }
        catch (e) {
            if (e.name === 'SequelizeUniqueConstraintError') {        }
            else console.log(`Something went wrong with adding a user id , the user id is ${msg.author.id} please add it to the DATABASE.`);
        }
        const userSettings = await userMail.findOne({ where: { userid: msg.author.id, serverid: modmailServer.id} });
        if(userSettings.get('blacklisted') == 1) return
        if(!userSettings) msg.author.send('Something went wrong!, Sorry.')
        let match
        modmailServer.channels.cache.forEach(channel => {
            const uid = channel.name.replace(/-/g,' ').split(' ')
            if((uid[0]) === msg.author.id) {
                //channel already exists
                match = channel
            }
        })
        if(!match) {
            //channel doesn't exist
            const name = `${msg.author.id} ${msg.author.tag}`
            match = await modmailServer.channels.create(name, { parent: modmailCategory })
            const matchEmbed = new Discord.MessageEmbed()
            .setAuthor(msg.author.tag, msg.author.displayAvatarURL({dynamic: true}))
            .setDescription(msg.content)
            .setFooter(`${msg.author.username} is on x warnings | m.close | m.warn | m.blacklist`)
            match.send(matchEmbed)
            msg.author.send('Hey! Thanks for contacting our support team, Please wait patiently for one of our staff to answer you!')
        }
        return match.send(`${msg.author.tag}: ${msg.content}`)
    }
    if(msg.channel.parentID === '785465099522801694') {
        console.log('adsdas')
        const userID = msg.channel.name.replace(/-/g,' ').split(' ')
        const toSend = client.users.cache.get(userID[0])
        if(!toSend) msg.channel.send('The user has left the server, Closing ticket').then(message => {
            setTimeout(function a() {
                message.delete()
            }, 25000)
        }) 
        const message = new Discord.MessageEmbed()
        .setAuthor(msg.member.user.tag, msg.member.user.displayAvatarURL({dynamic: true}))
        .setDescription(msg.content)
        toSend.send(message)
    }
    const args = msg.content.split(' ')
    let command = args[0].slice(config.prefix.length).split(' ')
    command = command[0]
    if(command === 'blacklist') {
        args.shift()
        const reason = args.join(' ') || 'unspecified'
        if(msg.channel.parentID != '785465099522801694') return
        const userID = msg.channel.name.replace(/-/g,' ').split(' ')
        const toSend = client.users.cache.get(userID[0])
        const userSettings = await userMail.findOne({ where: { userid: userID[0], serverid: modmailServer.id} });
        if(!userSettings) return msg.channel.send('Something went wrong, sorry!')
        if(userSettings.get('blacklisted') == 1) return msg.channel.send('User is already blacklisted!')
        var affectedRow = await userMail.update({ blacklisted: 1 }, { where: { userid: userID[0] } });
        if (affectedRow > 0) {
            msg.channel.send('Blacklisted user, Closing ticket...')
            setTimeout(function close(){
                msg.channel.delete()
            }, 10000)
       } try{
           toSend.send(`You have been blacklisted from using our ticket system for: ${reason}`)
       }catch(err){
           console.log(e.name)
       }
        //blacklists user
    }
    if(command === 'unblacklist') {
        console.log('unblacklist')
        const staffRole = msg.guild.roles.cache.get('747251006160502794')
        console.log(staffRole)
        if (!msg.member.roles.cache.some((role) => role.id === staffRole.id)) return msg.channel.send('You need staff role to use this command!')
        const mention = msg.mentions.members.first()
        const user = client.users.cache.get(args[1]) || mention
        if(!user) return msg.channel.send('You must mention someone to unblacklist!')
        const userID = user.id
        args.shift()
        args.shift()
        if(!userID) return msg.channel.send('Invalid User')
        const reason = args.join(' ') || 'unspecified'
        const toSend = user
        console.log('passed')
        const userSettings = await userMail.findOne({ where: { userid: userID, serverid: modmailServer.id} });
        if(!userSettings) return msg.channel.send('Something went wrong, sorry! (User not in DB)')
        if(userSettings.get('blacklisted') == 0) return msg.channel.send('User is not blacklisted.')
        var affectedRow = await userMail.update({ blacklisted: 0 }, { where: { userid: userID } });
        if (affectedRow > 0) {
            msg.channel.send('Successfully unblacklisted user!')
       } try{
           toSend.send(`You have been un-blacklisted from using our ticket system for: ${reason}`)
       }catch(err){
           console.log(e.name)
       }
        //unblacklists user
    }
    if(command === 'warn') {
        if(msg.channel.parentID != '785465099522801694') return
        const userID = msg.channel.name.replace(/-/g,' ').split(' ')
        const toSend = client.users.cache.get(userID[0])
        //warns user
    } if(command === 'close') {
        if(msg.channel.parentID != '785465099522801694') return
        const userID = msg.channel.name.replace(/-/g,' ').split(' ')
        const toSend = client.users.cache.get(userID[0])
        if(!toSend) msg.channel.send('The user has left the server, Closing ticket').then(message => {
            setTimeout(function a() {
                message.delete()
            }, 25000)
        }) 
        const message = new Discord.MessageEmbed()
        .setAuthor(client.user.username, client.user.displayAvatarURL({dynamic: true}))
        .setDescription(`This ticket has now been closed by the staff member\nThanks for contacting our support team!`)
        toSend.send(message)
        msg.channel.delete()
    }
})
client.login('Nzg1NDY3MDk1MzI4MzU4NDEw.X84RPA.hK9hqsRFvHIMA9VnfvzLDt_Lzo0')
