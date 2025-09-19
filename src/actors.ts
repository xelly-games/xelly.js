import {Actor, ActorArgs} from 'excalibur';
import {actorArgs, FromSpriteOptions} from './actorArgs';
import {GraphicOptions, graphics} from './graphics';
import {XellyContext} from './XellyContext';
import {create, LabelOptions} from './create';

/** @deprecated */
export type ActorArgsSansColliderArgs = Omit<ActorArgs, 'width' | 'height' | 'radius' | 'collider'>;

/** @deprecated */
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

/** @deprecated */
const fromText
    = (context: XellyContext, text: string, options?: GraphicOptions & FromSpriteOptions & LabelOptions, moreArgs?: ActorArgs) => {
    return fromSprite(context, create.label(text, options), options, moreArgs);
};

/** @deprecated */
export const actors = {fromSprite, fromText};
