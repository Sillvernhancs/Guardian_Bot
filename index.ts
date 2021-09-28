import { IntegrationExpireBehavior } from 'discord-api-types';
import DiscordJS, { Intents } from 'discord.js'
import dotenv from 'dotenv'
const translate = require('@iamtraction/google-translate');
const { Client, Message } = require('discord.js');

dotenv.config()

const fs = require('fs');
const readline = require('readline');
var price_pool = new Map();
let OP = ["IamSilver"];

const client = new DiscordJS.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})
//------------------------------------------------------------------------------------------
// translate function
// Turn bot off (destroy), then turn it back on
function resetBot(channel : any) {
    // send channel a message that you're resetting bot [optional]
    channel.send('Brb, don\'t you dare say something before I\'m back')
    .then((msg : any)=> client.destroy())
    .then(() => client.login(process.env.TOKEN));
}
//------------------------------------------------------------------------------------------
// translate function
function toEng(s : any, message : any) {
    return new Promise(resolve => {
        translate(s, { to: 'en' }).then((trasnlated_ : any) => {
            // if able to translate to english pass it to toFine function.
            toFine(trasnlated_.text, message);
          }).catch((err : any) => {
            // if unable to translate to english, pass the original message to toFine function.
            toFine(s, message);
        });
    })
}
//------------------------------------------------------------------------------------------
// "fine function"
function toFine(s : any, message : any) {
    // regex made it slow but it's shorter and easier to read so...
    const regex_mom = /muu*m|moo*m|maa*mm*a*|maa*dd*aa*|m00*m|moo*ther|muu*ther|m00*ther/s;
    const regex_your = /yoo*uu*r|uu*r|yee*3*r|y00*uu*r|thyy*|thoo*uu*|yuu*h/s;
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
        // save to the file pool.txt
        var line = "";
        for (var entry of price_pool.entries()) {
            line += entry[0] + " " + entry[1] + " \n";
        }
        // console.log(line);
        fs.writeFile('pool.txt', line, (err : any) => {
            if (err) {
                console.error(err)
                return
        }})
    }
}
//------------------------------------------------------------------------------------------
// boot up sequence
client.on("ready", () => {
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
    });

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
        var line = "";
        for (var entry of price_pool.entries()) {
            line += entry[0] + "\t: $" + entry[1] + "\n";
        }
        message.reply({
            content: line
        })
    }
    //----------------------------------// restart the bot with new code.
    if(message.content === "!reset") {
        process.exit(0);
    }

    //----------------------------------// dev mode increase debt
    if((message.content.includes("$1 to") || message.content.includes("1$ to")) && message.author.username != "The guardian") {
        //---> if an OP let them, if not be sassy.
        if(OP.includes(message.author.username)) {
            var user_ = message.content.substr(5);
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
        } else {
            message.reply({
                content: "you can't tell me what to do"
            })
        }
    }
})

client.login(process.env.TOKEN)