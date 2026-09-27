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
    <div class="page-head">
        <span class="page-icon"><ui-icon name="settings"></ui-icon></span>
        <div><p class="eyebrow">Settings</p><h2>Club and Game</h2></div>
    </div>
    <section class="set-group club">
        <h3><ui-icon name="palette"></ui-icon> Club</h3>
        <team-settings :team="team"></team-settings>
    </section>
    <div class="set-columns">
        <section class="set-group">
            <h3><ui-icon name="match"></ui-icon> Matches</h3>
            <label class="set-row"><span>Match Autoplay <small>Starts the next Match by itself</small></span><input type="checkbox" v-model="settings.match.autoPlay"/></label>
            <label class="set-row" :class="{disabled: !settings.match.autoPlay}"><span>Autoplay needs <small>{{Math.round(settings.match.minAutoPlayStamina * 100)}} % average Stamina</small></span><input type="range" min="0" max="1" step="any" v-model.number="settings.match.minAutoPlayStamina"/></label>
            <label class="set-row"><span>Refill Team after Match <small>Fills empty places from the Bench</small></span><input type="checkbox" v-model="settings.team.refillPlayers"/></label>
            <label class="set-row"><span>Hold Shift to sell Players <small>For Keyboards: a safety for selling</small></span><input type="checkbox" v-model="settings.players.shiftToSell"/></label>
        </section>
        <section class="set-group">
            <h3><ui-icon name="palette"></ui-icon> Display</h3>
            <div class="set-row"><span>Theme</span>
                <div class="seg seg-text" role="radiogroup" aria-label="Theme">
                    <label v-for="(name, key) in themes" :class="{selected: settings.theme === key}"><input type="radio" name="theme" v-model="settings.theme" :value="key"/>{{name}}</label>
                </div>
            </div>
            <div class="set-row"><span>Game Header says</span>
                <div class="seg seg-text" role="radiogroup" aria-label="Term shown in Game Header">
                    <label v-for="term in ['Football', 'Soccer']" :class="{selected: settings.term === term}"><input type="radio" name="term" v-model="settings.term" :value="term"/>{{term}}</label>
                </div>
            </div>
            <notation-select></notation-select>
            <label class="set-row" v-if="tvUnlocked"><span>Render TV Screens <small>Uses more Performance</small></span><input type="checkbox" v-model="settings.tv.renderCanvas"/></label>
        </section>
        <section class="set-group notification-settings">
            <h3><ui-icon name="bolt"></ui-icon> Notifications</h3>
            <label class="set-row"><span>Match ended</span><input type="checkbox" :checked="settings.notifications.matchEnd" @change="toggleNotification('matchEnd', $event)"/></label>
            <label class="set-row"><span>Season ended</span><input type="checkbox" :checked="settings.notifications.seasonEnd" @change="toggleNotification('seasonEnd', $event)"/></label>
            <p class="set-note">Shown when the Tab is in the Background. While on, Matches keep playing in the Background.</p>
            <p class="notification-message" v-if="notificationMessage">{{notificationMessage}}</p>
        </section>
        <section class="set-group">
            <h3><ui-icon name="help"></ui-icon> Help</h3>
            <div class="set-row"><span>Tutorial <small>Show the Introduction again</small></span><button @click="restartTutorial()">Restart</button></div>
            <div class="set-row shortcuts"><span>Keyboard Shortcuts <small><kbd>1</kbd>-<kbd>9</kbd>, <kbd>0</kbd> switch Tabs · <kbd>Space</kbd> next Match · <kbd>B</kbd> Best XI</small></span></div>
            <a class="set-row" target="_blank" href="https://veprogames.github.io"><span>Original Game by veprogames <small>Visit the Website</small></span><ui-icon name="link"></ui-icon></a>
        </section>
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
    <cloud-save-panel></cloud-save-panel>
    <section class="set-group save">
        <h3><ui-icon name="bag"></ui-icon> Save Management</h3>
        <p class="set-note">The Game does <b>not</b> save if <b>cookies or storage</b> are disabled, and cleaning Utilities might clear Browser Storage. Export your Savegame <b>often</b>.</p>
        <div class="save-actions">
            <button @click="exportGame()">Export Game</button>
            <button @click="importGame()">Import Game</button>
            <button @click="download()">Download Savegame</button>
            <button class="negative" @click="hardReset()">Hard Reset</button>
        </div>
        <textarea v-model="saveString" aria-label="Savegame"></textarea>
    </section>
</div>`
});