//Protects the savegame across updates: the save found when a new version opens it for the first time
//is kept as a backup, and a save that fails to load is never written over.
//GAME_BUILD changes with every release; index.html asks for the files with it, so no old copy is mixed in.
const GAME_BUILD = "2026.09.27.1";

const saveGuard = {
    locked: false,
    backupKey: "idleSoccerManagerBackup",
    buildKey: "ifmBuild",

    read(key){
        try{
            return localStorage.getItem(key);
        }
        catch(e){
            return null;
        }
    },

    write(key, value){
        try{
            localStorage.setItem(key, value);
        }
        catch(e){
            //storage full or blocked: the game still runs
        }
    },

    //first start of a new version: keep the save as it was
    backupOnUpdate(){
        let save = this.read("idleSoccerManager");
        if(save && this.read(this.buildKey) !== GAME_BUILD){
            this.write(this.backupKey, save);
            this.write(this.backupKey + "Date", new Date().toISOString());
        }
    },

    markLoaded(){
        this.write(this.buildKey, GAME_BUILD);
    },

    hasBackup(){
        return this.read(this.backupKey) !== null;
    },

    backupDate(){
        let d = this.read(this.backupKey + "Date");
        return d ? new Date(d) : null;
    },

    //puts the backup back and reloads without saving the current game over it
    restore(){
        let backup = this.read(this.backupKey);
        if(backup){
            this.locked = true;
            this.write("idleSoccerManager", backup);
            location.reload();
        }
    }
};
