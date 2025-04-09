import Chart from "chart.js/auto";
import { Oscillator, getDestination, now } from "tone";

type NumericKeys = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";
type MasterSlider = {
	master: HTMLInputElement;
};
type NumericSliders = {
	[key in NumericKeys]: HTMLInputElement;
};
type SlidersByName = MasterSlider & NumericSliders;

type OscillatorsByNumber = {
	[key in NumericKeys]: Oscillator;
};

type FerriesWheelCanvasCoordinates = {
	centerX: number;
	centerY: number;
	radius: number;
	rectWidth: number;
	rectHeight: number;
};

type FerriesWheelLineCanvasCoordinates = {
	lineX: number;
	lineStartY: number;
	lineEndY: number;
	rectWidth: number;
	rectHeight: number;
};

interface FerriesWheelConfig {
	rotationTimeMinutes: number;
	amplitude: number;
	color: string;
	label: string;
	phase?: number; // phase in radians (0 to 2π) defaults to 0
}

interface ChartDisplayOptions {
	showPhaseOnXAxis?: boolean; // whether to show phase instead of time on x-axis
}

type YAxisLabelMap = {
	[key: number]: string;
};

type ScaleCallback = (
	this: any,
	tickValue: string | number,
	index: number,
	ticks: any[]
) => string | string[] | number | number[] | null | undefined;

let isPlaying = false;
let selectedWaveType = "default";

// frequency slider
const fundamentalFrequencySlider = document.getElementById(
	"fundamental-frequency"
);

let allOscillators = intialiseOscillatorsForAllHarmonics();

const allSliders = getAllHarmonicSliders();

const canvasWaveform = document.getElementById(
	"final-waveform"
) as HTMLCanvasElement;
const canvasWaveformContext = canvasWaveform.getContext("2d");

const playTriangleWaveButton = document.getElementById("playback-triangle");
const playSawtoothWaveButton = document.getElementById("playback-sawtooth");
const playSquareWaveButton = document.getElementById("playback-square");

document.addEventListener("DOMContentLoaded", function () {
	const playbackButton = document.getElementById("playback");
	playbackButton?.addEventListener("click", function () {
		handlePlaybackForOscillators();
		if (isPlaying) {
			this.textContent = "Stop";
		} else {
			this.textContent = "Play";
		}
	});

	playTriangleWaveButton?.addEventListener("click", function () {
		if (isPlaying && selectedWaveType === "triangle") {
			// already playing triangle wave stop it
			handlePlaybackForOscillators();
			this.textContent = "Play Triangle Wave";
		} else {
			// if playing a different wave stop it first
			if (isPlaying) {
				handlePlaybackForOscillators();
			}

			playTriangleWave();

			this.textContent = "Stop Triangle Wave";
			if (playSawtoothWaveButton)
				playSawtoothWaveButton.textContent = "Play Sawtooth Wave";
			if (playSquareWaveButton)
				playSquareWaveButton.textContent = "Play Square Wave";
		}
	});

	playSawtoothWaveButton?.addEventListener("click", function () {
		if (isPlaying && selectedWaveType === "sawtooth") {
			handlePlaybackForOscillators();
			this.textContent = "Play Sawtooth Wave";
		} else {
			if (isPlaying) {
				handlePlaybackForOscillators();
			}

			playSawtoothWave();

			this.textContent = "Stop Sawtooth Wave";
			if (playTriangleWaveButton)
				playTriangleWaveButton.textContent = "Play Triangle Wave";
			if (playSquareWaveButton)
				playSquareWaveButton.textContent = "Play Square Wave";
		}
	});

	playSquareWaveButton?.addEventListener("click", function () {
		if (isPlaying && selectedWaveType === "square") {
			handlePlaybackForOscillators();
			this.textContent = "Play Square Wave";
		} else {
			if (isPlaying) {
				handlePlaybackForOscillators();
			}

			playSquareWave();

			this.textContent = "Stop Square Wave";
			if (playTriangleWaveButton)
				playTriangleWaveButton.textContent = "Play Triangle Wave";
			if (playSawtoothWaveButton)
				playSawtoothWaveButton.textContent = "Play Sawtooth Wave";
		}
	});

	initialiseCanvas();
	drawStaticWaveform();
	attachSliderEventListeners(allSliders);
	getVolumeForHarmonics();
	drawSyncedFerriesWheels();

	const largeFerriesWheelConfig: FerriesWheelConfig = {
		rotationTimeMinutes: 8,
		amplitude: 1.0,
		color: "#FF6577",
		label: "Position vs Time (8-Minute Rotation)",
	};

	drawFerriesWheelChart("large-ferris-wheel-chart", largeFerriesWheelConfig);

	const smallFerriesWheelConfig: FerriesWheelConfig = {
		rotationTimeMinutes: 8,
		amplitude: 0.3,
		color: "#4169E1",
		label: "Small Wheel (4-Minute Rotation)",
	};
	drawFerriesWheelChart("large-small-ferris-wheel-chart", [
		largeFerriesWheelConfig,
		smallFerriesWheelConfig,
	]);

	drawFerriesWheelChart("slow-fast-ferris-wheel-chart", [
		{
			...largeFerriesWheelConfig,
		},
		{
			...largeFerriesWheelConfig,
			color: "#4169E1",
			rotationTimeMinutes: 4,
			label: "Position vs Time (4-Minute Rotation)",
		},
	]);

	drawFerriesWheelChart("phase-ferris-wheel-chart", largeFerriesWheelConfig, {
		showPhaseOnXAxis: true,
	});
});

function adjustMasterVolume(event: Event) {
	const { value } = event.target as HTMLInputElement;
	const volumeNumber = Number(value);
	const dbValue = volumeNumber * 60 - 60; // maps 0 → -60dB and 1 → 0dB
	getDestination().volume.exponentialRampToValueAtTime(dbValue, now() + 1);
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
				const harmonicNumber = getHarmonicNumberFromId(this.id);
				handleOscillatorForIndividualHarmonic(harmonicNumber, Number(value));
			});
		}
	}
}

function drawSyncedFerriesWheels() {
	const circleCanvas = document.getElementById(
		"ferries-wheel"
	) as HTMLCanvasElement;
	const lineCanvas = document.getElementById(
		"one-dimensional-ferries-wheel"
	) as HTMLCanvasElement;

	const circleContext = circleCanvas.getContext("2d");
	const lineContext = lineCanvas.getContext("2d");

	if (!circleContext || !lineContext) return;

	const dprCircle = window.devicePixelRatio || 1;
	const rectCircle = circleCanvas.getBoundingClientRect();

	circleCanvas.width = rectCircle.width * dprCircle;
	circleCanvas.height = rectCircle.height * dprCircle;
	circleContext.scale(dprCircle, dprCircle);

	const dprLine = window.devicePixelRatio || 1;
	const rectLine = lineCanvas.getBoundingClientRect();

	lineCanvas.width = rectLine.width * dprLine;
	lineCanvas.height = rectLine.height * dprLine;
	lineContext.scale(dprLine, dprLine);

	const RECT_WIDTH_RATIO = 0.15; // 15% of radius
	const RECT_HEIGHT_RATIO = 0.1; // 10% of radius
	const CIRCLE_RADIUS_RATIO = 0.7; // 70% of half the smaller dimension

	const LINE_LENGTH_RATIO = 0.7; // 70% of height
	const LINE_RECT_WIDTH_RATIO = 0.05; // 5% of canvas width
	const LINE_RECT_HEIGHT_RATIO = 0.05; // 5% of line length

	// shared animation variables
	let angle = 0;
	let speed = 0.02;

	const circleCoords: FerriesWheelCanvasCoordinates = {
		centerX: rectCircle.width / 2,
		centerY: rectCircle.height / 2,
		radius:
			Math.min(rectCircle.width / 2, rectCircle.height / 2) *
			CIRCLE_RADIUS_RATIO,
		rectWidth: 0,
		rectHeight: 0,
	};

	circleCoords.rectWidth = circleCoords.radius * RECT_WIDTH_RATIO;
	circleCoords.rectHeight = circleCoords.radius * RECT_HEIGHT_RATIO;

	const lineCoords: FerriesWheelLineCanvasCoordinates = {
		lineX: rectLine.width / 2,
		lineStartY: (rectLine.height * (1 - LINE_LENGTH_RATIO)) / 2,
		lineEndY:
			(rectLine.height * (1 - LINE_LENGTH_RATIO)) / 2 +
			rectLine.height * LINE_LENGTH_RATIO,
		rectWidth: rectLine.width * LINE_RECT_WIDTH_RATIO,
		rectHeight: rectLine.height * LINE_LENGTH_RATIO * LINE_RECT_HEIGHT_RATIO,
	};

	function drawCircle() {
		circleContext!.beginPath();
		const { centerX, centerY, radius } = circleCoords;
		circleContext!.arc(centerX, centerY, radius, 0, Math.PI * 2);
		circleContext!.strokeStyle = "#FF6577";
		circleContext!.lineWidth = 2;
		circleContext!.stroke();
	}

	function drawCircleRectangle() {
		const { centerX, centerY, radius, rectWidth, rectHeight } = circleCoords;

		const x = centerX + radius * Math.cos(angle);
		const y = centerY + radius * Math.sin(angle);

		circleContext!.save();

		circleContext!.translate(x, y);

		circleContext!.rotate(angle + Math.PI / 2);

		circleContext!.fillStyle = "#ff6600";
		circleContext!.fillRect(
			-rectWidth / 2,
			-rectHeight / 2,
			rectWidth,
			rectHeight
		);

		circleContext!.restore();
	}

	function drawLine() {
		const { lineX, lineStartY, lineEndY } = lineCoords;

		lineContext!.beginPath();
		lineContext!.moveTo(lineX, lineStartY);
		lineContext!.lineTo(lineX, lineEndY);
		lineContext!.strokeStyle = "#FF6577";
		lineContext!.lineWidth = 2;
		lineContext!.stroke();
	}

	function drawLineRectangle() {
		const { lineX, lineStartY, lineEndY, rectWidth, rectHeight } = lineCoords;

		const { centerY, radius } = circleCoords;
		const circleY = centerY + radius * Math.sin(angle);

		// map the circular Y position to the line position
		// scale the y-coordinate from circle to line proportionally
		const lineLength = lineEndY - lineStartY;
		const circleTotalHeight = 2 * radius;

		// calculate the relative position within the circle's vertical rang,e -radius to +radius from center
		// then map it to the line's position
		const relativeCirclePosition =
			(circleY - (centerY - radius)) / circleTotalHeight;
		const y = lineStartY + lineLength * relativeCirclePosition;

		lineContext!.fillStyle = "#ff6600";
		lineContext!.fillRect(
			lineX - rectWidth / 2,
			y - rectHeight / 2,
			rectWidth,
			rectHeight
		);
	}

	// combined animation function
	function animate() {
		circleContext!.clearRect(0, 0, rectCircle.width, rectCircle.height);
		lineContext!.clearRect(0, 0, rectLine.width, rectLine.height);

		drawCircle();
		drawCircleRectangle();

		drawLine();
		drawLineRectangle();

		angle -= speed;

		requestAnimationFrame(animate);
	}

	animate();
}

function drawFerriesWheelChart(
	canvasId: string,
	configs: FerriesWheelConfig | FerriesWheelConfig[],
	options: ChartDisplayOptions = {}
): void {
	const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
	if (!canvas) {
		console.error(`Canvas with ID "${canvasId}" not found`);
		return;
	}

	const context = canvas.getContext("2d");
	if (!context) return;

	const { showPhaseOnXAxis = false } = options;

	const configArray = Array.isArray(configs) ? configs : [configs];

	const maxAmplitude = Math.max(
		...configArray.map((config) => config.amplitude)
	);

	const datasets = configArray.map((config) => {
		const data = generateFerriesWheelData(config, options);
		return {
			label: config.label,
			data: data.map((point) => point.position),
			borderColor: config.color,
			backgroundColor: `${config.color}1A`, // 10% opacity
			borderWidth: 2,
			tension: 0.4,
			fill: true,
			pointRadius: 0,
		};
	});

	const labels = generateFerriesWheelData(configArray[0], options).map(
		(point) => point.label
	);

	const keyPhasePoints = [0, 90, 180, 270, 360];

	const xAxisConfig = showPhaseOnXAxis
		? {
				title: {
					display: true,
					text: "Phase (degrees)",
				},
				ticks: {
					callback: function (this: any, index: number) {
						// only show ticks for key phase points
						const degree = index * (360 / 100);
						if (keyPhasePoints.includes(Math.round(degree))) {
							return `${Math.round(degree)}°`;
						}
						return null; // hide other tick labels
					} as ScaleCallback,
					maxRotation: 0,
					autoSkip: false,
				},
		  }
		: {
				title: {
					display: true,
					text: "Time (minutes:seconds)",
				},
		  };
	const yAxisLabels: YAxisLabelMap = showPhaseOnXAxis
		? {
				1: "Amplitude",
				0: "Start",
				[-1]: "-Amplitude",
		  }
		: {
				1: "top",
				0: "start",
				[-1]: "bottom",
		  };

	new Chart(context, {
		type: "line",
		data: {
			labels: labels,
			datasets: datasets,
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				title: {
					display: true,
					text: showPhaseOnXAxis
						? "Ferris Wheel Position vs Phase"
						: "Ferris Wheel Position vs Time",
					font: {
						size: 16,
					},
				},
				tooltip: {
					enabled: false,
				},
				legend: {
					display: configArray.length > 1, // only show legend when multiple datasets
				},
			},
			scales: {
				x: xAxisConfig,
				y: {
					title: {
						display: true,
						text: "Vertical Position",
					},
					min: -maxAmplitude * 1.1,
					max: maxAmplitude * 1.1,
					ticks: {
						callback: function (value) {
							// normalize to the max amplitude
							const normalizedValue = Number(value) / maxAmplitude;
							const roundedValue = Math.round(normalizedValue);

							return yAxisLabels[roundedValue] || ""; // return appropriate label or empty string
						},
					},
				},
			},
		},
	});
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
	const samples = prepareDataNeededForWaveformRender(
		displayWidth,
		selectedWaveType
	);
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

function generateFerriesWheelData(
	config: FerriesWheelConfig,
	options: ChartDisplayOptions = {}
): {
	time: number;
	phase: number;
	phaseDegrees: number;
	position: number;
	label: string;
}[] {
	const { rotationTimeMinutes, amplitude } = config;
	const { showPhaseOnXAxis = false } = options;
	const totalPoints = 100; // number of data points to generate
	const data = [];

	for (let i = 0; i <= totalPoints; i++) {
		// always calculate both time and phase values
		const timeMinutes = (i / totalPoints) * 8;
		const phase = (i / totalPoints) * 2 * Math.PI;
		const phaseDegrees = (i / totalPoints) * 360;

		// calculate angle for position calculation
		const angle = showPhaseOnXAxis
			? phase
			: (i / totalPoints) * (8 / rotationTimeMinutes) * 2 * Math.PI;

		// calculate vertical position (sine wave for height)
		const position = amplitude * Math.sin(angle);

		// format label based on what we're showing on x-axis
		let label = "";
		if (showPhaseOnXAxis) {
			label = `${Math.round(phaseDegrees)}°`;
		} else {
			const minutes = Math.floor(timeMinutes);
			const seconds = Math.floor((timeMinutes % 1) * 60);
			label = `${minutes}:${seconds.toString().padStart(2, "0")}`;
		}

		data.push({
			time: parseFloat(timeMinutes.toFixed(2)),
			phase: parseFloat(phase.toFixed(2)),
			phaseDegrees: parseFloat(phaseDegrees.toFixed(0)),
			position: parseFloat(position.toFixed(2)),
			label,
		});
	}

	return data;
}

/**
 * this will generate sample for an individual
 * harmonic number
 */
function generateSamplesForHarmonicNumber(
	harmonicNumber: number,
	harmonicVolume: number,
	sampleCount: number,
	phase: number = 0
): number[] {
	const samples: number[] = [];
	for (let i = 0; i < sampleCount; i++) {
		// first calculate the angle for the harmonic number
		const angle = (i / (sampleCount - 1)) * Math.PI * 2 * harmonicNumber;
		const y = harmonicVolume * Math.sin(angle + phase);
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
	sampleCount: number,
	waveType: string = "default"
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
			let phase = 0;
			if (waveType === "triangle" && harmonicNumber % 2 !== 0) {
				phase = Math.floor(harmonicNumber / 2) % 2 === 0 ? 0 : Math.PI;
			}
			const currentHarmonicSamples = generateSamplesForHarmonicNumber(
				harmonicNumber,
				currentHarmonicVolume,
				sampleCount,
				phase
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

function generateSawtoothWaveHarmonics(): string[] {
	const volumes: string[] = [];
	for (let i = 1; i <= 10; i++) {
		const amplitude = 1 / i;
		volumes.push(amplitude.toFixed(3));
	}
	return volumes;
}

function generateTriangleWaveHarmonics(): string[] {
	const volumes: string[] = [];
	for (let i = 1; i <= 10; i++) {
		if (i % 2 === 1) {
			// odd harmonic: amplitude follows 1/n²
			// the actual coefficient is 8/(π²n²)
			const amplitude = 8 / (Math.PI * Math.PI * i * i);
			// scale to make it more audible
			const scaledAmplitude = amplitude * 1.2;
			volumes.push(Math.min(1, scaledAmplitude).toFixed(3));
		} else {
			// even harmonics should be zero
			volumes.push("0.000");
		}
	}
	return volumes;
}

function generateSquareWaveHarmonics(): string[] {
	const volumes: string[] = [];
	for (let i = 1; i <= 10; i++) {
		const amplitude = i % 2 === 1 ? 1 / i : 0;
		volumes.push(amplitude.toFixed(3));
	}
	return volumes;
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

function getHarmonicNumberFromId(id: string): number {
	// extract the word between "harmonic-" and "-volume"
	const regex = /harmonic-(\w+)-volume/;
	const match = regex.exec(id);

	if (!match) return 1; // default if no match found

	const wordNumber = match[1]; // this gives "one"

	const wordToNumber: Record<string, number> = {
		one: 1,
		two: 2,
		three: 3,
		four: 4,
		five: 5,
		six: 6,
		seven: 7,
		eight: 8,
		nine: 9,
		ten: 10,
	};

	return wordToNumber[wordNumber] || 1;
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

function handlePlaybackForOscillators() {
	if (isPlaying) {
		isPlaying = false;
		for (let i = 1; i <= 10; i++) {
			const currentOscillator = allOscillators[i.toString() as NumericKeys];
			currentOscillator.volume.exponentialRampToValueAtTime(-60, now() + 1);
			setTimeout(function () {
				currentOscillator.stop();
			}, 150);
		}
	} else {
		isPlaying = true;
		const allVolumes = getVolumeForHarmonics();
		for (let i = 1; i <= 10; i++) {
			const currentVolume = Number(allVolumes[i - 1]);
			const key = i.toString() as NumericKeys;
			const currentOscillator = allOscillators[key];
			// hearing a higher harmonic somewhere in the 10 oscillators
			// only start oscillators with volume above threshold
			if (currentVolume > 0.05) {
				// using a small threshold to avoid noise
				const dbValue = currentVolume * 60 - 60;
				currentOscillator.volume.value = dbValue;
				currentOscillator.start();
			} else {
				// let's make sure it's not playing
				currentOscillator.volume.value = -Infinity;
			}
		}
	}
}

function handleOscillatorForIndividualHarmonic(
	harmonicNumber: number,
	volume: number
) {
	const selectedOscillator =
		allOscillators[harmonicNumber as unknown as NumericKeys];
	selectedOscillator.stop();
	const dbValue = volume * 60 - 60;
	if (isPlaying) {
		// only adjust volume if we're supposed to be playing
		if (selectedOscillator.state === "stopped") {
			// if stopped but should be playing, start it
			selectedOscillator.volume.value = dbValue;
			selectedOscillator.start();
		} else {
			//  already playing just adjust volume
			selectedOscillator.volume.exponentialRampToValueAtTime(
				dbValue,
				now() + 0.1
			);
		}
	} else {
		// if not playing make sure it's stopped
		if (selectedOscillator.state === "started") {
			selectedOscillator.stop();
		}
	}
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

function intialiseOscillatorsForAllHarmonics(waveType: string = "default") {
	const fundamentalFrequency =
		Number(fundamentalFrequencySlider?.getAttribute("value")) || 440;
	const oscillators: OscillatorsByNumber = {} as OscillatorsByNumber;

	const isTriangle = waveType === "triangle";

	for (let i = 1; i <= 10; i++) {
		const key = i.toString() as NumericKeys;
		// for triangle waves we need to alternate the phase for odd harmonics
		let phase = 0;
		if (isTriangle) {
			// dor a triangle wave odd harmonics alternate phase (0 or π)
			if (i % 2 !== 0) {
				phase = 1 % 4 === 1 ? 0 : Math.PI;
			}
		}
		const osc = new Oscillator(
			fundamentalFrequency * i,
			"sine"
		).toDestination();
		osc.phase = phase;
		if (isTriangle && i % 2 === 0) {
			osc.volume.value = -Infinity;
		} else {
			osc.volume.value = -60;
		}
		oscillators[key] = osc;
	}
	return oscillators;
}

function playTriangleWave() {
	if (isPlaying) {
		handlePlaybackForOscillators();
	}
	selectedWaveType = "triangle";
	const triangleVolumes = generateTriangleWaveHarmonics();

	setHarmonicSliderVolumes(triangleVolumes);
	allOscillators = intialiseOscillatorsForAllHarmonics("triangle");
	handlePlaybackForOscillators();
}

function playSawtoothWave() {
	if (isPlaying) {
		handlePlaybackForOscillators();
	}
	selectedWaveType = "sawtooth";
	const sawtoothVolumes = generateSawtoothWaveHarmonics();
	setHarmonicSliderVolumes(sawtoothVolumes);
	allOscillators = intialiseOscillatorsForAllHarmonics("sawtooth");
	handlePlaybackForOscillators();
}

function playSquareWave() {
	if (isPlaying) {
		handlePlaybackForOscillators();
	}
	selectedWaveType = "square";
	const squareVolumes = generateSquareWaveHarmonics();
	setHarmonicSliderVolumes(squareVolumes);
	allOscillators = intialiseOscillatorsForAllHarmonics("square");
	handlePlaybackForOscillators();
}

function prepareDataNeededForWaveformRender(
	sampleCount: number,
	waveType: string = "default"
): number[] {
	const allVolumes = getVolumeForHarmonics();
	const masterVolume = Number(allSliders.master.getAttribute("value"));
	const samples = generateCompositeWaveformSamplesOfAllHarmonics(
		allVolumes,
		masterVolume,
		sampleCount,
		waveType
	);
	return samples;
}

function setHarmonicSliderVolumes(volumes: string[]) {
	for (let i = 1; i <= volumes.length; i++) {
		const currentSlider = allSliders[i.toString() as NumericKeys];
		if (currentSlider) {
			currentSlider.setAttribute("value", volumes[i - 1]);
			const event = new Event("input", { bubbles: true });
			currentSlider.dispatchEvent(event);
		}
	}
}

window.addEventListener("resize", function () {
	initialiseCanvas();
	drawStaticWaveform();
});
