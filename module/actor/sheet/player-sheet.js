import { CemBaseActorSheet } from "./base-sheet.js";
import { Skills } from "../../common/skills.js";

export default class PlayerSheet extends CemBaseActorSheet {
  /**
   * @constructor
   * @param  {...any} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @override
   */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      height: 750,
      width: 850,
      template: "systems/cleenmain/templates/actor/player.html",
      classes: ["cleenmain", "sheet", "actor", "player"],
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "boons" }],
      dragDrop: [{ dragSelector: ".draggable", dropSelector: ".droppable" }],
    });
  }

  /** @override */
  getData(options) {
    const context = super.getData(options);

    context.protection = this.actor.getArmorProtection();
    let defenceModifier = this.actor.getModifiers().find( modifier => modifier.type === "behaviour");
    context.defenceModifier = defenceModifier ? defenceModifier.value : 0;

    return context;
  }

  /** @override */
  activateListeners(html){
    super.activateListeners(html);

    html.find(".spend-heroism").click(this._onSpendHeroismOnePoint.bind(this));
    html.find(".spend-heroism").contextmenu(this._onSpendHeroismTwoPoints.bind(this));
  }

  /** @override */
  _onDrop(event) {
    event.preventDefault();
    if (!this.options.editable) return false;
    // Get dropped data
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch (err) {
      return false;
    }
    if (!data) return false;

    // Case 1 - Dropped Item
    if (data.type === "Item") {
      return this._onDropItem(event, data);
    }
    // Case 2 - Dropped Actor
    if (data.type === "Actor") {
      return false;
    }
  }

  /**
   * @name _onDropItem
   * @description Handle dropping of an item reference or item data onto an Item Sheet
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {Object} data         The data transfer extracted from the event
   * @private
   */
  _onDropItem(event, data) {
    Item.fromDropData(data).then((item) => {
      const itemData = duplicate(item.data);
      switch (itemData.type) {
        case "skill":
          return this._onDropSkillItem(event, itemData);
        default:
          return super._onDropItem(event, data);
      }
    });
  }

  /**
   * @name _onDropSkillItem
   * @description Handle the drop of a skill on a weapon item
   * @param {*} event
   * @param {*} itemData
   * @returns
   */
  _onDropSkillItem(event, itemData) {
    event.preventDefault();

    // Get the target
    const id = event.target.parentElement.dataset["itemId"];
    const target = this.actor.items.get(id);
    if (!target || target.type !== "weapon") return;
    let targetData = duplicate(target.data);
    targetData.data.skillName = itemData.name;
    targetData.data.skillValue = this.actor.getSkillValue(itemData);

    targetData.data.skillId = itemData._id;

    this.actor.updateEmbeddedDocuments("Item", [targetData]);
  }

  /**
   * 
   * @param {*} event 
   */
   _onSpendHeroismOnePoint(event) {
    event.preventDefault();
    this.actor.useHeroism(1);
  }

  /**
   * 
   * @param {*} event 
   */
   _onSpendHeroismTwoPoints(event) {
    event.preventDefault();
    this.actor.useHeroism(2);
  }

}
