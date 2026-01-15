const $html = document.querySelector("html");

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
