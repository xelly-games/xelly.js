import {Color} from 'excalibur';

export type XellyContextParameters = {
    readonly gameConfig?: string,
    userGameState?: string
};

/** XellyContext. */
export type XellyContext = {
    readonly canvas: HTMLCanvasElement,

    readonly screen: {
        pixel: {
            readonly width: number,
            readonly height: number
        },
        css: {
            readonly width: number,
            readonly height: number
        }
    }

    readonly color: {
        readonly fg: Color,
        readonly bg: Color
    }

    readonly onePixel: {
        readonly cssDim: number,
        readonly cssMargin: number
    }

    readonly parameters?: XellyContextParameters
};
