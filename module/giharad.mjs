import { GiharadActor } from "./actor/actor.mjs";
import { GiharadActorSheet } from "./actor/actor-sheet.mjs";
import { GiharadItem } from "./item/item.mjs";
import { GiharadItemSheet } from "./item/item-sheet.mjs";

Hooks.once("init", function () {
    console.log("Giharad Fastplay | Inicializando o sistema...");

    Handlebars.registerHelper('eq', function (a, b) { return a === b; });
    Handlebars.registerHelper('gt', function (a, b) { return a > b; });
    Handlebars.registerHelper('lt', function (a, b) { return a < b; });
    Handlebars.registerHelper('selected', function (a, b) { return a === b ? 'selected' : ''; });
    Handlebars.registerHelper('list', function (...args) { return args.slice(0, -1); });
    Handlebars.registerHelper('diceSvgContent', function (val) {
        const n = parseInt(val);
        const DICE_SVG = {
            4: '<polygon points="50,10 90,85 10,85" />',
            6: '<rect x="15" y="15" width="70" height="70" />',
            8: '<polygon points="50,5 90,50 50,95 10,50" />',
            10: '<polygon points="50,5 85,35 50,95 15,35" />',
            12: '<polygon points="50,5 90,40 75,90 25,90 10,40" />',
            20: '<polygon points="50,5 90,25 90,75 50,95 10,75 10,25" />'
        };
        return DICE_SVG[n] || '<circle cx="50" cy="50" r="40" />';
    });

    CONFIG.Actor.documentClass = GiharadActor;
    CONFIG.Item.documentClass = GiharadItem;

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("giharadfastplay", GiharadActorSheet, { makeDefault: true });

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("giharadfastplay", GiharadItemSheet, { makeDefault: true });
});
