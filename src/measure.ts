import {XellyPixelScheme} from './XellyPixelScheme';
import {sprites} from './sprites';
import {convert as internalConvert} from './internal/convert';
import {Color} from 'excalibur';

/** @deprecated Sprite width in logical pixels. */
const width = sprites.width;
/** @deprecated Sprite height in logical pixels. */
const height = sprites.height;

/** Sprite width in logical pixels. */
const widthLogical = width;
/** Sprite height in logical pixels. */
const heightLogical = width;

/** Sprite width in actual ("CSS") pixels. */
const widthCss = (vec: [number, number, Color?][], pixelScheme: XellyPixelScheme) => {
    return internalConvert.toCssScaleTrimmed(internalConvert.toPixelMetrics(pixelScheme), widthLogical(vec));
};

/** Sprite height in actual ("CSS") pixels. */
const heightCss = (vec: [number, number, Color?][], pixelScheme: XellyPixelScheme) => {
    return internalConvert.toCssScaleTrimmed(internalConvert.toPixelMetrics(pixelScheme), heightLogical(vec));
};

export const measure = {width, height, widthLogical, heightLogical, widthCss, heightCss};
