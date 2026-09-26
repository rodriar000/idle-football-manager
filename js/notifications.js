//browser notifications while the tab is in the background
const gameNotifications = {
    get supported(){
        return "Notification" in window;
    },
    get permission(){
        return this.supported ? Notification.permission : "denied";
    },
    get enabled(){
        let s = game.settings.notifications;
        return s.matchEnd || s.seasonEnd;
    },
    //must be called from a click, browsers ignore it otherwise
    async request(){
        if(!this.supported){
            return false;
        }
        if(Notification.permission === "granted"){
            return true;
        }
        if(Notification.permission === "denied"){
            return false;
        }
        return (await Notification.requestPermission()) === "granted";
    },
    send(title, body){
        if(!document.hidden || this.permission !== "granted"){
            return;
        }
        try{
            let n = new Notification(title, {body, icon: "logo.png", tag: "idle-football-manager"});
            n.onclick = () => {
                window.focus();
                n.close();
            };
        }
        catch(e){
            //some mobile browsers only allow notifications from a service worker
        }
    },
    matchEnded(match){
        if(!game.settings.notifications.matchEnd){
            return;
        }
        let result = {[MATCH_WIN]: "Won", [MATCH_DRAW]: "Draw", [MATCH_LOSE]: "Lost"}[match.getGameResult()];
        this.send("Match ended: " + result,
            match.team1.name + " " + match.score1 + " - " + match.score2 + " " + match.team2.name);
    },
    seasonEnded(season){
        if(!game.settings.notifications.seasonEnd){
            return;
        }
        let outcome = {promoted: "Promoted!", relegated: "Relegated.", champion: "Champion!", stayed: "Staying in the Division."}[season.outcome];
        this.send("Season ended: " + season.position + ". of " + season.teams,
            season.divisionName + " · " + season.points + " Points · " + outcome);
    }
};
