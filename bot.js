const Discord = require('discord.js');
const Shuffle = require('knuth-shuffle');
const bot = new Discord.Client();

bot.on('ready', () => {
    console.log('Connected');
});

//Two digit numbers represent 2 fail cards needed
var missions = [
    [2, 3, 2, 3, 3],
    [2, 3, 4, 3, 4],
    [2, 3, 3, 40, 4],
    [3, 4, 4, 50, 5]
];
var players = new Array();
var spies = new Array();
var ids = new Array();
var status = "waiting";
var leader;

bot.on('message', message => {
    if(message.author.id != '587771244485672970' && message.content.substring(0,1) == '!') {
        var arg = message.content.substring(1).trim();

        switch(arg) {
            case 'join':
                if(!ids.includes(message.author) && status == "waiting") {
                    ids.push(message.author.id);
                    players.push(message.author);
                    message.reply(" has join the game.");
                    console.log(players);
                }
                else {
                    message.reply(" you have already joined.");
                }
            break;

            case 'start':
                if((players.length <= 4 || players.length >= 11) && status != "waiting") {
                    message.channel.send("There are not enough players or the game has started. 5 players are needed to start.");
                }
                //starting game
                else {
                    message.channel.send("Starting game...");
                    players = shuffle(players);
                    leader = players[Math.floor(Math.random() * (players.length+1))];
                    status = "picking";

                    //sending players their role
                    spies = players.splice(0, Math.ceil(players.length/3));

                    spies.forEach(user => {
                        user.send("You are the **SPY**. The spies are:");

                        var spySend = spies.map(x => " " + x.tag );

                        user.send("The fellow spies are: " + spySend.toString());
                    });

                    players.forEach(user => {
                        user.send("You are the **RESISTANCE**.");
                    });

                    message.channel.send("<@" + leader.id + "> is the leader. Use !pick @user to pick your team.");
                }
            break;

            case 'pick':

            break;
        }
    }
});

bot.login('NTg3NzcxMjQ0NDg1NjcyOTcw.XP8DKg._BbxIPhM5YYqe_QxSZoweY91Jco');
