import {
    Actor,
    Collider,
    ColliderComponent,
    Color,
    LineSegment,
    Shape,
    vec,
    Vector
} from 'excalibur';
import {convert, type PixelMetrics} from './internal/convert';
import {measure} from './measure';
import {XellyPixelScheme} from './XellyPixelScheme';
import * as xel from './index';

const internalGenerate = (sprite: [number, number, Color?][], pixelMetrics: PixelMetrics): Collider | undefined => {
    const [w, h] = [measure.width(sprite), measure.height(sprite)];
    const matrix: number[][] = Array.from({ length: h }, () => Array(w).fill(0));

    sprite.forEach(([x, y]) => matrix[y][x] = 1);

    const polygon: Vector[] = [];
    let currSlope: number | undefined = undefined;
    for (let row = 0; row < h; ++row) {
        const rowX = matrix[row].indexOf(1);
        if (rowX < 0) {
            continue;
        }
        const candidatePoint = vec(convert.toCssScale(pixelMetrics, rowX), convert.toCssScale(pixelMetrics, row));
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
                vec(prevPoint.x, prevPoint.y + convert.toCssScale(pixelMetrics, 1));
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
        const candidatePoint = vec(convert.toCssScale(pixelMetrics, rowX + 1), convert.toCssScale(pixelMetrics, row + 1));
        const slope = new LineSegment(polygon[polygon.length - 1], candidatePoint).slope;
        if (slope > 0 || Math.abs(slope) === Infinity) {
            if (currSlope !== undefined && slope === currSlope && polygon.length > 1) {
                polygon.pop();
            }
        } else {
            const prevPoint: Vector = polygon[polygon.length - 1];
            const insertPoint = vec(prevPoint.x, prevPoint.y + convert.toCssScale(pixelMetrics, 1));
            polygon.push(insertPoint);
        }
        polygon.push(candidatePoint);
        currSlope = slope;
    }
    polygon.reverse(); // clockwise!

    // shift the polygon we made so that it's anchored in the center
    // todo -- do we need to respect actor anchor somehow in this???
    const shiftedPolygon
        = polygon.map(v => vec(v.x - convert.toCssScale(pixelMetrics, w / 2), v.y - convert.toCssScale(pixelMetrics, h/ 2)));
    const shape = Shape.Polygon(shiftedPolygon, Vector.Zero, true/*suppressContextWarning*/);
    // triangulate to deal w/ concave results
    return shape.triangulate();
};

const generate = (sprite: [number, number, Color?][], pixelScheme: XellyPixelScheme = XellyPixelScheme.Px3_0): Collider | undefined => {
    return internalGenerate(sprite, convert.toPixelMetrics(pixelScheme));
}

/** @returns false if the collider could not be generated */
const addTo = (actor: Actor,
               sprite: [number, number, Color?][],
               pixelScheme: XellyPixelScheme = XellyPixelScheme.Px3_0): boolean => {
    const collider = generate(sprite, pixelScheme);
    if (!collider) {
        return false;
    }
    actor.collider = new ColliderComponent(collider);
    actor.addComponent(actor.collider, true);
    return true;
};

export const colliders = {generate, addTo};
