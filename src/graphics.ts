import {Color, Graphic, Raster, vec, Vector} from 'excalibur';
import {XellyContext} from './XellyContext';
import {XellyPixelScheme} from './XellyPixelScheme';
import {convert as legacyConvert} from './convert';
import {create, LabelOptions} from './create';
import {sprites} from './sprites';
import {measure} from './measure';
import {
    convert as internalConvert,
    type PixelMetrics,
} from './internal/convert';

// -- deprecated/legacy --

/** @deprecated */
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

/** Internal. @deprecated */
class InternalGraphic extends Raster {
    readonly context: XellyContext;
    readonly sprite: [number, number][];
    readonly options: GraphicOptions;
    readonly cssSpriteWidth: number;
    readonly cssSpriteHeight: number;

    constructor(context: XellyContext, sprite: [number, number][], options?: GraphicOptions) {
        const cssSpriteWidth = legacyConvert.toCssScaleTrimmed(context, sprites.width(sprite));
        const cssSpriteHeight = legacyConvert.toCssScaleTrimmed(context, sprites.height(sprite));
        const spritePaddingX = (typeof options?.spritePadding === 'number') ? options?.spritePadding : (options?.spritePadding?.x || 0);
        const spritePaddingY = (typeof options?.spritePadding === 'number') ? options?.spritePadding : (options?.spritePadding?.y || 0);
        const cssPaddingX = legacyConvert.toCssScale(context, spritePaddingX);
        const cssPaddingY = legacyConvert.toCssScale(context, spritePaddingY);
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
            ...{
                positioning: {
                    ...{anchor: Vector.Zero, fractionalOffset: Vector.Zero},
                    ...(options?.positioning ? options.positioning : {})
                }
            }
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
            ctx.lineWidth = legacyConvert.toCssScale(this.context, this.options.borderWidth!);
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

// -- new --

const DefaultColor = Color.Black;

type GraphicOptions2 = {
    readonly color?: Color,
    readonly backgroundPixelColor?: Color,
    readonly backgroundColor?: Color,
    readonly pixelScheme?: XellyPixelScheme, // see DefaultPixelMetrics
    readonly cssWidthAndHeightOverride?: Vector | ((cssWidthAndHeight: Vector) => Vector),
    readonly anchor?: Vector, // default is Vector.Half
    readonly cssPosition?: Vector, // default is Vector.Half
    readonly borderColor?: Color,
    readonly borderWidth?: number,
    readonly borderRadius?: number,
    readonly quality?: number,
};

class InternalGraphic2 extends Raster {
    readonly sprite: [number, number, Color?][];
    readonly logicalSpriteWidth: number;
    readonly logicalSpriteHeight: number;
    readonly cssSpriteWidth: number;
    readonly cssSpriteHeight: number;
    readonly options?: GraphicOptions2;
    readonly usePixelMetrics: PixelMetrics;

    constructor(sprite: [number, number, Color?][], options?: GraphicOptions2) {
        const usePixelMetrics = internalConvert.toPixelMetrics(options?.pixelScheme ?? XellyPixelScheme.Px3_0);
        const logicalSpriteWidth = measure.width(sprite);
        const logicalSpriteHeight = measure.height(sprite);
        const cssSpriteWidth = internalConvert.toCssScaleTrimmed(usePixelMetrics, logicalSpriteWidth);
        const cssSpriteHeight = internalConvert.toCssScaleTrimmed(usePixelMetrics, logicalSpriteHeight);
        let useCssWidthAndHeight: Vector;
        if (options?.cssWidthAndHeightOverride && typeof options?.cssWidthAndHeightOverride === 'function') {
            useCssWidthAndHeight = options?.cssWidthAndHeightOverride?.(vec(cssSpriteWidth, cssSpriteHeight));
        } else if (options?.cssWidthAndHeightOverride instanceof Vector) {
            useCssWidthAndHeight = options.cssWidthAndHeightOverride;
        } else {
            useCssWidthAndHeight = vec(cssSpriteWidth, cssSpriteHeight);
        }
        super({
            quality: options?.quality ?? 1,
            smoothing: false, // default
            // note: we don't use other Raster options/features, b/c we take care of
            // concepts like padding, positioning on our own; we just need Raster
            // to setup the canvas with an explicit width and height and no other
            // matrix transforms, and we'll take care of it from there in execute()
            width: useCssWidthAndHeight.x,
            height: useCssWidthAndHeight.y,
        });
        this.sprite = sprite;
        this.logicalSpriteWidth = logicalSpriteWidth;
        this.logicalSpriteHeight = logicalSpriteHeight;
        this.cssSpriteWidth = cssSpriteWidth;
        this.cssSpriteHeight = cssSpriteHeight;
        this.options = options;
        this.usePixelMetrics = usePixelMetrics;
    }

    public clone(): InternalGraphic2 {
        return new InternalGraphic2(this.sprite, this.options);
    }

    execute(ctx: CanvasRenderingContext2D): void {
        if (this.options?.backgroundColor && !this.options?.borderWidth) {
            ctx.save();
            ctx.fillStyle = this.options.backgroundColor.toHex();
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.restore();
        } else if (this.options?.borderWidth) {
            ctx.save();
            if (this.options?.borderRadius) {
                ctx.beginPath();
                ctx.lineWidth = this.options.borderWidth;
                // Inset your rect: shrink x,y,w,h by half the lineWidth, so the
                //   stroke stays inside the drawing arena.
                ctx.roundRect(ctx.lineWidth / 2, ctx.lineWidth / 2, this.width - ctx.lineWidth, this.height - ctx.lineWidth, this.options.borderRadius);
                if (this.options?.backgroundColor) {
                    ctx.fillStyle = this.options.backgroundColor.toHex();
                    ctx.fill();
                }
                ctx.strokeStyle = this.options.borderColor?.toHex() ?? DefaultColor.toHex();
                ctx.stroke();
            } else { // no borderRadius
                ctx.beginPath();
                ctx.lineWidth = this.options.borderWidth;
                ctx.rect(0, 0, this.width, this.height);
                if (this.options?.backgroundColor) {
                    ctx.fillStyle = this.options.backgroundColor.toHex();
                    ctx.fill();
                }
                ctx.strokeStyle = this.options.borderColor?.toHex() ?? DefaultColor.toHex();
                ctx.stroke();
            }
            ctx.restore();
        }
        ctx.save();
        const useForegroundPixelColorHex
            = (this.options?.color ?? DefaultColor).toHex();
        ctx.fillStyle = useForegroundPixelColorHex;
        const useAnchor = this.options?.anchor ?? Vector.Half;
        const useCssPosition = this.options?.cssPosition ?? vec(this.width / 2, this.height / 2);
        ctx.translate(
            Math.round(useCssPosition.x - useAnchor.x * this.cssSpriteWidth),
            Math.round(useCssPosition.y - useAnchor.y * this.cssSpriteHeight));
        const coordSet = new Set<string>();
        // blit (foreground pixels):
        for (let i = 0; i < this.sprite.length; ++i) {
            const [x, y, color] = this.sprite[i];
            coordSet.add(`${x},${y}`);
            ctx.fillStyle = color?.toHex() ?? useForegroundPixelColorHex;
            const rectX = x * (this.usePixelMetrics.cssDim + this.usePixelMetrics.cssMargin);
            const rectY = y * (this.usePixelMetrics.cssDim + this.usePixelMetrics.cssMargin);
            ctx.fillRect(rectX, rectY, this.usePixelMetrics.cssDim, this.usePixelMetrics.cssDim);
        }
        // blit (background pixels):
        if (this.options?.backgroundPixelColor) {
            ctx.fillStyle = this.options.backgroundPixelColor.toHex();
            for (let x = 0; x < this.logicalSpriteWidth; ++x) {
                for (let y = 0; y < this.logicalSpriteHeight; ++y) {
                    if (!coordSet.has(`${x},${y}`)) {
                        const rectX = x * (this.usePixelMetrics.cssDim + this.usePixelMetrics.cssMargin);
                        const rectY = y * (this.usePixelMetrics.cssDim + this.usePixelMetrics.cssMargin);
                        ctx.fillRect(rectX, rectY, this.usePixelMetrics.cssDim, this.usePixelMetrics.cssDim);
                    }
                }
            }
        }
        //
        ctx.restore();
    }

}

// -- public (deprecated) --

/** @deprecated */
const fromSprite = (context: XellyContext, sprite: [number, number][], options?: GraphicOptions): Graphic => {
    return new InternalGraphic(context, sprite, options);
};

/** @deprecated */
const fromText = (context: XellyContext, text: string, options?: GraphicOptions & LabelOptions) => {
    return fromSprite(context, create.label(text, options), options);
};

// -- public (new) --

const fromSpriteArray = (sprite: [number, number, Color?][], options?: GraphicOptions2): Graphic => {
    return new InternalGraphic2(sprite, options);
};

// todo fromText, fromAscii, rect ?? etc... and update game examples

// -- exports --

export {GraphicOptions};
export const graphics = {fromSprite, fromText, fromSpriteArray};

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
