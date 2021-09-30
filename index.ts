import { IntegrationExpireBehavior } from 'discord-api-types';
import DiscordJS, { Channel, Emoji, Intents, MessageEmbed } from 'discord.js'
import dotenv from 'dotenv'
const translate = require('@iamtraction/google-translate');
const { Client, Message } = require('discord.js');

dotenv.config()

const fs = require('fs');
const readline = require('readline');
var price_pool = new Map();
var pardonCount = new Map();
let OP = ["IamSilver"];

const client = new DiscordJS.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})
//------------------------------------------------------------------------------------------
// return a string of user names/debt/pardons
function listUsers() {
    var line = "";
    for (var entry of price_pool.entries()) {
        line += entry[0] + "\n";
    }
    return line;
}
function listDebts() {
    var line = "";
    for (var entry of price_pool.entries()) {
        line += entry[1] + "\n";
    }
    return line;
}
function listPardons() {
    var line = "";
    for (var entry of pardonCount.entries()) {
        line += entry[1] + "\n";
    }
    return line;
}
//------------------------------------------------------------------------------------------
// translate function
function toEng(s : any, message : any) {
    return new Promise(resolve => {
        translate(s, { to: 'en' }).then((trasnlated_ : any) => {
            // if able to translate to english pass it to DETECT function.
            DETECT(trasnlated_.text, message);
          }).catch((err : any) => {
            // if unable to translate to english, pass the original message to DETECT function.
            DETECT(s, message);
        });
    })
}
//------------------------------------------------------------------------------------------
// save Map to Pool.txt
function save() {
    // save to the file pool.txt
    var line = "";
    // sort the price pool and save it to the file.
    price_pool = new Map([...price_pool.entries()].sort((b, a) => b[1] - a[1]));
    for (var entry of price_pool.entries()) {
        line += entry[0] + " " + entry[1] + " " + pardonCount.get(entry[0]) + " \n";
    }
    // console.log(line);
    fs.writeFile('pool.txt', line, (err : any) => {
        if (err) {
            console.error(err)
            return
    }})

    // console.log(price_pool)
    // console.log(pardonCount)
}
//------------------------------------------------------------------------------------------
// "fine function"
function DETECT(s : any, message : any) {
    // regex made it slow but it's shorter and easier to read so...
    const regex_mom = /muu*m|moo*m|maa*mm*a*|maa*dd*aa*|m00*m|moo*ther|muu*ther|m00*ther/s;
    const regex_your = /yoo*uu*r|uu*r|yee*3*r|y00*uu*r|thyy*|thoo*uu*|yuu*h|y33*r/s;
    if(regex_mom.test(s) && regex_your.test(s)) {
        message.reply({
            content: "$1"
        })
        // get rid of space in user names.
        var nameNoSpace = message.author.username.replace(/ /g,"_");
        // if the name already exist
        if(price_pool.has(nameNoSpace)) {
            price_pool.set(nameNoSpace, price_pool.get(nameNoSpace) + 1);
        } else {
            // create new user in the pool
            price_pool.set(nameNoSpace, 1);
        }
    }
    //-----------------------------------------------------////
    // my mom joke
    else if (regex_mom.test(s) && s.includes("my")) {
        // get rid of space in user names.
        var nameNoSpace = message.author.username.replace(/ /g,"_");
        // if the name already exist
        if(price_pool.has(nameNoSpace)) {
            if(price_pool.get(nameNoSpace) > 0 && pardonCount.get(nameNoSpace) > 0) {
                message.reply({
                    content: "1$ less to you"
                })
                price_pool.set(nameNoSpace, price_pool.get(nameNoSpace) - 1);
                pardonCount.set(nameNoSpace, pardonCount.get(nameNoSpace) - 1);
            } else {
                message.reply({
                    content: "nice"
                })
            }
        } else {
            message.reply({
                content: "nice"
            })
        }
    }
    // save it to the pool.txt
    save();
}
//------------------------------------------------------------------------------------------
// boot up sequence
client.on("ready", () => {
    console.log("\\------------------------------------------")
    console.log("reading save files...")
    //-----------------------// read file
    const data = fs.readFileSync('pool.txt', 'UTF-8');
    // split the contents by new line
    var lines = data.split(" \n");
    lines.pop();
    // put in all the data
    lines.forEach((line : any) => {
        console.log(line)
        var data = line.split(" ");
        price_pool.set(data[0], parseInt(data[1], 10));
        pardonCount.set(data[0], parseInt(data[2], 10));
    });
    console.log(price_pool)
    // console.log(pardonCount)
    console.log("\\------------------------------------------")
    console.log("syncing OP list...")
    //-----------------------// read file for DEV LIST
    const data_2 = fs.readFileSync('OP_list.txt', 'UTF-8');
    // split the contents by new line
    var lines = data_2.split("\n");
    // put in all the data
    console.log("OP LIST:")
    lines.forEach((line : any) => {
        OP.push(line.replace("\r",''));
    });
    console.log(OP)
    //------------------------// set the bot's status
    client.user?.setActivity('You', { type: 'WATCHING' });
    console.log("the bot is ready!")
})
//------------------------------------------------------------------------------------------
// every time a bot see a message
client.on("messageCreate", async (message) => {
    const s = message.content.toLocaleLowerCase();

    // catch all the cheekys foriegn your moms
    toEng(s, message);
    //----------------------------------// check your own debt
    if(message.content === "!check") {
        if(price_pool.has(message.author.username)) {
            message.reply({
                content: "You owe the server: $" + price_pool.get(message.author.username) 
                        + "\nYour pardons: "+ pardonCount.get(message.author.username)
            })
        } else {
            message.reply({
                content: "you owe us nothing, move along"
            })
        }
        console.log(price_pool.get(message.author.username))
        console.log(message.author.username + " requested check")
    }
    //----------------------------------// check everyone's debt
    if(message.content === "!checkAll") {
        var embed_ = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('---The Yer Mum Mux pool---')
        .addFields(
            { name: 'Muxies', value: listUsers(), inline: true  },
            { name: 'Yer Mum Jokes Made', value: listDebts(), inline: true },
            { name: 'Pardons', value: listPardons(), inline: true },
        ).setFooter("\u3000".repeat(10/*any big number works too*/)+"|");
        message.channel.send({embeds:[embed_]});
    }
    //----------------------------------// dev mode increase debt
    
    if((message.content.startsWith("$1 to") || message.content.startsWith("1$ to")) && message.author.username != "The guardian") {
        //---> if an OP let them, if not be sassy.
        if(OP.includes(message.author.username)) {
            var user_ = message.content.substr(6);
            console.log(user_ + " was given $1")
            if(price_pool.has(user_)) {
                price_pool.set(user_, price_pool.get(user_) + 1);
                message.reply({
                    content: "$1 to " + user_
                })
            } else {
                message.reply({
                    content: "I don't know this person yet, I'll let that pass this time"
                })
                // let them go on the first yer mum joke, if they didn't make one themself already.
                price_pool.set(user_, 0);
            }
            save()
        } else {
            message.reply({
                content: "you can't tell me what to do"
            })
        }
    }

    //----------------------------------// restart the bot with new code.
    if(message.content === "!exit") {
        process.exit(0);
    }
})

client.login(process.env.TOKEN)