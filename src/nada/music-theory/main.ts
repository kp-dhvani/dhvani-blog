import * as Tone from "tone";

const linerSeries = [200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100];
const logarithmicSeries = [
	200, 300, 450, 675, 1012, 1519, 2278, 3417, 5126, 7689,
];

document.addEventListener("DOMContentLoaded", () => {
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
	const fifthHarmonicWaveCanvas = document.getElementById(
		"fifth-harmonic-wave"
	) as HTMLCanvasElement;

	const firstHarmonicWaveContext = firstHarmonicWaveCanvas.getContext("2d");
	const secondHarmonicWaveContext = secondHarmonicWaveCanvas.getContext("2d");
	const thirdHarmonicWaveContext = thirdHarmonicWaveCanvas.getContext("2d");
	const fourthHarmonicWaveContext = fourthHarmonicWaveCanvas.getContext("2d");
	const fifthHarmonicWaveContext = fifthHarmonicWaveCanvas.getContext("2d");

	// LINEAR SERIES
	const playLinearSeriesButton = document.getElementById(
		"play-linear-series"
	) as unknown as SVGElement;
	const pauseLinearSeriesButton = document.getElementById(
		"pause-linear-series"
	) as unknown as SVGElement;

	const linearPlayer = createPlayerForFrequencies(
		linerSeries,
		toggleLinearButtonClasses
	);

	playLinearSeriesButton?.addEventListener("click", () => {
		toggleLinearButtonClasses();
		linearPlayer.play();
	});
	pauseLinearSeriesButton?.addEventListener("click", () => {
		toggleLinearButtonClasses();
		linearPlayer.pause();
	});

	function toggleLinearButtonClasses() {
		if (playLinearSeriesButton?.classList.contains("invisible")) {
			playLinearSeriesButton?.classList.remove("invisible");
			pauseLinearSeriesButton?.classList.add("invisible");
		} else {
			playLinearSeriesButton?.classList.add("invisible");
			pauseLinearSeriesButton?.classList.remove("invisible");
		}
	}

	// LOG SERIES
	const playLogSeriesButton = document.getElementById(
		"play-log-series"
	) as unknown as SVGElement;
	const pauseLogSeriesButton = document.getElementById(
		"pause-log-series"
	) as unknown as SVGElement;

	const logPlayer = createPlayerForFrequencies(
		logarithmicSeries,
		toggleLogarithmicButtonClasses
	);

	playLogSeriesButton?.addEventListener("click", () => {
		toggleLogarithmicButtonClasses();
		logPlayer.play();
	});
	pauseLogSeriesButton?.addEventListener("click", () => {
		toggleLogarithmicButtonClasses();
		logPlayer.pause();
	});

	function toggleLogarithmicButtonClasses() {
		if (playLogSeriesButton?.classList.contains("invisible")) {
			playLogSeriesButton?.classList.remove("invisible");
			pauseLogSeriesButton?.classList.add("invisible");
		} else {
			playLogSeriesButton?.classList.add("invisible");
			pauseLogSeriesButton?.classList.remove("invisible");
		}
	}

	drawStandingWave(firstHarmonicWaveCanvas, firstHarmonicWaveContext, 1);
	drawStandingWave(secondHarmonicWaveCanvas, secondHarmonicWaveContext, 2);
	drawStandingWave(thirdHarmonicWaveCanvas, thirdHarmonicWaveContext, 3);
	drawStandingWave(fourthHarmonicWaveCanvas, fourthHarmonicWaveContext, 4);
	drawStandingWave(fifthHarmonicWaveCanvas, fifthHarmonicWaveContext, 5);
	drawSeriesChart();
});

function createPlayerForFrequencies(
	frequencySeries: number[],
	onPlayerStopCallback: Function
) {
	let sequence: Tone.Sequence | null = null;
	const synth = new Tone.PolySynth(Tone.Synth).toDestination();
	let isPlaying = false;

	function play() {
		if (isPlaying) return;
		Tone.start();
		if (!sequence) {
			sequence = new Tone.Sequence(
				(time, frequency) => {
					synth.triggerAttackRelease(frequency, 1, time);
					console.log(frequency);
					if (frequency === frequencySeries[frequencySeries.length - 1]) {
						Tone.getTransport().stop(time);
						isPlaying = false;
						reset();
						onPlayerStopCallback();
					}
				},
				frequencySeries,
				1
			);
		}
		Tone.start();
		sequence.start(0);
		Tone.getTransport().start();

		isPlaying = true;
	}

	function pause() {
		if (isPlaying) {
			Tone.getTransport().pause();
			isPlaying = false;
		}
	}
	function reset() {
		if (sequence) {
			Tone.getTransport().stop();
			sequence.dispose();
			sequence = null;
			isPlaying = false;
		}
	}

	return {
		play,
		pause,
	};
}

async function drawSeriesChart() {
	const linearData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Linear scale data
	const logarithmicData = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]; // Logarithmic scale data

	const ctx = document.getElementById("number-series")! as HTMLCanvasElement;
	if (!ctx) return;
	const { Chart, registerables } = await import("chart.js");
	Chart.register(...registerables);

	new Chart(ctx, {
		type: "line",
		data: {
			labels: linearData,
			datasets: [
				{
					label: "Linear Scale (+1)",
					data: linearData,
					borderColor: "blue",
					fill: false,
					tension: 0.1,
				},
				{
					label: "Logarithmic Scale (x2)",
					data: logarithmicData,
					borderColor: "red",
					fill: false,
					tension: 0.1,
				},
			],
		},
		options: {
			responsive: true,
			scales: {
				y: {
					beginAtZero: true,
					title: {
						display: true,
						text: "Value",
					},
				},
				x: {
					title: {
						display: true,
						text: "Scale",
					},
				},
			},
		},
	});
}

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
