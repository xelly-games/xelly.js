import {Collider, LineSegment, Shape, vec, Vector} from 'excalibur';
import {XellyContext} from './XellyContext';
import {convert} from './convert';
import {sprites} from './sprites';

const generate = (context: XellyContext, sprite: [number, number][]): Collider | undefined => {
    const [w, h] = [sprites.width(sprite), sprites.height(sprite)];
    const matrix: number[][] = Array.from({ length: h }, () => Array(w).fill(0));

    sprite.forEach(([x, y]) => matrix[y][x] = 1);

    const polygon: Vector[] = [];
    let currSlope: number | undefined = undefined;
    for (let row = 0; row < h; ++row) {
        const rowX = matrix[row].indexOf(1);
        if (rowX < 0) {
            continue;
        }
        const candidatePoint = vec(convert.toCssScale(context, rowX), convert.toCssScale(context, row));
        if (polygon[polygon.length - 1] === undefined) {
            polygon.push(candidatePoint);
            continue;
        }
        const slope = new LineSegment(polygon[polygon.length - 1], candidatePoint).slope;
        if (slope < 0 || Math.abs(slope) === Infinity) {
            if (currSlope !== undefined && slope === currSlope && polygon.length > 1) {
                polygon.pop();
            }
        } else {
            const prevPoint: Vector = polygon[polygon.length - 1];
            const insertPoint =
                vec(prevPoint.x, prevPoint.y + convert.toCssScale(context, 1));
            polygon.push(insertPoint);
        }
        polygon.push(candidatePoint);
        currSlope = slope;
    }
    if (polygon.length === 0) {
        return undefined;
    }
    for (let row = h - 1; row >= 0; --row) {
        const rowX = matrix[row].lastIndexOf(1);
        if (rowX < 0) {
            continue;
        }
        const candidatePoint = vec(convert.toCssScale(context, rowX + 1), convert.toCssScale(context, row + 1));
        const slope = new LineSegment(polygon[polygon.length - 1], candidatePoint).slope;
        if (slope > 0 || Math.abs(slope) === Infinity) {
            if (currSlope !== undefined && slope === currSlope && polygon.length > 1) {
                polygon.pop();
            }
        } else {
            const prevPoint: Vector = polygon[polygon.length - 1];
            const insertPoint = vec(prevPoint.x, prevPoint.y + convert.toCssScale(context, 1));
            polygon.push(insertPoint);
        }
        polygon.push(candidatePoint);
        currSlope = slope;
    }
    polygon.reverse(); // clockwise!

    // shift the polygon we made so that it's anchored in the center
    // todo -- do we need to respect actor anchor somehow in this???
    const shiftedPolygon
        = polygon.map(v => vec(v.x - convert.toCssScale(context, w / 2), v.y - convert.toCssScale(context, h/ 2)));
    const shape = Shape.Polygon(shiftedPolygon, Vector.Zero, true/*suppressContextWarning*/);
    // triangulate to deal w/ concave results
    return shape.triangulate();
};

export const colliders = {generate};
