import {XellyPixelScheme} from '../XellyPixelScheme';

export type PixelMetrics = {
    readonly cssDim: number,
    readonly cssMargin: number
};

const toPixelMetrics = (scheme: XellyPixelScheme): PixelMetrics => {
    switch (scheme) {
        case XellyPixelScheme.Px2_0:
            return { cssDim: 2, cssMargin: 0 };
        case XellyPixelScheme.Px2_1:
            return { cssDim: 2, cssMargin: 1 };
        case XellyPixelScheme.Px3_1:
            return { cssDim: 3, cssMargin: 1 };
        case XellyPixelScheme.Px3_0:
        default:
            return { cssDim: 3, cssMargin: 0 };
    }
};

// --

/** Example: if val is a width, say, then the css result would be the width including xelly pixel margins (if any). */
const toCssScale = (pm: PixelMetrics, val: number) => {
    return pm.cssMargin + val * (pm.cssDim + pm.cssMargin);
};

/** Example: if val is a width, say, then the css result would be the with any xelly pixel margins (if any) trimmed. */
const toCssScaleTrimmed = (pm: PixelMetrics, val: number) => {
    return val * (pm.cssDim + pm.cssMargin) - pm.cssMargin;
};

/** */
const toCssRate = (pm: PixelMetrics, val: number) => {
    return val * (pm.cssDim + pm.cssMargin);
};

export const convert = {toCssScale, toCssScaleTrimmed, toCssRate, toPixelMetrics};
