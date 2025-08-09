import {Graphic, Raster, Vector} from 'excalibur';
import {XellyContext} from './XellyContext';
import {convert} from './convert';
import {create, LabelOptions} from './create';
import {sprites} from './sprites';

type GraphicOptions = {
    // This just adds 2x the value to the width and/or height; positioning config
    // determines where the sprite is located (whether center or not); the
    // unit of this padding value is sprite/"xelly" pixels!
    readonly spritePadding?: Vector | number,
    readonly positioning?: {
        readonly anchor?: Vector,
        readonly fractionalOffset?: Vector
    },
    readonly fgColor?: 'positive' | 'negative',
    readonly fgAlpha?: number,
    readonly bgColor?: 'positive' | 'negative',
    readonly bgAlpha?: number,
    // borderWidth is default 0, draws with fgColor
    readonly borderWidth?: number
};

/** Internal. */
class InternalGraphic extends Raster {
    readonly context: XellyContext;
    readonly sprite: [number, number][];
    readonly options: GraphicOptions;
    readonly cssSpriteWidth: number;
    readonly cssSpriteHeight: number;

    constructor(context: XellyContext, sprite: [number, number][], options?: GraphicOptions) {
        const cssSpriteWidth = convert.toCssScaleTrimmed(context, sprites.width(sprite));
        const cssSpriteHeight = convert.toCssScaleTrimmed(context, sprites.height(sprite));
        const spritePaddingX = (typeof options?.spritePadding === 'number') ? options?.spritePadding : (options?.spritePadding?.x || 0);
        const spritePaddingY = (typeof options?.spritePadding === 'number') ? options?.spritePadding : (options?.spritePadding?.y || 0);
        const cssPaddingX = convert.toCssScale(context, spritePaddingX);
        const cssPaddingY = convert.toCssScale(context, spritePaddingY);
        const cssGraphicWidth = cssSpriteWidth + 2 * cssPaddingX;
        const cssGraphicHeight = cssSpriteHeight + 2 * cssPaddingY;
        super({
            quality: 1, // default
            smoothing: false, // default
            // note: we don't use other Raster options/features, b/c we take care of
            // concepts like padding, positioning on our own; we just need Raster
            // to setup the canvas with an explicit width and height and no other
            // matrix transforms, and we'll take care of it from there in execute()
            width: cssGraphicWidth,
            height: cssGraphicHeight,
        });
        this.context = context;
        this.sprite = sprite;
        // merge options with defaults so we don't have to check for undefined in logic
        this.options = {
            ...{
                fgColor: 'positive',
                fgAlpha: 1,
                bgColor: 'negative',
                bgAlpha: 0,
                borderWidth: 0
            },
            ...options,
            ...{positioning: { ...{ anchor: Vector.Zero, fractionalOffset: Vector.Zero },
                    ...(options?.positioning ? options.positioning : {}) }}
        };
        this.cssSpriteWidth = cssSpriteWidth;
        this.cssSpriteHeight = cssSpriteHeight;
    }

    public clone(): InternalGraphic {
        return new InternalGraphic(this.context, this.sprite, this.options);
    }

    execute(ctx: CanvasRenderingContext2D): void {
        if (this.options?.bgColor) {
            ctx.save();
            const useColor
                = (this.options.bgColor == 'positive' ? this.context.color.fg : this.context.color.bg).clone();
            useColor.a = this.options.bgAlpha!;
            ctx.fillStyle = useColor.toHex();
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.restore();
        }
        ctx.save();
        const useColor
            = (this.options.fgColor == 'negative' ? this.context.color.bg : this.context.color.fg).clone();
        useColor.a = this.options.fgAlpha!;
        ctx.fillStyle = useColor.toHex();
        if (this.options.borderWidth! > 0) {
            ctx.save();
            ctx.strokeStyle = useColor.toHex();
            ctx.lineWidth = convert.toCssScale(this.context, this.options.borderWidth!);
            ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, this.width - ctx.lineWidth * 2, this.height - ctx.lineWidth * 2);
            ctx.restore();
        }
        ctx.translate(
            this.options.positioning!.fractionalOffset!.x * this.width - this.cssSpriteWidth * this.options.positioning!.anchor!.x,
            this.options.positioning!.fractionalOffset!.y * this.height - this.cssSpriteHeight * this.options.positioning!.anchor!.y);
        blit_(this.context, this.sprite, ctx);
        ctx.restore();
    }

}

// -- public --

const fromSprite = (context: XellyContext, sprite: [number, number][], options?: GraphicOptions): Graphic => {
    return new InternalGraphic(context, sprite, options);
};

const fromText = (context: XellyContext, text: string, options?: GraphicOptions & LabelOptions) => {
    return fromSprite(context, create.label(text, options), options);
};

export {GraphicOptions};
export const graphics = {fromSprite, fromText};

// -- private --

const blit_
    = (context: XellyContext, sprite: [number, number][], ctx: CanvasRenderingContext2D) => {
    for (let i = 0; i < sprite.length; ++i) {
        const coord = sprite[i];
        const rectX = coord[0] * (context.onePixel.cssDim + context.onePixel.cssMargin);
        const rectY = coord[1] * (context.onePixel.cssDim + context.onePixel.cssMargin);
        ctx.fillRect(rectX, rectY, context.onePixel.cssDim, context.onePixel.cssDim);
        /*
        ctx.beginPath();
        ctx.rect(rectX, rectY, context.onePixel.cssDim, context.onePixel.cssDim);
        ctx.fill();
         */
        /*
        ctx.beginPath();
        ctx.moveTo(rectX, rectY);
        ctx.lineTo(rectX + context.onePixel.cssDim, rectY);
        ctx.lineTo(rectX + context.onePixel.cssDim, rectY + context.onePixel.cssDim);
        ctx.lineTo(rectX, rectY + context.onePixel.cssDim);
        ctx.closePath();
        ctx.fill();
        */
    }
};
