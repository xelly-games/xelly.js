import {
    Actor,
    ActorArgs,
    Color,
    Engine,
    GraphicsGroup,
    Rectangle,
    Timer,
    vec,
    Vector
} from 'excalibur';
import {XellyContext} from '../XellyContext';
import {actors} from '../actors';
import {graphics} from '../graphics';
import {measure} from '../measure';
import {convert} from '../convert';

const DeleteKeySprite: [number, number][] = [
    [0, 3],
    [1, 2], [1, 4],
    [2, 1], [2, 5],
    [3, 0], [3, 6],
    [4, 0], [4, 6],
    [5, 0], [5, 6],
    [6, 0], [6, 6],
    [7, 0], [7, 6],
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6],
    [4, 2], [4, 4],
    [5, 3],
    [6, 2], [6, 4]
];

const EnterKeySprite: [number, number][] = [
    [0, 3],
    [1, 2], [1, 3], [1, 4],
    [2, 1], [2, 3], [2, 5],
    [3, 3],
    [4, 3],
    [5, 0], [5, 1], [5, 2], [5, 3]
];

const MinimizerSprite: [number, number][] = [
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 1],
    [4, 0]
];

const MaximizerSprite: [number, number][] = [
    [0, 2],
    [1, 1],
    [2, 0],
    [3, 1],
    [4, 2]
];

// --

export const keyboardWidthPercent = 0.90;
export const keyboardKeyMargin = 2;
export const keyboardHeightOverWidth = 1.2;
export const keyboardBottomMargin = 10;
export const keyboardMinimizerMargin = 5;
export const keyboardMinimizedPeekabooMargin = 25;

export const createFilledRect = (color: Color, width: number, height?: number) => {
    return new Rectangle({
        width: width,
        height: height || width,
        color: color
    });
};

export const createOpenRect = (color: Color, width: number, height?: number) => {
    return new Rectangle({
        width: width,
        height: height || width,
        lineWidth: 3,
        strokeColor: color,
        color: Color.Transparent
    });
};

const keyboardKeys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'], // !!! logic will add <enter> and <delete> on both sides of last row !!!
];

export type KeyboardOptions = {
    readonly transparent?: boolean;
    readonly minimizer?: boolean;
    readonly minimizerInvisibleMargins?: Vector;
    readonly animateDepressedKeys?: boolean;
};

export type KeyboardBounds = {
    readonly dimensions: { width: number, height: number };
    readonly localOffsetMinusControls: Vector;
};

/** Keyboard. */
export class Keyboard extends Actor {

    private readonly context: XellyContext;
    private readonly options: KeyboardOptions;
    private keyboardBounds: KeyboardBounds | undefined;
    private minimized: boolean = false;
    private defaultPos: Vector | undefined;
    private defaultMinimizedPos: Vector | undefined;

    constructor(context: XellyContext, config?: ActorArgs & KeyboardOptions) {
        super({
            name: 'keyboard',
            z: 100,
            ...config
        });
        this.context = context;
        this.options = {
            transparent: false,
            minimizer: true,
            minimizerInvisibleMargins: vec(10, 25),
            animateDepressedKeys: false,
            ...config
        };
    }

    onInitialize(engine: Engine) {
        super.onInitialize(engine);
        const maxKeyboardWidth = engine.drawWidth * keyboardWidthPercent;
        const cols = Math.max(...keyboardKeys.map(row => row.length));
        const keyWidth = (maxKeyboardWidth - cols * keyboardKeyMargin) / cols;
        const keyHeight = keyboardHeightOverWidth * keyWidth;

        const minimizerWidth = convert.toCssScale(this.context, measure.width(MinimizerSprite));
        const minimizerHeight = convert.toCssScale(this.context, measure.height(MinimizerSprite));
        // NOTE: headroom gives more but invisible "clickable"/"touchable" area for user minimize/maximize
        const minimizerInvisibleMargins = this.options.minimizerInvisibleMargins!;
        if (this.options.minimizer) {
            const minimizer = new Actor({
                anchor: Vector.Zero,
                pos: vec(maxKeyboardWidth - minimizerWidth - keyboardMinimizerMargin - minimizerInvisibleMargins.x, 0)
            });
            const minimize = new GraphicsGroup({
                members: [
                    {
                        graphic: graphics.fromSprite(this.context, MinimizerSprite),
                        offset:
                            vec(minimizerInvisibleMargins.x, minimizerInvisibleMargins.y)
                    }]
            });
            const maximize = new GraphicsGroup({
                members: [
                    {
                        graphic: graphics.fromSprite(this.context, MaximizerSprite),
                        offset:
                            vec(minimizerInvisibleMargins.x, minimizerInvisibleMargins.y)
                    }]
            });
            minimizer.graphics.add('minimize', minimize);
            minimizer.graphics.add('maximize', maximize);
            minimizer.graphics.use('minimize'); // for starters.
            minimizer.on('pointerdown', () => {
                this.minimizeKeyboard(!this.minimized);
                minimizer.graphics.use(this.minimized ? 'minimize' : 'maximize');
                this.minimized = !this.minimized;
            });
            this.addChild(minimizer);
        }

        const yOffsetBase = this.options.minimizer ? minimizerInvisibleMargins.y + minimizerHeight + keyboardMinimizerMargin : 0;
        for (let row = 0; row < keyboardKeys.length; ++row) {
            const rowLen = keyboardKeys[row].length;
            const rowWidth = Keyboard.calculateRowWidth(keyWidth, rowLen);
            const xOffset = (maxKeyboardWidth - rowWidth) / 2;
            const yOffset = yOffsetBase + row * (keyHeight + keyboardKeyMargin);
            for (let col = 0; col < keyboardKeys[row].length; ++col) {
                this.addChild(this.createKeyActor(engine, keyboardKeys[row][col], keyWidth,
                    keyHeight, xOffset + col * (keyWidth + keyboardKeyMargin), yOffset));
            }
            if (row === keyboardKeys.length - 1) { // last row
                this.addChild(this.createKeyActor(engine, 'DEL', xOffset - keyboardKeyMargin,
                    keyHeight, 0, yOffset));
                this.addChild(this.createKeyActor(engine, 'ENTER', maxKeyboardWidth - (xOffset + rowWidth + keyboardKeyMargin * 2),
                    keyHeight, xOffset + rowWidth + keyboardKeyMargin * 2, yOffset));
            }
        }

        const dimensionsMinusControls = {
            width: Math.max(...keyboardKeys.map(row => Keyboard.calculateRowWidth(keyWidth, row.length))),
            height: keyboardKeys.length * (keyHeight + keyboardKeyMargin) - keyboardKeyMargin
        };
        const totalDimensions = {
            width: dimensionsMinusControls.width,
            height: dimensionsMinusControls.height + yOffsetBase
        };
        this.keyboardBounds = {
            dimensions: totalDimensions,
            localOffsetMinusControls: vec(0, yOffsetBase)
        };

        if (!this.options.transparent) {
            this.graphics.use(new GraphicsGroup({
                members: [{
                    graphic: createFilledRect(Color.White, dimensionsMinusControls.width, dimensionsMinusControls.height),
                    offset: vec(0, yOffsetBase)
                }]
            }));
        }

        const keyboardDefaultXOffset
            = (engine.drawWidth - this.keyboardBounds.dimensions.width) / 2;
        const keyboardDefaultYOffset
            = engine.drawHeight - this.keyboardBounds.dimensions.height - keyboardBottomMargin;
        this.defaultPos = vec(keyboardDefaultXOffset, keyboardDefaultYOffset);
        this.defaultMinimizedPos = vec(keyboardDefaultXOffset, engine.drawHeight -
            this.keyboardBounds!.localOffsetMinusControls.y);
        this.anchor = Vector.Zero;
        this.pos = this.defaultPos;
    }

    /** Available after class #onInitialize(). */
    getKeyboardBounds(): KeyboardBounds {
        if (!this.keyboardBounds) {
            throw new Error('keyboard bounds only available after onInitialize()');
        }
        return this.keyboardBounds!;
    }

    minimizeKeyboard(minimize: boolean, peekabooMargin: number = keyboardMinimizedPeekabooMargin) {
        this.actions.moveTo({
            pos: vec(this.defaultPos!.x,
                minimize ? this.defaultMinimizedPos!.y - peekabooMargin
                    : this.defaultPos!.y),
            duration: 100
        });
    }

    createKeyActor(engine: Engine, text: string, keyWidth: number, keyHeight: number, xOffset: number, yOffset: number) {
        const theKey = new Actor({
            name: `theKey${text}`, // see highlightKey() below.
            anchor: Vector.Zero,
            pos: vec(xOffset, yOffset)
        });
        theKey.graphics.use(createOpenRect(this.context.color.fg, keyWidth, keyHeight));
        theKey.graphics.add('negative', createFilledRect(this.context.color.fg, keyWidth, keyHeight));
        if (text === 'DEL') {
            const label = actors.fromSprite(this.context, DeleteKeySprite, {}, {name: 'theKeyLabel'});
            label.graphics.add('negative',
                graphics.fromSprite(this.context, DeleteKeySprite, {fgColor: 'negative'}));
            label.anchor = Vector.Half;
            label.pos = vec(keyWidth / 2, keyHeight / 2);
            theKey.addChild(label);
        } else if (text === 'ENTER') {
            const label = actors.fromSprite(this.context, EnterKeySprite, {}, {name: 'theKeyLabel'});
            label.graphics.add('negative',
                graphics.fromSprite(this.context, EnterKeySprite, {fgColor: 'negative'}));
            label.anchor = Vector.Half;
            label.pos = vec(keyWidth / 2, keyHeight / 2);
            theKey.addChild(label);
        } else {
            const label = actors.fromText(this.context, text, {}, {name: 'theKeyLabel'});
            label.graphics.add('negative',
                graphics.fromText(this.context, text, {fgColor: 'negative'}));
            label.anchor = Vector.Half;
            label.pos = vec(keyWidth / 2, keyHeight / 2);
            theKey.addChild(label);
        }
        theKey.on('pointerdown', () => {
            if (!this.minimized) {
                this.emit('*keypress', text);
                if (this.options.animateDepressedKeys) {
                    theKey.graphics.use('negative');
                    const theKeyLabel
                        = theKey.children.find(c => c.name === 'theKeyLabel');
                    (theKeyLabel as Actor).graphics.use('negative');
                    const timer = new Timer({
                        action: () => {
                            theKey.graphics.use('default');
                            (theKeyLabel as Actor).graphics.use('default');
                        },
                        interval: 200,
                        repeats: false
                    });
                    engine.currentScene.add(timer);
                    timer.start();
                }
            }
        });
        return theKey;
    }

    static calculateRowWidth(keyWidth: number, rowLen: number) {
        return rowLen * (keyWidth + keyboardKeyMargin) - keyboardKeyMargin;
    }

}