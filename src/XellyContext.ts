import {Color} from 'excalibur';

export type XellyContextParameters = {
    readonly gameConfig?: string,
    userGameState?: string
};

/** XellyContext. */
export type XellyContext = {
    readonly canvas: HTMLCanvasElement,

    readonly color: {
        readonly fg: Color
    }

    readonly parameters?: XellyContextParameters

    readonly deps?: {
        [key: string ]: object
    };
};
