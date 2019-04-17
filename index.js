// to read the settings file
var PropertiesReader = require('properties-reader');
// to interact with Discord
const Discord = require('discord.js');
// to write in files
var fs = require("fs");
// Create an instance of a Discord LUDZ
const LUDZ = new Discord.Client();
//read with the PropertiesReader Setting file
var properties;
try {
  properties = PropertiesReader('settings.properties')
} catch (err) {
  console.log("You need to create a settings.properties file in the application folder. See README for more informations.");
  process.exit(1);
}

//check the token
const token = properties.get('token');
if (!token) {
  console.log("settings.properties file is missing a 'token = <your token>' line. Check README if you don't know how to get your token.");
  process.exit(1);
}


// retrieve the ownerID from the config file
var ownerID = properties.get('ownerID');

// retrieve the prefix for the bot
var prefix = properties.get('prefix');
if (!prefix) {
  console.log("Please add setting 'prefix' to settings.properties !");
  console.log("Using default prefix : #");
  properties.set('prefix', '#');
  prefix = "#";
}



var admin = {
  name: "",
  role: 16
};

var voiceEvents = {
  start: 0,
  end: 0
}


var VoiceUsers = {};

// the regex we will use to check if the name is valid
var inputFilter = /^[A-Za-z0-9]+$/;
// the regex we will use to replace user mentions in message
var mentionFilter = /\s(<?@\S+)/g;


var Admins;
try {
  Admins = require('./Admins.json');
} catch (err) {
  console.log(err);
  Admins = {};
}



var chatUser = {
  name: "john",
  role: "none",
  stars: 0,
  chars: 0,
  credit: 0
}

var transaction = {
  number: 0,
  from: "",
  to: "",
  amount: 0
}


//the JSON file where all user data are in
var UserPoints;
try {
  UserPoints = require('./UserPoints.json');
} catch (err) {
  console.log(err);
  UserPoints = {};
}

//the JSON file where credit Transactions are: 
var Transactions;
try {
  Transactions = require('./Transactions.json');
} catch (err) {
  console.log(err);
  Transactions = {};
}

var RoleTransactions;
try {
  RoleTransactions = require('./RoleTransactions.json');
} catch (err) {
  console.log(err);
  RoleTransactions = {};
}

//we login our bot with token

LUDZ.login(token);

/**
 * The ready event is vital, it means that only _after_ this
 will your bot start reacting to information
 * received from Discord
 */
LUDZ.on('ready', () => {
  console.log('LUDZ connected!');
});

LUDZ.on('message', message => {

  if (message.author.id != LUDZ.user.id) {

    TextCredit(message.author, message.content.length);


    if (message.content.startsWith(prefix) && message.content.length > 1) {
      message.content = message.content.substring(prefix.length); // removes the prefix
      var myString = message.content; // TODO change the way this work to be able to handle roles aswell
      var content = message.content.split(" ");
      var content = content.filter(function (el) {
        return el != '';
      });
      console.log(content);

      function isCmd(cmd) {
        return content[0] == cmd;
      }

      function isExist(message) {
        return (UserPoints[message.author.id] !== null);
      }

      if (isCmd('test')) {
        message.channel.send("yes yes i am under test!")
        if (UserPoints[message.author.id]) {
          message.channel.send(message.author.id + "\n" + message.author.username);
        }

      } else if (isCmd('credit')) {
        try {
          if (content[1]) {
            content[1] = content[1].replace(/\D/g, '');
            console.log(typeof (content[1]));
            if (UserPoints[content[1]])
              xp(message, content[1]);
            else
              message.channel.send("no such user in the server");
          } else
            xp(message, message.author.id);
        } catch (err) {
          message.channel.send("try this :" + prefix + "level @user");
          console.log(err);
        }
      } else if (isCmd('avatar')) {
        try {
          if (content[1]) {
            content[1] = content[1].replace(/\D/g, '');
            if (UserPoints[content[1]])
              ShowName(message, content[1]);
            else
              message.channel.send("no such user in the server");
          } else
            ShowName(message, message.author);
        } catch (err) {
          message.channel.send("try this :" + prefix + "level @user");
          console.log(err);
        }
      } else if (isCmd('pay')) {
        try {
          content[1] = content[1].replace(/\D/g, '');
          if (content[1]) {
            console.log("yep yep user valid");
            console.log(content[2]);
            if (content[2]) {
              if (UserPoints[content[1]]) {
                var amount = parseInt(content[2].replace(/\D/g, ''));
                if (amount) {
                  Credit(message, content[1], amount);
                } else
                  message.channel.send("use : #credit @user points : error in points \nfor example : #credit #ludz (400) ");
              } else
                message.channel.send("no such user in the bank system.");
            } else {
              message.channel.send("use : #credit @user points \nfor example : #credit @LUDZ 400");
            }

          } else
            message.channel.send("no such user in the bank system.");

        } catch (err) {
          console.log(err);
          message.channel.send("use : #credit @user points \nfor example : #credit #ludz 400");
        }

      } else if (isCmd('top')) {
        top(message);
      } else if (isCmd('pt')) {
        try {
          content[1] = content[1].replace(/\D/g, '');
          if (content[1]) {
            console.log("yep yep user valid");
            console.log(content[2]);
            if (content[2]) {
              if (UserPoints[content[1]]) {
                var amount = parseInt(content[2].replace(/\D/g, ''));
                if (amount) {
                  Star(message, content[1], amount);
                } else
                  message.channel.send("use : #pt @user points : error in points \nfor example : #pt #ludz 1 ");
              } else
                message.channel.send("no such user in the bank system.");
            } else {
              message.channel.send("use : #pt @user points \nfor example : #pt @LUDZ 1");
            }

          } else
            message.channel.send("no such user in the bank system.");

        } catch (err) {
          console.log(err);
          message.channel.send("use : #pt @user points \nfor example : #pt #ludz 1");
        }
      }
      else if (isCmd('adminize')) {
        try {
          content[1] = content[1].replace(/\D/g, '');
          console.log(content[1]);
          if (content[1]) {
            console.log("yep yep user valid");
            console.log(content[1]);
            if (content[1]) {
              if (UserPoints[content[1]]) {
                if (content[2]) {
                  content[2] = content[2].replace(/\D/g, '');
                  if (content[2] != '') AdminAdd(message, content[1], parseInt(content[2]));
                }

              }
              else
                message.channel.send("no such user in the bank system.");
            }
          } else
            message.channel.send("no such user in the bank system.");

        } catch (err) {
          console.log(err);
          message.channel.send("use : #loot @user points \nfor example : #loot #ludz 400");
        }
      } else if (isCmd('loot')) {
        try {
          content[1] = content[1].replace(/\D/g, '');
          console.log(content[1]);
          if (content[1]) {
            console.log("yep yep user valid");
            console.log(content[1]);
            if (content[1]) {
              if (UserPoints[content[1]]) {
                var amount = parseInt(content[1].replace(/\D/g, ''));
                console.log(amount + " type " + typeof (amount));
                if (amount) console.log("amount yes");
                else console.log("amount no");
                if (amount) {
                  loot(message, content[1], amount);
                } else
                  message.channel.send("use : #loot @user points : error in points \nfor example : #loot #ludz (400) ");
              } else
                message.channel.send("no such user in the bank system.");
            } else {
              message.channel.send("use : #loot @user points \nfor example : #loot @LUDZ 400");
            }

          } else
            message.channel.send("no such user in the bank system.");

        } catch (err) {
          console.log(err);
          message.channel.send("use : #loot @user points \nfor example : #loot #ludz 400");
        }
      }
      else if (isCmd('payrole')) {
        try {
          content[1] = content[1].replace(/\D/g, '');
          console.log(content[1]);
          if (content[1]) {
            console.log("yep yep user valid");
            console.log(content[1]);
            if (content[1]) {
              if (UserPoints[content[1]]) {
                var amount = parseInt(content[1].replace(/\D/g, ''));
                console.log(amount + " type " + typeof (amount));
                if (amount) console.log("amount yes");
                else console.log("amount no");
                if (amount) {
                  creditRole(message, content[1], amount);
                } else
                  message.channel.send("use : #loot @user points : error in points \nfor example : #loot #ludz (400) ");
              } else
                message.channel.send("no such user in the bank system.");
            } else {
              message.channel.send("use : #loot @user points \nfor example : #loot @LUDZ 400");
            }

          } else
            message.channel.send("no such user in the bank system.");

        } catch (err) {
          console.log(err);
          message.channel.send("use : #loot @user points \nfor example : #loot #ludz 400");
        }
      }
      else if (isCmd('lootRole')) {
        try {
          content[1] = content[1].replace(/\D/g, '');
          console.log(content[1]);
          if (content[1]) {
            console.log("yep yep user valid");
            console.log(content[1]);
            if (content[1]) {
              if (UserPoints[content[1]]) {
                var amount = parseInt(content[1].replace(/\D/g, ''));
                console.log(amount + " type " + typeof (amount));
                if (amount) console.log("amount yes");
                else console.log("amount no");
                if (amount) {
                  lootRole(message, content[1], amount);
                } else
                  message.channel.send("use : #loot @user points : error in points \nfor example : #loot #ludz (400) ");
              } else
                message.channel.send("no such user in the bank system.");
            } else {
              message.channel.send("use : #loot @user points \nfor example : #loot @LUDZ 400");
            }

          } else
            message.channel.send("no such user in the bank system.");

        } catch (err) {
          console.log(err);
          message.channel.send("use : #loot @user points \nfor example : #loot #ludz 400");
        }
      }
      else if (isCmd('ptlootRole')) {
        try {
          content[1] = content[1].replace(/\D/g, '');
          console.log(content[1]);
          if (content[1]) {
            console.log("yep yep user valid");
            console.log(content[1]);
            if (content[1]) {
              if (UserPoints[content[1]]) {
                var amount = parseInt(content[1].replace(/\D/g, ''));
                console.log(amount + " type " + typeof (amount));
                if (amount) console.log("amount yes");
                else console.log("amount no");
                if (amount) {
                  ptlootRole(message, content[1], amount);
                } else
                  message.channel.send("use : #loot @user points : error in points \nfor example : #loot #ludz (400) ");
              } else
                message.channel.send("no such user in the bank system.");
            } else {
              message.channel.send("use : #loot @user points \nfor example : #loot @LUDZ 400");
            }

          } else
            message.channel.send("no such user in the bank system.");

        } catch (err) {
          console.log(err);
          message.channel.send("use : #loot @user points \nfor example : #loot #ludz 400");
        }
      }
      else if (isCmd('ptRole')) {
        try {
          content[1] = content[1].replace(/\D/g, '');
          console.log(content[1]);
          if (content[1]) {
            console.log("yep yep user valid");
            console.log(content[1]);
            if (content[1]) {
              if (UserPoints[content[1]]) {
                var amount = parseInt(content[1].replace(/\D/g, ''));
                console.log(amount + " type " + typeof (amount));
                if (amount) console.log("amount yes");
                else console.log("amount no");
                if (amount) {
                  ptRole(message, content[1], amount);
                } else
                  message.channel.send("use : #loot @user points : error in points \nfor example : #loot #ludz (400) ");
              } else
                message.channel.send("no such user in the bank system.");
            } else {
              message.channel.send("use : #loot @user points \nfor example : #loot @LUDZ 400");
            }

          } else
            message.channel.send("no such user in the bank system.");

        } catch (err) {
          console.log(err);
          message.channel.send("use : #loot @user points \nfor example : #loot #ludz 400");
        }
      }
      else if (isCmd('help')) {
        help(message);
      } else if (isCmd('testRole')) {
        findbyrole(content[1].replace(/\D/g, ''), message);
      } else if (isCmd('tfou')) {
        message.channel.send("tfou 3lik a <@453014816685293590>");
      } else if (isCmd('lootpt')) {
        try {
          content[1] = content[1].replace(/\D/g, '');
          if (content[1]) {
            console.log("yep yep user valid");
            console.log(content[2]);
            if (content[2]) {
              if (UserPoints[content[1]]) {
                var amount = parseInt(content[2].replace(/\D/g, ''));
                if (amount) {
                  Star(message, content[1], -amount);
                } else
                  message.channel.send("use : #pt @user points : error in points \nfor example : #pt #ludz 1 ");
              } else
                message.channel.send("no such user in the bank system.");
            } else {
              message.channel.send("use : #pt @user points \nfor example : #pt @LUDZ 1");
            }

          } else
            message.channel.send("no such user in the bank system.");

        } catch (err) {
          console.log(err);
          message.channel.send("use : #pt @user points \nfor example : #pt #ludz 1");
        }
      } else if (isCmd('stars')) {
        try {
          if (content[1]) {
            content[1] = content[1].replace(/\D/g, '');
            console.log(typeof (content[1]));
            if (UserPoints[content[1]])
              stars(message, content[1]);
            else
              message.channel.send("no such user in the server");
          } else
            stars(message, message.author.id);
        } catch (err) {
          message.channel.send("try this :" + prefix + "stars @user");
          console.log(err);
        }
      } else {
        LUDZTalk(message.channel, myString);
      }

      if (message.author.id == "453014816685293590")
        message.channel.send("ماركو الغبي راس الاناناس <@" + message.author.id + ">");
    }

  }

});



LUDZ.on('voiceStateUpdate', (oldMember, newMember) => {
  let newUserChannel = newMember.voiceChannel
  let oldUserChannel = oldMember.voiceChannel

  if (oldUserChannel === undefined && newUserChannel !== undefined) {
    console.log(UserPoints[newMember.id].name + " had joined the channel");
    watchVoice(newMember, "join");

  } else if (newUserChannel === undefined) {
    console.log(UserPoints[oldMember.id].name + " had left the channel");
    watchVoice(oldMember, "leave");
  }
})


function watchVoice(user, event) {

  if (event == "join") {
    voiceEvents.start = voiceEvents.end = Date.now();
    VoiceUsers[user.id] = voiceEvents;
  }
  else if (event == "leave") {
    VoiceUsers[user.id].end = Date.now();
    if (VoiceUsers[user.id].start != 0)
      var countPoints = parseInt((VoiceUsers[user.id].end - VoiceUsers[user.id].start) / (6000));
    console.log(countPoints);
    TextCredit(user, countPoints);
  }

}



//as it says just saving to disk
function saveToDisk(file, obj) {
  fs.writeFile(file, JSON.stringify(obj), "utf8", err => {
    if (err) throw err;
    console.log(file + ' successfully saved !');
  });
}


//the function that sets the credit for the user and save it in the database
function TextCredit(user, charsNumber) {
  console.log(user.username + " sent a message");
  try {
    if (UserPoints[user.id]) {
      UserPoints[user.id].chars += charsNumber;
      UserPoints[user.id].credit = parseInt(UserPoints[user.id].chars / 600);
      return 2;
    } else {
      UserPoints[user.id] = JSON.parse(JSON.stringify(chatUser));
      UserPoints[user.id].name = user.username;
      UserPoints[user.id].credit = parseInt(UserPoints[user.id].chars / 600);
      return 1;
    }
  } catch (err) {
    console.log(err);
  } finally {
    saveToDisk('./UserPoints.json', UserPoints);
  }
}

function Star(message, id, amount) {

  if (UserPoints[message.author.id] && UserPoints[id]) {
    if (Admins[message.author.id].role <= 1) {
      if (amount > 0) {
        UserPoints[id].stars += amount;
        message.channel.send("<@" + message.author.id + "> gives " + amount + " :star: to  <@" + id + ">");
      }
      else {
        if (amount <= UserPoints[id].stars) {
          UserPoints[message.author.id].stars -= amount;
          UserPoints[id].stars += amount;
          message.channel.send("<@" + message.author.id + "> toke " + (-amount) + " :star: from  <@" + id + ">");
        }
      }
      // if a transaction is made we will save it in the log 
      transaction.amount = amount;
      transaction.from = message.author.id;
      transaction.to = id;
      transaction.number = Object.keys(Transactions).length;
      Transactions[transaction.number] = transaction;
      //update the transaction.json file.
      saveToDisk('./Transactions.json', Transactions);
    } else {
      message.channel.send("<@" + message.author.id + ">, you don't have enought privileges.");
    }
  } else {
    message.channel.send("no such user in the bank system.");
  }

}


//the function that sets the credit for the user and save it in the database
function CreditID(id, charsNumber) {
  console.log(UserPoints[id].name + " sent a message");
  if (UserPoints[id]) {
    UserPoints[id].chars += charsNumber;
    UserPoints[id].credit = parseInt(UserPoints[id].chars / 600);
    return 2;
  } else {
    saveToDisk('UserPoints.json');
    return 1;
  }
}


//the function that sets the credit for the user and save it in the database
function Credit(message, id, amount) {
  if (amount > 0) {
    if (UserPoints[message.author.id] && UserPoints[id]) {
      if (UserPoints[message.author.id].credit > amount) {
        TextCredit(message.author, -(amount * 600));
        CreditID(id, (amount * 600));
        message.channel.send("<@" + message.author.id + "> transfered " + amount + " $ to  <@" + id + ">");
        // if a transaction is made we will save it in the log 
        transaction.amount = amount;
        transaction.from = message.author.id;
        transaction.to = id;
        transaction.number = Object.keys(Transactions).length;
        Transactions[transaction.number] = transaction;
        //update the transaction.json file.
        saveToDisk('./Transactions.json', Transactions);
      } else {
        message.channel.send("<@" + message.author.id + ">, you don't have enought credits.");
      }
    } else {
      message.channel.send("no such user in the bank system.");
    }
  } else {
    message.channel.send("Can't credit negative, DAH!!!");
  }
}


//functions of show level and show something else
function ShowName(message, id) {
  LUDZ.fetchUser(id).then(
    function (name) {
      if (UserPoints[id]) {
        message.channel.send(name.username + "\n" + name.displayAvatarURL);
      } else {
        message.channel.send("you are new here, right?");
      }
    }
  );
}



//level function
function xp(message, id) {
  if (UserPoints[id]) {
    message.channel.send(UserPoints[id].name + " Credit is: " + UserPoints[id].credit);
    if (UserPoints[id].chars < 600) message.channel.send("you should talk more " + UserPoints[id].name + "! \ndo not be shy!\nyou can talk to me, we are friends, right?");

  } else {
    message.channel.send("you should talk more, you are new here, right?");
  }
}

function stars(message, id) {
  if (UserPoints[id]) {
    message.channel.send(UserPoints[id].name + " has  " + UserPoints[id].stars + " :star: ");
    if (UserPoints[id].chars < 600) message.channel.send("you should talk more " + UserPoints[id].name + "! \ndo not be shy!\nyou can talk to me, we are friends, right?");
  } else {
    message.channel.send("you should talk, you are new here, right?");
  }
}


function help(message) {
  message.channel.send("``` قائمة لأوامر البوت ``` \n **#xp** : `الإطلاع على مقدارك من الكريديت` \n **#xp _@mentions_** :   `الإطلاع على كريديت عضو` \n **#credit _@mentions_** :  `إعطاء كريديت لعضو` \n **#top**:  `قائمة لأغنياء السيرفر` \n **#star** : `الإطلاع على  ننجومك` \n **#star _@mentions_** : `الإطلاع على نجوم العضو` \n **#stars _@mentions_** : `إعطاء نقاط ل عضو` \n **#rank** :  `معرفة مستواك` \n **#rank _@mentions_** : `الإطلاع على مستوى عضو`\n")
}



function LUDZTalk(channel, talk) {
  channel.send("i am taking a nap, when i wake up we will have a looong conversation.")
}



function top(message) {

  var tops = "```";
  var best = SortByCredit();
  for (let i = 0; i < best.length; i++) {
    tops += (i + 1) + "- " + UserPoints[best[i]].name + "   Score: " + UserPoints[best[i]].credit + "\n";
    if (i == best.length - 1) {
      tops += "```";
      message.channel.send(tops);
    }
  }
}

function SortByCredit() {
  var tops = Object.keys(UserPoints);
  tops.sort(
    function (a, b) {
      return parseInt(UserPoints[b].credit) - parseInt(UserPoints[a].credit)
    }
  )
  if (tops.length > 10) return tops.slice(0, 10);
  else return tops;
}

function loot(message, id, amount) {
  if (Admins[message.author.id]) {
    var c = message.author.id;
    message.author.id = id;
    id = c;
    Credit(message, id, amount);
  } else {
    var messageId = message.channel.send("not admin");
    console.log(messageId);
  }


} 


function AdminAdd(message, id, role) {
  if (Admins[message.author.id]) {
    if (Admins[id]) {
      message.channel.send("Role already exist.");
    }
    else {
      if (UserPoints[message.author.id]) {
        if (UserPoints[id]) {
          admin.name = UserPoints[id].name;
          admin.role = role;
          Admins[id] = admin;
          message.channel.send("<@" + id + ">  added as an " + role + ".")
          saveToDisk("./Admins.json", Admins);
        }
      }
    }
  } else {
    var messageId = message.channel.send("you are not admin");
    console.log(messageId);
  }
}


function findbyrole(roleID, message) {
  message.guild.roles.get(roleID).members.forEach(member => {

  });

}

function lootRole(roleID, message, amount) {
  if (Admins[message.user.id].role <= 1)
    message.guild.roles.get(roleID).members.forEach(member => {
      saveTrans(message,roleID,amount,"Loot credit");
      loot(message, member.id, amount);
    });
}

function creditRole(roleID, message, amount) {
  if (Admins[message.user.id].role <= 1)
    message.guild.roles.get(roleID).members.forEach(member => {
      saveTrans(message,roleID,amount,"guive credit");
      UserPoints[message.user.id].chars+=(amount*600);
      credit(message, member.id, amount);
    });
}


function ptRole(roleID, message, amount) {
  if (Admins[message.user.id].role <= 1)
    message.guild.roles.get(roleID).members.forEach(member => {
      saveTrans(message,roleID,amount,"Guive Stars");
      Star(message, member.id, amount);
    });
}

function ptlootRole(roleID, message, amount) {
  if (Admins[message.user.id].role <= 1)
    message.guild.roles.get(roleID).members.forEach(member => {
      saveTrans(message,roleID,amount,"Loot Stars");
      Star(message, member.id, -amount);
    });
}

function saveTrans(message,id,amount,type){
        transaction.amount = amount;
        transaction.type=type
        transaction.from = message.author.id;
        transaction.to = id;
        transaction.number = Object.keys(RoleTransactions).length;
        RoleTransactions[transaction.number] = transaction;
        //update the transaction.json file.u
        saveToDisk('./RoleTransactions.json', RoleTransactions);
}
