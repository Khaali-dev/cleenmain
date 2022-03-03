export default class CleenmainActor extends Actor {
    static async create(data, options) {
        super.create(data, options);
/*
        let createChanges = {};
        mergeObject(createChanges, {
          'token.disposition': CONST.TOKEN_DISPOSITIONS.NEUTRAL,
        });
        
        if (this.data.type === 'player') {
          createChanges.token.vision = true;
          createChanges.token.actorLink = true;
      
          let skillData = {
            name: game.i18n.localize('cleenmain.skill.autorite'),
            type: 'skill',
            data: {}
          };
          await Item.create(skillData, { parent: this }, { renderSheet: true });
        }
        console.log("createChanges",createChanges);
        this.data.update(createChanges);*/
    }

    prepareData(){
        super.prepareData();

        if(this.type === "npc"){
            let numberofplayers = game.settings.get('cleenmain', 'numberOfPlayers');
            let numberofplayersString="fivepcs";
            if (numberofplayers <= 2) numberofplayersString="twopcs";
            else if (numberofplayers == 3) numberofplayersString="threepcs";
            else if (numberofplayers == 4) numberofplayersString="fourpcs";
            
            if(this.data.data.level === "support"){
                this.data.data.health.value = this.data.data.health.max = 1;
            }
            else{
                console.log(this.data);
                let healthMax = this.data.data.healthsecondfiddle[numberofplayersString];
                if(this.data.data.level === "boss")  healthMax = healthMax*2;
                if(this.data.data.health.value === this.data.data.health.max){
                    this.data.data.health.value = this.data.data.health.max = healthMax;
                }
                else this.data.data.health.max = healthMax;
            }
        }
    }

    /* roll a player action
    arguments: {type: itemType, itemId}*/
    async roll(elements){
        let item = this.items.get(elements.itemId);
        if (typeof(item) === 'undefined') return;
        let skillData= {
            itemname: item.name,
            weaponRoll: false,
            modifierText: "",
            rollModifier: "",
            heroismText: ""
        };

        if (elements.type === "skill"){
            skillData.skillvalue = item.data.value;
        }
        //get the active token
        let tokenList = this.getActiveTokens();
        let actingToken = tokenList[0];
//if there is a token active for this actor, we use its name and image instead of the actor's
        skillData.actingCharName = actingToken?.data?.name ?? this.name;
        skillData.actingCharImg= actingToken?.data?.img ?? this.data.img;
        skillData.subImg = item.data.img;
        
        if(elements.type === "weapon"){
            skillData.weaponRoll = true;
            if(this.type="npc"){
                skillData.skillvalue = this.data.data.elite ? item.data.data.skillvaluenpcelite : item.data.skillvaluenpc;
            }
            else skillData.skillvalue = item.data.data.skillvalue;

            skillData.damageFormula=item.data.data.damage;
        } else skillData.skillvalue = item.data.data.value;
        skillData.skillRollFormula = "3d6 + " + skillData.skillvalue.toString();
        skillData.introText = game.i18n.format("cleenmain.dialog.intro", skillData);

        
        const html = await renderTemplate('systems/cleenmain/templates/chat/rollDialog.html', {
            skillData: skillData
        });

        let dialog = new Dialog({
            title: skillData.name,
            content: html,
            buttons: {
            roll: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize("cleenmain.dialog.button.roll"),
                callback: async (html) => {

                    let rollModifier = html.find("#rollmodifier")[0].value;
                    if(rollModifier.length > 0){
                        skillData.rollModifier = rollModifier ?? "";
                    }

                    skillData.useHeroism = html.find("#heroism")[0].checked;
            
                    let skillFormula = skillData.skillRollFormula;
                    if(skillData.rollModifier.length > 0){
                        skillFormula =+ " + " +skillData.rollModifier;
                        skillData.modifierText = game.i18n.localize("cleenmain.chatmessage.custommodifier", skillData);
                    }
                    
                    if(skillData.useHeroism){
                        skillFormula =+ " +1d6";
                        skillData.heroismText = game.i18n.localize("cleenmain.chatmessage.heroismmodifier", skillData);
                    }
                    skillData.skillRoll = new Roll(skillFormula).evaluate({async:false});
                    

                    const chatTemplate = await renderTemplate("systems/cleenmain/templates/chat/rollResult.html", {
                        skillData: skillData,
                    });
                    const chatData = {
                        user: game.user.id,
                        speaker: ChatMessage.getSpeaker({ 
                            alias: game.user.name
                        }),
                        rollMode: game.settings.get('core', 'rollMode'),    
                        content: chatTemplate
                    }

                    let NewMessage = await ChatMessage.create(chatData);


                },
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize("cleenmain.dialog.button.cancel"),
                callback: () => {},
            },
            },
            default: 'roll',
            close: () => {},
        });
        dialog.render(true);
    }
}
