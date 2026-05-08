/**
 * @file mathSolver.js
 * @description Core symbolic and numerical math engine. Provides derivative
 * computation, critical point detection via bisection search, inflection point
 * detection, tangent line calculation, function evaluation, and plot data
 * generation. All symbolic operations use the math.js library (Apache-2.0).
 *
 * This module is entirely local — no network calls. It powers the Solver
 * screen's Derivative, Optimize, and Limit modes, and the Visualizer screen's
 * plot + analysis panel.
 *
 * @requires mathjs (v13+) — https://mathjs.org/
 * @license Apache-2.0 (math.js), MIT (this file)
 *
 * @changelog
 * - Initial implementation with computeDerivative, evaluateAt, generatePlotData
 * - Added findCriticalPoints using numerical bisection on f'(x)
 * - Added classifyCriticalPoints using second derivative test
 * - Added findInflectionPoints using bisection on f''(x)
 * - Added tangentLineAt for tangent line rendering on the Visualizer
 * - Added analyzeFunction as a unified optimization analysis entry point
 * - Added solveCalculusProblem dispatcher for Solver screen modes
 */

import { derivative, parse, evaluate, simplify, rationalize } from 'mathjs';

/**
 * Computes the first derivative of an expression symbolically.
 *
 * @param {string} expr - Mathematical expression in math.js syntax (e.g., "x^3 - 3*x + 2").
 * @param {string} [variable='x'] - Variable to differentiate with respect to.
 * @returns {string} Simplified derivative as a string.
 * @throws {Error} If math.js cannot parse or differentiate the expression.
 */
export function computeDerivative(expr, variable = 'x') {
  try {
    const node = parse(expr);
    const d = derivative(node, variable);
    return simplify(d).toString();
  } catch (e) {
    throw new Error('Could not compute derivative: ' + e.message);
  }
}

/**
 * Computes the second derivative by differentiating the first derivative.
 *
 * @param {string} expr - Mathematical expression.
 * @param {string} [variable='x'] - Differentiation variable.
 * @returns {string} Simplified second derivative as a string.
 * @throws {Error} If either differentiation step fails.
 */
export function computeSecondDerivative(expr, variable = 'x') {
  try {
    const first = computeDerivative(expr, variable);
    return computeDerivative(first, variable);
  } catch (e) {
    throw new Error('Could not compute second derivative: ' + e.message);
  }
}

/**
 * Evaluates an expression at a specific numeric value.
 *
 * @param {string} expr - Expression to evaluate.
 * @param {string} variable - Variable name to substitute.
 * @param {number} value - Numeric value to substitute.
 * @returns {number} Result of evaluation, or NaN on error.
 */
export function evaluateAt(expr, variable, value) {
  try {
    const scope = {};
    scope[variable] = value;
    return evaluate(expr, scope);
  } catch (e) {
    return NaN;
  }
}

/**
 * Finds critical points of a function numerically by scanning for sign changes
 * in the first derivative across a given interval. Uses bisection refinement
 * (50 iterations) for sub-step precision.
 *
 * @param {string} expr - The function expression.
 * @param {string} [variable='x'] - Variable name.
 * @param {number} [min=-20] - Left boundary of search interval.
 * @param {number} [max=20] - Right boundary of search interval.
 * @param {number} [steps=2000] - Number of scan steps (higher = finer resolution).
 * @returns {number[]} Array of x-values where f'(x) = 0.
 */
export function findCriticalPoints(expr, variable = 'x', min = -20, max = 20, steps = 2000) {
  const firstDeriv = computeDerivative(expr, variable);
  const criticalPoints = [];
  const step = (max - min) / steps;

  for (let i = 0; i < steps; i++) {
    const x1 = min + i * step;
    const x2 = x1 + step;
    const y1 = evaluateAt(firstDeriv, variable, x1);
    const y2 = evaluateAt(firstDeriv, variable, x2);

    if (isNaN(y1) || isNaN(y2)) continue;

    // Sign change in f'(x) indicates a root — refine with bisection
    if (y1 * y2 < 0) {
      let lo = x1, hi = x2;
      for (let j = 0; j < 50; j++) {
        const mid = (lo + hi) / 2;
        const ym = evaluateAt(firstDeriv, variable, mid);
        if (isNaN(ym)) break;
        if (ym * evaluateAt(firstDeriv, variable, lo) < 0) hi = mid;
        else lo = mid;
      }
      const cp = (lo + hi) / 2;
      criticalPoints.push(Math.round(cp * 1e8) / 1e8);
    }

    // Also catch exact zeros (f'(x) ≈ 0 within tolerance)
    if (Math.abs(y1) < 1e-10) {
      const rounded = Math.round(x1 * 1e8) / 1e8;
      if (!criticalPoints.some(p => Math.abs(p - rounded) < step * 2)) {
        criticalPoints.push(rounded);
      }
    }
  }

  return criticalPoints;
}

/**
 * Classifies each critical point as Local Minimum, Local Maximum, or
 * Inconclusive using the second derivative test.
 *
 * @param {string} expr - The function expression.
 * @param {number[]} criticalPoints - Array of x-values from findCriticalPoints.
 * @param {string} [variable='x'] - Variable name.
 * @returns {Array<{x: number, y: number, secondDerivValue: number, type: string}>}
 */
export function classifyCriticalPoints(expr, criticalPoints, variable = 'x') {
  const secondDeriv = computeSecondDerivative(expr, variable);

  return criticalPoints.map(cp => {
    const fValue = evaluateAt(expr, variable, cp);
    const fppValue = evaluateAt(secondDeriv, variable, cp);

    let type = 'Inconclusive';
    if (fppValue > 0.0001) type = 'Local Minimum';
    else if (fppValue < -0.0001) type = 'Local Maximum';
    else type = 'Inflection / Inconclusive';

    return {
      x: cp,
      y: Math.round(fValue * 1e6) / 1e6,
      secondDerivValue: Math.round(fppValue * 1e6) / 1e6,
      type,
    };
  });
}

/**
 * Finds inflection points by scanning for sign changes in the second derivative.
 * Uses the same bisection approach as findCriticalPoints.
 *
 * @param {string} expr - The function expression.
 * @param {string} [variable='x'] - Variable name.
 * @param {number} [min=-20] - Left boundary.
 * @param {number} [max=20] - Right boundary.
 * @param {number} [steps=2000] - Scan resolution.
 * @returns {Array<{x: number, y: number}>}
 */
export function findInflectionPoints(expr, variable = 'x', min = -20, max = 20, steps = 2000) {
  const secondDeriv = computeSecondDerivative(expr, variable);
  const inflectionPoints = [];
  const step = (max - min) / steps;

  for (let i = 0; i < steps; i++) {
    const x1 = min + i * step;
    const x2 = x1 + step;
    const y1 = evaluateAt(secondDeriv, variable, x1);
    const y2 = evaluateAt(secondDeriv, variable, x2);

    if (isNaN(y1) || isNaN(y2)) continue;
    if (y1 * y2 < 0) {
      let lo = x1, hi = x2;
      for (let j = 0; j < 50; j++) {
        const mid = (lo + hi) / 2;
        const ym = evaluateAt(secondDeriv, variable, mid);
        if (isNaN(ym)) break;
        if (ym * evaluateAt(secondDeriv, variable, lo) < 0) hi = mid;
        else lo = mid;
      }
      const ip = (lo + hi) / 2;
      inflectionPoints.push({
        x: Math.round(ip * 1e6) / 1e6,
        y: Math.round(evaluateAt(expr, variable, ip) * 1e6) / 1e6,
      });
    }
  }

  return inflectionPoints;
}

/**
 * Generates an array of {x, y} data points for plotting a function.
 * Filters out NaN, Infinity, and extreme values (|y| > 1e6) to prevent
 * rendering artifacts in the Visualizer's canvas.
 *
 * @param {string} expr - The function expression.
 * @param {string} [variable='x'] - Variable name.
 * @param {number} [min=-10] - Left x boundary.
 * @param {number} [max=10] - Right x boundary.
 * @param {number} [numPoints=500] - Number of sample points.
 * @returns {Array<{x: number, y: number}>}
 */
export function generatePlotData(expr, variable = 'x', min = -10, max = 10, numPoints = 500) {
  const points = [];
  const step = (max - min) / numPoints;

  for (let i = 0; i <= numPoints; i++) {
    const x = min + i * step;
    const y = evaluateAt(expr, variable, x);
    if (!isNaN(y) && isFinite(y) && Math.abs(y) < 1e6) {
      points.push({ x, y });
    }
  }
  return points;
}

/**
 * Computes the tangent line to a function at a given point x = a.
 * Returns slope, y-intercept, and a human-readable equation string.
 *
 * @param {string} expr - The function expression.
 * @param {string} [variable='x'] - Variable name.
 * @param {number} [a=0] - The x-value at which to compute the tangent.
 * @returns {{slope: number, yIntercept: number, equation: string, pointY: number}}
 */
export function tangentLineAt(expr, variable = 'x', a = 0) {
  const fA = evaluateAt(expr, variable, a);
  const firstDeriv = computeDerivative(expr, variable);
  const slope = evaluateAt(firstDeriv, variable, a);

  return {
    slope: Math.round(slope * 1e6) / 1e6,
    yIntercept: Math.round((fA - slope * a) * 1e6) / 1e6,
    equation: `y = ${Math.round(slope * 1e4) / 1e4} * (x - ${a}) + ${Math.round(fA * 1e4) / 1e4}`,
    pointY: fA,
  };
}

/**
 * Performs a full optimization analysis: computes first and second derivatives,
 * finds and classifies critical points, and finds inflection points.
 *
 * @param {string} expr - The function expression.
 * @param {string} [variable='x'] - Variable name.
 * @param {number} [rangeMin=-20] - Left search boundary.
 * @param {number} [rangeMax=20] - Right search boundary.
 * @returns {{originalFunction: string, firstDerivative: string, secondDerivative: string, criticalPoints: Array, inflectionPoints: Array}}
 */
export function analyzeFunction(expr, variable = 'x', rangeMin = -20, rangeMax = 20) {
  const firstDeriv = computeDerivative(expr, variable);
  const secondDeriv = computeSecondDerivative(expr, variable);
  const critPoints = findCriticalPoints(expr, variable, rangeMin, rangeMax);
  const classified = classifyCriticalPoints(expr, critPoints, variable);
  const inflections = findInflectionPoints(expr, variable, rangeMin, rangeMax);

  return {
    originalFunction: expr,
    firstDerivative: firstDeriv,
    secondDerivative: secondDeriv,
    criticalPoints: classified,
    inflectionPoints: inflections,
  };
}

/**
 * Dispatcher for the Solver screen's computation modes.
 * Routes to the appropriate computation based on problemType.
 *
 * @param {string} problemType - One of 'derivative', 'integral_basic', 'limit', 'optimize'.
 * @param {Object} params - Problem parameters (expr, variable, value, min, max).
 * @returns {Object} Result object with steps and computed values.
 * @throws {Error} If problemType is unknown.
 */
export function solveCalculusProblem(problemType, params) {
  switch (problemType) {
    case 'derivative': {
      const { expr, variable = 'x' } = params;
      return {
        input: expr,
        derivative: computeDerivative(expr, variable),
        steps: [
          `Given: f(${variable}) = ${expr}`,
          `Apply differentiation rules`,
          `f'(${variable}) = ${computeDerivative(expr, variable)}`,
        ],
      };
    }
    case 'integral_basic': {
      const { expr, variable = 'x' } = params;
      return {
        input: expr,
        note: 'For complex integrals, use the AI scanner feature.',
        steps: [`Given: ∫ ${expr} d${variable}`, `Apply integration rules`],
      };
    }
    case 'limit': {
      const { expr, variable = 'x', value } = params;
      // Numerical limit approximation from both sides
      const approaches = [0.1, 0.01, 0.001, 0.0001, 0.00001];
      const fromLeft = approaches.map(d => ({
        x: value - d,
        y: evaluateAt(expr, variable, value - d),
      }));
      const fromRight = approaches.map(d => ({
        x: value + d,
        y: evaluateAt(expr, variable, value + d),
      }));
      const limitValue = evaluateAt(expr, variable, value + 0.00001);
      return {
        input: `lim (${variable}→${value}) ${expr}`,
        fromLeft,
        fromRight,
        limitValue: Math.round(limitValue * 1e6) / 1e6,
        steps: [
          `Evaluate f(${variable}) as ${variable} approaches ${value}`,
          `From left: ${fromLeft.map(p => `f(${p.x}) = ${Math.round(p.y * 1e4) / 1e4}`).join(', ')}`,
          `From right: ${fromRight.map(p => `f(${p.x}) = ${Math.round(p.y * 1e4) / 1e4}`).join(', ')}`,
          `Limit ≈ ${Math.round(limitValue * 1e6) / 1e6}`,
        ],
      };
    }
    case 'optimize': {
      return analyzeFunction(params.expr, params.variable || 'x', params.min || -20, params.max || 20);
    }
    default:
      throw new Error('Unknown problem type: ' + problemType);
  }
}
