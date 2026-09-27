let lastUpdate = Date.now();
let windowFocus = true;

function initializeGame(){
    game.league.divisions[0].teams[0] = new Team("My Football Club", [], 0, 0, Date.now());
    game.team = game.league.divisions[0].teams[0];
    game.league.simulate();
    game.playerMarket.refresh();
}

function setup(){
    game.league = GeneratorUtils.generateLeague(0, game.country);
    window.initalGame = functions.getSaveString();

    let error = "";
    window.onerror = (msg, url, ln, col, error) => {
        error = [msg, url, error, ln, col].join(":");
        document.body.innerHTML = `<h2>Error</h2>
<p>An error occurred while loading the game. You may forward this to the developer:</p>
<p class="game-error">${btoa(error)}</p>`;
        return false;
    }

    if(localStorage.getItem("idleSoccerManager") === null){
        initializeGame();
    }
    else{
        functions.loadGame();
    }
    game.academy.start();
    game.career.start();
    gameTheme.apply();

    if(!error.length){
        Vue.nextTick(() => {
            game.init = true;
            hideSplash();
        });
        window.onerror = null;

        requestAnimationFrame(update);
        setInterval(backgroundUpdate, 1000);
        cloudSave.init();
    }
}

function update(){
    let dt = (Date.now() - lastUpdate) / 1000;
    lastUpdate = Date.now();
    step(dt);
    requestAnimationFrame(update);
}

//browsers pause requestAnimationFrame in background tabs. With notifications on,
//keep the game running from a timer so matches can end and notify.
function backgroundUpdate(){
    if(!game.init || !document.hidden || !gameNotifications.enabled){
        return;
    }
    let elapsed = (Date.now() - lastUpdate) / 1000;
    lastUpdate = Date.now();
    //small steps, as if the tab was visible. Throttled timers can fire rarely,
    //so limit the work per call and pass the rest at once like a visible tab would.
    let simulated = Math.min(10, elapsed);
    for(let t = simulated; t > 0; t -= 1 / 30){
        step(Math.min(1 / 30, t));
    }
    if(elapsed > simulated){
        step(elapsed - simulated);
    }
}

function step(dt){
    if(game.settings.match.autoPlay && game.team.getAverageStamina() >= game.settings.match.minAutoPlayStamina){
        if(game.team.canPlayNextMatch() && (!game.currentMatch || game.currentMatch.ended)){
            game.league.divisions[game.team.divisionRank].playNextMatch();
        }
    }
    if(game.currentMatch){
        game.currentMatch.tick(dt);
    }
    for(let p of game.team.players){
        if(!p.active || !game.currentMatch || (game.currentMatch && game.currentMatch.ended)){
            p.regenerate(dt);
        }
    }

    for(let k of Object.keys(game.training.tasks)){
        game.training.tasks[k].tick(dt);
    }

    for(let c of game.tv.channels){
        c.tick(dt);
    }

    for(let a of game.achievements){
        if(!a.completed){
            a.completed = a.requirement();
        }
    }
}

let app = Vue.createApp({
    data: function(){
        return game;
    },
    methods: functions,
    computed,
    watch: {
        "settings.theme"(){
            gameTheme.apply();
        }
    },
    setup
});

onblur = e => windowFocus = false;
onfocus = e => windowFocus = true;

setInterval(() => functions.saveGame(), 60e3);
onbeforeunload = () => functions.saveGame();

let keyMap = new KeyMap();