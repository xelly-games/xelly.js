import {XellyPixelScheme} from './XellyPixelScheme';
import {convert as internalConvert} from './internal/convert';
import {Color} from 'excalibur';

/** Sprite width in xelly pixels. */
const width = (vec: [number, number, Color?][]): number => {
    return vec.reduce((acc, [x, y, color]) => Math.max(acc, x), 0) + 1;
};

/** Sprite height in xelly pixels. */
const height = (vec: [number, number, Color?][]): number => {
    return vec.reduce((acc, [x, y, color]) => Math.max(acc, y), 0) + 1;
};

/** Sprite width in logical pixels. */
const widthLogical = width;
/** Sprite height in logical pixels. */
const heightLogical = height;

/** Sprite width in actual ("CSS") pixels. */
const widthCss = (vec: [number, number, Color?][], pixelScheme: XellyPixelScheme) => {
    return internalConvert.toCssScaleTrimmed(internalConvert.toPixelMetrics(pixelScheme), widthLogical(vec));
};

/** Sprite height in actual ("CSS") pixels. */
const heightCss = (vec: [number, number, Color?][], pixelScheme: XellyPixelScheme) => {
    return internalConvert.toCssScaleTrimmed(internalConvert.toPixelMetrics(pixelScheme), heightLogical(vec));
};

export const measure = {
    width, height,
    widthLogical, heightLogical,
    widthCss, heightCss
};
