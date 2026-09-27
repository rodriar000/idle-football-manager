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
<div class="crest-preview"><team-logo :logo="logo"></team-logo></div>
<div class="set-list">
    <label class="set-row"><span>Team Name</span><input type="text" v-model="team.name"/></label>
    <div class="set-row"><span>Colors</span>
        <div class="colors">
            <input type="color" v-for="(col, i) in logo.gradient" v-model="logo.gradient[i]" :aria-label="'Color ' + (i + 1)"/>
            <button class="icon-btn" @click="removeColor()" v-if="logo.gradient.length > 1" aria-label="Remove Color" title="Remove Color">&minus;</button>
            <button class="icon-btn add" @click="addColor()" v-if="logo.gradient.length < 10" aria-label="Add Color" title="Add Color">+</button>
        </div>
    </div>
    <label class="set-row" v-if="logo.gradient.length > 1"><span>Gradient</span><select v-model="logo.gradientDirection">
        <option v-for="(name, key) in gradientDirections" :value="key">{{name}}</option>
    </select></label>
    <label class="set-row"><span>Pattern</span><select v-model="logo.pattern">
        <option v-for="(name, key) in patterns" :value="key">{{name}}</option>
    </select></label>
    <label class="set-row" v-if="logo.pattern !== 'none'"><span>Pattern Color</span><input type="color" v-model="logo.stripeColor"/></label>
    <label class="set-row"><span>Outline Color</span><input type="color" v-model="logo.outlineColor"/></label>
    <label class="set-row"><span>Sides <small>{{logo.sides}}</small></span><input type="range" min="3" max="8" v-model="logo.sides"/></label>
    <label class="set-row"><span>Icon Letter</span><input class="short" type="text" maxlength="1" v-model="logo.icon"/></label>
    <label class="set-row"><span>Icon Color</span><input type="color" v-model="logo.iconColor"/></label>
</div>
</div>`
});