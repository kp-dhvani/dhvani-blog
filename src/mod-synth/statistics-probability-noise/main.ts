import { Chart } from "chart.js/auto";

type Sample = number;
type DataPoint = { x: number; y: number };
type HistogramBin = { value: number; count: number };

type ProbabilityChartType = "pmf" | "pdf";

interface ProbabilityChartOptions {
	title?: string;
	subtitle?: string;
	xAxisLabel?: string;
	yAxisLabel?: string;
	fillColor?: string;
	borderColor?: string;
	xRange?: { min: number; max: number };
	showLegend?: boolean;
}

const LARGE_SAMPLE_SIZE = 256000;
const SIGNAL_MEAN = 128;
const SIGNAL_STD_DEV = 15;
const SMALL_SAMPLE_SIZE = 128;
const VALUE_RANGE = { min: 90, max: 170 }; // range where the signal data is meaningful
const CHART_COLOR = "#FF6577";

function generateGaussianNoise(mean: number, stdDev: number): number {
	const u1 = Math.random();
	const u2 = Math.random();
	const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
	// ensure values stay within 8-bit range (0-255) for the graph
	return Math.min(255, Math.max(0, Math.round(mean + stdDev * z0)));
}

function generateSignal(size: number, mean: number, stdDev: number): Sample[] {
	return Array.from({ length: size }, () =>
		generateGaussianNoise(mean, stdDev)
	);
}

function createDataPoints(samples: Sample[]): DataPoint[] {
	return samples.map((y, i) => ({ x: i, y }));
}

function create8BitHistogram(
	samples: Sample[],
	minValue: number,
	maxValue: number
): HistogramBin[] {
	// Initialize bins for each possible value in the range
	const binCount = maxValue - minValue + 1;
	const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
		value: minValue + i,
		count: 0,
	}));

	// Count samples into bins
	return samples.reduce((acc, sample) => {
		if (sample >= minValue && sample <= maxValue) {
			const index = sample - minValue;
			acc[index].count += 1;
		}
		return acc;
	}, bins);
}

// Chart creation functions
function createRawSignalChart(canvasId: string, dataPoints: DataPoint[]): void {
	const ctx = document.getElementById(canvasId) as HTMLCanvasElement;
	if (!ctx) return;
	new Chart(ctx, {
		type: "line",
		data: {
			datasets: [
				{
					data: dataPoints,
					borderColor: CHART_COLOR,
					backgroundColor: CHART_COLOR,
					pointRadius: 2,
					pointHoverRadius: 3,
					tension: 0,
					borderWidth: 1,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				x: {
					type: "linear",
					position: "bottom",
					min: 0,
					max: SMALL_SAMPLE_SIZE - 1,
					title: {
						display: true,
						text: "Sample number",
					},
					ticks: {
						stepSize: 16,
					},
					grid: {
						color: "rgba(0, 0, 0, 0.1)",
						drawTicks: true,
					},
				},
				y: {
					min: 0,
					max: 255,
					title: {
						display: true,
						text: "Amplitude",
					},
					ticks: {
						stepSize: 64,
					},
					grid: {
						color: "rgba(0, 0, 0, 0.1)",
						drawTicks: true,
					},
				},
			},
			plugins: {
				title: {
					display: true,
					text: `Chart A: ${SMALL_SAMPLE_SIZE} raw samples of an 8 bit signal`,
					position: "top",
					align: "center",
					font: {
						weight: "bold",
					},
				},
				legend: {
					display: false,
				},
			},
		},
	});
}

function createHistogramChart(
	canvasId: string,
	histogramData: HistogramBin[],
	title: string,
	maxYScale?: number
): void {
	const ctx = document.getElementById(canvasId) as HTMLCanvasElement;
	if (!ctx) return;
	new Chart(ctx, {
		type: "bar",
		data: {
			labels: histogramData.map((bin) => bin.value.toString()),
			datasets: [
				{
					label: "Count",
					data: histogramData.map((bin) => bin.count),
					backgroundColor: CHART_COLOR,
					barPercentage: 1,
					categoryPercentage: 1,
					borderWidth: 0,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				x: {
					title: {
						display: true,
						text: "Value of sample",
					},
					min: VALUE_RANGE.min.toString(),
					max: VALUE_RANGE.max.toString(),
					grid: {
						color: "rgba(0, 0, 0, 0.1)",
						drawTicks: true,
					},
				},
				y: {
					title: {
						display: true,
						text: "Number of occurrences",
					},
					beginAtZero: true,
					...(maxYScale && { max: maxYScale }),
					grid: {
						color: "rgba(0, 0, 0, 0.1)",
						drawTicks: true,
					},
				},
			},
			plugins: {
				title: {
					display: true,
					text: title,
					position: "top",
					align: "center",
					font: {
						weight: "bold",
					},
				},
				legend: {
					display: false,
				},
			},
		},
	});
}

function calculateStatsFromHistogram(
	histogram: number[],
	binValues: number[] = histogram.map((_, i) => i)
): { mean: number; standardDeviation: number } {
	if (histogram.length === 0) return { mean: 0, standardDeviation: 0 };
	// Calculate total count
	const totalCount = histogram.reduce((sum, count) => sum + count, 0);
	if (totalCount === 0) return { mean: 0, standardDeviation: 0 };
	// Calculate mean
	let weightedSum = 0;
	for (let i = 0; i < histogram.length; i++) {
		weightedSum += binValues[i] * histogram[i];
	}
	const mean = weightedSum / totalCount;

	// Calculate variance and standard deviation
	let varianceSum = 0;
	for (let i = 0; i < histogram.length; i++) {
		varianceSum += Math.pow(binValues[i] - mean, 2) * histogram[i];
	}
	// Use n-1 correction for sample standard deviation
	const divisor = totalCount > 1 ? totalCount - 1 : 1;
	const variance = varianceSum / divisor;
	const standardDeviation = Math.sqrt(variance);

	return { mean, standardDeviation };
}

function createProbabilityChart(
	canvasId: string,
	histogramData: HistogramBin[],
	chartType: ProbabilityChartType,
	options: ProbabilityChartOptions = {}
): void {
	const ctx = document.getElementById(canvasId) as HTMLCanvasElement;
	if (!ctx) return;

	// Set default options
	const chartOptions: Required<ProbabilityChartOptions> = {
		title:
			chartType === "pmf"
				? "Chart D: Probability Mass Function (PMF)"
				: "Chart E: Probability Density Function (PDF)",
		subtitle: "",
		xAxisLabel: "Value of sample",
		yAxisLabel:
			chartType === "pmf" ? "Probability of occurrence" : "Probability density",
		fillColor: CHART_COLOR,
		borderColor: CHART_COLOR,
		xRange: VALUE_RANGE,
		showLegend: false,
		...options,
	};

	// Calculate statistics from histogram data
	const binValues = histogramData.map((bin) => bin.value);
	const histogramCounts = histogramData.map((bin) => bin.count);

	// Calculate total count of all samples
	const totalCount = histogramData.reduce((sum, bin) => sum + bin.count, 0);

	// Function to determine appropriate decimal places
	function getDecimalPlaces(value: number): number {
		if (value < 0.01) return 4;
		if (value < 0.1) return 3;
		if (value < 1) return 2;
		return 1;
	}

	// Prepare data based on chart type
	let chartData: any[] = [];
	let maxY = 0;
	let chartTypeConfig: any = {};

	if (chartType === "pmf") {
		// Calculate PMF (probability for each value)
		chartData = histogramData.map((bin) => ({
			x: bin.value,
			y: totalCount > 0 ? bin.count / totalCount : 0,
		}));
		maxY = Math.max(...chartData.map((item) => item.y));
		chartTypeConfig = {
			type: "bar",
			barPercentage: 1,
			categoryPercentage: 1,
			borderWidth: 0,
		};
	} else {
		const stats = calculateStatsFromHistogram(histogramCounts, binValues);
		const { mean, standardDeviation: stdDev } = stats;
		// Generate points for normal distribution curve (PDF)
		const xMin = chartOptions.xRange.min;
		const xMax = chartOptions.xRange.max;
		const stepSize = 0.25; // Smaller step for smoother curve

		for (let x = xMin; x <= xMax; x += stepSize) {
			const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
			const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
			chartData.push({ x, y });
		}
		maxY = Math.max(...chartData.map((p) => p.y));
		chartTypeConfig = {
			type: "line",
			tension: 0.2,
			pointRadius: 0,
			fill: true,
			borderWidth: 2,
		};
	}

	const decimalPlaces = getDecimalPlaces(maxY);

	// Create the chart
	new Chart(ctx, {
		type: chartType === "pmf" ? "bar" : "line",
		data: {
			datasets: [
				{
					label: chartOptions.title,
					data: chartData,
					backgroundColor: `${chartOptions.fillColor}${
						chartType === "pdf" ? "15" : ""
					}`,
					borderColor: chartOptions.borderColor,
					...chartTypeConfig,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				x: {
					type: "linear",
					title: {
						display: true,
						text: chartOptions.xAxisLabel,
						font: {
							weight: "bold",
							size: 12,
						},
					},
					min: chartOptions.xRange.min,
					max: chartOptions.xRange.max,
					grid: {
						display: true,
						color: "rgba(0, 0, 0, 0.1)",
						drawTicks: true,
					},
					ticks: {
						stepSize: 10,
						font: {
							size: 10,
						},
					},
				},
				y: {
					title: {
						display: true,
						text: chartOptions.yAxisLabel,
						font: {
							weight: "bold",
							size: 12,
						},
					},
					beginAtZero: true,
					max: maxY * 1.05, // add 5% padding to the top
					grid: {
						display: true,
						color: "rgba(0, 0, 0, 0.1)",
						drawTicks: true,
					},
					ticks: {
						callback: function (value) {
							return Number(value).toFixed(decimalPlaces);
						},
						font: {
							size: 10,
						},
					},
				},
			},
			plugins: {
				title: {
					display: true,
					text: chartOptions.title,
					position: "top",
					align: "center",
					font: {
						weight: "bold",
						size: 14,
					},
					padding: {
						top: 10,
						bottom: chartOptions.subtitle ? 5 : 10,
					},
				},
				subtitle: {
					display: !!chartOptions.subtitle,
					text: chartOptions.subtitle,
					position: "top",
					align: "center",
					font: {
						style: "italic",
						size: 12,
					},
					padding: {
						bottom: 10,
					},
				},
				legend: {
					display: chartOptions.showLegend,
				},
				tooltip: {
					callbacks: {
						label: (context) => {
							const y = context.parsed.y;
							const label = chartType === "pmf" ? "Probability" : "Density";
							return `${label}: ${y.toFixed(5)}`;
						},
					},
				},
			},
			layout: {
				padding: {
					left: 10,
					right: 10,
					top: 10,
					bottom: 10,
				},
			},
		},
	});
}

// main function to create all three visualizations
function createSignalVisualisations(): void {
	// 1. generate data - both small and large sample sets
	const smallSignal = generateSignal(
		SMALL_SAMPLE_SIZE,
		SIGNAL_MEAN,
		SIGNAL_STD_DEV
	);
	const largeSignal = generateSignal(
		LARGE_SAMPLE_SIZE,
		SIGNAL_MEAN,
		SIGNAL_STD_DEV
	);

	// 2. process data for visualizations
	const smallDataPoints = createDataPoints(smallSignal);
	const smallHistogram = create8BitHistogram(
		smallSignal,
		VALUE_RANGE.min,
		VALUE_RANGE.max
	);
	const largeHistogram = create8BitHistogram(
		largeSignal,
		VALUE_RANGE.min,
		VALUE_RANGE.max
	);

	const largeHistogramStats = calculateStatsFromHistogram(
		largeHistogram.map((bin) => bin.count),
		largeHistogram.map((bin) => bin.value)
	);
	const meanSpanElement = document.getElementById("histogram-mean");
	if (meanSpanElement) {
		meanSpanElement.textContent = `${largeHistogramStats.mean.toFixed(4)}`;
	}
	const standardDeviationSpanElement = document.getElementById(
		"histogram-standard-deviation"
	);
	if (standardDeviationSpanElement) {
		standardDeviationSpanElement.textContent = `${largeHistogramStats.standardDeviation.toFixed(
			4
		)}`;
	}

	// 3. create visualizations
	createRawSignalChart("raw-signal-plot", smallDataPoints);
	createHistogramChart(
		"128-point-histogram",
		smallHistogram,
		`Chart B: ${SMALL_SAMPLE_SIZE} point histogram`,
		10
	);
	createHistogramChart(
		"256k-point-histogram",
		largeHistogram,
		`Chart C: ${LARGE_SAMPLE_SIZE} point histogram`,
		10000
	);

	createProbabilityChart("pmf", largeHistogram, "pmf");
	createProbabilityChart("pdf", largeHistogram, "pdf");
}

document.addEventListener("DOMContentLoaded", () => {
	createSignalVisualisations();
});
