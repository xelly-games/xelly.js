import {Engine} from 'excalibur';
import {XellyContext} from './XellyContext';

export type XellyInstallFunction = (context: XellyContext, engine: Engine) => void;
