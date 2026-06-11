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
 * Converts a math.js expression string to LaTeX using the parse tree.
 * Returns null if the expression is invalid or incomplete, so callers can
 * safely fall back to a plain-text display without crashing.
 * @param {string} expr
 * @returns {string|null}
 */
export function toLatex(expr) {
  // parse().toTex() is math.js's built-in LaTeX serialiser; wrapping in try/catch
  // lets the preview box degrade gracefully while the user is still typing
  try { return parse(expr).toTex(); } catch { return null; }
}

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
 * WHY bisection: a simple scan with a fixed step size would miss roots that
 * fall between two sample points. Detecting a sign change (y1 * y2 < 0) pins
 * down which sub-interval contains the root, then bisection halves that
 * interval 50 times (~2^-50 ≈ 10^-15 precision) to pinpoint the exact zero.
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

    // Skip any interval where evaluation fails (e.g., discontinuities like 1/x at 0)
    if (isNaN(y1) || isNaN(y2)) continue;

    // Sign change in f'(x) indicates a root — refine with bisection
    if (y1 * y2 < 0) {
      let lo = x1, hi = x2;
      for (let j = 0; j < 50; j++) {
        const mid = (lo + hi) / 2;
        const ym = evaluateAt(firstDeriv, variable, mid);
        if (isNaN(ym)) break;
        // Narrow the bracket toward the side whose sign matches lo's sign
        if (ym * evaluateAt(firstDeriv, variable, lo) < 0) hi = mid;
        else lo = mid;
      }
      // Round to avoid floating-point noise in the display (e.g., 2.9999999 → 3)
      const cp = (lo + hi) / 2;
      criticalPoints.push(Math.round(cp * 1e8) / 1e8);
    }

    // Also catch exact zeros (f'(x) ≈ 0 within tolerance) that won't produce
    // a sign change (e.g., a tangent touch-point like x=0 for x^2)
    if (Math.abs(y1) < 1e-10) {
      const rounded = Math.round(x1 * 1e8) / 1e8;
      // Deduplicate: skip if a nearby point was already recorded
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
 * f''(x) > 0 → concave up → local minimum
 * f''(x) < 0 → concave down → local maximum
 * f''(x) ≈ 0 → test is inconclusive (may be an inflection point)
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

    // Use a small tolerance (0.0001) rather than exact zero to account for
    // floating-point rounding in the numerical evaluation
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
 * Uses the same bisection approach as findCriticalPoints — a sign change in
 * f''(x) means concavity flips, which is the definition of an inflection point.
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
      // Bisection to pinpoint where f''(x) = 0
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
 * Computes a definite integral numerically using composite Simpson's 1/3 rule.
 *
 * WHY Simpson's rule: it fits a parabola through each pair of sub-intervals,
 * giving O(h^4) error per step vs O(h^2) for the trapezoidal rule. With
 * n = 1000 sub-intervals this typically achieves 8+ significant digits for
 * smooth functions — sufficient for student-level calculus problems.
 *
 * The alternating 4-2-4-2 weight pattern comes directly from Simpson's formula:
 *   h/3 * [f(x0) + 4f(x1) + 2f(x2) + 4f(x3) + ... + f(xn)]
 *
 * @param {string} expr - The integrand expression.
 * @param {string} [variable='x'] - Integration variable.
 * @param {number} a - Lower bound.
 * @param {number} b - Upper bound.
 * @param {number} [n=1000] - Number of sub-intervals (forced even; Simpson's rule requires it).
 * @returns {number} Approximate value of the definite integral.
 */
export function computeDefiniteIntegral(expr, variable = 'x', a, b, n = 1000) {
  // Simpson's rule requires an even number of intervals
  if (n % 2 !== 0) n += 1;
  const h = (b - a) / n;
  // Start with the endpoint values (weight 1 each)
  let sum = evaluateAt(expr, variable, a) + evaluateAt(expr, variable, b);
  for (let i = 1; i < n; i++) {
    const y = evaluateAt(expr, variable, a + i * h);
    // NaN/Infinity can occur at discontinuities (e.g., 1/x near 0); skip them
    // rather than letting a single bad point corrupt the entire sum
    if (!isNaN(y) && isFinite(y)) sum += (i % 2 === 0 ? 2 : 4) * y;
  }
  return (h / 3) * sum;
}

/**
 * Returns true if the math.js parse-tree node (or any descendant) references
 * the given variable name. Used by integrateNode to decide whether a factor
 * is a constant (with respect to the integration variable) or depends on it.
 *
 * @param {Object} node - math.js MathNode.
 * @param {string} v    - Variable name to search for.
 * @returns {boolean}
 */
function containsVar(node, v) {
  if (node.type === 'SymbolNode') return node.name === v;
  if (node.type === 'ConstantNode') return false;
  // Recursively check all child argument nodes
  if (node.args) return node.args.some(a => containsVar(a, v));
  // ParenthesisNode wraps a single child in 'content'
  if (node.content) return containsVar(node.content, v);
  return false;
}

/**
 * Recursively integrates a math.js parse-tree node with respect to variable v.
 * Implements the power rule, sum/difference rule, constant-multiple rule, and
 * standard function integrals (sin, cos, tan, exp, log, sqrt).
 *
 * WHY a tree-walker instead of string manipulation: operating on the AST avoids
 * ambiguous parsing (e.g., is "2x" one token or two?) and lets us handle
 * nested expressions correctly via recursion.
 *
 * Limitations: product-of-two-x-functions (integration by parts) and
 * arbitrary compositions are not supported — those cases throw so the caller
 * can fall back to the numerical integrator.
 *
 * @param {Object} node - math.js MathNode to integrate.
 * @param {string} v    - Integration variable.
 * @returns {string}    - Antiderivative as a math.js expression string.
 * @throws {Error}      - If the pattern is not recognised.
 */
function integrateNode(node, v) {
  switch (node.type) {
    case 'ConstantNode':
      // ∫ c dx = c·x
      return `${node.value} * ${v}`;

    case 'SymbolNode':
      if (node.name === v) return `${v}^2 / 2`; // ∫ x dx = x²/2
      return `${node.name} * ${v}`; // treat other symbols as constants w.r.t. v

    case 'ParenthesisNode':
      // Transparent wrapper — just recurse into the inner expression
      return integrateNode(node.content, v);

    case 'OperatorNode': {
      const [a, b] = node.args;
      switch (node.op) {
        // Sum/difference rule: integrate each term independently
        case '+': return `(${integrateNode(a, v)}) + (${integrateNode(b, v)})`;
        case '-':
          if (node.args.length === 1) return `-(${integrateNode(a, v)})`; // unary minus
          return `(${integrateNode(a, v)}) - (${integrateNode(b, v)})`;

        case '*':
          // Constant-multiple rule: pull the constant factor out
          if (!containsVar(a, v)) return `${a} * (${integrateNode(b, v)})`;
          if (!containsVar(b, v)) return `${b} * (${integrateNode(a, v)})`;
          // Both factors contain v → would require integration by parts; not supported
          throw new Error('Product of two x-functions not supported');

        case '/':
          // Constant denominator: treat as constant-multiple and integrate numerator
          if (!containsVar(b, v)) return `(${integrateNode(a, v)}) / (${b})`;
          // ∫ 1/x dx = ln|x|
          if (a.type === 'ConstantNode' && Number(a.value) === 1 &&
              b.type === 'SymbolNode' && b.name === v) return `log(${v})`;
          // ∫ c/x dx = c·ln|x|
          if (!containsVar(a, v) && b.type === 'SymbolNode' && b.name === v)
            return `(${a}) * log(${v})`;
          throw new Error('Division by a function of x not supported');

        case '^': {
          // Power rule: ∫ x^n dx = x^(n+1)/(n+1), with special case for n=-1
          if (a.type === 'SymbolNode' && a.name === v && !containsVar(b, v)) {
            if (b.type === 'ConstantNode' && Number(b.value) === -1) return `log(${v})`;
            if (b.type === 'ConstantNode') {
              const n = Number(b.value);
              return `${v}^${n + 1} / ${n + 1}`;
            }
            // Symbolic exponent (e.g., x^k) — keep it generic
            return `${v}^(${b} + 1) / (${b} + 1)`;
          }
          // ∫ e^x dx = e^x
          if (a.type === 'SymbolNode' && a.name === 'e' &&
              b.type === 'SymbolNode' && b.name === v) return `e^${v}`;
          // ∫ a^x dx = a^x / ln(a)
          if (!containsVar(a, v) && b.type === 'SymbolNode' && b.name === v)
            return `${a}^${v} / log(${a})`;
          throw new Error('Power integration pattern not recognised');
        }
        default:
          throw new Error(`Unsupported operator: ${node.op}`);
      }
    }

    case 'FunctionNode': {
      const fn = node.name;
      const arg = node.args[0];

      /*
       * Determine the linear coefficient k for functions of the form f(k·v).
       * This lets us handle ∫ sin(3x) dx = -cos(3x)/3 via the chain rule
       * shortcut ∫ f(kx) dx = F(kx)/k, valid for linear arguments only.
       */
      let coeff = null;
      if (arg.type === 'SymbolNode' && arg.name === v) {
        coeff = 1; // f(x) — coefficient is 1
      } else if (
        arg.type === 'OperatorNode' && arg.op === '*' &&
        !containsVar(arg.args[0], v) &&
        arg.args[1].type === 'SymbolNode' && arg.args[1].name === v
      ) {
        coeff = arg.args[0].toString(); // f(k·x) — coefficient is the first factor
      }

      if (coeff !== null) {
        // inv prefix implements the 1/k scale factor for the chain rule
        const inv = coeff === 1 ? '' : `(1 / ${coeff}) * `;
        const argStr = arg.toString();
        switch (fn) {
          case 'sin':  return `${inv}-cos(${argStr})`;    // ∫ sin(kx) dx = -cos(kx)/k
          case 'cos':  return `${inv}sin(${argStr})`;     // ∫ cos(kx) dx = sin(kx)/k
          case 'tan':  return `${inv}-log(abs(cos(${argStr})))`; // ∫ tan = -ln|cos|
          case 'exp':  return `${inv}exp(${argStr})`;     // ∫ e^(kx) = e^(kx)/k
          case 'log':
          case 'ln':
            // ∫ ln(x) dx = x·ln(x) - x  (integration by parts result)
            if (coeff === 1) return `${v} * log(${v}) - ${v}`;
            break;
          case 'sqrt':
            // ∫ √x dx = (2/3)x^(3/2)
            if (coeff === 1) return `(2 / 3) * ${v}^(3 / 2)`;
            break;
          default: break;
        }
      }
      throw new Error(`Cannot integrate ${fn}(...) symbolically`);
    }

    default:
      throw new Error(`Unsupported node type: ${node.type}`);
  }
}

/**
 * Computes an indefinite integral symbolically using basic calculus rules.
 * Handles polynomials, sin/cos/tan, exp, log, sqrt, and linear composites.
 *
 * @param {string} expr - Integrand expression.
 * @param {string} [variable='x'] - Integration variable.
 * @returns {string} Antiderivative as a math.js string (without + C).
 * @throws {Error} If the expression cannot be integrated symbolically.
 */
export function computeIndefiniteIntegral(expr, variable = 'x') {
  try {
    const node = parse(expr);
    const raw = integrateNode(node, variable);
    // simplify() collapses redundant subexpressions that integrateNode introduces
    // by building strings like "(1 * (x^2 / 2))" — the result is cleaner LaTeX
    return simplify(parse(raw)).toString();
  } catch (e) {
    throw new Error(e.message);
  }
}

/**
 * Dispatcher for the Solver screen's computation modes.
 * Routes to the appropriate computation based on problemType.
 *
 * @param {string} problemType - One of 'derivative', 'integral_basic', 'limit', 'optimize', 'integrate'.
 * @param {Object} params - Problem parameters (expr, variable, value, min, max, lower, upper, indefinite).
 * @returns {Object} Result object with steps and computed values.
 * @throws {Error} If problemType is unknown.
 */
export function solveCalculusProblem(problemType, params) {
  switch (problemType) {
    case 'derivative': {
      const { expr, variable = 'x' } = params;
      const deriv = computeDerivative(expr, variable);
      // Local toTex helper — converts a math.js expression string to LaTeX for
      // embedding in the markdown result block rendered by MathRenderer
      const toTex = (e) => { try { return parse(e).toTex(); } catch { return e; } };
      return {
        input: expr,
        derivative: deriv,
        // latex field is a full markdown+KaTeX block; MathRenderer will parse
        // the $$ delimiters and the ** bold markers
        latex: `**Given:**\n$$f(${variable}) = ${toTex(expr)}$$\n**Result:**\n$$f'(${variable}) = ${toTex(deriv)}$$`,
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
      // Numerical limit: evaluate at decreasing distances from the target value
      // on both sides to show convergence (a standard epsilon-delta illustration)
      const approaches = [0.1, 0.01, 0.001, 0.0001, 0.00001];
      const fromLeft = approaches.map(d => ({
        x: value - d,
        y: evaluateAt(expr, variable, value - d),
      }));
      const fromRight = approaches.map(d => ({
        x: value + d,
        y: evaluateAt(expr, variable, value + d),
      }));
      // Use a small right-side offset as the final estimate; both sides should
      // converge to the same value if the limit exists
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
    case 'integrate': {
      const { expr, variable = 'x', lower, upper, indefinite = false } = params;
      const toTex = (e) => { try { return parse(e).toTex(); } catch { return e; } };
      if (indefinite) {
        // Symbolic path: attempt tree-walking antiderivative; throws for unsupported forms
        const antiderivative = computeIndefiniteIntegral(expr, variable);
        return {
          input: expr, variable, indefinite: true, antiderivative,
          // "+ C" is appended in the LaTeX so the displayed formula is mathematically correct
          latex: `\\int ${toTex(expr)}\\, d${variable} = ${toTex(antiderivative)} + C`,
        };
      }
      // Numerical path: Simpson's rule with n = 1000
      const result = computeDefiniteIntegral(expr, variable, lower, upper);
      return {
        input: expr, lower, upper, variable, indefinite: false,
        result: Math.round(result * 1e8) / 1e8,
        // \approx signals to the reader that this is a numerical approximation
        latex: `\\int_{${lower}}^{${upper}} ${toTex(expr)}\\, d${variable} \\approx ${Math.round(result * 1e8) / 1e8}`,
      };
    }
    case 'optimize': {
      return analyzeFunction(params.expr, params.variable || 'x', params.min || -20, params.max || 20);
    }
    default:
      throw new Error('Unknown problem type: ' + problemType);
  }
}
