import * as FontFaceObserver from "fontfaceobserver";
import * as PIXI from "pixi.js";
import {CANVAS_HEIGHT, CANVAS_WIDTH} from "./Constants";
import {GameState} from "./GameState";
import {Renderer} from "./Renderer";
import tilesetImg from "./assets/tileset.png";

export class Application {
    private readonly app: PIXI.Application;
    private readonly state: GameState;
    private readonly renderer: Renderer;
    private readonly ticker: PIXI.Ticker;

    private constructor(canvas: HTMLCanvasElement) {
        this.app = new PIXI.Application({
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transparent: true,
            antialias: true,
            view: canvas
        });

        this.ticker = new PIXI.Ticker();
        this.ticker.autoStart = false;

        this.state = new GameState();
        this.renderer = new Renderer(this.app, PIXI.Loader.shared, () => this.ticker.start(), () => this.state.restart());

        this.ticker.add(() => {
            this.state.tick(this.ticker.elapsedMS);
            this.renderer.render(this.state);
        });
    }


    // The renderer, game state and tickers are all intertwined. I need to find a cleaner abstraction
    private async setup() {
        await this.renderer.setup();
        this.renderer.renderEmptyState();
        this.state.setupControls();
    }

    static async start(canvas: HTMLCanvasElement): Promise<Application> {
        let typekitLink = document.createElement("link");
        typekitLink.setAttribute("rel", "stylesheet");
        typekitLink.setAttribute("type", "text/css");
        typekitLink.setAttribute("href", "https://use.typekit.net/uwv5rqv.css");
        document.head.appendChild(typekitLink);

        let tileSetLoader = new Promise<void>((resolve) => {
            PIXI.Loader
                .shared
                .add("tileset.png", tilesetImg)
                .load(() => {
                    console.log(`Loading ${tilesetImg}`)
                    resolve();
                });
        });

        let fonts = [
            {name: "Armada", weight: 400},
            {name: "Armada", weight: 700},
            {name: "Neue-Kabel", weight: 300},
            {name: "Neue-Kabel", weight: 400}
        ];

        let fontObservers = fonts.map((font) => {
            return new FontFaceObserver(font.name, {weight: font.weight}).load();
        })

        await Promise.all([tileSetLoader, ...fontObservers]);

        let app = new Application(canvas);
        await app.setup();

        return app;
    }
}
