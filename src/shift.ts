import {Color} from 'excalibur';

const xshift = <T extends [number, number][] | [number, number, Color?][]>(vec: T, n: number = 1): T => {
    return vec.map(([x, y, color]) => color ? [x + n, y, color] : [x + n, y]) as T;
};

const yshift = <T extends [number, number][] | [number, number, Color?][]>(vec: T, n: number = 1): T => {
    return vec.map(([x, y, color]) => color ? [x, y + n, color] : [x, y + n]) as T;
};

const x = xshift;
const y = yshift;

export const shift = {x, y};
