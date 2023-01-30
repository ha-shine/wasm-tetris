import * as FontFaceObserver from "fontfaceobserver";
import * as PIXI from "pixi.js";
import {CANVAS_HEIGHT, CANVAS_WIDTH} from "./Constants";
import {GameState} from "./GameState";
import {Renderer} from "./Renderer";

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

        this.renderer.setup();
        this.renderer.renderEmptyState();
        this.state.setupControls();

        this.ticker.add(() => {
            this.state.tick(this.ticker.elapsedMS);
            this.renderer.render(this.state);
        });
    }

    static async start(canvas: HTMLCanvasElement): Promise<Application> {
        let tileSetLoader = new Promise<void>((resolve) => {
            PIXI.Loader
                .shared
                .add("tileset.png")
                .add("tileset.json")
                .load(() => {
                    resolve();
                });
        });

        await tileSetLoader;

        // Load typekit fonts and wait for FontFaceObserver to complete
        let typekitLink = document.createElement("link");
        typekitLink.setAttribute("rel", "stylesheet");
        typekitLink.setAttribute("type", "text/css");
        typekitLink.setAttribute("href", "https://use.typekit.net/uwv5rqv.css");
        document.head.appendChild(typekitLink);

        let armadaFont = new FontFaceObserver("Armada");
        let nkFont = new FontFaceObserver("Neue-Kabel");

        await Promise.all([
            armadaFont.load(),
            nkFont.load(),
        ]);

        return new Application(canvas);
    }
}
