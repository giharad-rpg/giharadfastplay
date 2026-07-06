const DICE_SVG = {
    4: '<polygon points="50,10 90,85 10,85" />',
    6: '<rect x="15" y="15" width="70" height="70" />',
    8: '<polygon points="50,5 90,50 50,95 10,50" />',
    10: '<polygon points="50,5 85,35 50,95 15,35" />',
    12: '<polygon points="50,5 90,40 75,90 25,90 10,40" />',
    20: '<polygon points="50,5 90,25 90,75 50,95 10,75 10,25" />'
};

function getDiceSvg(val) {
    const n = parseInt(val);
    return DICE_SVG[n] || '<circle cx="50" cy="50" r="40" />';
}

export class GiharadActorSheet extends ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["giharad", "sheet", "actor"],
            template: "systems/giharadfastplay/templates/actor/actor-sheet.hbs",
            width: 820,
            height: 920,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "general" }],
            dragDrop: [{ dragSelector: ".item-row", dropSelector: null }]
        });
    }

    async getData() {
        const context = await super.getData();
        const system = this.actor.toObject(false).system;

        // Fallbacks para exibição de fichas antigas ou não preparadas
        system.mente = system.mente || system.presenca || 4;
        system.reflexos = system.reflexos || system.astucia || 4;
        system.fisico = system.fisico || 4;
        system.carisma = system.carisma || 4;

        const fieldsToZero = [
            'fisico_exp', 'fisico_inc', 'mente_exp', 'mente_inc',
            'carisma_exp', 'carisma_inc', 'reflexos_exp', 'reflexos_inc'
        ];
        for (const f of fieldsToZero) system[f] = system[f] ?? 0;

        system.comp_attrs = system.comp_attrs || {};
        system.comp_attrs.prof_attrs = system.comp_attrs.prof_attrs || {};
        system.comp_attrs.idio_attrs = system.comp_attrs.idio_attrs || {};
        
        // Auto-cleanup bad default generic skills from old templates
        if (system.competencias?.profissoes?.default) {
            setTimeout(() => this.actor.update({ "system.competencias.profissoes.-=default": null }), 500);
            delete system.competencias.profissoes.default;
        }
        if (system.competencias?.idiomas?.default) {
            setTimeout(() => this.actor.update({ "system.competencias.idiomas.-=default": null }), 500);
            delete system.competencias.idiomas.default;
        }

        context.system = system;
        context.flags = this.actor.flags;

        const COMP_DEFAULTS = {
            'Aristocracia': 'carisma', 'Artimanha': 'reflexos', 'Atuação': 'carisma',
            'Condução': 'reflexos', 'Coordenação': 'reflexos', 'Dissimulação': 'carisma',
            'Esoterismo': 'mente', 'Esquiva': 'reflexos', 'Fortitude': 'fisico',
            'Manejo Animal': 'carisma', 'Medicina': 'mente', 'Sagacidade': 'mente', 
            'Sobrevivência': 'mente', 'Vontade': 'mente'
        };
        const compBonuses = system.competencias || {};
        const compAttrs = system.comp_attrs || {};
        
        const FIX_LIST = ['Artimanha', 'Condução', 'Coordenação', 'Esoterismo', 'Manejo Animal', 'Medicina', 'Sagacidade', 'Sobrevivência', 'Vontade'];
        let needsUpdate = false;
        let updateData = {};

        context.competencias = Object.keys(COMP_DEFAULTS).map(name => {
            let data = compBonuses[name];
            if (typeof data !== 'object' || data === null) {
                data = { treinamento: Number(data) || 0, avulso: 0, armadura: 0 };
            }

            let savedAttr = compAttrs[name];
            // Auto-fix para o bug antigo onde tudo foi setado para 'fisico'
            if (savedAttr === 'fisico' && FIX_LIST.includes(name)) {
                savedAttr = COMP_DEFAULTS[name];
                updateData[`system.comp_attrs.${name}`] = savedAttr;
                needsUpdate = true;
            }

            return {
                name,
                treinamento: data.treinamento ?? 0,
                avulso: data.avulso ?? 0,
                armadura: data.armadura ?? 0,
                atributo: savedAttr || COMP_DEFAULTS[name]
            };
        });

        if (needsUpdate && this.actor.isOwner) {
            setTimeout(() => {
                this.actor.update(updateData);
            }, 500);
        }

        if (system.competencias?.profissoes) {
            system.competencias.profissoes_names = {};
            for (let [id, val] of Object.entries(system.competencias.profissoes)) {
                system.competencias.profissoes_names[id] = val.name || "Nova Profissão";
            }
        }
        if (system.competencias?.idiomas) {
            system.competencias.idiomas_names = {};
            for (let [id, val] of Object.entries(system.competencias.idiomas)) {
                system.competencias.idiomas_names[id] = val.name || "Novo Idioma";
            }
        }

        context.enrichedNotas = await TextEditor.enrichHTML(system.notas || "", { async: true });
        context.enrichedLequeDestino = await TextEditor.enrichHTML(system.leque_destino || "", { async: true });

        // Add Handlebars helpers specifically here if needed, but usually registered globally.
        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.dice-container .dice-select-hidden').on('mousedown', this._onDiceMousedown.bind(this));
        
        if (!this.isEditable) return;

        html.find('.dice-container .dice-select-hidden').change(this._onDiceSelectChange.bind(this));
        html.find('.mini-dice-container .dice-select-hidden').change(this._onMiniDiceSelectChange.bind(this));
        
        html.find('.item-create').click(this._onItemCreate.bind(this));
        html.find('.item-edit').click(this._onItemEdit.bind(this));
        html.find('.item-delete').click(this._onItemDelete.bind(this));

        html.find('.item-roll').click(this._onItemRoll.bind(this));
        
        html.find('.comp-roll:not(.generic)').click(this._onCompRoll.bind(this));
        html.find('.generic-add').click(this._onAddGenericSkill.bind(this));
        html.find('.generic-delete').click(this._onDeleteGenericSkill.bind(this));
        html.find('.comp-roll.generic').click(this._onGenericCompRoll.bind(this));

    }

    _onDiceMousedown(event) {
        if (!event.shiftKey) return;
        event.preventDefault();
        event.stopPropagation();
        const container = event.currentTarget.closest('.dice-container');
        const attr = container.dataset.attr;
        const label = container.dataset.label || attr;
        this._rollAttribute(attr, label);
    }

    async _rollAttribute(attr, label) {
        const system = this.actor.system;
        const base = parseInt(system[attr]) || 0;
        const exp = parseInt(system[`${attr}_exp`]) || 0;
        const inc = parseInt(system[`${attr}_inc`]) || 0;
        const bonus = parseInt(system[`bonus_${attr}`]) || 0;

        let formula = `1d${base}`;
        if (exp > 0) formula += ` + 1d${exp}[exp]`;
        if (inc > 0) formula += ` - 1d${inc}[inc]`;
        if (bonus !== 0) formula += ` ${bonus > 0 ? '+' : ''}${bonus}`;

        return this._evaluateAndSendRoll(formula, `<b>${label}</b> (${formula})`);
    }

    async _onDiceSelectChange(event) {
        event.stopPropagation();
        const select = event.currentTarget;
        const newVal = parseInt(select.value);
        const fieldName = select.name;
        await this.actor.update({ [fieldName]: newVal });
        const container = select.closest('.dice-container');
        container.querySelector('.dice-svg').innerHTML = getDiceSvg(newVal);
        container.querySelector('.dice-label').textContent = newVal;
    }

    async _onMiniDiceSelectChange(event) {
        event.stopPropagation();
        const select = event.currentTarget;
        const newVal = parseInt(select.value) || 0;
        const fieldName = select.name;
        await this.actor.update({ [fieldName]: newVal });
        const container = select.closest('.mini-dice-container');
        const svgEl = container.querySelector('.dice-svg');
        svgEl.innerHTML = newVal > 0 ? getDiceSvg(newVal) : '<circle cx="50" cy="50" r="40" />';
        svgEl.classList.toggle('empty-dice', newVal === 0);
        container.querySelector('.mini-dice-label').textContent = newVal > 0 ? String(newVal) : '';
    }

    async _onItemCreate(event) {
        event.preventDefault();
        const type = event.currentTarget.dataset.type;
        return Item.create({ name: `Novo(a) ${type}`, type: type, system: {} }, { parent: this.actor });
    }

    _onItemEdit(event) {
        event.preventDefault();
        const li = $(event.currentTarget).closest(".item-row");
        const item = this.actor.items.get(li.data("item-id"));
        item.sheet.render(true);
    }

    _onItemDelete(event) {
        event.preventDefault();
        const li = $(event.currentTarget).closest(".item-row");
        const item = this.actor.items.get(li.data("item-id"));
        item.delete();
    }

    async _onItemRoll(event) {
        event.preventDefault();
        const btn = event.currentTarget;
        const type = btn.dataset.rollType;
        const li = $(btn).closest(".item-row");
        const item = this.actor.items.get(li.data("item-id"));
        if (!item) return;

        const system = this.actor.system;
        const iSystem = item.system;

        if (type === 'desc') {
            const desc = await TextEditor.enrichHTML(iSystem.descricao || "", { async: true });
            let propsHtml = '';
            
            if (item.type === 'ataque') {
                propsHtml = `
                    <div class="chat-card-props">
                        <div class="prop-item"><strong>Dano:</strong> ${iSystem.dano || '-'}</div>
                        <div class="prop-item"><strong>Categoria:</strong> ${iSystem.categoria || '-'}</div>
                        <div class="prop-item"><strong>Alcance:</strong> ${iSystem.alcance || '-'}</div>
                        <div class="prop-item"><strong>Margem:</strong> ${iSystem.margem || '20'}</div>
                        <div class="prop-item"><strong>Explosão:</strong> ${iSystem.explosivo || '-'}</div>
                        ${iSystem.propriedades ? `<div class="prop-item full-width"><strong>Propriedades:</strong> ${iSystem.propriedades}</div>` : ''}
                    </div>
                `;
            } else if (item.type === 'feitico') {
                propsHtml = `
                    <div class="chat-card-props">
                        <div class="prop-item"><strong>Escola:</strong> ${iSystem.escola || '-'}</div>
                        <div class="prop-item"><strong>Círculo:</strong> ${iSystem.circulo || '-'}</div>
                        <div class="prop-item"><strong>Tempo:</strong> ${iSystem.tempo_conjuracao || '-'}</div>
                        <div class="prop-item"><strong>Alcance:</strong> ${iSystem.alcance || '-'}</div>
                        <div class="prop-item"><strong>Alvo/Área:</strong> ${iSystem.alvo_area || '-'}</div>
                        <div class="prop-item"><strong>Duração:</strong> ${iSystem.duracao || '-'}</div>
                        ${iSystem.teste_resistencia ? `<div class="prop-item full-width"><strong>Resistência:</strong> ${iSystem.teste_resistencia}</div>` : ''}
                        ${iSystem.dano_cura ? `<div class="prop-item full-width"><strong>Dano/Cura:</strong> ${iSystem.dano_cura}</div>` : ''}
                    </div>
                `;
            } else if (item.type === 'habilidade') {
                propsHtml = `
                    <div class="chat-card-props">
                        <div class="prop-item"><strong>Tipo:</strong> ${iSystem.tipo || '-'}</div>
                        <div class="prop-item"><strong>Custo:</strong> ${iSystem.custo || '0'} ${String(iSystem.tipo_custo || 'PA').toUpperCase()}</div>
                        ${iSystem.teste ? `<div class="prop-item full-width"><strong>Teste:</strong> ${iSystem.teste}</div>` : ''}
                        ${iSystem.dano_efeito ? `<div class="prop-item full-width"><strong>Dano/Efeito:</strong> ${iSystem.dano_efeito}</div>` : ''}
                    </div>
                `;
            }
            
            let content = `
                <div class="giharad chat-card">
                    <h3 class="section-title">${item.name}</h3>
                    ${propsHtml}
                    <div class="card-content">
                        ${desc}
                    </div>
                </div>
            `;
            return ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: content,
                flavor: `Compartilhou ${item.name}`
            });
        }

        if (type === 'dano' || type === 'explosivo') {
            let formula = iSystem.dano || "0";
            
            // Dano de armas corpo-a-corpo soma os passos de bônus de Físico
            if (iSystem.alcance && iSystem.alcance.toLowerCase().includes('corpo')) {
                const fisBonus = parseInt(system.bonus_fisico) || 0;
                if (fisBonus > 0) formula += ` + ${fisBonus}`;
            }

            let flavor = `Dano de <b>${item.name}</b>`;
            
            if (type === 'explosivo') {
                const explNum = parseInt(String(iSystem.explosivo || "").replace(/\+/g, "").trim()) || 0;
                if (explNum > 0) {
                    formula = formula.replace(/(\d+)d(\d+)/i, (match, count, sides) => `${parseInt(count) + explNum}d${sides}`);
                    flavor = `🔥 Dano Crítico/Explosivo de <b>${item.name}</b>`;
                }
            }
            return this._evaluateAndSendRoll(formula, flavor);
        }

        const attrKey = iSystem.atributo || 'fisico';
        const attrVal = parseInt(system[attrKey]) || 4;
        const exp = system[`${attrKey}_exp`] || 0;
        const inc = system[`${attrKey}_inc`] || 0;
        const itemBonus = parseInt(iSystem.acerto) || parseInt(iSystem.bonus_ataque) || 0;

        let formula = `1d${attrVal}`;
        if (exp > 0) formula += ` + 1d${exp}[exp]`;
        if (inc > 0) formula += ` - 1d${inc}[inc]`;
        if (itemBonus !== 0) formula += ` ${itemBonus > 0 ? '+' : ''}${itemBonus}`;

        return this._evaluateAndSendRoll(formula, `Rolagem de <b>${item.name}</b>`);
    }

    async _onCompRoll(event) {
        event.preventDefault();
        const name = event.currentTarget.dataset.name;
        const system = this.actor.system;

        const compObj = system.competencias[name];
        const t = Number(compObj?.treinamento) || 0;
        const av = Number(compObj?.avulso) || 0;
        const ar = Number(compObj?.armadura) || 0;
        const compBonus = t + av - Math.abs(ar);

        const attrKey = system.comp_attrs?.[name] || 'fisico';
        const attrVal = parseInt(system[attrKey]) || 4;
        const attrBonus = parseInt(system[`bonus_${attrKey}`]) || 0;
        const exp = system[`${attrKey}_exp`] || 0;
        const inc = system[`${attrKey}_inc`] || 0;

        let formula = `1d${attrVal}`;
        if (exp > 0) formula += ` + 1d${exp}[exp]`;
        if (inc > 0) formula += ` - 1d${inc}[inc]`;

        const totalBonus = attrBonus + compBonus;
        if (totalBonus !== 0) formula += ` ${totalBonus > 0 ? '+' : ''}${totalBonus}`;

        return this._evaluateAndSendRoll(formula, `Teste de <b>${name}</b>`);
    }
    
    async _onGenericCompRoll(event) {
        event.preventDefault();
        const type = event.currentTarget.dataset.type;
        const id = event.currentTarget.dataset.id;
        const system = this.actor.system;
        
        const skillData = system.competencias[type]?.[id];
        if (!skillData) return;
        const name = skillData.name || (type === 'profissoes' ? 'Profissão' : 'Idioma');
        
        const compBonus = (Number(skillData.treinamento) || 0) + (Number(skillData.avulso) || 0) - Math.abs(Number(skillData.armadura) || 0);
        const attrMap = type === 'profissoes' ? 'prof_attrs' : 'idio_attrs';
        const attrKey = system.comp_attrs?.[attrMap]?.[id] || 'reflexos';
        const attrVal = parseInt(system[attrKey]) || 4;
        const exp = system[`${attrKey}_exp`] || 0;
        const inc = system[`${attrKey}_inc`] || 0;
        
        let formula = `1d${attrVal}`;
        if (exp > 0) formula += ` + 1d${exp}[exp]`;
        if (inc > 0) formula += ` - 1d${inc}[inc]`;
        if (compBonus !== 0) formula += ` ${compBonus > 0 ? '+' : ''}${compBonus}`;
        
        return this._evaluateAndSendRoll(formula, `Teste de <b>${name}</b>`);
    }

    async _onAddGenericSkill(event) {
        event.preventDefault();
        const type = event.currentTarget.dataset.type;
        const id = foundry.utils.randomID();
        const attrMap = type === 'profissoes' ? 'prof_attrs' : 'idio_attrs';
        await this.actor.update({
            [`system.competencias.${type}.${id}`]: { name: "", treinamento: 0, avulso: 0, armadura: 0 },
            [`system.comp_attrs.${attrMap}.${id}`]: type === 'profissoes' ? "mente" : "carisma"
        });
    }

    async _onDeleteGenericSkill(event) {
        event.preventDefault();
        const id = event.currentTarget.dataset.id;
        const type = event.currentTarget.dataset.type;
        const attrMap = type === 'profissoes' ? 'prof_attrs' : 'idio_attrs';
        await this.actor.update({
            [`system.competencias.${type}.-=${id}`]: null,
            [`system.comp_attrs.${attrMap}.-=${id}`]: null
        });
    }



    async _evaluateAndSendRoll(formula, flavor) {
        let baseRoll = new Roll(formula, this.actor.getRollData());
        await baseRoll.evaluate({ async: true });

        const isDamage = flavor.toLowerCase().includes('dano');
        const baseTerm = baseRoll.terms[0];
        
        // Estouro de Dado: Apenas no dado base (primeiro termo), apenas em testes (não em dano), e apenas uma vez.
        if (!isDamage && baseTerm && baseTerm.faces && baseTerm.results && baseTerm.results.length === 1) {
            if (baseTerm.results[0].result === baseTerm.faces) {
                let extraRoll = new Roll(`1d${baseTerm.faces}[Estouro]`);
                await extraRoll.evaluate({ async: true });
                
                // Marca o dado original como explodido visualmente
                baseTerm.results[0].exploded = true;
                
                // Cria os novos termos
                const opTerm = new OperatorTerm({operator: "+"});
                opTerm._evaluated = true;
                
                // Insere na rolagem base
                baseRoll.terms.push(opTerm);
                baseRoll.terms.push(extraRoll.terms[0]);
                
                baseRoll._total += extraRoll.total;
                baseRoll._formula += ` + 1d${baseTerm.faces}[Estouro]`;
                
                flavor = "💥 ESTOURO DE DADO! | " + flavor;
            }
        }

        await baseRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: flavor
        });
    }
}
