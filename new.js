const Discord = require('discord.js');
var shuffle = require('knuth-shuffle').knuthShuffle;
const fs = require('fs');
const bot = new Discord.Client();

let raw = fs.readFileSync('auth.json');
let token = JSON.parse(raw);

class Player{
    constructor(user, align) {
        this.user = user;
        this.align = align;
    }
}

var status, players, leaderNum, roundNum, numPlayers;
var team;
var roomId;
var missions = [
    [2, 3, 2, 3, 3],
    [2, 3, 4, 3, 4],
    [2, 3, 3, 4, 4],
    [3, 4, 4, 5, 5]
];
//Resets the game
function reset() {
    status = "waiting";  //4 phases: waiting, picking, voting, mission
    players = new Array();
    leaderNum = -1;
    roundNum = -1;
    numPlayers = -1;
    team = new Array();
    console.log("Game is ready");
}

//Sends roles to players
function sendRoles(spies) {
    for(let i = 0; i < players.length; i++) {
        if(i < Math.ceil(players.length/3)) {
            players[i].user.send("You are the **SPY**!");
            players[i].user.send("The spies are: " + spies.toString() + ". Be sure to stay hidden!");
        }
        else {
            players[i].user.send("You are the **RESISTANCE**! Stop the spies from sabotaging your missions.");
        }
    }
}

//Increases the leaderNum variable
function newLeader(leader) {
    if(leader < players.length -1) {
        return leader++;
    } else {
        return leader = 0;
    }
}

//Sends the username of the leader and intructions
function pickPlayers() {
    roomId.send("The round leader is <@" + players[leaderNum].user.id + ">.");
    roomId.send("Use !pick @user to pick team members, !remove to remove team members, and !list to see your current team.");
    roomId.send("Type !lock when you are ready!");
    roomId.send("You can choose " + missions[numPlayers][roundNum] + " players for this mission.");
    if(roundNum == 3 && (numPlayers == 2 || numPlayers == 3)) {
        roomId.send("2 fails are needed to fail this mission!");
    }
}

bot.on('ready', () => {
    console.log('Connected');
    reset();
});

bot.on('message', message => {
    if(message.author.id != '587771244485672970' && message.content.substring(0,1) == '!') {
        var arg = message.content.substring(1).trim().split(" ");

        switch(arg[0]) {
            case 'join':
            case 'Join':
                //If a player is not in the game then add them
                if(!players.includes(message.author.id) && status=="waiting") {
                    players.push(message.author.id);
                    message.reply(" has joined the game. Type !leave to leave the game.");
                }
                else if(status !="waiting"){
                    message.reply(" The game is already in session.")
                }
                else {
                    message.reply(" You have already joined.");
                }
            break;

            case 'leave':
                let index = players.indexOf(message.author.id);
                if (index > -1 && status=="waiting") {
                    players.splice(index, 1);
                    message.reply(" has left the game.")
                }
                else if (status != "waiting") {
                    message.reply(" the game is in session!");
                }
                else {
                    message.reply(" you need to !join the game first.")
                }
            break;

            case 'start':
                console.log(players); 
                if(players.length <= 4 || players.length >= 11 || status != "waiting") {
                    message.channel.send("There are not enough players or the game has started. 5 players are needed to start and up to 10 players can play.");
                }
                else { //Set the game up
                    message.channel.send("Starting game...");
                    roundNum = 0;
                    numPlayers = players.length - 5;
                    if(numPlayers > 3) {
                        numPlayers = 3;
                    }
                    status = "picking";
                    roomId = bot.channels.get(message.channel.id);

                    //Setting a leader number to track the leader of each round
                    leaderNum = Math.floor(Math.random() * players.length);

                    //Shuffling the players array and create the resistance and spies
                    players = shuffle(players);
                    //Create a Players object with the right alignment
                    //Setting the roles
                    let spies = new Array();
                    for(let i = 0; i < players.length; i++) {
                        bot.fetchUser(players[i]).then(function(user) {
                            //Setting spies
                            if(i < Math.ceil(players.length/3)) {
                                players[i] = new Player(user, "spy");
                                spies.push(" " + user.username);
                            }
                            //setting resistance
                            else {
                                players[i] = new Player(user, "resistance");
                            }
                            //Send roles after all users are fetched and send leader instructions
                            if(i == players.length-1) {
                                sendRoles(spies);
                                pickPlayers();
                            }
                        });
                    }
                }
            break;

            case 'pick':
                if(status != "picking" || message.author.id != players[leaderNum].user.id) {
                    message.channel.send("You must be a leader to pick or the game is in progess.");
                } else {
                    //Grab the mentions from the message and adds them to an array
                    message.mentions.members.array().forEach(mention => {
                        if(mention.user.id == '587771244485672970') {
                            message.channel.send("You cannot choose the bot!");
                        }
                        else if(!team.includes(mention.user)) {
                            message.channel.send("<@" + mention.user.id + "> has been added.");
                            team.push(mention.user);
                        } else {
                            message.channel.send("<@" + mention.user.id + "> is already on the team.");
                        }
                    });
                }
            break;

            case 'remove':
            if(status != "picking" || message.author.id != players[leaderNum].user.id) {
                message.channel.send("You must be a leader to remove or the game is in progess.");
            } else {
                //removes mentions if they are on the team
                team.forEach(member => {
                    message.mentions.members.array().forEach(mention => {
                        if(member.id == mention.user.id) {
                            let index = team.indexOf(member);
                            if(index > -1) {
                                team.splice(index, 1);
                                message.channel.send("<@" + member.id + "> has been removed from the team.");
                            }
                        }
                    });
                });
            }
            break;

            case 'list':
                let teamMembers = new Array();
                if(status != "picking") {
                    message.channel.send("There is not team to list in this phase of the game.");
                } else{
                    team.forEach(member => {
                        teamMembers.push(" " + member.username);
                    });
                }
                message.channel.send("The current team is: " + teamMembers.toString());
            break;

            case 'lock':
                if(status != "picking" || message.author.id != players[leaderNum].user.id) {
                    message.channel.send("You must be a leader to remove or the game is in progess.");
                }
                else if(team.length != missions[numPlayers][roundNum]) {
                    message.channel.send("You need " + missions[numPlayers][roundNum] + " members on this team.");
                } else { //Continuing the game here
                    message.channel.send("The team has been locked.");
                    let teamMembers = new Array();
                    team.forEach(member => {
                        teamMembers.push(" " + member.username);
                    });
                    //Update game settings
                    status = "voting";
                    message.channel.send("The current team is: " + teamMembers.toString());
                    message.channel.send("Everyone will now vote, check your PM's to vote.");

                }
            break;

            case 'debug':
                console.log(leaderNum);
                console.log();
            break;
        }
    }
});

bot.login(token.token);
