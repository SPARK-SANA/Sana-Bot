/* Copyright (C) 2020 Yusuf Usta.

Licensed under the  GPL-3.0 License;
you may not use this file except in compliance with the License.

WhatsAsena - Yusuf Usta
*/

const simpleGit = require('simple-git');
const git = simpleGit();
const MyPnky = require('../events');
const {MessageType} = require('@adiwajshing/baileys');
const Config = require('../config');
const exec = require('child_process').exec;
const Heroku = require('heroku-client');
const { PassThrough } = require('stream');
const heroku = new Heroku({ token: Config.HEROKU.API_KEY })

const Language = require('../language');
const Lang = Language.getString('updater');


MyPnky.addCommand({pattern: 'update$', fromMe: true, dontAddCommandList: true, desc: Lang.UPDATER_DESC}, (async (message, match) => {
    await git.fetch();
    var commits = await git.log([Config.BRANCH + '..origin/' + Config.BRANCH]);
    if (commits.total === 0) {
        await message.client.sendMessage(
            message.jid,
            Lang.UPDATE, MessageType.text
        );    
    } else {
        var shadowupdate = Lang.NEW_UPDATE;
                commits['all'].map(
                    (commit) => {
                        shadowupdate += '│➩ [' + commit.date.substring(0, 10) + '] ➠  *' + commit.message + '*   ↱ ' + commit.author_name + ' ↲\n';
                    }
                );
        
        await message.client.sendMessage(
            message.jid,
            '╭──────────────────────────╮\n│➣ 𝐁𝐨𝐭 𝐔𝐩𝐝𝐚𝐭𝐞  \n│\n```│' + sanaupdate + '│\n│ ☞ 𝚃𝚢𝚙𝚎 .𝐮𝐩𝐝𝐚𝐭𝐞 𝐧𝐨𝐰 𝚝𝚘 𝚄𝚙𝚍𝚊𝚝𝚎 𝚈𝚘𝚞𝚛 𝙱𝚘𝚝\n╰──────────────────────────╯\n◩ 𝐂𝐨𝐝𝐞𝐝 𝐁𝐲 𝐒𝐚𝐧𝐚\n╭──────────────────────────╮\n➣ 𝐂𝐨𝐧𝐭𝐚𝐜𝐭 𝐎𝐰𝐧𝐞𝐫...\n✆ wa.me/917025994178?text=Hi\n╰──────────────────────────╯', MessageType.text
        ); 
    }
}));

MyPnky.addCommand({pattern: 'update now$', fromMe: true,dontAddCommandList: true, desc: Lang.UPDATE_NOW_DESC}, (async (message, match) => {
    await git.fetch();
    var commits = await git.log([Config.BRANCH + '..origin/' + Config.BRANCH]);
    if (commits.total === 0) {
        return await message.client.sendMessage(
            message.jid,
            Lang.UPDATE, MessageType.text
        );    
    } else {
        var guncelleme = await message.reply(Lang.UPDATING);
        if (Config.HEROKU.HEROKU) {
            try {
                var app = await heroku.get('/apps/' + Config.HEROKU.APP_NAME)
            } catch {
                await message.client.sendMessage(
                    message.jid,Lang.INVALID_HEROKU, MessageType.text);
                await new Promise(r => setTimeout(r, 1000));
                return await message.client.sendMessage(
                    message.jid,Lang.IN_AF, MessageType.text);
            }

            git.fetch('upstream', Config.BRANCH);
            git.reset('hard', ['FETCH_HEAD']);

            var git_url = app.git_url.replace(
                "https://", "https://api:" + Config.HEROKU.API_KEY + "@"
            )
            
            try {
                await git.addRemote('heroku', git_url);
            } catch { console.log('heroku remote ekli'); }
            await git.push('heroku', Config.BRANCH);

            await message.client.sendMessage(
                message.jid,Lang.UPDATED, MessageType.text);

            await message.sendMessage(Lang.AFTER_UPDATE);
            
        } else {
            git.pull((async (err, update) => {
                if(update && update.summary.changes) {
                    await message.client.sendMessage(
                        message.jid,Lang.UPDATED_LOCAL, MessageType.text);
                    exec('npm install').stderr.pipe(process.stderr);
                } else if (err) {
                    await message.client.sendMessage(
                        message.jid,'*❌ Güncelleme başarısız oldu!*\n*Hata:* ```' + err + '```', MessageType.text);
                }
            }));
            await guncelleme.delete();
        }
    }
}));
