app.component("cloud-save-panel", {
    data(){
        return {
            cloud: cloudSave,
            code: ""
        };
    },
    methods: {
        formatDate(iso){
            return iso ? new Date(iso).toLocaleString() : "never";
        }
    },
    template: `<div class="cloud-save card" v-if="cloud.configured">
    <h4>☁ Cloud Save</h4>
    <p class="cloud-intro" v-if="!cloud.user">Sign in with your email to keep your Game in the Cloud and play it on any device.</p>
    <template v-if="!cloud.ready">
        <p>Connecting…</p>
    </template>
    <template v-else-if="!cloud.user">
        <div class="cloud-row">
            <input type="email" id="cloud-email" autocomplete="email" placeholder="you@example.com" v-model="cloud.email" @keyup.enter="cloud.signIn()"/>
            <button :disabled="cloud.busy" @click="cloud.signIn()">{{cloud.codeSent ? "Send again" : "Send Sign-in Email"}}</button>
        </div>
        <div class="cloud-row" v-if="cloud.codeSent">
            <input type="text" id="cloud-code" inputmode="numeric" autocomplete="one-time-code" placeholder="Code from the email" v-model="code" @keyup.enter="cloud.verifyCode(code)"/>
            <button :disabled="cloud.busy || !code" @click="cloud.verifyCode(code)">Sign in</button>
        </div>
    </template>
    <template v-else>
        <p>Signed in as <b>{{cloud.user.email}}</b></p>
        <div class="cloud-conflict" v-if="cloud.newerInCloud">
            <p>There is a newer Game in the Cloud, saved {{formatDate(cloud.newerInCloud)}} on another device.</p>
            <button :disabled="cloud.busy" @click="cloud.download()">Load Cloud Game</button>
            <button class="negative" :disabled="cloud.busy" @click="cloud.upload(true)">Keep this Device's Game</button>
        </div>
        <template v-else>
            <p class="cloud-status">Last synced: {{formatDate(cloud.lastSync)}}. Saves automatically every 5 Minutes and when you leave.</p>
            <div class="cloud-row">
                <button :disabled="cloud.busy || cloud.uploading" @click="cloud.upload()">Save to Cloud now</button>
                <button :disabled="cloud.busy" @click="cloud.download()">Load from Cloud</button>
                <button :disabled="cloud.busy" @click="cloud.signOut()">Sign out</button>
            </div>
        </template>
    </template>
    <p class="cloud-message" :class="{error: cloud.error}" v-if="cloud.message">{{cloud.message}}</p>
</div>`
});
