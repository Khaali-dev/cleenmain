export default function registerSystemSettings() {

    game.settings.register('cleenmain', 'numberOfPlayers', {
        name: 'CLEENMAIN.options.numberofplayers.name',
        hint: 'CLEENMAIN.options.numberofplayers.hint',
        scope: 'world',
        config: true,
        default: "two",
        type: String,
        choices: {
            "two" : 'CLEENMAIN.options.numberofplayers.two',
            "three" : 'CLEENMAIN.options.numberofplayers.three',
            "four" : 'CLEENMAIN.options.numberofplayers.four',
            "five" : 'CLEENMAIN.options.numberofplayers.five'
        },
        onChange: value => {console.log('new numberOfPlayers',value);foundry.utils.debounce(() => window.location.reload(), 100)}
    });
    game.settings.register('cleenmain', 'advancedRules', {
        name: 'CLEENMAIN.options.advancedrules.name',
        hint: 'CLEENMAIN.options.advancedrules.hint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
        onChange: foundry.utils.debounce(() => window.location.reload(), 100)
    });
}