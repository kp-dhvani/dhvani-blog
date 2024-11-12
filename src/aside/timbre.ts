import { Player } from "tone";

const pianoC4 = new Player("../assets/piano-C4.wav", () => {
	console.log("piano loaded");
});
