class Point {
	x: number;
	y: number;
	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
}

function getLinearInterPolationValue(
	startValue: number,
	endValue: number,
	ratio: number,
) {
	return startValue + (endValue - startValue) * ratio;
}

function getLinearInterpolationPoint(
	startPoint: Point,
	endPoint: Point,
	ratio: number,
) {
	return new Point(
		getLinearInterPolationValue(startPoint.x, endPoint.x, ratio),
		getLinearInterPolationValue(startPoint.y, endPoint.y, ratio),
	);
}

function getPointOnQuadraticBezierCurve(
	startPoint: Point,
	controlPoint: Point,
	endPoint: Point,
	ratio: number,
) {
	return getLinearInterpolationPoint(
		getLinearInterpolationPoint(startPoint, controlPoint, ratio),
		getLinearInterpolationPoint(controlPoint, endPoint, ratio),
		ratio,
	);
}

document.addEventListener("DOMContentLoaded", function () {
	let harmonicWaveCanvasHeight = 0;
	let harmonicWaveCanvasWidth = 0;

	const harmonicWaveCanvas = <HTMLCanvasElement>(
		document.getElementById("harmonic-wave-canvas")
	);
	const harmonicWaveContext = harmonicWaveCanvas?.getContext("2d");

	/**
	 *
	 * @param harmonic
	 * @param restY resting horizontal string line
	 * @param amplitude
	 */
	function drawNthHarmonic(harmonic: number, restY: number, amplitude: number) {
		/**
		 * cut the string into harmonic equal pieces
		 * each piece is one arch
		 */
		const archWidth = harmonicWaveCanvasWidth / harmonic; // each harmonic width is L/n
		harmonicWaveContext?.beginPath();

		// outer loop once per arch
		for (let i = 0; i < harmonic; i++) {
			/**
			 * X positions of the two nodes
			 */
			const curveStartX = archWidth * i;
			const curveEndX = curveStartX + archWidth;

			/**
			 * X, Y of the start and end points
			 * Y stays the same since we want the
			 * harmonic centered horizontally
			 */
			const startPoint = new Point(curveStartX, restY);
			const endPoint = new Point(curveEndX, restY);

			/**
			 * canvas y points down so up is negative
			 * flips to +1, -1, +1, -1...
			 * for the antinodes to go up and down
			 */
			const direction = i % 2 === 0 ? -1 : 1;

			/**
			 * this is what we will use to draw the arch. Y is calculated based on direction and the position of the control point
			 * if restY is 250 half of height and i want to keep some margin between the curve and the border let's say amplitude peaking at y = 100
			 * 250 - 100 = 150px above restY so actual amplitude is 150
			 * ratio 0.5 for first harmonic using de Casteljau makes the peak halfway so the control point has to be 2 * amplitude
			 */
			const controlPoint = new Point(
				(curveStartX + curveEndX) / 2,
				restY + direction * 2 * amplitude,
			);

			/**
			 *
			 */
			for (let j = 0; j <= 60; j++) {
				const point = getPointOnQuadraticBezierCurve(
					startPoint,
					controlPoint,
					endPoint,
					j / 60,
				);
				i === 0 && j === 0
					? harmonicWaveContext?.moveTo(point.x, point.y)
					: harmonicWaveContext?.lineTo(point.x, point.y);
			}
		}
		harmonicWaveContext!.strokeStyle = "#FF6577";
		harmonicWaveContext!.lineWidth = 3;

		harmonicWaveContext?.stroke();
	}

	function drawAllHarmonics(count: number) {
		harmonicWaveContext?.clearRect(
			0,
			0,
			harmonicWaveCanvasWidth,
			harmonicWaveCanvasHeight,
		);
		const amplitude = harmonicWaveCanvasHeight * 0.4;
		const restY = harmonicWaveCanvasHeight / 2;
		harmonicWaveContext?.beginPath();
		// harmonicWaveContext?.setLineDash([5, 5]);
		harmonicWaveContext?.moveTo(0, harmonicWaveCanvasHeight / 2);
		harmonicWaveContext!.lineWidth = 3;

		harmonicWaveContext?.lineTo(
			harmonicWaveCanvasWidth,
			harmonicWaveCanvasHeight / 2,
		);
		harmonicWaveContext?.stroke();
		harmonicWaveContext?.setLineDash([]);
		for (let h = 1; h <= count; h++) {
			drawNthHarmonic(h, restY, amplitude);
		}
	}

	drawAllHarmonics(4);

	function resizeHarmonicWaveCanvas(cssW: number, cssH: number) {
		const dpr = window.devicePixelRatio || 1;

		harmonicWaveCanvasWidth = cssW;
		harmonicWaveCanvasHeight = cssH;

		harmonicWaveCanvas.width = Math.round(cssW * dpr);
		harmonicWaveCanvas.height = Math.round(cssH * dpr);
		harmonicWaveContext?.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	function renderHarmonicWave() {
		drawAllHarmonics(4);
	}

	const harmonicWaveResizeObserver = new ResizeObserver(([entry]) => {
		const { width, height } = entry.contentRect;
		resizeHarmonicWaveCanvas(width, height);
		renderHarmonicWave();
	});
	harmonicWaveResizeObserver.observe(harmonicWaveCanvas);
});
