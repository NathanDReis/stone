const $html = document.querySelector("html");
const $siteMenu = document.querySelector(".site-menu");

/* Theme */
function alterTheme() {
    const mapTheme = {
        "terr": "terr-dark",
        "terr-dark": "light",
        "light": "dark",
        "dark": "terr",
    };
    const current = $html.classList[0];
    $html.classList.remove(current);
    $html.classList.add(mapTheme[current]);
    localStorage.setItem("theme", mapTheme[current]);
}

const theme = localStorage.getItem("theme");
$html.classList.add(theme || "light");

/* Menu */
let activeSiteMenu = innerWidth >= 1920;
function toggleSiteMenu() {
    activeSiteMenu = !activeSiteMenu;
    siteMenu();
}
function siteMenu() {
    if (activeSiteMenu) {
        $siteMenu.classList.add("actived");
    } else {
        $siteMenu.classList.remove("actived");
    }
}
siteMenu();

function addNote() {

} 

function addFolder() {
    
}

function sync() {

}