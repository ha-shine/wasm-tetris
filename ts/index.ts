import * as WebFont from "webfontloader";
import { Application, Ticker, Loader } from "pixi.js";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./Constants";
import { Renderer } from "./Renderer";
import { GameState } from "./GameState";

WebFont.load({
  custom: {
    families: ["armada", "neue-kabel"]
  }
});

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const application = new Application({
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  transparent: true,
  antialias: true,
  view: canvas
});

const loader = Loader.shared;

const state = new GameState();
const renderer = new Renderer(application, loader, startGame, () => state.restart());

function setupInterface() {
  renderer.setup();
  renderer.renderEmptyState();
  state.setupControls();
}

const ticker = new Ticker();
ticker.autoStart = false;
ticker.add(() => {
  state.tick(ticker.elapsedMS);
  renderer.render(state);
});

function startGame() {
  ticker.start();
}

loader
  .add("tileset.png")
  .add("tileset.json")
  .load(setupInterface);
