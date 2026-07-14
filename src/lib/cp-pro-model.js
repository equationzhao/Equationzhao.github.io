const MIN_CP = 50;
const MIN_W_PRIME = 500;
const MIN_TAU = 0.1;
const MAX_TAU = 3600;
const TAU_SCAN_STEPS = 128;
const GOLDEN_MAX_ITERATIONS = 80;
const GOLDEN_TOLERANCE = 1e-8;
const BOOTSTRAP_SAMPLES = 500;
const MIN_BOOTSTRAP_SUCCESSES = 400;
const OUTLIER_MAX_ITERATIONS = 5;
const MIN_RELATIVE_OUTLIER = 1e-10;

export class CpProValidationError extends Error {
	constructor(code, message) {
		super(message);
		this.name = 'CpProValidationError';
		this.code = code;
	}
}

function normalizePoints(points) {
	if (!Array.isArray(points)) {
		throw new CpProValidationError('INVALID_POINTS', 'Power-time points must be an array.');
	}

	const byTime = new Map();
	const outliers = [];
	for (const point of points) {
		const time = Number(point?.time);
		const power = Number(point?.power);
		if (!Number.isFinite(time) || time <= 0 || !Number.isFinite(power) || power <= 0) {
			throw new CpProValidationError('INVALID_POINT', 'Every point needs a positive time and power.');
		}
		const normalizedPoint = { time, power };
		const previous = byTime.get(time);
		if (!previous) {
			byTime.set(time, normalizedPoint);
		} else if (power > previous.power) {
			outliers.push({ point: previous, reason: 'duplicate-duration' });
			byTime.set(time, normalizedPoint);
		} else {
			outliers.push({ point: normalizedPoint, reason: 'duplicate-duration' });
		}
	}

	const sorted = [...byTime.values()].sort((a, b) => a.time - b.time);
	if (sorted.length < 3) {
		throw new CpProValidationError('NOT_ENOUGH_POINTS', 'At least 3 unique power-time points are required.');
	}
	return { points: sorted, outliers };
}

function predict(model, time) {
	return model.cp + model.wPrime / (time + model.tau);
}

function evaluateAtTau(points, tau) {
	const powerScale = Math.min(...points.map((point) => point.power));
	let sumW = 0;
	let sumWX = 0;
	let sumWY = 0;

	for (const point of points) {
		const x = 1 / (point.time + tau);
		const weight = (powerScale / point.power) ** 2;
		sumW += weight;
		sumWX += weight * x;
		sumWY += weight * point.power;
	}

	const meanX = sumWX / sumW;
	const meanY = sumWY / sumW;
	let centeredXX = 0;
	let centeredXY = 0;
	for (const point of points) {
		const x = 1 / (point.time + tau);
		const weight = (powerScale / point.power) ** 2;
		centeredXX += weight * (x - meanX) ** 2;
		centeredXY += weight * (x - meanX) * (point.power - meanY);
	}
	if (!Number.isFinite(centeredXX) || centeredXX <= 0 || !Number.isFinite(centeredXY)) return null;

	const wPrime = centeredXY / centeredXX;
	const cp = meanY - wPrime * meanX;
	const minimumPower = Math.min(...points.map((point) => point.power));
	if (
		!Number.isFinite(cp) ||
		!Number.isFinite(wPrime) ||
		cp < MIN_CP ||
		wPrime < MIN_W_PRIME ||
		cp >= minimumPower
	) return null;

	let squaredRelativeError = 0;
	let squaredError = 0;
	let absoluteRelativeError = 0;
	for (const point of points) {
		const error = cp + wPrime / (point.time + tau) - point.power;
		const relativeError = error / point.power;
		squaredRelativeError += relativeError * relativeError;
		squaredError += error * error;
		absoluteRelativeError += Math.abs(relativeError);
	}

	return {
		cp,
		wPrime,
		tau,
		pMax: cp + wPrime / tau,
		msre: squaredRelativeError / points.length,
		rmse: Math.sqrt(squaredError / points.length),
		meanRelativeError: absoluteRelativeError / points.length,
	};
}

function goldenSection(points, lowerLogTau, upperLogTau) {
	const ratio = (Math.sqrt(5) - 1) / 2;
	let lower = lowerLogTau;
	let upper = upperLogTau;
	let left = upper - ratio * (upper - lower);
	let right = lower + ratio * (upper - lower);
	let leftFit = evaluateAtTau(points, Math.exp(left));
	let rightFit = evaluateAtTau(points, Math.exp(right));
	const loss = (fit) => fit?.msre ?? Number.POSITIVE_INFINITY;

	for (let iteration = 0; iteration < GOLDEN_MAX_ITERATIONS && upper - lower > GOLDEN_TOLERANCE; iteration++) {
		if (loss(leftFit) <= loss(rightFit)) {
			upper = right;
			right = left;
			rightFit = leftFit;
			left = upper - ratio * (upper - lower);
			leftFit = evaluateAtTau(points, Math.exp(left));
		} else {
			lower = left;
			left = right;
			leftFit = rightFit;
			right = lower + ratio * (upper - lower);
			rightFit = evaluateAtTau(points, Math.exp(right));
		}
	}

	return loss(leftFit) <= loss(rightFit) ? leftFit : rightFit;
}

function fitMorton(points) {
	const upperTau = Math.min(MAX_TAU, points.at(-1).time);
	if (upperTau <= MIN_TAU) {
		throw new CpProValidationError('INVALID_DURATION_RANGE', 'Point durations do not support a three-parameter fit.');
	}
	const lowerLogTau = Math.log(MIN_TAU);
	const upperLogTau = Math.log(upperTau);
	const candidates = [];
	for (let index = 0; index < TAU_SCAN_STEPS; index++) {
		const progress = index / (TAU_SCAN_STEPS - 1);
		const logTau = lowerLogTau + progress * (upperLogTau - lowerLogTau);
		candidates.push({ logTau, fit: evaluateAtTau(points, Math.exp(logTau)) });
	}

	let bestIndex = -1;
	for (let index = 0; index < candidates.length; index++) {
		if (!candidates[index].fit) continue;
		if (bestIndex === -1 || candidates[index].fit.msre < candidates[bestIndex].fit.msre) bestIndex = index;
	}
	if (bestIndex === -1) {
		throw new CpProValidationError('FIT_FAILED', 'No valid Morton model fits these points.');
	}

	const bracketStart = candidates[Math.max(0, bestIndex - 1)].logTau;
	const bracketEnd = candidates[Math.min(candidates.length - 1, bestIndex + 1)].logTau;
	const refined = goldenSection(points, bracketStart, bracketEnd);
	const scanned = candidates[bestIndex].fit;
	return refined && refined.msre < scanned.msre ? refined : scanned;
}

function coverageReasons(points, model) {
	const reasons = [];
	if (points.length < 6) reasons.push('At least 6 accepted points are needed for a stable interval.');
	if (!points.some((point) => point.time <= 60)) reasons.push('Add a maximal effort of 60 seconds or less.');
	if (!points.some((point) => point.time >= 120 && point.time <= 480)) reasons.push('Add a maximal effort between 2 and 8 minutes.');
	if (!points.some((point) => point.time >= 600)) reasons.push('Add a maximal effort of 10 minutes or longer.');
	const upperTau = Math.min(MAX_TAU, points.at(-1).time);
	if (model.tau <= MIN_TAU * 1.01 || model.tau >= upperTau * 0.99) {
		reasons.push('Tau is too close to the fitting search boundary.');
	}
	return reasons;
}

function hashPoints(points) {
	let hash = 0x811c9dc5;
	for (const point of points) {
		const text = `${point.time}:${point.power};`;
		for (let index = 0; index < text.length; index++) {
			hash ^= text.charCodeAt(index);
			hash = Math.imul(hash, 0x01000193);
		}
	}
	return hash >>> 0;
}

function seededRandom(seed) {
	let state = seed >>> 0;
	return () => {
		state += 0x6d2b79f5;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

function quantile(values, probability) {
	const sorted = [...values].sort((a, b) => a - b);
	const position = (sorted.length - 1) * probability;
	const lower = Math.floor(position);
	const upper = Math.ceil(position);
	if (lower === upper) return sorted[lower];
	return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function intervalFor(samples, key) {
	const values = samples.map((sample) => sample[key]);
	return [quantile(values, 0.025), quantile(values, 0.975)];
}

function bootstrapFits(points, model) {
	const predictions = points.map((point) => predict(model, point.time));
	const relativeResiduals = points.map((point, index) => (predictions[index] - point.power) / point.power);
	const residualMean = relativeResiduals.reduce((sum, residual) => sum + residual, 0) / relativeResiduals.length;
	const centeredResiduals = relativeResiduals.map((residual) => residual - residualMean);
	const random = seededRandom(hashPoints(points));
	const samples = [];

	for (let sampleIndex = 0; sampleIndex < BOOTSTRAP_SAMPLES; sampleIndex++) {
		const samplePoints = points.map((point, pointIndex) => {
			const residual = centeredResiduals[Math.floor(random() * centeredResiduals.length)];
			return { time: point.time, power: predictions[pointIndex] / (1 + residual) };
		});
		if (samplePoints.some((point) => !Number.isFinite(point.power) || point.power <= 0)) continue;
		try {
			samples.push(fitMorton(samplePoints));
		} catch {
			// Invalid resamples are reflected in the bootstrap success diagnostic.
		}
	}
	return samples;
}

function curveTimes(points) {
	const maximumTime = Math.max(3600, points.at(-1).time);
	const times = new Set(points.map((point) => point.time));
	const minimumLog = Math.log(1);
	const maximumLog = Math.log(maximumTime);
	for (let index = 0; index < 160; index++) {
		const progress = index / 159;
		times.add(Math.exp(minimumLog + progress * (maximumLog - minimumLog)));
	}
	return [...times].sort((a, b) => a - b);
}

function buildCurve(points, model, bootstrapSamples) {
	const times = curveTimes(points);
	const best = times.map((time) => ({ time, power: predict(model, time) }));
	if (bootstrapSamples.length < MIN_BOOTSTRAP_SUCCESSES) return { best, lower: [], upper: [] };
	const lower = [];
	const upper = [];
	for (const time of times) {
		const powers = bootstrapSamples.map((sample) => predict(sample, time));
		lower.push({ time, power: quantile(powers, 0.025) });
		upper.push({ time, power: quantile(powers, 0.975) });
	}
	return { best, lower, upper };
}

function detectResidualOutliers(points, model) {
	const candidates = points.map((point) => ({
		point,
		residual: Math.abs(predict(model, point.time) - point.power) / point.power,
	}));
	const residuals = candidates.map((candidate) => candidate.residual);
	const firstQuartile = quantile(residuals, 0.25);
	const thirdQuartile = quantile(residuals, 0.75);
	const upperFence = thirdQuartile + 3 * (thirdQuartile - firstQuartile);
	return candidates
		.filter(({ residual }) => residual >= MIN_RELATIVE_OUTLIER && residual > upperFence)
		.map(({ point }) => ({
			point,
			reason: 'residual',
		}));
}

function outlierKey(point) {
	return `${point.time}:${point.power}`;
}

function sameOutlierSet(first, second) {
	return first.size === second.size && [...first].every((key) => second.has(key));
}

function fitWithOutliers(points, enabled) {
	let acceptedPoints = points;
	let model = fitMorton(acceptedPoints);
	let outliers = [];
	const reasons = [];
	let iterations = 0;
	let converged = true;
	if (!enabled) return { acceptedPoints, model, outliers, reasons, iterations, converged };
	if (points.length < 5) return { acceptedPoints, model, outliers, reasons, iterations, converged };

	let previousOutlierKeys = new Set();
	converged = false;
	for (let iteration = 0; iteration < OUTLIER_MAX_ITERATIONS; iteration++) {
		iterations = iteration + 1;
		const detected = detectResidualOutliers(points, model);
		const detectedKeys = new Set(detected.map(({ point }) => outlierKey(point)));
		const nextPoints = points.filter((point) => !detectedKeys.has(outlierKey(point)));
		if (nextPoints.length < 3) {
			reasons.push('The latest outlier set was rejected because it would leave fewer than 3 points.');
			break;
		}

		let nextModel;
		try {
			nextModel = fitMorton(nextPoints);
		} catch {
			reasons.push('The latest outlier set was rejected because the remaining points could not be fitted.');
			break;
		}
		const unchanged = sameOutlierSet(previousOutlierKeys, detectedKeys);
		acceptedPoints = nextPoints;
		model = nextModel;
		outliers = detected;
		if (unchanged) {
			converged = true;
			break;
		}
		previousOutlierKeys = detectedKeys;
	}
	if (!converged && iterations === OUTLIER_MAX_ITERATIONS) {
		reasons.push('The residual outlier set did not converge within 5 rounds.');
	}
	return { acceptedPoints, model, outliers, reasons, iterations, converged };
}

const ZONE_DEFINITIONS = [
	{ name: 'Recovery', color: '#6edea2', upper: 0.56, label: '<56% CP' },
	{ name: 'Endurance', color: '#66c2ff', upper: 0.75, label: '56–75% CP' },
	{ name: 'Tempo', color: '#4f95ff', upper: 0.9, label: '>75–90% CP' },
	{ name: 'Threshold', color: '#415dce', upper: 1.05, label: '>90–105% CP' },
	{ name: 'VO2max', color: '#6834b0', upper: 1.2, label: '>105–120% CP' },
	{ name: 'Anaerobic', color: '#a62d8c', upper: 1.5, label: '>120–150% CP' },
	{ name: 'Neuro', color: '#d61f57', upper: null, label: '>150% CP · maximal' },
];

function stableFloor(value) {
	return Math.floor(value + 1e-7);
}

function buildZones(cp) {
	let minimum = 0;
	return ZONE_DEFINITIONS.map((definition, index) => {
		const maximum = definition.upper === null
			? null
			: index === 0
				? Math.ceil(definition.upper * cp - 1e-7) - 1
				: stableFloor(definition.upper * cp);
		const zone = {
			name: definition.name,
			color: definition.color,
			label: definition.label,
			min: minimum,
			max: maximum,
		};
		if (maximum !== null) minimum = maximum + 1;
		return zone;
	});
}

export function analyzeCpPro({ points, weightKg = null, detectOutliers = true }) {
	const normalized = normalizePoints(points);
	const fitted = fitWithOutliers(normalized.points, detectOutliers);
	const { acceptedPoints, model } = fitted;
	const reasons = [...fitted.reasons, ...coverageReasons(acceptedPoints, model)];
	const bootstrapSamples = reasons.length === 0 ? bootstrapFits(acceptedPoints, model) : [];
	let intervals = null;
	if (reasons.length === 0) {
		if (bootstrapSamples.length < MIN_BOOTSTRAP_SUCCESSES) {
			reasons.push(`Only ${bootstrapSamples.length} of ${BOOTSTRAP_SAMPLES} bootstrap samples produced valid fits.`);
		} else {
			intervals = {
				cp: intervalFor(bootstrapSamples, 'cp'),
				wPrime: intervalFor(bootstrapSamples, 'wPrime'),
				tau: intervalFor(bootstrapSamples, 'tau'),
				pMax: intervalFor(bootstrapSamples, 'pMax'),
			};
			const upperTau = Math.min(MAX_TAU, acceptedPoints.at(-1).time);
			if (intervals.tau[0] <= MIN_TAU * 1.01 || intervals.tau[1] >= upperTau * 0.99) {
				reasons.push('The bootstrap Tau interval reaches the fitting search boundary.');
			}
			const minimumObservedPower = Math.min(...acceptedPoints.map((point) => point.power));
			if (
				intervals.cp[0] <= MIN_CP * 1.01 ||
				intervals.cp[1] >= minimumObservedPower * 0.99 ||
				intervals.wPrime[0] <= MIN_W_PRIME * 1.01
			) {
				reasons.push('A bootstrap parameter interval reaches a fitting constraint.');
			}
			if (intervals.cp[1] - intervals.cp[0] > model.cp * 0.1) {
				reasons.push('The bootstrap CP interval is wider than 10% of the best-fit CP.');
			}
		}
	}
	const status = reasons.length === 0 ? 'ok' : 'low-confidence';
	const numericWeight = Number(weightKg);
	const hasFiveMinuteAnchor = acceptedPoints.some((point) => point.time >= 240 && point.time <= 360);
	const vo2Estimate = status === 'ok' && Number.isFinite(numericWeight) && numericWeight > 0 && hasFiveMinuteAnchor
		? 16.6 + 8.87 * (predict(model, 300) / numericWeight)
		: null;
	return {
		model: { ...model, intervals },
		curve: buildCurve(acceptedPoints, model, bootstrapSamples),
		zones: status === 'ok' ? buildZones(model.cp) : [],
		vo2Estimate,
		acceptedPoints,
		outliers: [...normalized.outliers, ...fitted.outliers],
		diagnostics: {
			status,
			reasons,
			outlierIterations: fitted.iterations,
			outliersConverged: fitted.converged,
			bootstrapSuccesses: bootstrapSamples.length,
		},
	};
}
