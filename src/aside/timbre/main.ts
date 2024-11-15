import { Analyser, Player } from "tone";
import { highlightCurrentPageInNav } from "../../shared/util";

document.addEventListener("DOMContentLoaded", () => {
	highlightCurrentPageInNav();
});
const canvasWaveform = document.getElementById(
	"visualiser-waveform"
) as HTMLCanvasElement;
const canvasFFT = document.getElementById(
	"visualiser-fft"
) as HTMLCanvasElement;

const fundamentalFrequencyWaveformCanvas = document.getElementById(
	"fundamental-frequency-waveform"
) as HTMLCanvasElement;

const standingWaveOneAntinodeCanvas = document.getElementById(
	"standing-wave"
) as HTMLCanvasElement;

const standingWaveSecondHarmonicCanvas = document.getElementById(
	"standing-wave-second-harmonic"
) as HTMLCanvasElement;

const standingWaveThirdHarmonicCanvas = document.getElementById(
	"standing-wave-third-harmonic"
) as HTMLCanvasElement;

const canvasWaveformContext = canvasWaveform.getContext("2d");
const canvasFFTContext = canvasFFT.getContext("2d");
const fundamentalFrequencyWaveformContext =
	fundamentalFrequencyWaveformCanvas.getContext("2d");
const standingWaveOneAntinodeCanvasContext =
	standingWaveOneAntinodeCanvas.getContext("2d");
const standingWaveSecondHarmonicContext =
	standingWaveSecondHarmonicCanvas.getContext("2d");
const standingWaveThirdHarmonicContext =
	standingWaveThirdHarmonicCanvas.getContext("2d");

const waveFormAnalyser = new Analyser("waveform", 4096);
const fftAnalyser = new Analyser("fft", 2048);

const allSoundButtons = document.querySelectorAll(".sound-buttons button");
allSoundButtons.forEach((button) => {
	const id = button.getAttribute("id");
	const wavSound = new Player(`../../assets/${id}.wav`).toDestination();
	wavSound.connect(waveFormAnalyser);
	wavSound.connect(fftAnalyser);
	button.addEventListener("click", () => {
		if (wavSound.state === "started") {
			wavSound.stop();
		} else {
			wavSound.start();
			visualiseWaveform(wavSound);
			visualiseFFT(wavSound);
		}
	});
});

function visualiseWaveform(player: Player) {
	if (!canvasWaveformContext) return;
	if (player.state === "stopped") return;

	const width = canvasWaveform.width;
	const height = canvasWaveform.height;
	const dataArray = waveFormAnalyser.getValue() as Float32Array;
	canvasWaveformContext.clearRect(0, 0, width, height);
	canvasWaveformContext.lineWidth = 2;
	canvasWaveformContext.strokeStyle = "#FF6577";
	canvasWaveformContext.beginPath();

	const sliceWidth = width / dataArray.length;
	let x = 0;

	for (let i = 0; i < dataArray.length; i++) {
		const value = dataArray[i];
		const y = (value * height * 10) / 2 + height / 2;

		if (i === 0) {
			canvasWaveformContext.moveTo(x, y);
		} else {
			canvasWaveformContext.lineTo(x, y);
		}

		x += sliceWidth;
	}

	canvasWaveformContext.lineTo(width, height / 2);
	canvasWaveformContext.stroke();
	requestAnimationFrame(() => visualiseWaveform(player));
}

function visualiseFFT(player: Player) {
	if (!canvasFFTContext) return;
	if (player.state === "stopped") return;

	const width = canvasFFT.width;
	const height = canvasFFT.height;
	const dataArray = fftAnalyser.getValue();
	const barWidth = width / dataArray.length;
	canvasFFTContext.clearRect(0, 0, width, height);
	canvasFFTContext.lineWidth = 5;
	let x = 0;

	for (let i = 0; i < dataArray.length; i++) {
		let frequencyMagnitude = dataArray[i];
		frequencyMagnitude =
			frequencyMagnitude === -Infinity
				? 0
				: Math.max(0, ((frequencyMagnitude as number) + 100) / 100);
		const barHeight = frequencyMagnitude * height * 1.5;
		canvasFFTContext.fillStyle = "#FF6577";
		canvasFFTContext.fillRect(x, height - barHeight, barWidth, barHeight);
		x += barWidth;
	}

	requestAnimationFrame(() => visualiseFFT(player));
}

if (fundamentalFrequencyWaveformContext) {
	const frequency = 261.63; // Frequency of middle C4
	const amplitude = 80;
	const waveSpeed = 0.05;
	let time = 0;

	function drawFundamentalFrequencyStandingWave() {
		fundamentalFrequencyWaveformContext!.clearRect(
			0,
			0,
			fundamentalFrequencyWaveformCanvas.width,
			fundamentalFrequencyWaveformCanvas.height
		);

		fundamentalFrequencyWaveformContext!.strokeStyle = "#FF6577";
		fundamentalFrequencyWaveformContext!.lineWidth = 2;
		fundamentalFrequencyWaveformContext!.beginPath();

		const centerY = fundamentalFrequencyWaveformCanvas.height / 2;

		for (let x = 0; x < fundamentalFrequencyWaveformCanvas.width; x++) {
			const phase = (2 * Math.PI * frequency * time) / 1000;
			const spatialFactor = Math.sin(
				(2 * Math.PI * x) / fundamentalFrequencyWaveformCanvas.width
			);
			const y = centerY + amplitude * Math.sin(phase) * spatialFactor;

			if (x === 0) {
				fundamentalFrequencyWaveformContext!.moveTo(x, y);
			} else {
				fundamentalFrequencyWaveformContext!.lineTo(x, y);
			}
		}

		fundamentalFrequencyWaveformContext!.stroke();
		time += waveSpeed;
		requestAnimationFrame(drawFundamentalFrequencyStandingWave);
	}

	drawFundamentalFrequencyStandingWave();
}

// if (standingWaveOneAntinodeCanvasContext) {
// 	const canvasWidth = standingWaveOneAntinodeCanvas.width;
// 	const canvasHeight = standingWaveOneAntinodeCanvas.height;

// 	const amplitude = 50; // Maximum amplitude of the wave
// 	const wavelength = canvasWidth; // Distance between two nodes (full wave)
// 	const centerY = canvasHeight / 2;
// 	let time = 0;
// 	const waveSpeed = 0.05;

// 	function drawWave() {
// 		standingWaveOneAntinodeCanvasContext!.clearRect(
// 			0,
// 			0,
// 			canvasWidth,
// 			canvasHeight
// 		);
// 		standingWaveOneAntinodeCanvasContext!.beginPath();
// 		standingWaveOneAntinodeCanvasContext!.strokeStyle = "#FF6577";
// 		standingWaveOneAntinodeCanvasContext!.lineWidth = 2;

// 		for (let x = 0; x <= canvasWidth; x++) {
// 			// Standing wave equation: y = A * sin(π * x / L) * cos(ωt)
// 			const y =
// 				centerY +
// 				amplitude * Math.sin((Math.PI * x) / wavelength) * Math.cos(time);

// 			if (x === 0) {
// 				standingWaveOneAntinodeCanvasContext!.moveTo(x, y);
// 			} else {
// 				standingWaveOneAntinodeCanvasContext!.lineTo(x, y);
// 			}
// 		}

// 		standingWaveOneAntinodeCanvasContext!.stroke();
// 		time += waveSpeed;
// 		requestAnimationFrame(drawWave);
// 	}

// 	drawWave();
// }

// if (standingWaveSecondHarmonicContext) {
// 	const canvasWidth = standingWaveSecondHarmonicCanvas.width;
// 	const canvasHeight = standingWaveSecondHarmonicCanvas.height;

// 	const amplitude = 50; // Maximum amplitude of the wave
// 	const wavelength = canvasWidth; // Full wavelength fits in the canvas width (not divided by 2 as previously)
// 	const centerY = canvasHeight / 2;
// 	let time = 0;
// 	const waveSpeed = 0.05;

// 	function drawWave() {
// 		// Clear the previous wave before drawing the new one
// 		standingWaveSecondHarmonicContext!.clearRect(
// 			0,
// 			0,
// 			canvasWidth,
// 			canvasHeight
// 		);

// 		// Begin a new wave drawing path
// 		standingWaveSecondHarmonicContext!.beginPath();
// 		standingWaveSecondHarmonicContext!.strokeStyle = "#FF6577";
// 		standingWaveSecondHarmonicContext!.lineWidth = 2;

// 		// Loop through each pixel in the width of the canvas
// 		for (let x = 0; x <= canvasWidth; x++) {
// 			// Standing wave equation for second harmonic: y = A * sin(2π * x / λ) * cos(ωt)
// 			// This equation ensures that there are 2 antinodes (max points) and 2 nodes (zero displacement points).
// 			const y =
// 				centerY +
// 				amplitude * Math.sin((2 * Math.PI * x) / wavelength) * Math.cos(time);

// 			// Move to the first point and start drawing the wave
// 			if (x === 0) {
// 				standingWaveSecondHarmonicContext!.moveTo(x, y);
// 			} else {
// 				standingWaveSecondHarmonicContext!.lineTo(x, y);
// 			}
// 		}

// 		// Stroke the path to draw the wave
// 		standingWaveSecondHarmonicContext!.stroke();

// 		// Update time to animate the wave
// 		time += waveSpeed;
// 		requestAnimationFrame(drawWave);
// 	}

// 	// Start drawing the wave
// 	drawWave();
// }

// if (standingWaveThirdHarmonicContext) {
// 	const canvasWidth = standingWaveThirdHarmonicCanvas.width;
// 	const canvasHeight = standingWaveThirdHarmonicCanvas.height;

// 	const amplitude = 50; // Maximum amplitude of the wave
// 	const centerY = canvasHeight / 2;
// 	const wavelength = canvasWidth / 3; // Third harmonic has 3 antinodes and 4 nodes
// 	let time = 0;
// 	const waveSpeed = 0.05;

// 	function drawWave() {
// 		standingWaveThirdHarmonicContext!.clearRect(
// 			0,
// 			0,
// 			canvasWidth,
// 			canvasHeight
// 		);
// 		standingWaveThirdHarmonicContext!.beginPath();
// 		standingWaveThirdHarmonicContext!.strokeStyle = "#FF6577";
// 		standingWaveThirdHarmonicContext!.lineWidth = 2;

// 		for (let x = 0; x <= canvasWidth; x++) {
// 			// Correct equation for third harmonic: y = A * sin(3 * pi * x / L) * cos(omega * t)
// 			const y =
// 				centerY +
// 				amplitude * Math.sin((3 * Math.PI * x) / canvasWidth) * Math.cos(time);

// 			if (x === 0) {
// 				standingWaveThirdHarmonicContext!.moveTo(x, y);
// 			} else {
// 				standingWaveThirdHarmonicContext!.lineTo(x, y);
// 			}
// 		}

// 		standingWaveThirdHarmonicContext!.stroke();
// 		time += waveSpeed;
// 		requestAnimationFrame(drawWave);
// 	}

// 	drawWave();
// }

function drawStandingWave(
	canvas: HTMLCanvasElement,
	context: CanvasRenderingContext2D | null,
	numberOfAntinodes: number
) {
	if (!context) return;
	const canvasWidth = canvas.width;
	const canvasHeight = canvas.height;

	const amplitude = 50; // Maximum amplitude of the wave
	const wavelength = canvasWidth / numberOfAntinodes; // Distance between 2 nodes (1 full wavelength)
	const centerY = canvasHeight / 2;
	let time = 0;
	const waveSpeed = 0.05;

	// Wave equation for n antinodes: k = 2πn / L
	const k = (2 * Math.PI) / wavelength; // Adjust wave frequency for n antinodes
	console.log({ numberOfAntinodes, k, wavelength, canvasWidth });
	function drawWave() {
		context!.clearRect(0, 0, canvasWidth, canvasHeight);
		context!.beginPath();
		context!.strokeStyle = "#FF6577";
		context!.lineWidth = 2;

		// Loop through the canvas width to calculate and draw the wave
		for (let x = 0; x <= canvasWidth; x++) {
			// Standing wave equation: y = A * sin(nπx / L) * cos(ωt)
			const y =
				numberOfAntinodes === 1
					? centerY +
					  amplitude * Math.sin((Math.PI * x) / wavelength) * Math.cos(time)
					: centerY + amplitude * Math.sin(k * x) * Math.cos(time); // For n antinodes

			if (x === 0) {
				context!.moveTo(x, y);
			} else {
				context!.lineTo(x, y);
			}
		}

		// Apply the stroke to render the wave
		context!.stroke();

		// Increment time for animation
		time += waveSpeed;

		// Repeat the drawing for the animation effect
		requestAnimationFrame(drawWave);
	}

	// Start drawing the wave
	drawWave();
}

drawStandingWave(
	standingWaveOneAntinodeCanvas,
	standingWaveOneAntinodeCanvasContext,
	1
);

drawStandingWave(
	standingWaveSecondHarmonicCanvas,
	standingWaveSecondHarmonicContext,
	2
);

drawStandingWave(
	standingWaveThirdHarmonicCanvas,
	standingWaveThirdHarmonicContext,
	3
);

window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
	const viewportWidth = window.innerWidth;
	if (viewportWidth < 1024) {
		canvasWaveform.width = 300;
	} else {
		canvasWaveform.width = 400;
	}
}

resizeCanvas();
