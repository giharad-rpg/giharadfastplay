const CLASS_DATA = {
    "Combatente": { pv: 6, pa: 5 },
    "Mentor": { pv: 4, pa: 6 },
    "Conjurador": { pv: 4, pa: 3 },
    "Zelote": { pv: 5, pa: 4 }
};

export class GiharadActor extends Actor {
    prepareData() {
        super.prepareData();
    }

    prepareDerivedData() {
        const actorData = this;
        if (actorData.type === 'character') {
            this._prepareCharacterData(actorData);
        }
    }

    _getPassos(valor) {
        valor = parseInt(valor) || 4;
        if (valor >= 20) return 5;
        if (valor >= 12) return 4;
        if (valor >= 10) return 3;
        if (valor >= 8) return 2;
        if (valor >= 6) return 1;
        return 0;
    }

    _prepareCharacterData(actorData) {
        const system = actorData.system;

        // Migração para personagens antigos
        if (system.presenca !== undefined && system.mente === undefined) system.mente = system.presenca;
        if (system.astucia !== undefined && system.reflexos === undefined) system.reflexos = system.astucia;

        // Migração de competências erradas
        if (system.competencias) {
            if (system.competencias['Robustez'] && !system.competencias['Fortitude']) {
                system.competencias['Fortitude'] = system.competencias['Robustez'];
                delete system.competencias['Robustez'];
            }
            if (system.competencias['Vigor'] && !system.competencias['Fortitude']) {
                system.competencias['Fortitude'] = system.competencias['Vigor'];
                delete system.competencias['Vigor'];
            }
            if (system.competencias['Ímpeto'] && !system.competencias['Vontade']) {
                system.competencias['Vontade'] = system.competencias['Ímpeto'];
                delete system.competencias['Ímpeto'];
            }
        }

        // Default Attributes
        system.fisico = system.fisico || 4;
        system.mente = system.mente || 4;
        system.carisma = system.carisma || 4;
        system.reflexos = system.reflexos || 4;

        const nivel = parseInt(system.nivel) || 1;
        const classe = system.classe;

        // Fadiga, Morte e Cicatrizes são apenas marcadores visuais. Nenhuma alteração nos dados.

        const db = parseInt(system.defesa_base);
        system.defesa_base = isNaN(db) ? 0 : db;
        
        const manualBonus = parseInt(system.defesa_bonus) || 0;
        const manualPenalty = parseInt(system.defesa_penalidade) || 0;

        system.defesa = system.defesa_base + manualBonus - manualPenalty;

        // CD Feitiço
        const attrName = system.atributo_chave || 'reflexos';
        system.cd_feitico = attrName.charAt(0).toUpperCase() + attrName.slice(1);

        // PV, PA, PG, PH
        if (CLASS_DATA[classe]) {
            const data = CLASS_DATA[classe];
            const pFis = parseInt(system.fisico) || 4;
            const passosFis = this._getPassos(pFis);

            system.pv.max = (data.pv + passosFis) * nivel + (parseInt(system.pv.bonus) || 0);
            system.pa.max = data.pa * nivel + (parseInt(system.pa.bonus) || 0);
        }

        system.pg.max = (nivel * 2) + (parseInt(system.pg.bonus) || 0);
        system.ph.max = (nivel * 2) + (parseInt(system.ph.bonus) || 0);

        // Competências Base Total
        if (system.competencias) {
            const defaultAttrs = {
                'Artimanha': 'reflexos', 'Condução': 'reflexos', 'Coordenação': 'reflexos',
                'Esoterismo': 'mente', 'Manejo Animal': 'carisma', 'Medicina': 'mente', 
                'Sagacidade': 'mente', 'Sobrevivência': 'mente', 'Vontade': 'mente',
                'Aristocracia': 'carisma', 'Atuação': 'carisma', 'Dissimulação': 'carisma',
                'Esquiva': 'reflexos', 'Fortitude': 'fisico'
            };

            for (let [key, comp] of Object.entries(system.competencias)) {
                if (key === 'profissoes' || key === 'idiomas') continue;
                
                // Bugfix migration: if the actor has 'fisico' saved for a skill that shouldn't be 'fisico'
                // due to an old bug, forcefully reset it to the default.
                if (system.comp_attrs && system.comp_attrs[key] === 'fisico' && defaultAttrs[key] && defaultAttrs[key] !== 'fisico') {
                    system.comp_attrs[key] = defaultAttrs[key];
                }

                let attrBaseKey = system.comp_attrs ? (system.comp_attrs[key] || defaultAttrs[key] || 'reflexos') : 'reflexos';
                let attrBaseVal = parseInt(system[attrBaseKey]) || 4;
                let treinamento = parseInt(comp.treinamento) || 0;
                comp.total = attrBaseVal + treinamento + (parseInt(comp.avulso) || 0);
            }
        }

        this._prepareSpellSlots(system, classe, nivel);
        this._prepareInventoryData(actorData);
    }

    _prepareInventoryData(actorData) {
        const system = actorData.system;
        let totalWeight = 0;
        for (let item of this.items) {
            if (item.type === 'item') {
                const q = Number(item.system.qtd ?? 1);
                const p = Number(item.system.espacos ?? 0);
                totalWeight += q * p;
            }
        }

        const fisico = parseInt(system.fisico) || 4;
        const passosFis = this._getPassos(fisico);
        const bonusCarga = parseInt(system.carga?.bonus) || 0;
        const capacity = 10 + (2 * passosFis) + bonusCarga;

        system.carga = {
            value: Number(totalWeight.toFixed(1)),
            max: capacity,
            pct: Math.min(100, (totalWeight / capacity) * 100),
            isOverloaded: totalWeight > capacity,
            bonus: bonusCarga
        };
    }

    _prepareSpellSlots(system, classe, nivel) {
        if (classe !== "Conjurador" && classe !== "Zelote") {
            for (let i = 1; i <= 6; i++) {
                if (system.slots[`l${i}`]) system.slots[`l${i}`].max = 0;
            }
            return;
        }

        const tabelaMagia = {
            1:  [2, 0, 0, 0, 0, 0],
            2:  [3, 1, 0, 0, 0, 0],
            3:  [4, 2, 0, 0, 0, 0],
            4:  [4, 3, 0, 0, 0, 0],
            5:  [4, 3, 0, 0, 0, 0],
            6:  [4, 3, 1, 0, 0, 0],
            7:  [4, 3, 2, 0, 0, 0],
            8:  [4, 3, 3, 0, 0, 0],
            9:  [4, 3, 3, 1, 0, 0],
            10: [4, 3, 3, 2, 0, 0],
            11: [5, 4, 3, 2, 0, 0],
            12: [5, 4, 4, 2, 1, 0],
            13: [5, 4, 4, 3, 1, 0],
            14: [6, 5, 4, 3, 2, 0],
            15: [6, 5, 5, 4, 2, 1],
            16: [6, 5, 5, 4, 3, 1],
            17: [7, 6, 5, 4, 3, 2],
            18: [7, 6, 6, 5, 3, 2],
            19: [7, 6, 6, 5, 4, 2],
            20: [7, 6, 6, 5, 4, 3]
        };

        const slots = tabelaMagia[nivel] || [0, 0, 0, 0, 0, 0];
        for (let i = 1; i <= 6; i++) {
            if (system.slots && system.slots[`l${i}`]) {
                system.slots[`l${i}`].max = slots[i - 1];
            }
        }
    }

    getRollData() {
        return foundry.utils.deepClone(this.system);
    }
}
