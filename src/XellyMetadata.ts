import {XellyGameType} from './XellyGameType';
import {XellyPixelScheme} from './XellyPixelScheme';

export type XellyMetadata = {
    type: XellyGameType,
    /** @deprecated */
    pixelScheme?: XellyPixelScheme,
    /** @deprecated */
    replayable?: boolean,
    /** @deprecated */
    forkable?: boolean
};
