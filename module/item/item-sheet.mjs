export class GiharadItemSheet extends ItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["giharad", "sheet", "item"],
            template: "systems/giharadfastplay/templates/item/item-sheet.hbs",
            width: 520,
            height: 480,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    async getData() {
        const context = await super.getData();
        const system = context.item.system;
        context.system = system;
        context.enrichedDescription = await TextEditor.enrichHTML(system.descricao || "", { async: true });
        return context;
    }
}
