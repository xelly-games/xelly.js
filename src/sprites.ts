const xshift = (vec: [number, number][], n: number = 1): [number, number][] => {
    return vec.map(([x, y]) => [x + n, y]);
};

const yshift = (vec: [number, number][], n: number = 1): [number, number][] => {
    return vec.map(([x, y]) => [x, y + n]);
};

/** Sprite width in xelly pixels. */
const width = (vec: [number, number][]): number => {
    return vec.reduce((acc, [x, y]) => Math.max(acc, x), 0) + 1;
};

/** Sprite height in xelly pixels. */
const height = (vec: [number, number][]): number => {
    return vec.reduce((acc, [x, y]) => Math.max(acc, y), 0) + 1;
};

/** @deprecated use `shift.*` and `measure.*` instead */
export const sprites = {width, height, xshift, yshift};
