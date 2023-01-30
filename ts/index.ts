import { Application } from "./Application";

async function main() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  await Application.start(canvas);
}

main()
    .then(() => {
      console.log("Game loaded")
    });
