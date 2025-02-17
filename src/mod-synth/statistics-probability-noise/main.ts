import { Chart, ChartConfiguration } from "chart.js/auto";

document.addEventListener("DOMContentLoaded", () => {
	// createDenseNoiseGraph("sample-graph");
});

function createDenseNoiseGraph(canvasId: string): void {
	const numSamples = 512 * 4;

	// Box-Muller transform to generate Gaussian noise
	function generateGaussianNoise(mean: number, stdDev: number): number {
		const u1 = Math.random();
		const u2 = Math.random();
		const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
		return mean + stdDev * z0;
	}

	const sampleData = Array.from({ length: numSamples }, (_, i) => ({
		x: i,
		y: generateGaussianNoise(0.5, 1),
	}));

	const config: ChartConfiguration = {
		type: "line",
		data: {
			datasets: [
				{
					label: "Noise Signal",
					data: sampleData,
					borderColor: "rgb(0, 0, 0)",
					borderWidth: 1,
					tension: 0,
					pointRadius: 0,
				},
			],
		},
		options: {
			responsive: true,
			animation: false,
			scales: {
				x: {
					type: "linear",
					title: {
						display: true,
						text: "Sample number",
					},
					min: 0,
					max: 511,
					grid: {
						display: true,
						color: "rgba(0, 0, 0, 0.1)",
					},
					ticks: {
						stepSize: 64,
						callback: function (value) {
							return Math.round(Number(value));
						},
					},
				},
				y: {
					title: {
						display: true,
						text: "Amplitude",
					},
					min: -4,
					max: 8,
					grid: {
						display: true,
						color: "rgba(0, 0, 0, 0.1)",
					},
					ticks: {
						stepSize: 2,
					},
				},
			},
		},
	};

	const ctx = document.getElementById(canvasId) as HTMLCanvasElement;
	new Chart(ctx, config);
}
