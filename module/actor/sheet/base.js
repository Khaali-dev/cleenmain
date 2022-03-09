
export class BaseSheet extends ActorSheet {

    /**
     * @constructor
     * @param  {...any} args
     */
    constructor(...args) {
        super(...args);
        this.options.submitOnClose = true;
    }

    activateListeners(html){
        super.activateListeners(html);
        
        html.find(".item-create").click(this._onItemCreate.bind(this));
        html.find(".inline-edit").change(this._onEmbeddedItemEdit.bind(this));
        html.find("item-edit").click(this._onItemEdit.bind(this));
        html.find(".item-open-sheet").click(this._onItemEdit.bind(this));
        html.find(".inline-delete").click(this._onEmbeddedItemDelete.bind(this));
        html.find(".sheet-unlock").click(this._onSheetUnlock.bind(this));
        html.find(".item-roll").click(this._onItemRoll.bind(this));

    }
    _onItemCreate(event){
        event.preventDefault();
        let element = event.currentTarget;
        let newName = "New";
        switch (element.dataset.type){
          case "boon":
            newName = game.i18n.localize("cleenmain.boon.add");
            break;
          case "weapon":
            newName = game.i18n.localize("cleenmain.weapon.add");
            break;
          case "skill":
            newName = game.i18n.localize("cleenmain.skill.add");
            break;
          case "armor":
            newName = game.i18n.localize("cleenmain.armor.add");
            break;
          case "equipment":
            newName = game.i18n.localize("cleenmain.equipment.add");
            break;
          case "biodata":
            newName = game.i18n.localize("cleenmain.biodata.add");
            break;
        }
        
        let itemData = {
          name: newName,
          type: element.dataset.type
        }
        return(this.actor.createEmbeddedDocuments("Item", [itemData]));
    }
    
  _onEmbeddedItemEdit(event){
    event.preventDefault();
    let element = event.currentTarget;
    const itemId = element.id;
    let item = this.actor.items.get(itemId);
    let field = element.dataset.field;
    let newValue;
    if(element.type === "checkbox"){
      newValue = element.checked;
    }
    else newValue = element.value;
    return item.update({[field]: newValue});
  }
  
  _onItemEdit(event){
    event.preventDefault();
    let element= event.currentTarget;
    let itemId = element.dataset.id;
    let item = this.actor.items.get(itemId);
    item.sheet.render(true);
  }

  _ontrainingsEdit(event){
    event.preventDefault();
    let element=event.currentTarget;
    console.log("element: ", element);
    const itemId = element.id
    let item = this.actor.items.get(itemId);
    let field = element.dataset.field;
    let newValue;
    if(element.type === "checkbox"){
      newValue = element.value == "1";
    }
    else newValue = element.value
    return item.update({[field]: newValue});
  }

  _onEmbeddedItemDelete(event){
    event.preventDefault();
    let element=event.currentTarget;
    let itemId = element.dataset.id;
    return this.actor.deleteEmbeddedDocuments("Item", [itemId]);
  }

  async _onSheetUnlock(event){
    event.preventDefault();

    let flagData = await this.actor.getFlag(game.system.id, "SheetUnlocked");
    if(flagData){
        await this.actor.unsetFlag(game.system.id, "SheetUnlocked");
    }
    else{
        await this.actor.setFlag(game.system.id, "SheetUnlocked", "SheetUnlocked");
    }
    this.actor.sheet.render(true);
  }

  
  _onItemRoll(event){
    event.preventDefault();
    let element= event.currentTarget;
    let itemId = element.dataset.id;
    let itemType = element.dataset.type;
    let rolltype = element.dataset?.rolltype;
    this.actor.roll({type: itemType, itemId: itemId, rolltype: rolltype});
  }
}