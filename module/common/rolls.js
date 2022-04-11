import { CemChat } from "./chat.js";

export class Rolls {

    /**
     * Rolls dices 
     * @param actor The actor which performs the action
     * @param item  The purpose of the action, that is the item, the attribute
     * @param type  The type of roll 
     * @param data  The action data
     */
       static async check(actor, item, type, data) {       
                
        let skillRoll = false;
        let attackRoll = false;
        let damageRoll = false;

        let titleDialog = "";
        let introText;
        let rollFormula;

        // Skill Roll
        if (type === "skill") {
            titleDialog += game.i18n.format("CLEENMAIN.dialog.titleskill", {itemName: item.name});
            skillRoll = true;
            rollFormula = "3d6 + " + item.data.data.value.toString();

            introText = game.i18n.format("CLEENMAIN.dialog.introskill", {actingCharName: data.actingCharacterName, itemName: item.name});

            // Check armors training
            if (item.data.data.physical) {
                const armorMalus = actor.getArmorMalus();
                if (armorMalus > 0) {
                    rollFormula = rollFormula.concat(' - ', armorMalus);
                } 
            }   

            if (actor.isPlayer() && actor.isInBadShape()) {
                rollFormula = rollFormula.concat(' - 2');
            }
        }

        // Attack roll
        if (type === "weapon-attack") {
            titleDialog += game.i18n.format("CLEENMAIN.dialog.titleweapon", {itemName: item.name});
            attackRoll = true;
            rollFormula = "3d6 + " + item.weaponSkill(actor);

            introText = game.i18n.format("CLEENMAIN.dialog.introweapon", {actingCharName: data.actingCharacterName, itemName: item.name});

            // Check weapons trainings
            if (item.data.data.category === "war") {
                if (!actor.data.data.trainings.weapons.war && !actor.data.data.trainings.weapons.heavy) {
                    data.difficulty = 1;
                    data.risk = 1;
                }
            }
            if (item.data.data.category === "heavy") {
                if (!actor.data.data.trainings.weapons.war && !actor.data.data.trainings.weapons.heavy) {
                    data.difficulty = 2;
                    data.risk = 1;
                }
                if (actor.data.data.trainings.weapons.war) {
                    data.difficulty = 1;
                    data.risk = 1;
                }
            }
        }

        // Damage roll
        if (type === "weapon-damage") {
            titleDialog += game.i18n.format("CLEENMAIN.dialog.titledamage", {itemName: item.name});
            damageRoll = true;
            rollFormula = item.weaponDamage(actor);
            
            introText = game.i18n.format("CLEENMAIN.dialog.introdamage", {actingCharName: data.actingCharacterName, itemName: item.name});
        }

        // Create the dialog panel to display.
        const html = await renderTemplate('systems/cleenmain/templates/chat/rollDialog.html', {
                actor: actor,
                item: item,
                type: type,
                action: data,
                introText: introText,
                actingCharImg: data.actingCharacterImage,
                isPlayer: actor.isPlayer(),
                rollFormula: rollFormula,
                skillRoll: skillRoll,
                attackRoll: attackRoll,
                damageRoll: damageRoll
        });

        // Display the action panel
        await new Dialog({
            title: titleDialog,
            content: html,
            buttons: {
                roll: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("CLEENMAIN.dialog.button.roll"),
                    callback: async (html) => {

                        data.skillRoll = skillRoll;
                        data.attackRoll = attackRoll;
                        data.damageRoll = damageRoll;

                        data.introText = introText;

                        data.applyModifiers = [];

                        // The optional modifier
                        const modifierInput = html.find("#rollmodifier")[0].value;
                        if (modifierInput !== "") {
                            data.modifier = parseInt(Math.floor(parseInt(modifierInput)));
                        }

                        data.formula = rollFormula;

                        if (data.modifier) {
                            data.formula = data.formula.concat(' + ', data.modifier.toString());
                            data.applyModifiers.push(game.i18n.format("CLEENMAIN.chatmessage.custommodifier", {rollModifier: data.modifier}));
                        }

                        // The optional heroism use
                        data.useHeroism = false;

                        if (html.find("#heroism")[0]?.checked) {
                            data.useHeroism = true;
                            data.formula = data.formula.concat(' + 1d6');
                            data.applyModifiers.push(game.i18n.format("CLEENMAIN.chatmessage.heroismmodifier"));
                            actor.useHeroism(1);
                        }

                        // Boons
                        if (attackRoll) {
                            let lethalattack = html.find("#lethalattack")[0].value;
                            data.lethalattack = parseInt(lethalattack) ?? 0;
                            if (data.lethalattack > 0) data.applyModifiers.push(game.i18n.format("CLEENMAIN.bonus.lethalattack.chatmessage", data));

                            let mutlipleattacks = html.find("#mutlipleattacks")[0].value;
                            data.mutlipleattacks = parseInt(mutlipleattacks) ?? 0;
                            if (data.mutlipleattacks > 0) data.applyModifiers.push(game.i18n.localize("CLEENMAIN.bonus.mutlipleattacks.chatmessage"));
                    
                            let efficiency = html.find("#efficiency")[0].value;
                            data.efficiency = parseInt(efficiency) ?? 0;
                            if (data.efficiency > 0) {
                                data.formula = data.formula.concat(' + ').concat((data.efficiency*2).toString());
                                data.applyModifiers.push(game.i18n.format("CLEENMAIN.bonus.efficiency.chatmessage", data));
                            }
                    
                            let caution = html.find("#caution")[0].value;
                            data.caution = parseInt(caution) ?? 0;
                            if (data.caution > 0) data.applyModifiers.push(game.i18n.format("CLEENMAIN.bonus.caution.chatmessage", data));
                    
                            if (game.settings.get('cleenmain', 'advancedRules')) {
                                let quick = html.find("#quick")[0].value;
                                data.quick = parseInt(quick) ?? 0;
                                if (data.quick > 0) data.applyModifiers.push(game.i18n.format("CLEENMAIN.bonus.quick.chatmessage"));
                            }
  
                            let minorinjury = html.find("#minorinjury")[0].value;
                            data.minorinjury = parseInt(minorinjury) ?? 0;
                            if (data.minorinjury > 0) data.applyModifiers.push(game.i18n.format("CLEENMAIN.penalty.minorinjury.chatmessage"));
                    
                            let danger = html.find("#danger")[0].value;
                            data.danger = parseInt(danger) ?? 0;
                            if (data.danger > 0) data.applyModifiers.push(game.i18n.format("CLEENMAIN.penalty.danger.chatmessage", data));
                    
                            let difficulty = html.find("#difficulty")[0].value;
                            data.difficulty = parseInt(difficulty) ?? 0;
                            if (data.difficulty > 0)  {
                                data.formula = data.formula.concat(' - ').concat((data.difficulty*2).toString());
                                data.applyModifiers.push(game.i18n.format("CLEENMAIN.penalty.difficulty.chatmessage", data));
                            }                                
                    
                            let risk = html.find("#risk")[0].value;
                            data.risk = parseInt(risk) ?? 0;
                            if (data.risk > 0) data.applyModifiers.push(game.i18n.format("CLEENMAIN.penalty.risk.chatmessage", data));
                    
                            if (game.settings.get('cleenmain', 'advancedRules')) {
                                let slowness = html.find("#slowness")[0].value;
                                data.slowness = parseInt(slowness) ?? 0;
                                if (data.slowness > 0) data.applyModifiers.push(game.i18n.localize("CLEENMAIN.penalty.slowness.chatmessage"));
                            }

                        }

                        // Status
                        if (actor.isPlayer() && actor.isInBadShape()) {
                            data.formula = data.formula.concat(' - 2 ');
                            data.applyModifiers.push(game.i18n.localize("CLEENMAIN.health.status.badshape"));
                        }

                        // Calculate the final difficulty
                        // data.difficulty = parseInt(data.difficulty) + (isNaN(modifier) ? 0 : modifier) + (skipWoundModifier ? 0 : woundModifier) + additionalKa + approche;

                        // Process to the roll
                        await Rolls.displayRoll(actor, item, data);

                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("Abandonner"),
                    callback: () => { },
                },
            },
            default: "roll",
            close: () => { },

        }).render(true);
    }

    /**
     * This method is used to display a roll result.
     * @param {*} actor    The actor which performs the action.
     * @param {*} item     The purpose of the action, that is the item, the attribute or the ka. 
     * @param {*} data 
     */
     static async displayRoll(actor, item, data) {

        // Roll the dice
        const result = await Rolls.getRollResult({
            actor: actor.id,
            alias: actor.name,
            scene: null,
            token: null,
        }, data.formula, data.difficulty);

        // Calculate damages
        let otherRollTooltip = "";
        let attackDamage = null;

        if (item.type === "weapon") {
            if (actor.type === "player") {
                attackDamage = item.calculateWeaponDamageForPlayer(actor, result.dices, data.useHeroism, data.lethalattack);
                
            }
            if (actor.type === "npc") {
                attackDamage = item.calculateWeaponDamageForNpc(actor);
            }     
            if (attackDamage.otherRoll !== null) {
                otherRollTooltip = new Handlebars.SafeString(await attackDamage.otherRoll.getTooltip());
            }     
        }  
          
        // Display the roll action
        await new CemChat(actor)
            .withTemplate("systems/cleenmain/templates/chat/rollResult.html")
            .withData({
                actor: actor,
                item: item,
                difficulty: data.difficulty,
                introText: data.introText,
                actingCharImg: data.actingCharacterImage,
                formula: data.formula,
                applyModifiers: data.applyModifiers,
                result: result,
                damage: attackDamage?.damage,
                otherRollTooltip: otherRollTooltip,
                skillRoll: data.skillRoll,
                attackRoll: data.attackRoll,
                damageRoll: data.damageRoll
            })
            .withRoll(true)
            .create();        
    }

    /**
     * Rolls dices and displays the specified message and returns the result.
     * @param {*} speaker 
     * @param {*} difficulty 
     * @returns the roll result. 
     */
     static async getRollResult(speaker, formula, difficulty) {
        const roll = new Roll(formula, {}).roll({ async: false });
        // const tp = await roll.getTooltip();
        // await roll.toMessage({ speaker: speaker }, { async: true });
        // await new Promise(r => setTimeout(r, 2000));
        return Rolls.getResult(roll, difficulty);
    }

    /**
     * @param {*} roll  The roll value is several d6
     * @param {*} difficulty The difficulty to succeed
     * @return the roll result
     */
     static async getResult(roll, difficulty) {
        /*
        const fail = roll === 100 || (roll > (level * 10) && roll !== 1);
        const fumble = Rolls.isDouble(roll) && fail;
        const critical = Rolls.isDouble(roll) && !fail;
        */
        const critical = Rolls._isTriple(roll,1);
        const fumble = Rolls._isTriple(roll,6);
        let toolTip = new Handlebars.SafeString(await roll.getTooltip());

        let dices = [];
        for (let index = 0; index < roll.dice.length; index++) {
            const dice = roll.dice[index];
            dices.push(...dice.results);
        }

        return {
            /*success: !fail,*/
            fumble: fumble,
            critical: critical,
            total: roll._total,
            tooltip: toolTip,
            dices: dices
        }
    }

    /**
     * 
     * @param {*} roll 
     * @param {*} value 
     * @returns 
     */
    static _isTriple(roll, value) {
        if (roll.dice[0].results[0] == value && roll.dice[0].results[1] == value && roll.dice[0].results[2] == value) return true;
        return false;
    }

}