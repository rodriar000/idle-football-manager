app.component("tab-settings", {
    data(){
        return {
            saveString: "Your savegame will appear here. Keep it somewhere safe! Make sure to backup often.\n" +
                "Import Game will read the content of this textbox.\n" +
                "The downloaded File contains the content to be pasted into this text box.",
            settings: game.settings,
            notificationMessage: ""
        };
    },
    methods: {
        async toggleNotification(key, e){
            if(!e.target.checked){
                this.settings.notifications[key] = false;
                return;
            }
            if(!gameNotifications.supported){
                e.target.checked = false;
                this.notificationMessage = "Your Browser does not support Notifications.";
                return;
            }
            let granted = await gameNotifications.request();
            this.settings.notifications[key] = granted;
            e.target.checked = granted;
            this.notificationMessage = granted ? "" : "Notifications are blocked. Allow them for this Site in your Browser Settings.";
        },
        restartTutorial(){
            game.restartedTutorial = true;
        },
        exportGame(){
            this.saveString = functions.getSaveString();
        },
        importGame(){
            if(functions.loadGame(this.saveString)){
                game.tab = "tab-team";
            }
            else{
                alert("Error: Save code could not be imported.");
            }
        },
        download(){
            this.saveString = functions.getSaveString();
            let a = document.createElement("a");
            let d = new Date();
            let y = d.getFullYear(), m = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"][d.getMonth()], day = d.getDate();
            a.href = "data:text/plain;charset=utf-8," + this.saveString;
            a.download = "idle-soccer-manager-" + [day, m, y].join("-") + ".txt";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },
        hardReset(){
            let t = 3;
            while(t > 0 && confirm("Are you sure you really want to erase EVERYTHING? There is no reward and no going back! Click " + t + " more time(s) to confirm")){
                t--;
            }
            if(t === 0){
                functions.loadGame(initalGame);
                initializeGame();
                functions.saveGame();
                game.tab = "tab-team";
            }
        }
    },
    computed: {
        team(){
            return game.team;
        },
        tvUnlocked(){
            return game.tv.isUnlocked();
        },
        pwa(){
            return gamePwa;
        },
        themes(){
            return gameTheme.options;
        }
    },
    template: `<div class="tab-settings">
    <h3 class="big-heading">Team Settings</h3>
    <team-settings :team="team"></team-settings>
    <h3 class="big-heading">Game Settings</h3>
    <div class="card flex">
        <div>
            Term shown in Game Header<br/>
            <label><input type="radio" name="term" v-model="settings.term" value="Football"/> Football</label>
            <label><input type="radio" name="term" v-model="settings.term" value="Soccer"/> Soccer</label><br/>
        </div>
        <div>   
            <label>Match Autoplay <input type="checkbox" v-model="settings.match.autoPlay"/></label><br/>
            <label>Min Avg. Stamina required <input type="range" min="0" max="1" step="any" v-model.number="settings.match.minAutoPlayStamina"/></label><br/>
            <label>Refill Team after Match <input type="checkbox" v-model="settings.team.refillPlayers"/></label>
            <notation-select></notation-select><br/>
        </div>
        <div>
            <label>Hold Shift to sell Players <input type="checkbox" v-model="settings.players.shiftToSell"/></label><br/>
        </div>
        <div v-if="tvUnlocked">
            <label>Render TV Screens (decreases Performance) <input type="checkbox" v-model="settings.tv.renderCanvas"/></label><br/>
        </div>
        <div>
            Theme<br/>
            <label v-for="(name, key) in themes"><input type="radio" name="theme" v-model="settings.theme" :value="key"/> {{name}}</label>
        </div>
        <div class="notification-settings">
            Notifications when the Tab is in the Background<br/>
            <label>Match ended <input type="checkbox" :checked="settings.notifications.matchEnd" @change="toggleNotification('matchEnd', $event)"/></label><br/>
            <label>Season ended <input type="checkbox" :checked="settings.notifications.seasonEnd" @change="toggleNotification('seasonEnd', $event)"/></label><br/>
            <small>While on, Matches keep playing in the Background.</small>
            <p class="notification-message" v-if="notificationMessage">{{notificationMessage}}</p>
        </div>
    </div>
    <div class="install-app card" v-if="!pwa.installed && (pwa.installEvent || pwa.isIOS)">
        <img alt="" src="images/app/icon-192.png"/>
        <div>
            <h4>Play it like an App</h4>
            <p v-if="pwa.installEvent">Install the Game to open it from your Home Screen, full screen and offline.</p>
            <p v-else>On iPhone and iPad: tap Share, then "Add to Home Screen".</p>
        </div>
        <button v-if="pwa.installEvent" @click="pwa.install()">Install App</button>
    </div>
    <button @click="restartTutorial()">Restart Tutorial</button><br/>
    <h3 class="big-heading">Keyboard Shortcuts</h3>
    <p class="shortcuts"><kbd>1</kbd>-<kbd>9</kbd>, <kbd>0</kbd> switch Tabs (in header order) · <kbd>Space</kbd> play next Match · <kbd>B</kbd> pick Best XI</p>
    <h3 class="big-heading">Save Management</h3>
    <p>Note: The Game does <b>not</b> save if <b>cookies or storage</b> are disabled. Cleaning Utilities might clear Browser Storage.
    It is recommended to export your savegame <b>often</b>.</p>
    <div>
        <div>
            <button @click="exportGame()">Export Game</button>
            <button @click="importGame()">Import Game</button>
            <button @click="download()">Download Savegame</button>
            <button @click="hardReset()">HARD RESET</button>
        </div>
        <textarea v-model="saveString">
        </textarea>
    </div>
    <h3 class="big-heading">Social</h3>
    <a target="_blank" href="https://veprogames.github.io" class="icon-flex"><img alt="" src="images/icons/website.png"/> Visit my Website</a>
</div>`
});