document.addEventListener("DOMContentLoaded", () => {
	const firstHarmonicWaveCanvas = document.getElementById(
		"standing-wave-first-harmonic"
	) as HTMLCanvasElement;

	const firstHarmonicWaveContext = firstHarmonicWaveCanvas.getContext("2d");

	const secondHarmonicWaveCanvas = document.getElementById(
		"standing-wave-second-harmonic"
	) as HTMLCanvasElement;

	const secondHarmonicWaveContext = secondHarmonicWaveCanvas.getContext("2d");

	const thirdHarmonicWaveCanvas = document.getElementById(
		"standing-wave-third-harmonic"
	) as HTMLCanvasElement;

	const thirdHarmonicWaveContext = thirdHarmonicWaveCanvas.getContext("2d");

	const fourthHarmonicWaveCanvas = document.getElementById(
		"standing-wave-fourth-harmonic"
	) as HTMLCanvasElement;

	const fourthHarmonicWaveContext = fourthHarmonicWaveCanvas.getContext("2d");

	drawStandingWave(firstHarmonicWaveCanvas, firstHarmonicWaveContext, 1);
	drawStandingWave(
		secondHarmonicWaveCanvas,
		secondHarmonicWaveContext,
		2,
		true
	);
	drawStandingWave(thirdHarmonicWaveCanvas, thirdHarmonicWaveContext, 3, true);
	drawStandingWave(
		fourthHarmonicWaveCanvas,
		fourthHarmonicWaveContext,
		4,
		true
	);
});
function drawStandingWave(
	canvas: HTMLCanvasElement,
	context: CanvasRenderingContext2D | null,
	harmonicNumber: number,
	showNodalPoints: boolean = false
) {
	if (!context) return;

	const canvasWidth = canvas.width;
	const canvasHeight = canvas.height;
	const amplitude = 50; // amplitude of the wave
	const centerY = canvasHeight / 2; // middle of the canvas

	context.clearRect(0, 0, canvasWidth, canvasHeight);

	// Draw center line
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

	// Draw nodal points if showNodalPoints is true
	if (showNodalPoints) {
		const nodalColors = [
			"#FF6B6B", // Coral Red
			"#4ECDC4", // Turquoise
			"#45B7D1", // Sky Blue
			"#FDCB6E", // Sunflower Yellow
			"#6C5CE7", // Purple
			"#A8E6CF", // Mint Green
			"#FF8ED4", // Pink
		];

		// Nodal points calculation
		// Nodal points calculation
		const nodalPoints: { x: number; fraction: string }[] = [];
		for (let i = 1; i < harmonicNumber; i++) {
			const nodalX = (i * canvasWidth) / harmonicNumber;
			nodalPoints.push({
				x: nodalX,
				fraction: `${i}/${harmonicNumber}`,
			});
		}
		console.log(nodalPoints);
		context.beginPath();
		context.fillStyle = "blue";
		context.strokeStyle = "blue";
		context.lineWidth = 1;

		nodalPoints.forEach((nodal, index) => {
			// Choose color for this nodal line
			const lineColor = nodalColors[index % nodalColors.length];

			// Draw vertical line from nodal point
			context.beginPath();
			context.strokeStyle = lineColor;
			context.lineWidth = 1;
			context.moveTo(nodal.x, centerY - amplitude);
			context.lineTo(nodal.x, centerY + amplitude);
			context.stroke();

			// Draw a dot at the nodal point
			context.beginPath();
			context.fillStyle = lineColor;
			context.arc(nodal.x, centerY, 3, 0, 2 * Math.PI);
			context.fill();

			// Add fraction label
			context.fillStyle = "black";
			context.textAlign = "center";
			context.textBaseline = "bottom"; // Align text to bottom
			context.fillText(
				nodal.fraction,
				nodal.x,
				centerY - amplitude - 5 // Slight offset above the line
			);
		});
	}
}
