import { highlightCurrentPageInNav } from "../../shared/util";

document.addEventListener("DOMContentLoaded", () => {
	highlightCurrentPageInNav();
	const firstHarmonicWaveCanvas = document.getElementById(
		"first-harmonic-wave"
	) as HTMLCanvasElement;
	const secondHarmonicWaveCanvas = document.getElementById(
		"second-harmonic-wave"
	) as HTMLCanvasElement;
	const thirdHarmonicWaveCanvas = document.getElementById(
		"third-harmonic-wave"
	) as HTMLCanvasElement;
	const fourthHarmonicWaveCanvas = document.getElementById(
		"fourth-harmonic-wave"
	) as HTMLCanvasElement;
	const fifthhHarmonicWaveCanvas = document.getElementById(
		"fifth-harmonic-wave"
	) as HTMLCanvasElement;

	const firstHarmonicWaveContext = firstHarmonicWaveCanvas.getContext("2d");
	const secondHarmonicWaveContext = secondHarmonicWaveCanvas.getContext("2d");
	const thirdHarmonicWaveContext = thirdHarmonicWaveCanvas.getContext("2d");
	const fourthHarmonicWaveContext = fourthHarmonicWaveCanvas.getContext("2d");
	const fifthHarmonicWaveContext = fifthhHarmonicWaveCanvas.getContext("2d");

	drawStandingWave(firstHarmonicWaveCanvas, firstHarmonicWaveContext, 1);
	drawStandingWave(secondHarmonicWaveCanvas, secondHarmonicWaveContext, 2);
	drawStandingWave(thirdHarmonicWaveCanvas, thirdHarmonicWaveContext, 3);
	drawStandingWave(fourthHarmonicWaveCanvas, fourthHarmonicWaveContext, 4);
	drawStandingWave(fifthhHarmonicWaveCanvas, fifthHarmonicWaveContext, 5);
});

function drawStandingWave(
	canvas: HTMLCanvasElement,
	context: CanvasRenderingContext2D | null,
	harmonicNumber: number
) {
	if (!context) return;

	const canvasWidth = canvas.width;
	const canvasHeight = canvas.height;
	const amplitude = 50; // amplitude of the wave
	const centerY = canvasHeight / 2; // middle of the canvas

	context.clearRect(0, 0, canvasWidth, canvasHeight);

	context.beginPath();
	context.strokeStyle = "#FF657";
	context.moveTo(0, centerY);
	context.lineTo(canvasWidth, centerY);
	context.stroke();

	// positive displacement wave (upward)
	context.beginPath();
	context.strokeStyle = "red";
	context.lineWidth = 2;

	// negative displacement wave (downward)
	const negativeWave = new Path2D();
	context.strokeStyle = "#FF657";

	const amplitudeScaling = 1 / harmonicNumber;

	for (let x = 0; x <= canvasWidth; x++) {
		// wave equation for standing wave
		const waveEquation = (n: number) =>
			amplitude *
			amplitudeScaling *
			Math.sin((n * Math.PI * x) / canvasWidth) *
			Math.sin((Math.PI * x) / canvasWidth);

		// positive wave
		const positiveY = centerY - waveEquation(harmonicNumber);

		// negative wave
		const negativeY = centerY + waveEquation(harmonicNumber);

		if (x === 0) {
			context.moveTo(x, positiveY);
		} else {
			context.lineTo(x, positiveY);
		}

		// draw negative wave
		if (x === 0) {
			negativeWave.moveTo(x, negativeY);
		} else {
			negativeWave.lineTo(x, negativeY);
		}
	}

	// render positive wave
	context.stroke();

	// render negative wave
	context.beginPath();
	context.strokeStyle = "#FF657";
	context.stroke(negativeWave);
}
