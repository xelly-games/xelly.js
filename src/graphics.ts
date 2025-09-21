import {Color, Graphic, Raster, vec, Vector} from 'excalibur';
import {XellyContext} from './XellyContext';
import {XellyPixelScheme} from './XellyPixelScheme';
import {create, LabelOptions} from './create';
import {measure} from './measure';
import {
    convert as internalConvert,
    type PixelMetrics,
} from './internal/convert';

const DefaultColor = Color.Black;

type GraphicOptions = {
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

class InternalGraphic extends Raster {
    readonly sprite: [number, number, Color?][];
    readonly logicalSpriteWidth: number;
    readonly logicalSpriteHeight: number;
    readonly cssSpriteWidth: number;
    readonly cssSpriteHeight: number;
    readonly options?: GraphicOptions;
    readonly usePixelMetrics: PixelMetrics;

    constructor(sprite: [number, number, Color?][], options?: GraphicOptions) {
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

    public clone(): InternalGraphic {
        return new InternalGraphic(this.sprite, this.options);
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

// -- public --

const fromSpriteArray = (sprite: [number, number, Color?][], options?: GraphicOptions): Graphic => {
    return new InternalGraphic(sprite, options);
};

const fromText = (label: string, options?: GraphicOptions & LabelOptions): Graphic => {
    return fromSpriteArray(create.label(label, options), options);
};

const fromAscii = (ascii: string, palette?: Color[], options?: GraphicOptions): Graphic => {
    return fromSpriteArray(create.ascii(ascii, palette), options);
};

const circle = (radius: number, options?: GraphicOptions) => {
    return fromSpriteArray(create.circle(0, 0, radius), options);
};

// -- exports --

export {GraphicOptions};
export const graphics = {fromSpriteArray, fromText, fromAscii, circle};
