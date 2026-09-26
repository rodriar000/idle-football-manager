//light / dark colors, "auto" follows the system setting
const gameTheme = {
    options: {light: "Light", dark: "Dark", auto: "System"},
    media: matchMedia("(prefers-color-scheme: dark)"),
    resolve(theme){
        if(theme === "auto"){
            return this.media.matches ? "dark" : "light";
        }
        return theme === "dark" ? "dark" : "light";
    },
    apply(){
        document.documentElement.dataset.theme = this.resolve(game.settings.theme);
    }
};

if(gameTheme.media.addEventListener){
    gameTheme.media.addEventListener("change", () => gameTheme.apply());
}
