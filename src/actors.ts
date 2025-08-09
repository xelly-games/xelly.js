import {Actor, ActorArgs} from 'excalibur';
import {actorArgs, FromSpriteOptions} from './actorArgs';
import {GraphicOptions, graphics} from './graphics';
import {XellyContext} from './XellyContext';
import {create, LabelOptions} from './create';

export type ActorArgsSansColliderArgs = Omit<ActorArgs, 'width' | 'height' | 'radius' | 'collider'>;

const fromSprite
    = (context: XellyContext, sprite: [number, number][], options?: GraphicOptions & FromSpriteOptions, moreArgs?: ActorArgsSansColliderArgs): Actor => {
    const actor = new Actor({
        ...actorArgs.fromSprite(context, sprite, options),
        ...moreArgs
    });
    const graphic = graphics.fromSprite(context, sprite, options);
    actor.graphics.use(graphic);
    return actor;
};

const fromText
    = (context: XellyContext, text: string, options?: GraphicOptions & FromSpriteOptions & LabelOptions, moreArgs?: ActorArgs) => {
    return fromSprite(context, create.label(text, options), options, moreArgs);
};

export const actors = {fromSprite, fromText};
