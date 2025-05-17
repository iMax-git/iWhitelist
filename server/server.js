var db = global.exports["mysql-async"];
if (db == null) {
    console.log(" => MySQL-Async not found!");
}
var json_card = LoadResourceFile(GetCurrentResourceName(), "server/card.json");
var card;
if (json_card == null) {
    console.log(" => Card not found!");
} else {
    card = JSON.parse(json_card);
}

    

on("playerConnecting", (name, setKickReason, deferrals) => {
    var _source = source;
    var whitelisted = false;
    console.log(" => " + name + " is connecting...");
    deferrals.defer();
    if (db == null) {
        deferrals.done("[iWhitelist] => MySQL-Async not found! Please contact the server administrator.");
    } else if (card == null) {
        deferrals.done("[iWhitelist] => Card not found! Please contact the server administrator.");
    }

    function cardAction(data, rawData) {
        switch(data.submitId){
            case "connect":
                deferrals.done();
                break;
            case "disconnect":
                deferrals.done("Déconnection...");
                break;
            
        }
    }
    

    var username = name;
    var identifier = GetPlayerIdentifier(_source,0);
    var netid = _source;
    
    card.body[2].actions[0].isEnabled = false;
    card.body[1].items[0].text = `Bonjour ${username}, vous êtes en cours d'identification par le serveur .`;
    card.body[1].items[1].facts[0].value = username;
    card.body[1].items[1].facts[1].value = netid.toString();
    card.body[1].items[1].facts[2].value = identifier;
    card.body[1].items[1].facts[3].value = "Checking ...";
    card.body[1].items[1].facts[4].value = "En attente...";
    setTimeout(()=>{

        deferrals.presentCard(card, cardAction);
    },500)
    
    setTimeout(() => {
        db.mysql_fetch_all("SELECT * FROM iwhitelist WHERE id = @identifier", {
            ['@identifier']: identifier
        }, function(result) {
            card.body[1].items[1].facts[3].value = result.length == 1 ? "Whitelisted" : "Not Whitelisted";
            console.log(" => " + name + " is " + (result.length == 1 ? "whitelisted" : "not whitelisted") + "!" );
            deferrals.presentCard(card, cardAction);
            setTimeout(()=>{
                if (result.length == 1) {
                    whitelisted = true;
                    card.body[1].items[1].facts[4].value = "Connexion autorisée !";
                    card.body[2].actions[0].isEnabled = true;
                } else {
                    whitelisted = false;
                    card.body[1].items[1].facts[4].value = "Connexion refusée !";
                }
                
                deferrals.presentCard(card, cardAction);
            },1000)
            
        });
    }, 5000);
    deferrals.presentCard(card, cardAction);
    

});

RegisterCommand("whitelist", (source, args, raw) => {
    var _source = source;
    
    if(_source == 0 || admin_list.includes(GetPlayerIdentifier(_source,0))) {
        if (args.length == 0) {
            if(_source == 0){
                console.log(" => Usage: /whitelist [add/remove/list]");
                
            } else {
                TriggerClientEvent("chat:addMessage",_source,{
                    "color" : [255,255,255],
                    "multiline" : true,
                    "args" :["iWhitelist"," => Usage: /whitelist [add/remove/list]"]
                })
            }
            return
        }
        switch (args[0]) {
            case "add":
                if (args.length < 3) {
                    if (_source == 0){
                        console.log(" => Usage: /whitelist add [identifier] [name]");
                    } else {
                        TriggerClientEvent("chat:addMessage",_source,{
                            "color" : [255,255,255],
                            "multiline" : true,
                            "args" :[" => Usage: /whitelist add [identifier] [name]"]
                        })
                    }
                    break;
                }
                var name = "";
                for (var i = 2; i < args.length; i++) {
                    name += args[i] + " ";
                }
                db.mysql_fetch_all("SELECT * FROM iwhitelist WHERE id = @identifier", {
                    ['@identifier']: args[1]
                }, function(result) {
                    if (result.length == 0) {
                        db.mysql_execute("INSERT INTO iwhitelist (id,name) VALUES (@identifier, @name)", {
                            ['@identifier']: args[1],
                            ['@name']: name
                        }, function(result) {
                            if (_source == 0){
                                console.log("=> " + name + " (" + args[1] + ") has been whitelisted !");
                            } else {
                                TriggerClientEvent("chat:addMessage",_source,{
                                    "color" : [28, 255, 36],
                                    "multiline" : true,
                                    "args" :[" [iWhitelist] "+name+" (" + args[1] + ") has been whitelisted !"]
                                })
                            }
                        });
                    } else {
                        console.log(" => " + args[1] + " is already whitelisted !");
                        if (_source == 0){
                            console.log(" => " + args[1] + " is already whitelisted !");
                        } else {
                            TriggerClientEvent("chat:addMessage",_source,{
                                "color" : [255, 28, 43],
                                "multiline" : true,
                                "args" :[" [iWhitelist] "+ args[1] + " is already whitelisted !"]
                            })
                        }
                    }
                });
                break;
            case "remove":
                if (args.length < 2) {
                    if (_source == 0){
                        console.log(" => Usage: /whitelist remove [identifier]");
                    } else {
                        TriggerClientEvent("chat:addMessage",_source,{
                            "color" : [255,255,255],
                            "multiline" : true,
                            "args" :[" => Usage: /whitelist remove [identifier]"]
                        })
                    }
                    break;
                }
                db.mysql_execute("DELETE FROM iwhitelist WHERE id = @identifier", {
                    ['@identifier']: args[1]
                }, function(result) {
                    if (result == 0) {
                        if (_source == 0){
                            console.log(" => " + args[1] + " is not whitelisted !");
                        } else {
                            TriggerClientEvent("chat:addMessage",_source,{
                                "color" : [255, 28, 43],
                                "multiline" : true,
                                "args" :[" [iWhitelist] "+ args[1] + " is not whitelisted !"]
                            })
                        }
                    } else {
                        
                        if (_source == 0){
                            console.log(" => " + args[1] + " has been removed from whitelist !");
                        } else {
                            TriggerClientEvent("chat:addMessage",_source,{
                                "color" : [28, 255, 36],
                                "multiline" : true,
                                "args" :[" [iWhitelist] "+ args[1] + " has been removed from whitelist !"]
                            })
                        }
                    }
                });
                break;
            case "list":
                db.mysql_fetch_all("SELECT * FROM iwhitelist", {}, function(result) {
                    if (_source == 0){
                        console.log(" Whitelist : ");
                    } else{
                        TriggerClientEvent("chat:addMessage",_source,{
                            "color" : [40, 157, 252],
                            "multiline" : true,
                            "args" :[" [iWhitelist] Whitelist:"]
                        })
                    }
                    for (var i = 0; i < result.length; i++) {
                        if (_source == 0){
                            console.log(" => " + result[i].id + " - " + result[i].name);
                        } else{
                            TriggerClientEvent("chat:addMessage",_source,{
                                "color" : [5, 142, 252],
                                "multiline" : true,
                                "args" :[" => " + result[i].id + " - " + result[i].name]
                            })
                        }
                        
                    }
                });
                break;
            default:
                if(_source == 0){
                    console.log(" => Usage: /whitelist [add/remove/list]");
                    console.log(" => Usage: /whitelist add [identifier] [name]");
                    console.log(" => Usage: /whitelist remove [identifier]");
                    console.log(" => Usage: /whitelist list");
                } else {
                    TriggerClientEvent("chat:addMessage",_source,{
                        "color" : [255,255,255],
                        "multiline" : true,
                        "args" :["iWhitelist", " => Usage: /whitelist add [identifier] [name]"]
                    })
                    TriggerClientEvent("chat:addMessage",_source,{
                        "color" : [255,255,255],
                        "multiline" : true,
                        "args" :["iWhitelist"," => Usage: /whitelist remove [identifier]"]
                    })
                    
                    TriggerClientEvent("chat:addMessage",_source,{
                        "color" : [255,255,255],
                        "multiline" : true,
                        "args" :["iWhitelist"," => Usage: /whitelist list"]
                    })
                }
                break;
        }
    }
});