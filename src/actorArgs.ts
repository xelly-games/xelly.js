import {ActorArgs, Collider, vec} from 'excalibur';
import {XellyContext} from './XellyContext';
import {convert} from './convert';
import {sprites} from './sprites';
import {colliders} from './colliders';

const fromPixelBasedArgs = <T extends Partial<ActorArgs>>(context: XellyContext, args: T): T => {
    const {x, y, pos, width, height, radius, vel, acc, offset} = args;
    return {...args,
        ...(x !== undefined ? {x: convert.toCssScale(context, x)} : {}),
        ...(y !== undefined ? {y: convert.toCssScale(context, y)} : {}),
        ...(pos !== undefined ? {pos: vec(convert.toCssScale(context, pos.x), convert.toCssScale(context, pos.y))} : {}),
        ...(width !== undefined ? {width: convert.toCssScale(context, width)} : {}),
        ...(height !== undefined ? {height: convert.toCssScale(context, height)} : {}),
        ...(radius !== undefined ? {radius: convert.toCssScale(context, radius)} : {}),
        ...(vel !== undefined ? {vel: vec(convert.toCssRate(context, vel.x), convert.toCssRate(context, vel.y))} : {}),
        ...(acc !== undefined ? {acc: vec(convert.toCssRate(context, acc.x), convert.toCssRate(context, acc.y))} : {}),
        ...(offset !== undefined ? {offset: vec(convert.toCssScale(context, offset.x), convert.toCssScale(context, offset.y))} : {})
    };
};

export type FromSpriteOptions = {
    readonly generatePolygonCollider?: boolean
};

export type ActorArgsFromSprite = {width?: number, height?: number} | {collider?: Collider};

const fromSprite = (context: XellyContext, sprite: [number, number][], options?: FromSpriteOptions): ActorArgsFromSprite => {
    if (options?.generatePolygonCollider === true) {
        const generated = colliders.generate(context, sprite);
        if (generated) {
            return {collider: generated};
        } else {
            console.warn('failed to generate polygon collider; falling back to width + height');
        }
    }
    return fromPixelBasedArgs(context, {
        width: sprites.width(sprite),
        height: sprites.height(sprite)
    });
};

export const actorArgs = {
    fromPixelBasedArgs,
    fromSprite
};
