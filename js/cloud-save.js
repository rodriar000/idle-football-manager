//save the game to a Supabase database so it can be played on several devices
let cloudClient = null; //kept out of Vue's reactivity

const cloudSave = Vue.reactive({
    configured: !!(CLOUD_CONFIG.url && CLOUD_CONFIG.anonKey),
    ready: false,
    user: null,
    email: "",
    codeSent: false,
    busy: false,
    uploading: false,
    message: "",
    error: false,
    lastSync: null, //updated_at of the cloud copy this device last uploaded or loaded
    newerInCloud: null, //updated_at of a cloud copy made on another device, waiting for a choice

    setMessage(text, error = false){
        this.message = text;
        this.error = error;
    },

    loadLibrary(){
        if(window.supabase){
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            let script = document.createElement("script");
            script.src = "js/lib/supabase.min.js";
            script.onload = resolve;
            script.onerror = () => reject(new Error("Could not load the Cloud Save library."));
            document.head.appendChild(script);
        });
    },

    async init(){
        if(!this.configured || this.ready){
            return;
        }
        try{
            this.lastSync = localStorage.getItem("ifmCloudSyncedAt");
            await this.loadLibrary();
            cloudClient = supabase.createClient(CLOUD_CONFIG.url, CLOUD_CONFIG.anonKey, {
                auth: {persistSession: true, detectSessionInUrl: true, flowType: "implicit"}
            });
            cloudClient.auth.onAuthStateChange((event, session) => this.setUser(session ? session.user : null));
            let {data} = await cloudClient.auth.getSession();
            await this.setUser(data.session ? data.session.user : null);
            this.ready = true;
            setInterval(() => this.autoUpload(), 5 * 60e3);
            document.addEventListener("visibilitychange", () => {
                if(document.hidden){
                    this.autoUpload();
                }
            });
        }
        catch(e){
            this.setMessage(e.message, true);
        }
    },

    async setUser(user){
        let changed = (this.user && this.user.id) !== (user && user.id);
        this.user = user;
        if(user && changed){
            this.codeSent = false;
            this.setMessage("");
            //a copy uploaded by another device since this one last synced is offered instead of overwritten
            await this.upload();
        }
    },

    async signIn(){
        if(!this.email.includes("@")){
            this.setMessage("Enter your email address.", true);
            return;
        }
        this.busy = true;
        let {error} = await cloudClient.auth.signInWithOtp({
            email: this.email.trim(),
            options: {emailRedirectTo: location.href.split("#")[0]}
        });
        this.busy = false;
        if(error){
            this.setMessage(error.message, true);
            return;
        }
        this.codeSent = true;
        this.setMessage("Check your email: open the link in it, or type the code here.");
    },

    async verifyCode(code){
        this.busy = true;
        let {error} = await cloudClient.auth.verifyOtp({email: this.email.trim(), token: code.trim(), type: "email"});
        this.busy = false;
        if(error){
            this.setMessage(error.message, true);
        }
    },

    async signOut(){
        await this.upload();
        await cloudClient.auth.signOut();
        this.user = null;
        this.newerInCloud = null;
        this.setMessage("Signed out. Your Game is still saved on this device.");
    },

    //updated_at of the cloud copy if another device saved it after this one last synced, else null
    async findNewerCloudCopy(){
        let {data, error} = await cloudClient.from("saves").select("updated_at").eq("user_id", this.user.id).maybeSingle();
        if(error){
            throw error;
        }
        if(data && (!this.lastSync || new Date(data.updated_at) > new Date(this.lastSync))){
            return data.updated_at;
        }
        return null;
    },

    rememberSync(updatedAt){
        this.lastSync = updatedAt;
        try{
            localStorage.setItem("ifmCloudSyncedAt", updatedAt);
        }
        catch(e){
            //storage blocked, the next check will ask again
        }
    },

    autoUpload(){
        if(this.user && !this.newerInCloud){
            this.upload();
        }
    },

    //force: overwrite the cloud even if another device saved there since this one last synced
    async upload(force = false){
        if(!this.user || this.uploading){
            return;
        }
        this.uploading = true;
        try{
            if(!force){
                let newer = await this.findNewerCloudCopy();
                if(newer){
                    this.newerInCloud = newer;
                    return;
                }
            }
            functions.saveGame();
            let {data, error} = await cloudClient.from("saves")
                .upsert({user_id: this.user.id, data: functions.getSaveString(), updated_at: new Date().toISOString()})
                .select("updated_at").single();
            if(error){
                throw error;
            }
            this.rememberSync(data.updated_at);
            this.newerInCloud = null;
            this.setMessage("");
        }
        catch(e){
            this.setMessage(e.message, true);
        }
        finally{
            this.uploading = false;
        }
    },

    async download(){
        this.busy = true;
        let {data, error} = await cloudClient.from("saves").select("data, updated_at").eq("user_id", this.user.id).maybeSingle();
        this.busy = false;
        if(error || !data){
            this.setMessage(error ? error.message : "There is no Game in the Cloud yet.", true);
            return;
        }
        if(!functions.loadGame(data.data)){
            this.setMessage("The Cloud Game could not be loaded.", true);
            return;
        }
        functions.saveGame();
        this.rememberSync(data.updated_at);
        this.newerInCloud = null;
        this.setMessage("Loaded the Game from the Cloud.");
    }
});
