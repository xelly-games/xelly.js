import {Color} from 'excalibur';

export type XellyContextParameters = {
    readonly gameConfig?: string,
    userGameState?: string
};

/** XellyContext. */
export type XellyContext = {
    readonly canvas: HTMLCanvasElement,

    readonly screen: {
        /* @deprecated */
        pixel: {
            /* @deprecated */
            readonly width: number,
            /* @deprecated */
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

    /* @deprecated */
    readonly onePixel: {
        /* @deprecated */
        readonly cssDim: number,
        /* @deprecated */
        readonly cssMargin: number
    }

    readonly parameters?: XellyContextParameters
};
