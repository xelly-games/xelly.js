import {XellyGameType} from './XellyGameType';
import {XellyPixelScheme} from './XellyPixelScheme';

export type XellyMetadata = {
    type: XellyGameType,
    pixelScheme?: XellyPixelScheme,
    replayable?: boolean,
    forkable?: boolean
};
