import { Analyser, Player, Context } from "tone";
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

const canvasWaveformContext = canvasWaveform.getContext("2d");
const canvasFFTContext = canvasFFT.getContext("2d");

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

window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
	const viewportWidth = window.innerWidth;
	if (viewportWidth <= 1024) {
		canvasWaveform.width = 300;
	} else {
		canvasWaveform.width = 400;
	}
}

resizeCanvas();
