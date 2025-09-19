import {XellyContext} from './XellyContext';

// -- to css scales --

/** Example: if val is a width, say, then the css result would be the width including xelly pixel margins (if any). @deprecated */
const toCssScale = (context: XellyContext, val: number) => {
    return context.onePixel.cssMargin + val * (context.onePixel.cssDim + context.onePixel.cssMargin);
};

/** Example: if val is a width, say, then the css result would be the with any xelly pixel margins (if any) trimmed. @deprecated */
const toCssScaleTrimmed = (context: XellyContext, val: number) => {
    return val * (context.onePixel.cssDim + context.onePixel.cssMargin) - context.onePixel.cssMargin;
};

/** @deprecated */
const toCssRate = (context: XellyContext, val: number) => {
    return val * (context.onePixel.cssDim + context.onePixel.cssMargin);
};

// -- exports --

/** @deprecated will be removed from public api/usage */
export const convert = {toCssScale, toCssScaleTrimmed, toCssRate};
