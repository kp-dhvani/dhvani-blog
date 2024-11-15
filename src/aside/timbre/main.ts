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

const standingWaveFourthHarmonicCanvas = document.getElementById(
	"standing-wave-fourth-harmonic"
) as HTMLCanvasElement;

const standingWaveFifthHarmonicCanvas = document.getElementById(
	"standing-wave-fifth-harmonic"
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

const standingWaveFourthHarmonicCanvasContext =
	standingWaveFourthHarmonicCanvas.getContext("2d");

const standingWaveFifthHarmonicCanvasContext =
	standingWaveFifthHarmonicCanvas.getContext("2d");

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

function drawStandingWave(
	canvas: HTMLCanvasElement,
	context: CanvasRenderingContext2D | null,
	numberOfAntinodes: number
) {
	if (!context) return;
	const canvasWidth = canvas.width;
	const canvasHeight = canvas.height;

	const amplitude = 50;
	const wavelength =
		canvasWidth / (numberOfAntinodes >= 2 ? numberOfAntinodes - 1 : 1);
	const centerY = canvasHeight / 2;
	let time = 0;
	const waveSpeed = 0.05;

	// Wave equation for n antinodes: k = 2πn / L
	const k = (2 * Math.PI) / wavelength;

	function drawWave() {
		context!.clearRect(0, 0, canvasWidth, canvasHeight);
		context!.beginPath();
		context!.strokeStyle = "#FF6577";
		context!.lineWidth = 2;

		for (let x = 0; x <= canvasWidth; x++) {
			// Standing wave equation: y = A * sin(nπx / L) * cos(ωt)
			const y =
				numberOfAntinodes === 1
					? centerY +
					  amplitude * Math.sin((Math.PI * x) / wavelength) * Math.cos(time)
					: centerY + amplitude * Math.sin(k * x) * Math.cos(time);

			if (x === 0) {
				context!.moveTo(x, y);
			} else {
				context!.lineTo(x, y);
			}
		}

		context!.stroke();

		time += waveSpeed;

		requestAnimationFrame(drawWave);
	}

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

drawStandingWave(
	standingWaveFourthHarmonicCanvas,
	standingWaveFourthHarmonicCanvasContext,
	4
);

drawStandingWave(
	standingWaveFifthHarmonicCanvas,
	standingWaveFifthHarmonicCanvasContext,
	5
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
