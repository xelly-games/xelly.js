import {GraphicOptions, graphics} from './graphics';
import {LabelOptions, create} from './create';
import {Actor, ActorArgs, Color} from 'excalibur';

const fromSpriteArray = (sprite: [number, number, Color?][], options?: ActorArgs & GraphicOptions): Actor => {
    const actor = new Actor(options);
    const graphic = graphics.fromSpriteArray(sprite, options);
    actor.graphics.use(graphic);
    return actor;
};

const fromText = (label: string, options?: ActorArgs & GraphicOptions & LabelOptions): Actor => {
    const actor = new Actor(options);
    const graphic = graphics.fromText(label, options);
    actor.graphics.use(graphic);
    return actor;
};

const fromAscii = (ascii: string, palette?: Color[], options?: ActorArgs & GraphicOptions): Actor => {
    const actor = new Actor(options);
    const graphic = graphics.fromAscii(ascii, palette, options);
    actor.graphics.use(graphic);
    return actor;
};

export const actors = {fromSpriteArray, fromText, fromAscii};
