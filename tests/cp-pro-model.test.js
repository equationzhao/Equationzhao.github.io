import assert from 'node:assert/strict';
import test from 'node:test';

import { analyzeCpPro } from '../src/lib/cp-pro-model.js';

const mortalPower = (time, { cp = 300, wPrime = 18_000, tau = 20 } = {}) => cp + wPrime / (time + tau);

function syntheticPoints(tau, times = [5, 20, 60, 180, 300, 600, 1200, 3600]) {
	return times.map((time) => ({ time, power: mortalPower(time, { tau }) }));
}

function metrics(points, model) {
	const errors = points.map((point) => model.cp + model.wPrime / (point.time + model.tau) - point.power);
	return {
		rmse: Math.sqrt(errors.reduce((sum, error) => sum + error * error, 0) / errors.length),
		msre: errors.reduce((sum, error, index) => sum + (error / points[index].power) ** 2, 0) / errors.length,
	};
}

const exactMortonPoints = [
	{ time: 20, power: 750 },
	{ time: 60, power: 525 },
	{ time: 180, power: 390 },
	{ time: 300, power: 356.25 },
	{ time: 600, power: 329.03225806451616 },
	{ time: 1200, power: 314.75409836065575 },
];

test('fits every accepted point deterministically with the Morton model', () => {
	const input = { points: exactMortonPoints, weightKg: 70, detectOutliers: false };
	const first = analyzeCpPro(input);
	const second = analyzeCpPro(input);

	assert.ok(Math.abs(first.model.cp - 300) < 1e-4);
	assert.ok(Math.abs(first.model.wPrime - 18_000) < 1e-2);
	assert.ok(Math.abs(first.model.tau - 20) < 1e-4);
	assert.ok(first.model.msre < 1e-20);
	assert.deepEqual(second, first);
});

test('recovers exact parameters across the supported Tau shapes', async (t) => {
	for (const tau of [2, 20, 50, 200]) {
		await t.test(`Tau ${tau}s`, () => {
			const analysis = analyzeCpPro({ points: syntheticPoints(tau), detectOutliers: false });
			assert.ok(Math.abs(analysis.model.cp - 300) < 1e-4);
			assert.ok(Math.abs(analysis.model.wPrime - 18_000) < 1e-2);
			assert.ok(Math.abs(analysis.model.tau - tau) < 1e-4);
			assert.ok(analysis.model.msre < 1e-18);
		});
	}
});

test('MSRE fitting is invariant to the absolute power scale', () => {
	const points = [
		{ time: 5, power: 680 },
		{ time: 20, power: 562.5 },
		{ time: 60, power: 402.5 },
		{ time: 180, power: 305.5 },
		{ time: 300, power: 279.0625 },
		{ time: 600, power: 260.4838709677419 },
		{ time: 1200, power: 251.80327868852456 },
		{ time: 3600, power: 246.51933701657458 },
	];
	const base = analyzeCpPro({ points, detectOutliers: false });
	const scale = 1_000_000;
	const scaled = analyzeCpPro({ points: points.map((point) => ({ ...point, power: point.power * scale })), detectOutliers: false });

	assert.ok(Math.abs(scaled.model.cp / (base.model.cp * scale) - 1) < 1e-8);
	assert.ok(Math.abs(scaled.model.wPrime / (base.model.wPrime * scale) - 1) < 1e-8);
	assert.ok(Math.abs(scaled.model.tau - base.model.tau) < 1e-6);
	assert.ok(Math.abs(scaled.model.msre - base.model.msre) < 1e-14);
});

test('weights relative errors across short/high and long/low power instead of selecting lower RMSE', () => {
	const points = [
		{ time: 5, power: 680 },
		{ time: 20, power: 562.5 },
		{ time: 60, power: 402.5 },
		{ time: 180, power: 305.5 },
		{ time: 300, power: 279.0625 },
		{ time: 600, power: 260.4838709677419 },
		{ time: 1200, power: 251.80327868852456 },
		{ time: 3600, power: 246.51933701657458 },
	];
	const selected = analyzeCpPro({ points, detectOutliers: false }).model;
	const lowerRmseAlternative = { cp: 236.20007170868723, wPrime: 15_554.628743592919, tau: 29.647490826742064 };
	const selectedMetrics = metrics(points, selected);
	const alternativeMetrics = metrics(points, lowerRmseAlternative);

	assert.ok(alternativeMetrics.rmse < selectedMetrics.rmse);
	assert.ok(selectedMetrics.msre < alternativeMetrics.msre);
});

test('handles 20 accepted points deterministically', () => {
	const points = Array.from({ length: 20 }, (_, index) => {
		const time = 5 * (1200 / 5) ** (index / 19);
		return { time, power: mortalPower(time) };
	});
	const first = analyzeCpPro({ points, detectOutliers: false });
	const second = analyzeCpPro({ points, detectOutliers: false });

	assert.equal(first.acceptedPoints.length, 20);
	assert.deepEqual(second, first);
});

test('builds continuous CP-relative approximation zones', () => {
	const analysis = analyzeCpPro({ points: exactMortonPoints, detectOutliers: false });

	assert.deepEqual(
		analysis.zones.map(({ name, min, max }) => ({ name, min, max })),
		[
			{ name: 'Recovery', min: 0, max: 167 },
			{ name: 'Endurance', min: 168, max: 225 },
			{ name: 'Tempo', min: 226, max: 270 },
			{ name: 'Threshold', min: 271, max: 315 },
			{ name: 'VO2max', min: 316, max: 360 },
			{ name: 'Anaerobic', min: 361, max: 450 },
			{ name: 'Neuro', min: 451, max: null },
		],
	);
});

test('returns deterministic fit-stability intervals for well-covered data', () => {
	const analysis = analyzeCpPro({ points: exactMortonPoints, weightKg: 70, detectOutliers: false });

	assert.equal(analysis.diagnostics.status, 'ok');
	assert.ok(analysis.model.intervals);
	assert.ok(analysis.model.intervals.cp.every(Number.isFinite));
	assert.ok(analysis.model.intervals.cp[0] <= analysis.model.intervals.cp[1]);
	assert.ok(analysis.curve.best.length > exactMortonPoints.length);
	assert.equal(analysis.curve.lower.length, analysis.curve.best.length);
	assert.equal(analysis.curve.upper.length, analysis.curve.best.length);
	assert.ok(analysis.vo2Estimate);
	assert.ok(Math.abs(analysis.vo2Estimate - (16.6 + 8.87 * (356.25 / 70))) < 1e-8);
});

test('noisy-data stability intervals contain the generating parameters', () => {
	const times = [10, 30, 60, 120, 240, 360, 600, 900, 1200, 1800];
	const noise = [1.01, 0.985, 1.008, 0.99, 1.012, 0.994, 1.006, 0.989, 1.004, 0.997];
	const points = times.map((time, index) => ({ time, power: mortalPower(time) * noise[index] }));
	const analysis = analyzeCpPro({ points, detectOutliers: false });
	const expected = { cp: 300, wPrime: 18_000, tau: 20, pMax: 1200 };

	assert.equal(analysis.diagnostics.status, 'ok');
	for (const [parameter, value] of Object.entries(expected)) {
		const [lower, upper] = analysis.model.intervals[parameter];
		assert.ok(lower <= value && value <= upper, `${parameter} should be inside its stability interval`);
	}
});

test('marks a bootstrap interval near parameter constraints as low-confidence', () => {
	const points = [5, 20, 60, 180, 300, 600, 1200].map((time) => ({
		time,
		power: mortalPower(time, { cp: 50.1, wPrime: 501, tau: 20 }),
	}));
	const analysis = analyzeCpPro({ points, detectOutliers: false });

	assert.equal(analysis.diagnostics.status, 'low-confidence');
	assert.ok(analysis.diagnostics.reasons.some((reason) => reason.includes('parameter interval')));
	assert.deepEqual(analysis.zones, []);
});

test('retains and refits residual-only outliers for ordinary point counts', () => {
	const points = [
		...exactMortonPoints,
		{ time: 120, power: 428.57142857142856 },
		{ time: 900, power: 319.5652173913044 },
	].map((point) => point.time === 300 ? { ...point, power: 330 } : point);
	const analysis = analyzeCpPro({ points, detectOutliers: true });

	assert.deepEqual(
		analysis.outliers.map((outlier) => ({ time: outlier.point.time, reason: outlier.reason })),
		[{ time: 300, reason: 'residual' }],
	);
	assert.equal(analysis.diagnostics.outlierIterations, 2);
	assert.equal(analysis.diagnostics.outliersConverged, true);
	assert.ok(Math.abs(analysis.model.cp - 300) < 1e-4);
	assert.ok(Math.abs(analysis.model.wPrime - 18_000) < 1e-2);
});

test('does not silently remove non-monotonic unique points when outlier detection is disabled', () => {
	const points = exactMortonPoints.map((point) => point.time === 300 ? { ...point, power: 320 } : point);
	const analysis = analyzeCpPro({ points, detectOutliers: false });

	assert.equal(analysis.acceptedPoints.length, points.length);
	assert.deepEqual(analysis.outliers, []);
});

test('keeps at least three points and reports low confidence for sparse input', () => {
	const points = syntheticPoints(20, [5, 20, 60, 300, 1200]).map((point, index) => (
		index === 3 ? { ...point, power: point.power * 0.8 } : point
	));
	const analysis = analyzeCpPro({ points, weightKg: 70, detectOutliers: true });

	assert.ok(analysis.acceptedPoints.length >= 3);
	assert.equal(analysis.diagnostics.status, 'low-confidence');
	assert.deepEqual(analysis.zones, []);
	assert.equal(analysis.vo2Estimate, null);
});

test('keeps the highest duplicate duration and preserves long chart durations', () => {
	const points = [
		...syntheticPoints(20, [5, 20, 60, 180, 300, 600, 1200, 7200]),
		{ time: 300, power: 340 },
	];
	const analysis = analyzeCpPro({ points, detectOutliers: false });

	assert.equal(analysis.acceptedPoints.find((point) => point.time === 300).power, mortalPower(300));
	assert.deepEqual(analysis.outliers.map((outlier) => outlier.reason), ['duplicate-duration']);
	assert.equal(analysis.curve.best.at(-1).time, 7200);
});

test('VO2max estimate requires trusted coverage, valid weight, and a 240–360s point', () => {
	const trusted = analyzeCpPro({ points: exactMortonPoints, weightKg: 70, detectOutliers: false });
	const noWeight = analyzeCpPro({ points: exactMortonPoints, detectOutliers: false });
	const noAnchor = analyzeCpPro({ points: syntheticPoints(20, [5, 20, 60, 180, 600, 1200]), weightKg: 70, detectOutliers: false });

	assert.ok(trusted.vo2Estimate);
	assert.equal(noWeight.vo2Estimate, null);
	assert.equal(noAnchor.vo2Estimate, null);
});
