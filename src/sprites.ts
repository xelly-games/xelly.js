import {Color} from 'excalibur';

const xshift = <T extends [number, number][] | [number, number, Color?][]>(vec: T, n: number = 1): T => {
    return vec.map(([x, y, color]) => color ? [x + n, y, color] : [x + n, y]) as T;
};

const yshift = <T extends [number, number][] | [number, number, Color?][]>(vec: T, n: number = 1): T => {
    return vec.map(([x, y, color]) => color ? [x, y + n, color] : [x, y + n]) as T;
};

/** Sprite width in xelly pixels. */
const width = (vec: [number, number, Color?][]): number => {
    return vec.reduce((acc, [x, y, color]) => Math.max(acc, x), 0) + 1;
};

/** Sprite height in xelly pixels. */
const height = (vec: [number, number, Color?][]): number => {
    return vec.reduce((acc, [x, y, color]) => Math.max(acc, y), 0) + 1;
};

/** @deprecated use `shift.*` and `measure.*` instead */
export const sprites = {width, height, xshift, yshift};
