app.component("team-settings", {
    props: ["team"],
    methods: {
        addColor(){
            if(this.logo.gradient.length < 10) {
                this.logo.gradient.push("#000000");
            }
        },
        removeColor(){
            if(this.logo.gradient.length > 1){
                this.logo.gradient.pop();
            }
        }
    },
    computed: {
        logo(){
            return this.team.logo;
        },
        patterns(){
            return TeamLogo.patterns;
        },
        gradientDirections(){
            return TeamLogo.gradientDirections;
        }
    },
    template: `<div class="team-settings">
<div>
    <label>My Team is called <input type="text" v-model="team.name"/></label>
</div>
<div class="logo-settings">
    <div>
        <team-logo :logo="logo"></team-logo>
    </div>
    <div>
        <label>Colors 
            <button @click="removeColor()" v-if="logo.gradient.length > 1">-</button>
            <input type="color" v-for="(col, i) in logo.gradient" v-model="logo.gradient[i]"/>
            <button @click="addColor()" v-if="logo.gradient.length < 10">+</button>
        </label>
        <label>Gradient <select v-model="logo.gradientDirection">
            <option v-for="(name, key) in gradientDirections" :value="key">{{name}}</option>
        </select></label>
        <label>Pattern <select v-model="logo.pattern">
            <option v-for="(name, key) in patterns" :value="key">{{name}}</option>
        </select></label>
        <label v-if="logo.pattern !== 'none'">Pattern Color <input type="color" v-model="logo.stripeColor"/></label>
        <label>Outline Color <input type="color" v-model="logo.outlineColor"/></label>
        <label>Sides <input type="range" min="3" max="8" v-model="logo.sides"/></label>
        <label>Icon <input type="text" maxlength="1" v-model="logo.icon"/></label>
        <label>Icon Color <input type="color" v-model="logo.iconColor"/></label>
    </div>
</div>
</div>`
});