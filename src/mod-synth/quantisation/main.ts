import Chart from "chart.js/auto";

type NumberFormat =
	| "UNSIGNED"
	| "OFFSET"
	| "SIGN_MAGNITUDE"
	| "TWOS_COMPLEMENT";

interface BinaryRow {
	decimal: number;
	binary: string;
}

interface FormatConfig {
	range: {
		start: number;
		end: number;
	};
	bits: number;
}

// Function to create the charts
function createDigitisationCharts(): void {
	// Generate the original signal
	const numPoints = 50;
	const originalSignal = generateOriginalSignal(numPoints);

	// Sample the signal (sample every 4 points)
	const samplingRate = 4;
	const sampledSignal = sampleSignal(originalSignal, samplingRate);

	// Quantize the sampled signal (10 quantization levels)
	const quantizationLevels = 10;
	const { digitalSignal, quantizationError } = quantizeSignal(
		sampledSignal,
		quantizationLevels
	);

	// Create the original signal chart
	const originalCtx = document.getElementById(
		"analog-signal"
	) as HTMLCanvasElement;
	new Chart(originalCtx, {
		type: "line",
		data: {
			datasets: [
				{
					label: "Chart A: Original analog signal",
					data: originalSignal,
					borderColor: "black",
					backgroundColor: "transparent",
					borderWidth: 1,
					pointRadius: 0,
					tension: 0.4,
				},
			],
		},
		options: {
			scales: {
				x: {
					type: "linear",
					position: "bottom",
					title: {
						display: true,
						text: "Time",
					},
					min: 0,
					max: numPoints,
				},
				y: {
					title: {
						display: true,
						text: "Amplitude (in Volts)",
					},
					min: 2.99,
					max: 3.03,
				},
			},
		},
	});

	// Create the sampled signal chart
	const sampledCtx = document.getElementById(
		"sampled-analog-signal"
	) as HTMLCanvasElement;
	new Chart(sampledCtx, {
		type: "line",
		data: {
			datasets: [
				{
					label: "Chart B: Sampled analog signal",
					data: sampledSignal,
					borderColor: "black",
					backgroundColor: "transparent",
					borderWidth: 1,
					pointRadius: 0,
					stepped: "before",
				},
			],
		},
		options: {
			scales: {
				x: {
					type: "linear",
					position: "bottom",
					title: {
						display: true,
						text: "Time",
					},
					min: 0,
					max: numPoints,
				},
				y: {
					title: {
						display: true,
						text: "Amplitude (in Volts)",
					},
					min: 2.99,
					max: 3.03,
				},
			},
		},
	});

	// Create the digital signal chart
	const digitalCtx = document.getElementById(
		"digital-signal"
	) as HTMLCanvasElement;
	new Chart(digitalCtx, {
		type: "scatter",
		data: {
			datasets: [
				{
					label: "Chart C: Digitised signal",
					data: digitalSignal,
					borderColor: "black",
					backgroundColor: "black",
					pointStyle: "rect",
					pointRadius: 3,
					showLine: true,
					stepped: "before",
				},
			],
		},
		options: {
			scales: {
				x: {
					type: "linear",
					position: "bottom",
					title: {
						display: true,
						text: "Sample number",
					},
					min: 0,
					max: numPoints,
				},
				y: {
					title: {
						display: true,
						text: "Digital number",
					},
					min: 2.99,
					max: 3.03,
				},
			},
		},
	});

	// Create the quantization error chart
	const errorCtx = document.getElementById(
		"quantisation-error"
	) as HTMLCanvasElement;
	new Chart(errorCtx, {
		type: "scatter",
		data: {
			datasets: [
				{
					label: "Chart D: Quantisation error",
					data: quantizationError,
					borderColor: "black",
					backgroundColor: "black",
					pointStyle: "rect",
					pointRadius: 3,
					showLine: true,
				},
			],
		},
		options: {
			scales: {
				x: {
					type: "linear",
					position: "bottom",
					title: {
						display: true,
						text: "Sample number",
					},
					min: 0,
					max: numPoints,
				},
				y: {
					title: {
						display: true,
						text: "Error (in LSBs)",
					},
					min: -0.002,
					max: 0.002,
				},
			},
		},
	});
}

function createDitheringVisualisations(): void {
	// Common data and configuration
	const sampleCount = 50;
	const yMin = 3000;
	const yMax = 3005;

	// Create base analog signal data - a low amplitude wave
	const baseAnalogSignal = Array.from({ length: sampleCount }, (_, i) => {
		const x = (i / sampleCount) * 2 * Math.PI * 2;
		return 3002 + Math.sin(x) * 0.8 + Math.cos(x * 1.5) * 0.5;
	});

	// Generate quantized digital signal from analog signal
	const digitalSignal = baseAnalogSignal.map((y) => Math.round(y));

	// Add dithering noise to analog signal
	const noiseScale = 2.5; // SD of 2.5 LSB
	const noisySignal = baseAnalogSignal.map((y) => {
		// Generate noise with normal distribution approximation
		let noise = 0;
		for (let i = 0; i < 6; i++) {
			noise += Math.random() * 2 - 1;
		}
		noise = (noise / 6) * noiseScale;
		return y + noise;
	});

	// create quantized digital signal from noisy analog signal
	const ditheredDigitalSignal = noisySignal.map((y) => Math.round(y));

	const smallAmplitudeSignal = document.getElementById(
		"small-amplitude-signal"
	) as HTMLCanvasElement;
	if (smallAmplitudeSignal) {
		new Chart(smallAmplitudeSignal, {
			type: "line",
			data: {
				labels: Array.from({ length: sampleCount }, (_, i) => i.toString()),
				datasets: [
					{
						label: "Analog Signal",
						data: baseAnalogSignal,
						borderColor: "rgba(100, 100, 255, 0.8)",
						backgroundColor: "transparent",
						borderWidth: 1.5,
						pointRadius: 0,
						tension: 0.4,
					},
					{
						label: "Digital Signal",
						data: digitalSignal,
						borderColor: "rgba(0, 0, 0, 1)",
						backgroundColor: "transparent",
						borderWidth: 2,
						pointRadius: 0,
						stepped: "before",
					},
				],
			},
			options: {
				plugins: {
					title: {
						display: true,
						text: "Chart E: Digitization of a small amplitude signal",
						font: { size: 14 },
					},
					legend: { position: "bottom" },
				},
				scales: {
					x: {
						title: { display: true, text: "Time (or sample number)" },
						grid: { display: true },
					},
					y: {
						min: yMin,
						max: yMax,
						title: { display: true, text: "Millivolts (or digital number)" },
						ticks: { stepSize: 1 },
					},
				},
			},
		});
	}

	// dithering noise added
	const ditheringNoiseCanvas = document.getElementById(
		"dithering-noise"
	) as HTMLCanvasElement;
	if (ditheringNoiseCanvas) {
		new Chart(ditheringNoiseCanvas, {
			type: "line",
			data: {
				labels: Array.from({ length: sampleCount }, (_, i) => i.toString()),
				datasets: [
					{
						label: "Original Analog Signal",
						data: baseAnalogSignal,
						borderColor: "rgba(100, 100, 255, 0.8)",
						backgroundColor: "transparent",
						borderWidth: 1.5,
						pointRadius: 0,
						tension: 0.4,
					},
					{
						label: "With Added Noise",
						data: noisySignal,
						borderColor: "rgba(100, 100, 100, 0.8)",
						backgroundColor: "transparent",
						borderWidth: 1,
						pointRadius: 0,
					},
				],
			},
			options: {
				plugins: {
					title: {
						display: true,
						text: "Chart F: Dithering noise added",
						font: { size: 14 },
					},
					legend: { position: "bottom" },
				},
				scales: {
					x: {
						title: { display: true, text: "Time" },
						grid: { display: true },
					},
					y: {
						min: yMin,
						max: yMax,
						title: { display: true, text: "Millivolts" },
						ticks: { stepSize: 1 },
					},
				},
			},
		});
	}

	// digitisation of dithered signal
	const digitisedDitherCanvas = document.getElementById(
		"digitised-dither"
	) as HTMLCanvasElement;
	if (digitisedDitherCanvas) {
		new Chart(digitisedDitherCanvas, {
			type: "line",
			data: {
				labels: Array.from({ length: sampleCount }, (_, i) => i.toString()),
				datasets: [
					{
						label: "Original Analog Signal",
						data: baseAnalogSignal,
						borderColor: "rgba(100, 100, 255, 0.8)",
						backgroundColor: "transparent",
						borderWidth: 1.5,
						pointRadius: 0,
						tension: 0.4,
					},
					{
						label: "Digital Signal",
						data: ditheredDigitalSignal,
						borderColor: "rgba(0, 0, 0, 1)",
						backgroundColor: "transparent",
						borderWidth: 2,
						pointRadius: 0,
						stepped: "before",
					},
				],
			},
			options: {
				plugins: {
					title: {
						display: true,
						text: "Chart G: Digitization of dithered signal",
						font: { size: 14 },
					},
					legend: { position: "bottom" },
				},
				scales: {
					x: {
						title: { display: true, text: "Time (or sample number)" },
						grid: { display: true },
					},
					y: {
						min: yMin,
						max: yMax,
						title: { display: true, text: "Millivolts (or digital number)" },
						ticks: { stepSize: 1 },
					},
				},
			},
		});
	}
}

const formatConfigs: Record<NumberFormat, FormatConfig> = {
	UNSIGNED: {
		range: { start: 15, end: 0 },
		bits: 4,
	},
	OFFSET: {
		range: { start: 8, end: -7 },
		bits: 4,
	},
	SIGN_MAGNITUDE: {
		range: { start: 7, end: -7 },
		bits: 4,
	},
	TWOS_COMPLEMENT: {
		range: { start: 7, end: -8 },
		bits: 4,
	},
};

// Create a function to generate the original analog signal
function generateOriginalSignal(numPoints: number): { x: number; y: number }[] {
	const data: { x: number; y: number }[] = [];

	for (let i = 0; i < numPoints; i++) {
		// Base signal around 3.01 with some sine waves and noise
		const x = i;
		// Create a complex waveform similar to the one in the image
		const baseValue = 3.01;
		const sineComponent1 = 0.01 * Math.sin(i * 0.6);
		const sineComponent2 = 0.007 * Math.sin(i * 1.2);
		const sineComponent3 = 0.005 * Math.sin(i * 2.5);
		const noise = 0.003 * (Math.random() - 0.5);

		let y =
			baseValue + sineComponent1 + sineComponent2 + sineComponent3 + noise;

		// Add some peaks similar to the original signal
		if (i === 5) y += 0.01;
		if (i === 15) y += 0.008;
		if (i === 34) y += 0.006;

		data.push({ x, y });
	}

	return data;
}

/**
 * Generates a binary pattern for a given decimal number in the specified format
 * @param decimal - The decimal number to convert
 * @param format - The binary number format to use
 * @returns The binary representation as a string
 */
function generateBinaryPattern(decimal: number, format: NumberFormat): string {
	const { bits } = formatConfigs[format];

	switch (format) {
		case "UNSIGNED":
			// Simple binary conversion with zero padding
			return decimal.toString(2).padStart(bits, "0");

		case "OFFSET":
			// Add bias to make all numbers positive
			// Bias is 2^(n-1)-1 where n is number of bits
			const bias = Math.pow(2, bits - 1) - 1;
			const offsetValue = decimal + bias;
			return offsetValue.toString(2).padStart(bits, "0");

		case "SIGN_MAGNITUDE":
			// First bit is sign (0 positive, 1 negative)
			// Remaining bits represent magnitude
			const magnitude = Math.abs(decimal);
			const signBit = decimal < 0 ? "1" : "0";
			return signBit + magnitude.toString(2).padStart(bits - 1, "0");

		case "TWOS_COMPLEMENT":
			if (decimal >= 0) {
				return decimal.toString(2).padStart(bits, "0");
			} else {
				// For negative numbers:
				// 1. Get positive binary
				// 2. Invert all bits
				// 3. Add 1 to get two's complement
				const positiveBinary = Math.abs(decimal)
					.toString(2)
					.padStart(bits, "0");
				const inverted = positiveBinary
					.split("")
					.map((bit) => (bit === "0" ? "1" : "0"))
					.join("");
				const twosComplement = (parseInt(inverted, 2) + 1)
					.toString(2)
					.padStart(bits, "0");
				return twosComplement;
			}
	}
}
/**
 * Creates and returns a table element with binary number representations
 * @param format - The binary number format to use
 * @returns HTMLTableElement populated with the binary format data
 */
function generateBinaryTable(format: NumberFormat): HTMLTableElement {
	// Create the main table element
	const table = document.createElement("table");
	table.className = "text-sm text-center border border-accent-color table-auto";

	// Create and populate the header
	const thead = document.createElement("thead");
	thead.className = "bg-gray-50";

	// Add the title row
	const titleRow = document.createElement("tr");
	const titleCell = document.createElement("th");
	titleCell.colSpan = 2;
	titleCell.className = "px-6 py-3 border border-accent-color";
	titleCell.textContent = format.replace("_", " ");
	titleRow.appendChild(titleCell);

	// Add the column headers row
	const headerRow = document.createElement("tr");
	const decimalHeader = document.createElement("th");
	const binaryHeader = document.createElement("th");

	decimalHeader.scope = "col";
	binaryHeader.scope = "col";
	decimalHeader.className = "px-6 py-3 border border-accent-color";
	binaryHeader.className = "px-6 py-3 border border-accent-color text-center";
	decimalHeader.textContent = "Decimal";
	binaryHeader.textContent = "Bit Pattern";

	headerRow.appendChild(decimalHeader);
	headerRow.appendChild(binaryHeader);

	thead.appendChild(titleRow);
	thead.appendChild(headerRow);
	table.appendChild(thead);

	// Create and populate the body
	const tbody = document.createElement("tbody");
	const rows = generateTableRows(format);

	rows.forEach(({ decimal, binary }) => {
		const row = document.createElement("tr");

		const decimalCell = document.createElement("td");
		decimalCell.className =
			"px-6 py-4 font-medium whitespace-nowrap border border-accent-color";
		decimalCell.textContent = decimal.toString();

		const binaryCell = document.createElement("td");
		binaryCell.className =
			"px-6 py-4 border border-accent-color text-center font-mono";
		binaryCell.textContent = binary;

		row.appendChild(decimalCell);
		row.appendChild(binaryCell);
		tbody.appendChild(row);
	});

	table.appendChild(tbody);

	return table;
}

/**
 * @returns Array of rows containing decimal and binary representations
 * Generates table rows for a specific number format
 * @param format - The binary number format to use
 */
function generateTableRows(format: NumberFormat): BinaryRow[] {
	const { range } = formatConfigs[format];
	const rows: BinaryRow[] = [];

	// Generate rows from start to end (descending order)
	for (let decimal = range.start; decimal >= range.end; decimal--) {
		rows.push({
			decimal,
			binary: generateBinaryPattern(decimal, format),
		});
	}

	return rows;
}

// Create a function to simulate the quantization process
function quantizeSignal(
	sampledSignal: { x: number; y: number }[],
	levels: number
): {
	digitalSignal: { x: number; y: number }[];
	quantizationError: { x: number; y: number }[];
} {
	const digitalSignal: { x: number; y: number }[] = [];
	const quantizationError: { x: number; y: number }[] = [];

	// Define the quantization range and step
	const min = 3.0;
	const max = 3.025;
	const step = (max - min) / levels;

	for (let i = 0; i < sampledSignal.length; i++) {
		// Quantize to the nearest level
		const quantizedValue =
			Math.round((sampledSignal[i].y - min) / step) * step + min;

		// Calculate the quantization error
		const error = sampledSignal[i].y - quantizedValue;

		digitalSignal.push({ x: i, y: quantizedValue });
		quantizationError.push({ x: i, y: error });
	}

	return { digitalSignal, quantizationError };
}

// Create a function to simulate the sampling process
function sampleSignal(
	originalSignal: { x: number; y: number }[],
	samplingRate: number
): { x: number; y: number }[] {
	const sampledData: { x: number; y: number }[] = [];

	for (let i = 0; i < originalSignal.length; i += samplingRate) {
		// Sample and hold - maintain the same value until the next sample
		const value = originalSignal[i].y;

		for (let j = 0; j < samplingRate && i + j < originalSignal.length; j++) {
			sampledData.push({ x: i + j, y: value });
		}
	}

	return sampledData;
}

document.addEventListener("DOMContentLoaded", () => {
	const formats: NumberFormat[] = [
		"UNSIGNED",
		"OFFSET",
		"SIGN_MAGNITUDE",
		"TWOS_COMPLEMENT",
	];
	const allTables = formats.map((format) => generateBinaryTable(format));
	const unsignedTableParent = document.getElementById("unsigned-integer-table");
	const offsetBinaryTable = document.getElementById("offset-binary-table");
	const signMagnitudeTable = document.getElementById("sign-magnitude-table");
	unsignedTableParent?.appendChild(allTables[0]);
	offsetBinaryTable?.appendChild(allTables[1]);
	signMagnitudeTable?.appendChild(allTables[2]);
	createDigitisationCharts();
	createDitheringVisualisations();
});
