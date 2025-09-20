import {Color} from 'excalibur';
import font from './font';
import font2 from './font2';
import {measure} from './measure';
import {shift} from './shift';

const toLegacySprite = (sprite: [number, number, any?][]): [number, number][] => {
    return sprite.map(([x, y]) => [x, y]);
};

export type LabelOptions = {
    readonly font?: 'default' | 'font2',
    readonly xspacing?: number,
    readonly yspacing?: number
};

const defaultLabelOptions: LabelOptions = { font: 'default', xspacing: 1, yspacing: 1 };

const createLabelSprite = (label: string, options: LabelOptions = {}): [number, number][] => {
    const resolvedOptions = {...defaultLabelOptions, ...options};
    const useFont = resolvedOptions.font === 'font2' ? font2 : font;
    let x_ = 0;
    let accs: ([number, number][])[] = [];
    accs.push([]);
    let currAccIdx = 0;
    let maxWidth = 0;
    for (const ch of label.toLowerCase()) {
        if (ch === '\n') {
            maxWidth = Math.max(maxWidth, x_ - resolvedOptions.xspacing!);
            x_ = 0;
            accs.push([]);
            ++currAccIdx;
        } else {
            const sprite: [number, number][] = useFont[ch] || font[ch] || useFont['?'] || font['?'];
            const shifted = shift.x(sprite, x_);
            accs[currAccIdx] = accs[currAccIdx].concat(toLegacySprite(shifted));
            x_ += measure.width(sprite) + resolvedOptions.xspacing!;
        }
    }

    // final!
    maxWidth = Math.max(maxWidth, x_ - resolvedOptions.xspacing!);

    let y_ = 0;
    let retval: [number, number][] = [];
    for (const acc of accs) {
        const w = measure.width(acc);
        const h = measure.height(acc);
        const adjustedAcc = shift.y(acc, y_);
        if (w < maxWidth) {
            retval.push(...toLegacySprite(shift.x(adjustedAcc, Math.floor((maxWidth - w) / 2))));
        } else {
            retval.push(...toLegacySprite(adjustedAcc));
        }
        y_ += h + resolvedOptions.yspacing!;
    }
    return retval;
}

const createLineSprite = (x1: number, y1: number, x2: number, y2: number) => {
    for (const [paramName, val] of [['x1', x1], ['y1', y1], ['x2', x2], ['y2', y2]]) {
        if (!Number.isInteger(val)) {
            throw new Error(`${paramName} must be integer, not ${val}`);
        }
    }
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    const result: [number, number][] = [];
    while (true) {
        result.push([x1, y1]);

        if (x1 === x2 && y1 === y2)
            break;

        const e2 = 2 * err;

        if (e2 > -dy) {
            err -= dy;
            x1 += sx;
        }

        if (e2 < dx) {
            err += dx;
            y1 += sy;
        }
    }
    return result;
}

const createRectSprite = (x: number, y: number, w: number, h: number) => {
    const acc: [number, number][] = [];
    for (let i = 0; i < h; ++i) {
        acc.push(...createLineSprite(x, y + i, w - 1, y + i));
    }
    return acc;
};

const createOpenRectSprite = (x: number, y: number, w: number, h: number)=> {
    const acc: [number, number][] = [];
    for (let i = 0; i < h; ++i) {
        if (i === 0 || i === h - 1) {
            acc.push(...createLineSprite(x, y + i, x + w - 1, y + i));
        } else {
            acc.push([x, y + i]);
            acc.push([x + w - 1, y + i]);
        }
    }
    return acc;
};

const PI = 3.1415926535;
const createCircleSprite = (x: number, y: number, r: number) => {
    for (const [paramName, val] of [['x', x], ['y', y], ['r', r]]) {
        if (!Number.isInteger(val)) {
            const msg = `${paramName} must be integer, not ${val}`;
            console.trace(msg);
            throw new Error(msg);
        }
    }
    const acc: [number, number][] = [];
    let x1, y1;
    const seen = new Set();
    for (let angle = 0; angle < 360; angle += 0.1) {
        x1 = Math.round(r * Math.cos(angle * PI / 180));
        y1 = Math.round(r * Math.sin(angle * PI / 180));
        const candidate = [x1, y1];
        const candidateKey = JSON.stringify(candidate);
        if (!seen.has(candidateKey)) {
            seen.add(candidateKey);
            acc.push([x1, y1]);
        }
    }
    return shift.y(shift.x(acc, r), r);
};

// --

const chToIndex = (ch: string) => {
    if (ch >= '0' && ch <= '9') {
        return parseInt(ch);
    } else if (ch >= 'A' && ch <= 'Z') {
        return ch.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
    } else if (ch >= 'a' && ch <= 'z') {
        return ch.charCodeAt(0) - 'a'.charCodeAt(0) + 37;
    } else {
        return -1;
    }
};

const createFromAscii = (ascii: string, palette?: Color[]): [number, number, Color?][] => {
    const retval: [number, number, Color?][] = [];
    const rows = ascii.trim().split("\n").map(l => l.trim());
    const h = rows.length;
    const w = Math.max(...rows.map(r => r.length));
    for (let y = 0; y < h; y++) {
        const row = rows[y];
        for (let x = 0; x < row.length; x++) {
            const ch = row[x] ?? '.';
            if (ch != '.') {
                const idx = chToIndex(ch);
                const useColor = palette
                    ? (idx >= 0 && idx < palette.length) ? palette[idx] : undefined
                    : undefined;
                retval.push(useColor? [x, y, useColor] : [x, y]);
            }
        }
    }
    return retval;
};

export const create = {
    line: createLineSprite,
    label: createLabelSprite,
    circle: createCircleSprite,
    rect: createOpenRectSprite,
    filledRect: createRectSprite,
    ascii: createFromAscii,
};
