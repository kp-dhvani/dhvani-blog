import { Analyser, Player } from "tone";

const canvas = document.getElementById("visualiser") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

const pianoC4Sound = new Player("../../assets/piano-C4.wav").toDestination();
const pianoC4Button = document.getElementById("piano-c4");

const analyser = new Analyser("fft", 256);
pianoC4Sound.connect(analyser);

pianoC4Button?.addEventListener("click", () => {
	if (pianoC4Sound.state === "started") {
		pianoC4Sound.stop();
	} else {
		pianoC4Sound.start();
		visualiseSounds();
	}
});

function visualiseSounds() {
	if (pianoC4Sound.state === "stopped") return;
	console.log("here");
	if (!ctx) return;
	const values = analyser.getValue();
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// console.log(values);
	const barWidth = canvas.width / values.length;
	const barHeightMultiplier = canvas.height / 2;
	for (let i = 0; i < values.length; i++) {
		const barHeight = (values[i] as number) * barHeightMultiplier;
		const x = i * barWidth;

		// Set bar color (can be adjusted as desired)
		ctx.fillStyle = `red`;
		ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
	}

	// Loop the draw function at the next animation frame
	requestAnimationFrame(visualiseSounds);
}
