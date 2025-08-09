import {Actor} from 'excalibur';
import {XellyContext} from './XellyContext';
import {FromSpriteOptions, actorArgs} from './actorArgs';
import {ActorArgsSansColliderArgs} from './actors';
import {GraphicOptions, graphics} from './graphics';

/** Useful for games that want to extend custom classes from Actor (instead of using
 * fromSprite utilities directly. */
export class XellySpriteActor extends Actor {

    readonly context: XellyContext;

    constructor(baseArgs: ActorArgsSansColliderArgs, context: XellyContext, sprite: [number, number][], options?: GraphicOptions & FromSpriteOptions) {
        super({
            ...baseArgs,
            ...actorArgs.fromSprite(context, sprite, options)
        });
        this.graphics.use(graphics.fromSprite(context, sprite, options));
        this.context = context;
    }

}
