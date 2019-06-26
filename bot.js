const Discord = require('discord.js');
const Shuffle = require('knuth-shuffle');
const fs = require('fs');
const bot = new Discord.Client();

let raw = fs.readFileSync('auth.json');
let token = JSON.parse(raw);

bot.on('ready', () => {
    console.log('Connected');
});

//Two digit numbers represent 2 fail cards needed
var missions = [
    [2, 3, 2, 3, 3],
    [2, 3, 4, 3, 4],
    [2, 3, 3, 4, 4],
    [3, 4, 4, 5, 5]
];
var misNum, leaderNum, roundNum, resPt, spyPt, leaderTemp;
var players = new Array();
var spies = new Array();
var spyUsers = new Array();
var resistance = new Array();
var team = new Array();
var status = "waiting";
var room;

bot.on('message', message => {
    if(message.author.id != '587771244485672970' && message.content.substring(0,1) == '!') {
        var arg = message.content.substring(1).trim().split(" ");

        switch(arg[0]) {
            case 'join':
                if(!players.includes(message.author.id) && status == "waiting") {
                    players.push(message.author.id);
                    message.reply(" has join the game. Type !leave to leave the game.");
                }
                else if(players.includes(message.author.id)) {
                    message.reply(" You have already joined.");
                }
                else {
                    message.reply(" The game is already in session.")
                }
            break;

            case 'leave':
                if(players.includes(message.author.id) && status == "waiting") {
                    let index = players.indexOf(message.author.id);
                    if(index > -1) {
                        players.splice(index, 1);
                        message.channel.send("<@" + message.author.id + "> has left the game.");
                    }
                }
            break;

            case 'start':
                if((players.length <= 4 || players.length >= 11) && status != "waiting") {
                    message.channel.send("There are not enough players or the game has started. 5 players are needed to start and up to 10 players can play.");
                }
                //starting game
                else {
                    message.channel.send("Starting game...");
                    players = shuffle(players);
                    leaderNum = Math.floor(Math.random() * (players.length));
                    status = "picking";
                    roundNum = 0;
                    resPt = 0;
                    spyPt = 0;
                    leaderTemp = 0;
                    room = bot.channels.get(message.channel.id);

                    //sending players their role
                    resistance = players;
                    spies = resistance.splice(0, Math.ceil(resistance.length/3));

                    spies.forEach(id => {
                        bot.fetchUser(id).then(user => {
                            spyUsers.push(" " + user);
                        })
                    });

                    spies.forEach(id => {
                        bot.fetchUser(id).then((user) => {
                            user.send("You are the **SPY**. The spies are:");
                            user.send("The fellow spies are: " + spyUsers.toString());
                        });
                    });

                    resistance.forEach(id => {
                        bot.fetchUser(id).then((user) => {
                            user.send("You are the **RESISTANCE**.");
                        });
                    });

                    message.channel.send("<@" + players[leaderNum] + "> is the leader. Use !pick @user(s) to pick your team, !lock to lock in your team, !remove @user to remove a teammate, and !list to see your team.");

                    //Set the number of people going on the missions
                    misNum = players.length - 5;
                    if(misNum > 3) {
                        misNum = 3;
                    }

                    message.channel.send("You can pick " + missions[misNum][roundNum] + " players for your team.");
                }
            break;

            case 'pick':
                //first person has to pick the players and each player then votes
                if(status != "picking") {
                    message.channel.send("You cannot pick in the current phase of the game. The current phase is: " + status);
                }
                else if(message.author.id != players[leaderNum].id) {
                    message.channel.send("Only the leader <@" + players[leaderNum].id + "> can pick the team.");
                }
                else {
                    let picks = message.mentions.users.array();
                    picks.forEach(pick => {
                        //Add to team if not already on team
                        if(!team.includes(pick.id)) {
                            team.push(pick.id);
                        } else {
                            message.channel.send("<@" + pick.id + "> is already on the team.");
                        }
                    });
                }
            break;

            case 'remove':
                if(status == "picking") {
                    let removes = message.mentions.users.array();
                    removes.forEach(pick => {
                        let index = team.indexOf(pick.id);
                        if(index > -1) {
                            team.splice(index, 1);
                            message.channel.send("<@" + pick.id + "> has been removed from the team.");
                        } else {
                            message.channel.send("The person is not on the team.")
                        }
                    });
                }
            break;

            case 'lock':
                if(status == "picking") {
                    if(team.length == missions[misNum][roundNum]) {
                        message.channel.send("The team has been locked in. Everyone will now vote.");

                        let teamUsers= new Array();
                        team.forEach(id => {
                            bot.fetchUser(id).then(user => {
                                teamUsers.push(" " + user);
                            })
                        });

                        //Voting phase, PM all players for vote.
                        players.forEach(id => {
                            bot.fetchUser(id).then((user) => {
                                user.send("Type *!vote yes* or *!vote no*. There is **NO** changing your vote after casting it.");
                                user.send("The current team is: " + teamUsers.toString());
                            });
                        });
                        teamUsers = [];
                        status = "voting";
                    } else {
                        message.channel.send("You have the incorrect number of people on the team. There should be " + missions[misNum][roundNum] + " players for the team.")
                    }
                }
            break;

            case 'list':
                if(status == "picking" || status == "voting") {
                    let teamUsers= new Array();
                    team.forEach(id => {
                        bot.fetchUser(id).then(user => {
                            teamUsers.push(" " + user);
                        })
                    });
                    message.channel.send("The current team is: " + teamUsers.toString());
                    teamUsers = [];
                }
            break;

            case 'vote':
                if(status == "voting") {
                    let yesVote = new Array();
                    let noVote = new Array();
                    if(arg[1] == "yes" && !yesVote.includes(message.author.id) && !noVote.include(message.author.id)) {
                        yesVote.push(message.author.id);
                        message.channel.send("Your vote has been casted.");
                    } else if(arg[1] == "no" && !yesVote.includes(message.author.id) && !noVote.include(message.author.id)) {
                        noVote.push(message.author.id);
                        message.channel.send("Your vote has been casted.");
                    } else {
                        message.channel.send("Your have already voted!");
                    }

                    if(yesVote.length + noVote.length == players.length) {
                        room.send("All players have voted.");

                        let yesUsers= new Array();
                        yesVote.forEach(id => {
                            bot.fetchUser(id).then(user => {
                                yesUsers.push(" " + user);
                            })
                        });
                        room.send("The following have voted **YES**: " + yesUsers.toString());

                        let noUsers= new Array();
                        noVote.forEach(id => {
                            bot.fetchUser(id).then(user => {
                                noUsers.push(" " + user);
                            })
                        });
                        room.send("The following have voted **NO**: " + noUsers.toString());

                        //Vote passes onto mission
                        if(yesVote.length > noVote.length) {
                            leaderTemp = 0;
                            status = "mission";
                            room.send("The vote has passed. The team will go on the mission.");

                            team.forEach(id => {
                                bot.fetchUser(id).then((user) => {
                                    user.send("Type *!mission pass* to pass the mission or *!mission sabotage* to fail the mission. You cannot change your vote.");
                                });
                            });
                        }
                        else {
                            leaderNum++;
                            leaderTemp++;
                            if(leaderTemp == players.length){
                                room.send("The players cannot decide on a mission team. A point will be awarded to the spies.");
                                spyPt++;
                                if(spyPt == 3) {
                                    room.send("Game over! The spies have won.");
                                    room.send("The spies were: " + spyUsers.toString());
                                    room.send("Type !restart to restart the game.");
                                    status = "waiting";
                                }
                            }
                            if(leaderNum > players.length) {
                                leaderNum = 0;
                            }
                            status = "picking";
                            room.send("The vote has failed. The new leader is <@" + players[leaderNum] + ">. Use !pick @user(s) to pick your team, !lock to lock in your team, !remove @user(s) to remove a teammate, and !list to see your team.");
                            room.send("You can pick " + missions[misNum][roundNum] + " players for your team.");
                        }
                    }
                }
            break;

            case 'mission':
                if(status == "mission") {
                    let yesVote = new Array();
                    let noVote = new Array();
                    if(arg[1] == "pass" && !yesVote.includes(message.author.id) && !noVote.include(message.author.id)) {
                        yesVote.push(message.author.id);
                        message.channel.send("Your vote has been casted.");
                    } else if(arg[1] == "sabotage" && !yesVote.includes(message.author.id) && !noVote.include(message.author.id)) {
                        noVote.push(message.author.id);
                        message.channel.send("Your vote has been casted.");
                    } else {
                        message.channel.send("Your have already voted!");
                    }

                    if(yesVote.length + noVote.length == team.length) {
                        let allVotes = new Array();
                        for(let i = 0; i < yesVote.length; i++) {
                            allVotes.push("PASS");
                        }
                        for(let i = 0; i < noVote.length; i++) {
                            allVotes.push("SABOTAGED");
                        }
                        allVotes = shuffle(allVotes);
                        room.send("The team has come back from their mission. The mission votes are:");
                        allVotes.forEach(vote => {
                            setTimeout(function(){
                                room.send(vote);
                            }, 500);
                        });

                        if(roundNum == 3 && (misNum == 2 || misNum == 3) && noVote.length >= 2) {
                            room.send("The mission has **FAILED**.");
                            spyPt++;
                        } else if(noVote.length >= 0) {
                            room.send("The mission has **FAILED**.");
                            spyPt++;
                        } else {
                            room.send("The mission has **PASSED**.");
                            resPt++;
                        }

                        if(spyPt == 3) {
                            room.send("Game over! The spies have won.");
                            room.send("The spies were: " + spyUsers.toString());
                            room.send("Type !restart to restart the game.");
                            status = "waiting";
                        } else if(resPt == 3) {
                            room.send("Game over! The resistance have won.");
                            room.send("The spies were: " + spyUsers.toString());
                            room.send("Type !restart to restart the game.");
                            status = "waiting";
                        } else {
                            roundNum++;
                            leaderNum++;
                            if(leaderNum > players.length) {
                                leaderNum = 0;
                            }
                            status = "picking";
                            room.send("The vote has failed. The new leader is <@" + players[leaderNum] + ">. Use !pick @user(s) to pick your team, !lock to lock in your team, !remove @user(s) to remove a teammate, and !list to see your team.");
                            room.send("You can pick " + missions[misNum][roundNum] + " players for your team.");
                        }
                    }
                }
            break;

            case 'restart':
                misNum = -1;
                leaderNum = -1;
                roundNum = 0;
                resPt = 0;
                spyPt = 0;
                leaderTemp = 0;
                players = [];
                spies = [];
                spyUsers = [];
                resistance = [];
                team = [];
            break;
        }
    }
});

bot.login(token.token);
