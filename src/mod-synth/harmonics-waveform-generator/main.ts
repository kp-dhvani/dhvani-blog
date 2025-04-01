import { Oscillator, ToneOscillatorType, getDestination } from "tone";

type NumericKeys = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";
type MasterSlider = {
	master: HTMLInputElement;
};
type NumericSliders = {
	[key in NumericKeys]: HTMLInputElement;
};
type SlidersByName = MasterSlider & NumericSliders;

const DEFAULT_FUNDAMENTAL_FREQUENCY = 440;
const DEFAULT_MASTER_VOLUME = 1;

let oscillator = intialiseOscillator(DEFAULT_FUNDAMENTAL_FREQUENCY, "sine");
oscillator.connect(getDestination());

const allSliders = getAllHarmonicSliders();

const canvasWaveform = document.getElementById(
	"final-waveform"
) as HTMLCanvasElement;
const canvasWaveformContext = canvasWaveform.getContext("2d");

document.addEventListener("DOMContentLoaded", function () {
	// frequency slider
	const fundamentalFrequencySlider = document.getElementById(
		"fundamental-frequency"
	);
	const fundamentalFrequencySliderLabel = document.getElementById(
		"fundamental-frequency-value"
	);
	fundamentalFrequencySliderLabel!.textContent = `${DEFAULT_FUNDAMENTAL_FREQUENCY} Hz`;
	// set the default
	if (fundamentalFrequencySlider) {
		fundamentalFrequencySlider.setAttribute(
			"value",
			DEFAULT_FUNDAMENTAL_FREQUENCY.toString()
		);
	}

	// listen to frequency slider
	fundamentalFrequencySlider?.addEventListener(
		"input",
		function (event: Event) {
			const { value } = event.target as HTMLInputElement;
			fundamentalFrequencySliderLabel!.textContent = `${value} Hz`;
			const wasPlaying = oscillator.state === "started";
			stopOscillator();
			oscillator.disconnect();
			oscillator.dispose();
			oscillator = intialiseOscillator(Number(value), "sine");
			oscillator.connect(getDestination());

			if (wasPlaying) {
				startOscillator();
			}
		}
	);

	const playbackButton = document.getElementById("playback");
	playbackButton?.addEventListener("click", function () {
		if (oscillator.state === "started") {
			this.textContent = "Play";
			stopOscillator();
		} else {
			startOscillator();
			this.textContent = "Stop";
		}
	});
	initialiseCanvas();
	drawStaticWaveform(DEFAULT_MASTER_VOLUME);
	attachSliderEventListeners(allSliders);
});

function attachSliderEventListeners(sliders: SlidersByName) {
	const masterVolumeSlider = sliders["master"];
	masterVolumeSlider.addEventListener("input", adjustMasterVolume);
}

function getAllHarmonicSliders(): SlidersByName {
	const sliders: NodeListOf<HTMLInputElement> = document.querySelectorAll(
		".harmonic-slider input"
	);
	if (sliders.length === 0) {
		throw new Error("no harmonic sliders found");
	}
	const slidersByName: SlidersByName = {
		master: sliders[0],
		"1": sliders[1],
		"2": sliders[2],
		"3": sliders[3],
		"4": sliders[4],
		"5": sliders[5],
		"6": sliders[6],
		"7": sliders[7],
		"8": sliders[8],
		"9": sliders[9],
		"10": sliders[10],
	};
	return slidersByName;
}

function adjustMasterVolume(event: Event) {
	const { value } = event.target as HTMLInputElement;
	const volumeNumber = Number(value);
	const dbValue = volumeNumber * 60 - 60; // maps 0 → -60dB and 1 → 0dB
	getDestination().volume.rampTo(dbValue, 0.1);
	drawStaticWaveform(volumeNumber);
	const masterVolumeSlider = allSliders["master"];
	masterVolumeSlider.setAttribute("value", value);
}

function drawStaticWaveform(amplitude: number) {
	if (!canvasWaveformContext) return;
	const rect = canvasWaveform.getBoundingClientRect();
	const displayWidth = rect.width;
	const displayHeight = rect.height;

	canvasWaveformContext.clearRect(0, 0, displayWidth, displayHeight);
	canvasWaveformContext.lineWidth = 2;
	canvasWaveformContext.strokeStyle = "#FF6577";
	canvasWaveformContext.beginPath();
	const samples = generateOneCycleSineWaveSamples(
		amplitude,
		Math.floor(displayWidth),
		0
	);

	const centerY = displayHeight / 2;

	for (let i = 0; i < samples.length; i++) {
		const x = (i / (samples.length - 1)) * displayWidth;
		// calculate y position (flipped because canvas y is top-down)
		const y = centerY - samples[i] * (displayHeight * 0.495);
		if (i === 0) {
			canvasWaveformContext.moveTo(x, y);
		} else {
			canvasWaveformContext.lineTo(x, y);
		}
	}
	canvasWaveformContext.stroke();
}

function generateOneCycleSineWaveSamples(
	amplitude: number,
	sampleCount: number,
	phase: number
): number[] {
	const values: number[] = [];
	for (let i = 0; i < sampleCount; i++) {
		// from 0 to 2Pie
		const angle = (i / (sampleCount - 1)) * Math.PI * 2;
		// calculate y at this angle
		const y = amplitude * Math.sin(angle + phase);
		values.push(y);
	}
	return values;
}

function initialiseCanvas() {
	if (!canvasWaveformContext) {
		console.log("mo canvasWaveformContext");
		return;
	}
	const dpr = window.devicePixelRatio || 1;
	const rect = canvasWaveform.getBoundingClientRect();

	const displayWidth = rect.width;
	const displayHeight = rect.height;
	canvasWaveform.width = displayWidth * dpr;
	canvasWaveform.height = displayHeight * dpr;

	canvasWaveformContext.scale(dpr, dpr);
}

function intialiseOscillator(frequency: number, type: ToneOscillatorType) {
	return new Oscillator(frequency, type);
}

function startOscillator() {
	oscillator.volume.value = -30; // start completely silent
	oscillator.toDestination().start();
	setTimeout(function () {
		oscillator.volume.rampTo(0, 0.1);
	}, 20);
}

function stopOscillator() {
	oscillator.volume.rampTo(-30, 0.1);
	setTimeout(function () {
		oscillator.stop();
	}, 150);
}

window.addEventListener("resize", function () {
	initialiseCanvas();
	const masterVolumeSlider = allSliders["master"];
	const value = masterVolumeSlider.getAttribute("value");
	drawStaticWaveform(Number(value));
});
