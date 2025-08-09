import {XellyContext} from './XellyContext';

// -- to css scales --

/** Example: if val is a width, say, then the css result would be the width including xelly pixel margins (if any). */
const toCssScale = (context: XellyContext, val: number) => {
    return context.onePixel.cssMargin + val * (context.onePixel.cssDim + context.onePixel.cssMargin);
};

/** Example: if val is a width, say, then the css result would be the with any xelly pixel margins (if any) trimmed. */
const toCssScaleTrimmed = (context: XellyContext, val: number) => {
    return val * (context.onePixel.cssDim + context.onePixel.cssMargin) - context.onePixel.cssMargin;
};

const toCssRate = (context: XellyContext, val: number) => {
    return val * (context.onePixel.cssDim + context.onePixel.cssMargin);
};

// -- exports --

export const convert = {toCssScale, toCssScaleTrimmed, toCssRate};
