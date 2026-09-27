//custom icon set: one inline SVG sprite (24px grid, 1.8 stroke, soft duotone fill)
//use <ui-icon name="ball"></ui-icon> in templates, or Icons.svg("ball") in strings
const Icons = {
    symbols: {
        "team": '<path class="d" d="M8.5 3.5 3 6.5l2 4.2 2-1V20.5h10V9.7l2 1 2-4.2-5.5-3c-.6 1.6-2 2.6-3.5 2.6S9.1 5.1 8.5 3.5z"/><path d="M8.5 3.5 3 6.5l2 4.2 2-1V20.5h10V9.7l2 1 2-4.2-5.5-3c-.6 1.6-2 2.6-3.5 2.6S9.1 5.1 8.5 3.5z"/><path d="M10.5 12.5h3M12 11v4"/>',
        "match": '<rect class="d" x="2.5" y="5" width="19" height="14" rx="2"/><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M12 5v14M2.5 9.5h2.8v5H2.5M21.5 9.5h-2.8v5h2.8"/><circle cx="12" cy="12" r="2.4"/>',
        "market": '<path class="d" d="M3.5 11.6V4.5a1 1 0 0 1 1-1h7.1l9 9a1.4 1.4 0 0 1 0 2l-6.1 6.1a1.4 1.4 0 0 1-2 0z"/><path d="M3.5 11.6V4.5a1 1 0 0 1 1-1h7.1l9 9a1.4 1.4 0 0 1 0 2l-6.1 6.1a1.4 1.4 0 0 1-2 0z"/><circle cx="8" cy="8" r="1.6"/><path d="m11.5 14.5 3-3"/>',
        "league": '<path class="d" d="M9 20.5v-11h6v11z"/><path d="M3 20.5v-7h6M15 20.5v-5h6v5M9 20.5v-11h6v11M2 20.5h20"/><path class="f" d="m12 2.6.9 1.9 2 .3-1.5 1.4.4 2L12 7.2l-1.8 1 .4-2-1.5-1.4 2-.3z"/>',
        "stadium": '<ellipse class="d" cx="12" cy="14" rx="9.5" ry="6"/><ellipse cx="12" cy="14" rx="9.5" ry="6"/><ellipse cx="12" cy="14.3" rx="5" ry="2.8"/><path d="M3.5 3.5v7.3M20.5 3.5v7.3"/><path d="M2.3 3.5h2.4M19.3 3.5h2.4"/>',
        "manager": '<circle class="d" cx="12" cy="7.5" r="3.8"/><circle cx="12" cy="7.5" r="3.8"/><path class="d" d="M4.5 20.5c.6-4 3.6-6.6 7.5-6.6s6.9 2.6 7.5 6.6z"/><path d="M4.5 20.5c.6-4 3.6-6.6 7.5-6.6s6.9 2.6 7.5 6.6zM12 14l-1.3 2 1.3 3.5 1.3-3.5z"/>',
        "academy": '<path class="d" d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M2.5 9 12 4.5 21.5 9 12 13.5zM6.5 11v4.6c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3V11M21.5 9v5.5"/>',
        "training": '<path class="d" d="M10 4h4l4.3 14H5.7z"/><path d="M10 4h4l4.3 14H5.7zM3 20.5h18M8.2 11h7.6"/>',
        "upgrades": '<rect class="d" x="3" y="3" width="18" height="18" rx="5"/><path d="m7 12.5 5-5 5 5M7 17.5l5-5 5 5"/>',
        "achievements": '<path d="M8 2.8 10.2 9M16 2.8 13.8 9M6 2.8h4M14 2.8h4"/><circle class="d" cx="12" cy="15" r="6.3"/><circle cx="12" cy="15" r="6.3"/><path class="f" d="m12 11.6 1 2 2.2.3-1.6 1.6.4 2.2-2-1-2 1 .4-2.2-1.6-1.6 2.2-.3z"/>',
        "settings": '<path d="M4 7h9M19 7h1M4 17h3M13 17h7"/><circle class="d" cx="16" cy="7" r="2.6"/><circle cx="16" cy="7" r="2.6"/><circle class="d" cx="10" cy="17" r="2.6"/><circle cx="10" cy="17" r="2.6"/>',
        "tv": '<rect class="d" x="3" y="7" width="18" height="12.5" rx="2.5"/><rect x="3" y="7" width="18" height="12.5" rx="2.5"/><path d="m8 3 4 4 4-4M9 23h6"/><path class="f" d="m10.3 10.5 4.2 2.7-4.2 2.7z"/>',
        "globe": '<circle class="d" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 3.7 5.7 3.7 9s-1.1 6.3-3.7 9c-2.6-2.7-3.7-5.7-3.7-9S9.4 5.7 12 3z"/>',
        "trophy": '<path class="d" d="M7.5 3.5h9v5.5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 3.5h9v5.5a4.5 4.5 0 0 1-9 0zM7.5 5.5H4.8a3.3 3.3 0 0 0 3.4 4.4M16.5 5.5h2.7a3.3 3.3 0 0 1-3.4 4.4M12 13.5v3.5M8 20.5h8M9.5 17h5l.5 3.5H9z"/>',
        "ball": '<circle class="d" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path class="f" d="m12 8.2 3.4 2.5-1.3 4h-4.2l-1.3-4z"/><path d="M12 8.2V3.2M15.4 10.7l4.6-1.6M14.1 14.7l2.9 4M9.9 14.7l-2.9 4M8.6 10.7 4 9.1"/>',
        "redcard": '<rect class="f" x="7" y="3.5" width="10" height="14" rx="1.6" transform="rotate(12 12 10.5)"/><path d="M5 21h7" opacity=".5"/>',
        "yellowcard": '<rect class="f" x="7" y="3.5" width="10" height="14" rx="1.6" transform="rotate(-8 12 10.5)"/>',
        "check": '<circle class="d" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="m7.8 12.4 2.8 2.8 5.6-5.8"/>',
        "timer": '<path class="d" d="M8 4.5h8v2.2a4 4 0 0 1-1.4 3L12 12l-2.6-2.3A4 4 0 0 1 8 6.7z"/><path d="M6.5 3h11M6.5 21h11M8 4.5v2.2a4 4 0 0 0 1.4 3L12 12l2.6-2.3a4 4 0 0 0 1.4-3V4.5M8 19.5v-2.2a4 4 0 0 1 1.4-3L12 12l2.6 2.3a4 4 0 0 1 1.4 3v2.2"/>',
        "pause": '<circle class="d" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
        "subin": '<circle class="d" cx="12" cy="12" r="9"/><path d="M12 16.5v-9M8 11.5l4-4 4 4"/>',
        "subout": '<circle class="d" cx="12" cy="12" r="9"/><path d="M12 7.5v9M8 12.5l4 4 4-4"/>',
        "promo": '<rect class="d" x="3" y="3" width="18" height="18" rx="5"/><path d="m7.5 14 4.5-4.5 4.5 4.5"/>',
        "releg": '<rect class="d" x="3" y="3" width="18" height="18" rx="5"/><path d="m7.5 10 4.5 4.5 4.5-4.5"/>',
        "compare": '<path d="M5 8h14M15.5 4.5 19 8l-3.5 3.5M19 16H5M8.5 12.5 5 16l3.5 3.5"/>',
        "star": '<path class="d" d="m12 3.2 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6-4.3-4.2 6-.9z"/><path d="m12 3.2 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6-4.3-4.2 6-.9z"/>',
        "attack": '<path class="d" d="M13 4h7v7z"/><path d="M4.5 19.5 20 4M13 4h7v7M4 13.5l3-3M10.5 20l3-3"/>',
        "defend": '<path class="d" d="M12 3 19.5 6v5.7c0 4.7-3.2 7.9-7.5 9.3-4.3-1.4-7.5-4.6-7.5-9.3V6z"/><path d="M12 3 19.5 6v5.7c0 4.7-3.2 7.9-7.5 9.3-4.3-1.4-7.5-4.6-7.5-9.3V6zM12 3v18"/>',
        "balance": '<circle cx="12" cy="12" r="8.5"/><path class="f" d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill-opacity=".35"/><path d="M8 12h8"/>',
        "flame": '<path class="d" d="M12 21a6 6 0 0 1-6-6c0-4 3.3-5.3 3.8-9.5 1.9 1.3 3 3 3 5 1-.6 1.6-1.7 1.7-3C16.7 9.2 18 11.7 18 15a6 6 0 0 1-6 6z"/><path d="M12 21a6 6 0 0 1-6-6c0-4 3.3-5.3 3.8-9.5 1.9 1.3 3 3 3 5 1-.6 1.6-1.7 1.7-3C16.7 9.2 18 11.7 18 15a6 6 0 0 1-6 6z"/><path d="M12 21a2.5 2.5 0 0 1-2.5-2.5c0-1.6 1.3-2.3 1.7-3.8 1.9 1.1 3.3 2.2 3.3 3.8A2.5 2.5 0 0 1 12 21z"/>',
        "drop": '<path class="d" d="M12 3.5c3.3 4.2 6 7.4 6 10.8a6 6 0 0 1-12 0c0-3.4 2.7-6.6 6-10.8z"/><path d="M12 3.5c3.3 4.2 6 7.4 6 10.8a6 6 0 0 1-12 0c0-3.4 2.7-6.6 6-10.8zM9 14.5a3 3 0 0 0 3 3"/>',
        "stamina": '<rect class="d" x="2.5" y="7" width="17" height="10" rx="2.5"/><rect x="2.5" y="7" width="17" height="10" rx="2.5"/><path d="M21.5 10.5v3"/><path class="f" d="m12.3 8.4-3.5 4.3h2.7l-.8 3 3.5-4.4h-2.7z"/>',
        "coins": '<ellipse class="d" cx="12" cy="6.5" rx="7" ry="2.8"/><ellipse cx="12" cy="6.5" rx="7" ry="2.8"/><path d="M5 6.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5M5 11.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5"/>',
        "help": '<circle class="d" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.7v.4"/><circle class="f" cx="12" cy="16.8" r="1.1"/>',
        "bolt": '<path class="d" d="M13.5 2.5 5 13.5h6l-1 8 8.5-11h-6z"/><path d="M13.5 2.5 5 13.5h6l-1 8 8.5-11h-6z"/>',
        "clock": '<circle class="d" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
        "play": '<path class="f" d="M8 5.2v13.6a1 1 0 0 0 1.5.8l10.4-6.8a1 1 0 0 0 0-1.6L9.5 4.4A1 1 0 0 0 8 5.2z"/>',
        "list": '<path d="M9 6h11M9 12h11M9 18h11"/><circle class="f" cx="4.5" cy="6" r="1.3"/><circle class="f" cx="4.5" cy="12" r="1.3"/><circle class="f" cx="4.5" cy="18" r="1.3"/>',
        "grid": '<rect class="d" x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
        "swap": '<path d="M7 20V5M3.5 8.5 7 5l3.5 3.5M17 4v15M13.5 15.5 17 19l3.5-3.5"/>',
        "sell": '<circle class="d" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M14.8 9.3c-.4-1-1.5-1.6-2.8-1.6-1.6 0-2.8.8-2.8 2.1 0 2.9 5.7 1.5 5.7 4.4 0 1.3-1.3 2.1-2.9 2.1-1.4 0-2.5-.6-2.9-1.7M12 6v1.7M12 16.3V18"/>',
        "cross": '<rect class="d" x="3" y="3" width="18" height="18" rx="5"/><path d="M12 7.5v9M7.5 12h9"/>',
        "calendar": '<rect class="d" x="3" y="5" width="18" height="16" rx="2.5"/><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><rect class="f" x="7" y="13" width="3.5" height="3.5" rx=".8"/>',
        "crowd": '<circle class="d" cx="12" cy="8" r="3.2"/><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="5" cy="9.5" r="2.2"/><circle cx="19" cy="9.5" r="2.2"/><path d="M1.5 18a4.2 4.2 0 0 1 4.8-3.6M22.5 18a4.2 4.2 0 0 0-4.8-3.6"/>',
        "moon": '<path class="d" d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
        "sun": '<circle class="d" cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M5.3 18.7l1.5-1.5M17.2 6.8l1.5-1.5"/>',
        "cloud": '<path class="d" d="M7 19a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.5 1.2A3.9 3.9 0 0 1 17.5 19z"/><path d="M7 19a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.5 1.2A3.9 3.9 0 0 1 17.5 19zM12 16.5v-5M9.8 13.5l2.2-2.2 2.2 2.2"/>',
        "rocket": '<path class="d" d="M14.5 4.5c2.5-1 4.6-1.2 5.8-1 .2 1.2 0 3.3-1 5.8l-6.4 6.4-4.6-4.6z"/><path d="M14.5 4.5c2.5-1 4.6-1.2 5.8-1 .2 1.2 0 3.3-1 5.8l-6.4 6.4-4.6-4.6zM8.3 11.1 4.5 10l3-3h4M12.9 15.7l1.1 3.8 3-3v-4M5.5 18.5c.3-1.6 1.1-2.6 2.4-2.9M7 21c1.3-.4 2.1-1.2 2.4-2.4"/><circle cx="15.8" cy="8.2" r="1.4"/>',
        "lock": '<rect class="d" x="5" y="10.5" width="14" height="10" rx="2.5"/><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><circle class="f" cx="12" cy="15.5" r="1.4"/>',
        "unlock": '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 7.8-1.3"/><circle class="f" cx="12" cy="15.5" r="1.4"/>',
        "player": '<path class="d" d="M4.5 20.5a7.5 7.5 0 0 1 15 0z"/><circle class="d" cx="12" cy="8" r="3.8"/><circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
        "palette": '<path class="d" d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-.9.7-1.6 1.7-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-.9.7-1.6 1.7-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle class="f" cx="7.5" cy="12" r="1.3"/><circle class="f" cx="9.3" cy="7.8" r="1.3"/><circle class="f" cx="14" cy="7" r="1.3"/><circle class="f" cx="17.2" cy="10.4" r="1.3"/>',
        "glitch": '<path d="M6.5 5h11l-11 14h11"/><path d="M9 2.5v2M15 19.5v2M3.5 11h3M17.5 13h3" opacity=".6"/>',
        "chart": '<path class="d" d="M4 16.5 9 11.5l3.5 3.5L20 7.5v13H4z"/><path d="M3 20.5h18M4 16.5 9 11.5l3.5 3.5L20 7.5M15 7.5h5v5"/>',
        "bag": '<path class="d" d="M10.3 7.5C6.3 9.5 4 12.6 4 15.6 4 19 7 20.5 12 20.5s8-1.5 8-4.9c0-3-2.3-6.1-6.3-8.1z"/><path d="M10.3 7.5C6.3 9.5 4 12.6 4 15.6 4 19 7 20.5 12 20.5s8-1.5 8-4.9c0-3-2.3-6.1-6.3-8.1zM9 3.5h6l-1.3 4h-3.4zM13.7 12.2c-.3-.6-1-.9-1.8-.9-1 0-1.8.5-1.8 1.3 0 1.8 3.8 1 3.8 2.8 0 .8-.8 1.3-1.9 1.3-.9 0-1.6-.4-1.9-1M12 10.3v1M12 16.7v1"/>',
        "link": '<path d="M10 14 20 4M14 4h6v6M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
        "training-star": '<path class="d" d="M8 6h3.4l3.8 12.5H4.2z"/><path d="M8 6h3.4l3.8 12.5H4.2zM2.5 20.5h14.5M6 12.5h7.6"/><path class="f" d="m18.5 2.6 1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"/>',
        "tv-off": '<rect x="3" y="7" width="18" height="12.5" rx="2.5"/><path d="m8 3 4 4 4-4M9 23h6"/>',
        "sponsor": '<path class="d" d="M2.5 10.5 7 6l3 1.5L13.5 6l8 4.5-4 5.5-5.5-.5L7 16z"/><path d="M2.5 10.5 7 6l3 1.5M21.5 10.5 17 6l-3.5 1.5L9.8 11a1.3 1.3 0 0 0 1.7 2l2.3-1.5 4.2 4.5M17.8 16l-1.4 1.4M7 16l2.5 2.5a1.3 1.3 0 0 0 1.9-1.8M9 14l3 3a1.3 1.3 0 0 0 1.9-1.8M11.4 11.9l3.5 3.5a1.3 1.3 0 0 0 1.9-1.8"/>',
        "cup": '<path class="d" d="M7 3.5h10v5a5 5 0 0 1-10 0z"/><path d="M7 3.5h10v5a5 5 0 0 1-10 0zM7 5.5H5.2a2 2 0 0 0-2 2.2c.3 2.4 2 3.8 4.3 4M17 5.5h1.8a2 2 0 0 1 2 2.2c-.3 2.4-2 3.8-4.3 4M12 13.5V17M8 20.5h8M9 20.5c0-2 1.3-3.5 3-3.5s3 1.5 3 3.5"/>',
        "whistle": '<path class="d" d="M3.5 13.5a5.5 5.5 0 1 0 11 0v-2h7v-4h-11.5a5.5 5.5 0 0 0-6.5 6z"/><path d="M3.5 13.5a5.5 5.5 0 1 0 11 0v-2h7v-4h-11.5M9 8a5.5 5.5 0 0 0-5.5 5.5M7 4.5 5.5 2.5M11 4.5l1.5-2"/><circle class="f" cx="9" cy="13.5" r="1.6"/>',
        "binoculars": '<circle class="d" cx="6.5" cy="15.5" r="4"/><circle class="d" cx="17.5" cy="15.5" r="4"/><circle cx="6.5" cy="15.5" r="4"/><circle cx="17.5" cy="15.5" r="4"/><path d="M10.5 15.5h3M3 14l2.3-8.2A1.7 1.7 0 0 1 7 4.5h1.5a1.5 1.5 0 0 1 1.5 1.5v6.5M21 14l-2.3-8.2A1.7 1.7 0 0 0 17 4.5h-1.5A1.5 1.5 0 0 0 14 6v6.5"/>',
        "physio": '<path class="d" d="M12 20.5s-8-4.6-8-10.4A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 8 2.7c0 5.8-8 10.4-8 10.4z"/><path d="M12 20.5s-8-4.6-8-10.4A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 8 2.7c0 5.8-8 10.4-8 10.4z"/><path d="M12 10.5v5M9.5 13h5"/>',
        "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
        "close": '<path d="M6 6l12 12M18 6 6 18"/>'
    },

    //old image paths (achievements, tabs) -> icon names
    images: {
        "images/icons/football.png": "ball",
        "images/icons/player-market.png": "market",
        "images/player.png": "player",
        "images/icons/colorful.png": "palette",
        "images/icons/upgrades.png": "upgrades",
        "images/icons/zalgo.png": "glitch",
        "images/icons/money.png": "coins",
        "images/icons/league.png": "league",
        "images/icons/stadium.png": "stadium",
        "images/stadium.png": "stadium",
        "images/icons/rich.png": "bag",
        "images/icons/speed.png": "bolt",
        "images/icons/speed2.png": "rocket",
        "images/icons/player-training.png": "training",
        "images/icons/player-training-2.png": "training-star",
        "images/tv-filled.png": "tv",
        "images/tv.png": "tv-off",
        "images/icons/country.png": "globe",
        "images/icons/stonks.png": "chart",
        "images/icons/stamina.png": "stamina",
        "images/icons/achievements.png": "trophy",
        "images/icons/help.png": "help",
        "images/icons/red-card.png": "redcard",
        "images/icons/settings.png": "settings",
        "images/icons/website.png": "link",
        "images/icons/cup.png": "cup",
        "images/icons/sponsor.png": "sponsor"
    },

    forImage(src){
        return this.images[src] || "trophy";
    },

    svg(name, cls){
        return '<svg class="ico' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
    },

    //adds the sprite to the page once
    install(){
        if(document.getElementById("icon-sprite")){
            return;
        }
        let symbols = Object.keys(this.symbols).map(k => '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + this.symbols[k] + '</symbol>').join("");
        document.body.insertAdjacentHTML("afterbegin", '<svg id="icon-sprite" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + symbols + '</defs></svg>');
    }
};

Icons.install();

app.component("ui-icon", {
    props: ["name"],
    template: `<svg class="ico" aria-hidden="true"><use :href="'#i-' + name"/></svg>`
});
