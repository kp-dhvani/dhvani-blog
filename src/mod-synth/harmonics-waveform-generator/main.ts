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
	drawStaticWaveform();
	attachSliderEventListeners(allSliders);
	getVolumeForHarmonics();
});

function adjustMasterVolume(event: Event) {
	const { value } = event.target as HTMLInputElement;
	const volumeNumber = Number(value);
	const dbValue = volumeNumber * 60 - 60; // maps 0 → -60dB and 1 → 0dB
	getDestination().volume.rampTo(dbValue, 0.1);
	drawStaticWaveform();
	const masterVolumeSlider = allSliders["master"];
	masterVolumeSlider.setAttribute("value", value);
}

function attachSliderEventListeners(sliders: SlidersByName) {
	const masterVolumeSlider = sliders["master"];
	masterVolumeSlider.addEventListener("input", adjustMasterVolume);
	for (const [key, value] of Object.entries(allSliders)) {
		if (key !== "master") {
			value.addEventListener("input", function (event: Event) {
				const { value } = event.target as HTMLInputElement;
				this.setAttribute("value", value);
				drawStaticWaveform();
			});
		}
	}
}

function drawStaticWaveform() {
	if (!canvasWaveformContext) return;
	const rect = canvasWaveform.getBoundingClientRect();
	const displayWidth = rect.width;
	const displayHeight = rect.height;

	canvasWaveformContext.clearRect(0, 0, displayWidth, displayHeight);
	canvasWaveformContext.lineWidth = 2;
	canvasWaveformContext.strokeStyle = "#FF6577";
	canvasWaveformContext.beginPath();

	const centerY = displayHeight / 2;
	const samples = prepareDataNeededForWaveformRender(displayWidth);
	const sampleLength = samples.length;
	for (let i = 0; i < sampleLength; i++) {
		const x = (i / (sampleLength - 1)) * displayWidth;
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

/**
 * this will generate sample for an individual
 * harmonic number
 */
function generateSamplesForHarmonicNumber(
	harmonicNumber: number,
	harmonicVolume: number,
	sampleCount: number
): number[] {
	const samples: number[] = [];
	for (let i = 0; i < sampleCount; i++) {
		// first calculate the angle for the harmonic number
		const angle = (i / (sampleCount - 1)) * Math.PI * 2 * harmonicNumber;
		const y = harmonicVolume * Math.sin(angle + 0); //phase = 0
		samples.push(y);
	}
	return samples;
}
/**
 * this will generate samples for the waveform being rendered
 * for all the harmonics taking an array for the volume levels
 * of all sliders
 */
function generateCompositeWaveformSamplesOfAllHarmonics(
	harmonicVolumes: string[],
	masterVolume: number,
	sampleCount: number
): number[] {
	const compositeSamples: number[] = Array(sampleCount).fill(0);

	// adding higher harmonics increases the amplitude of the final waveform
	// and pushes it out of the canvas

	// calculate a weighted sum of active harmonics
	// give higher harmonics more scaling
	let weightedSum = 0;
	for (const harmonicVolume of harmonicVolumes) {
		const currentHarmonicVolume = Number(harmonicVolume);
		if (currentHarmonicVolume > 0) {
			// give higher harmonics more weight in the scaling calculation
			weightedSum += currentHarmonicVolume;
		}
	}

	// let's add each harmonic based on its volume
	for (let h = 0; h < harmonicVolumes.length; h++) {
		const currentHarmonicVolume = Number(harmonicVolumes[h]);

		if (currentHarmonicVolume > 0) {
			// harmonic number is index + 1
			const harmonicNumber = h + 1;
			const currentHarmonicSamples = generateSamplesForHarmonicNumber(
				harmonicNumber,
				currentHarmonicVolume,
				sampleCount
			);

			// now let's add each harmonic sample to the composite sample
			for (let i = 0; i < sampleCount; i++) {
				compositeSamples[i] += currentHarmonicSamples[i];
			}
		}
	}

	// purpose of this scaling is to automatically adjust the amplitude as more harmonics are added
	// when we add multiple waveforms together their combined amplitude can quickly exceed the desired range
	// apply a scaling factor based on the weighted sum of harmonics
	const scalingFactor = weightedSum > 0 ? 1 / (1 + weightedSum) : 1;
	return compositeSamples.map(
		(sample) => sample * masterVolume * scalingFactor
	);
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

function getVolumeForHarmonics(): string[] {
	const volumes = Object.entries(allSliders)
		.map(([key, slider]) => {
			if (key !== "master") {
				return slider.getAttribute("value");
			}
		})
		.filter(Boolean);
	return volumes as string[];
}

function initialiseCanvas() {
	if (!canvasWaveformContext) {
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

function prepareDataNeededForWaveformRender(sampleCount: number): number[] {
	const allVolumes = getVolumeForHarmonics();
	const masterVolume = Number(allSliders.master.getAttribute("value"));
	const samples = generateCompositeWaveformSamplesOfAllHarmonics(
		allVolumes,
		masterVolume,
		sampleCount
	);
	return samples;
}

function startOscillator() {
	oscillator.volume.value = -30; // starts silent
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
	drawStaticWaveform();
});
