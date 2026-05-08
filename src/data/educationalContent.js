/**
 * @file educationalContent.js
 * @description Complete educational curriculum data for Calculus I (9 topics)
 * and Calculus II (7 topics), aligned with MATH 111-121 syllabus.
 * Each topic has: id, title, week, icon, description, theory (with **bold**
 * markers), examples [{problem, solution}], quiz [{question, options, correct,
 * explanation}].
 *
 * @see BinderMATH.pdf - Professor's lecture slides used as source material
 * @see https://jsdoc.app/ - Documentation standard
 *
 * @changelog
 * - Initial creation with all 16 topics covering Calc I and Calc II
 * - Theory text uses **bold** markers parsed by TopicScreen's regex split
 * - Unicode subscripts/superscripts used where possible in display strings
 */
export const CALC_1_TOPICS = [
  {
    id: 'functions',
    title: 'Functions & Graphs',
    week: 'Week 2',
    icon: '📐',
    description: 'Types of functions, domain/range, increasing/decreasing, even/odd functions, and graph transformations.',
    theory: `A function f is a rule that assigns each element x in a set D (domain) exactly one element f(x) in a set R (range).

**Types of Functions:**
• Polynomial: f(x) = aₙxⁿ + ... + a₁x + a₀
• Rational: f(x) = P(x)/Q(x)
• Trigonometric: sin(x), cos(x), tan(x), etc.
• Exponential: f(x) = aˣ
• Logarithmic: f(x) = logₐ(x)

**Properties:**
• Increasing: f(x₁) < f(x₂) when x₁ < x₂
• Decreasing: f(x₁) > f(x₂) when x₁ < x₂
• Even: f(-x) = f(x) — symmetric about y-axis
• Odd: f(-x) = -f(x) — symmetric about origin

**Graph Transformations:**
• y = f(x) + c → shift up by c
• y = f(x - c) → shift right by c
• y = c·f(x) → vertical stretch by c
• y = f(cx) → horizontal compression by c
• y = -f(x) → reflect over x-axis
• y = f(-x) → reflect over y-axis`,
    examples: [
      { problem: 'Is f(x) = x³ + x even, odd, or neither?', solution: 'f(-x) = (-x)³ + (-x) = -x³ - x = -(x³ + x) = -f(x). Since f(-x) = -f(x), the function is ODD.' },
      { problem: 'Describe the graph of y = (x-2)² + 3', solution: 'Start with y = x². Shift 2 units RIGHT and 3 units UP. The vertex is at (2, 3).' },
      { problem: 'Find the domain of f(x) = √(4 - x²)', solution: 'We need 4 - x² ≥ 0, so x² ≤ 4, meaning -2 ≤ x ≤ 2. Domain: [-2, 2].' },
    ],
    quiz: [
      { question: 'f(x) = x⁴ + x² is:', options: ['Even', 'Odd', 'Neither'], correct: 0, explanation: 'f(-x) = (-x)⁴ + (-x)² = x⁴ + x² = f(x), so it is even.' },
      { question: 'y = f(x) - 5 shifts the graph:', options: ['5 units left', '5 units down', '5 units right', '5 units up'], correct: 1, explanation: 'Subtracting from the function shifts the graph down.' },
      { question: 'The domain of f(x) = 1/(x-3) is:', options: ['All real numbers', 'x ≠ 3', 'x > 3', 'x ≥ 3'], correct: 1, explanation: 'The denominator cannot be zero, so x ≠ 3.' },
    ],
  },
  {
    id: 'limits',
    title: 'Limits & Continuity',
    week: 'Week 3',
    icon: '→',
    description: 'Limit definition, limit rules, Sandwich Theorem, one-sided limits, and continuity.',
    theory: `**Definition:** lim(x→a) f(x) = L means f(x) gets arbitrarily close to L as x approaches a.

**Limit Laws:**
• lim[f(x) + g(x)] = lim f(x) + lim g(x)
• lim[f(x) · g(x)] = lim f(x) · lim g(x)
• lim[f(x)/g(x)] = lim f(x) / lim g(x)  (if lim g(x) ≠ 0)
• lim[f(x)]ⁿ = [lim f(x)]ⁿ
• lim c = c (constant)
• lim x = a

**Sandwich (Squeeze) Theorem:**
If g(x) ≤ f(x) ≤ h(x) near a, and lim g(x) = lim h(x) = L, then lim f(x) = L.

**Important Limits:**
• lim(x→0) sin(x)/x = 1
• lim(x→0) (1-cos(x))/x = 0
• lim(x→∞) (1 + 1/n)ⁿ = e

**One-Sided Limits:**
• lim(x→a⁻) f(x) = left-hand limit
• lim(x→a⁺) f(x) = right-hand limit
• The limit exists iff both one-sided limits exist and are equal.

**Continuity:** f is continuous at a if:
1. f(a) is defined
2. lim(x→a) f(x) exists
3. lim(x→a) f(x) = f(a)`,
    examples: [
      { problem: 'Find lim(x→2) (x² - 4)/(x - 2)', solution: 'Factor: (x²-4)/(x-2) = (x-2)(x+2)/(x-2) = x+2. So lim(x→2) (x+2) = 4.' },
      { problem: 'Find lim(x→0) sin(3x)/x', solution: 'Rewrite: sin(3x)/x = 3 · sin(3x)/(3x). As x→0, 3x→0, so sin(3x)/(3x)→1. Answer: 3.' },
      { problem: 'Is f(x) = |x|/x continuous at x = 0?', solution: 'lim(x→0⁺) = 1, lim(x→0⁻) = -1. One-sided limits differ, so the limit DNE, and f is NOT continuous at 0.' },
    ],
    quiz: [
      { question: 'lim(x→3) (x² - 9)/(x - 3) = ?', options: ['0', '3', '6', 'DNE'], correct: 2, explanation: '(x²-9)/(x-3) = (x+3)(x-3)/(x-3) = x+3. At x=3: 3+3=6.' },
      { question: 'lim(x→0) sin(x)/x = ?', options: ['0', '1', '∞', 'DNE'], correct: 1, explanation: 'This is a fundamental limit equal to 1.' },
      { question: 'If lim(x→a⁻) f(x) = 3 and lim(x→a⁺) f(x) = 5, then lim(x→a) f(x) is:', options: ['3', '5', '4', 'Does not exist'], correct: 3, explanation: 'The two-sided limit exists only if left and right limits are equal.' },
    ],
  },
  {
    id: 'limits_infinity',
    title: 'Limits at Infinity',
    week: 'Week 3.2',
    icon: '∞',
    description: 'Limits involving infinity, horizontal and vertical asymptotes.',
    theory: `**Limits at Infinity:**
lim(x→∞) f(x) = L means f(x) approaches L as x grows without bound.

**Key Rules:**
• lim(x→∞) 1/xⁿ = 0 (for n > 0)
• lim(x→∞) aⁿ/bⁿ: compare highest powers
• For rational functions P(x)/Q(x):
  - If deg(P) < deg(Q): limit = 0
  - If deg(P) = deg(Q): limit = leading coefficient ratio
  - If deg(P) > deg(Q): limit = ±∞

**Horizontal Asymptote:** y = L if lim(x→±∞) f(x) = L
**Vertical Asymptote:** x = a if lim(x→a) f(x) = ±∞`,
    examples: [
      { problem: 'Find lim(x→∞) (3x² + 1)/(2x² - 5)', solution: 'Divide top and bottom by x²: (3 + 1/x²)/(2 - 5/x²) → 3/2 as x→∞.' },
      { problem: 'Find horizontal asymptotes of f(x) = (2x)/(x² + 1)', solution: 'deg(numerator)=1 < deg(denominator)=2, so lim(x→±∞) f(x) = 0. HA: y = 0.' },
    ],
    quiz: [
      { question: 'lim(x→∞) (5x³ + 2)/(3x³ - 1) = ?', options: ['0', '5/3', '∞', '3/5'], correct: 1, explanation: 'Same degree → ratio of leading coefficients = 5/3.' },
      { question: 'lim(x→∞) (x + 1)/x² = ?', options: ['0', '1', '∞', '-1'], correct: 0, explanation: 'deg(top) < deg(bottom), so the limit is 0.' },
    ],
  },
  {
    id: 'ivt_derivatives_intro',
    title: 'IVT & Intro to Derivatives',
    week: 'Week 4',
    icon: '📏',
    description: 'Intermediate Value Theorem and the definition of the derivative.',
    theory: `**Intermediate Value Theorem (IVT):**
If f is continuous on [a, b] and N is between f(a) and f(b), then there exists c in (a, b) such that f(c) = N.

Application: Proving a root exists. If f(a) > 0 and f(b) < 0 (or vice versa), then f has a root between a and b.

**The Derivative — Definition:**
f'(x) = lim(h→0) [f(x+h) - f(x)] / h

This represents:
• The slope of the tangent line at x
• The instantaneous rate of change of f at x

**Geometric Meaning:**
The derivative f'(a) is the slope of the tangent line to y = f(x) at x = a.
Tangent line equation: y - f(a) = f'(a)(x - a)`,
    examples: [
      { problem: 'Show x³ + x - 1 = 0 has a root in (0, 1)', solution: 'f(0) = -1 < 0, f(1) = 1 > 0. Since f is continuous and changes sign, by IVT there exists c in (0,1) with f(c) = 0.' },
      { problem: 'Find f\'(x) for f(x) = x² using the definition', solution: 'f\'(x) = lim(h→0) [(x+h)² - x²]/h = lim(h→0) [2xh + h²]/h = lim(h→0) (2x + h) = 2x.' },
    ],
    quiz: [
      { question: 'IVT requires f to be:', options: ['Differentiable', 'Continuous', 'Increasing', 'Bounded'], correct: 1, explanation: 'The IVT requires the function to be continuous on the interval.' },
      { question: 'The derivative of f(x) = x² at x = 3 is:', options: ['3', '6', '9', '12'], correct: 1, explanation: 'f\'(x) = 2x, so f\'(3) = 6.' },
    ],
  },
  {
    id: 'differentiation',
    title: 'Differentiation Rules',
    week: 'Week 5',
    icon: '∂',
    description: 'Power rule, product rule, quotient rule, and chain rule.',
    theory: `**Basic Rules:**
• Constant: d/dx[c] = 0
• Power Rule: d/dx[xⁿ] = nxⁿ⁻¹
• Constant Multiple: d/dx[c·f(x)] = c·f'(x)
• Sum/Difference: d/dx[f ± g] = f' ± g'

**Product Rule:**
d/dx[f(x)·g(x)] = f'(x)·g(x) + f(x)·g'(x)

**Quotient Rule:**
d/dx[f(x)/g(x)] = [f'(x)·g(x) - f(x)·g'(x)] / [g(x)]²

**Common Derivatives:**
• d/dx[sin x] = cos x
• d/dx[cos x] = -sin x
• d/dx[tan x] = sec²x
• d/dx[eˣ] = eˣ
• d/dx[ln x] = 1/x
• d/dx[aˣ] = aˣ·ln(a)

**Chain Rule:**
d/dx[f(g(x))] = f'(g(x))·g'(x)
"Derivative of outer × derivative of inner"

**Implicit Differentiation:**
Differentiate both sides with respect to x, treating y as a function of x (use chain rule for y terms), then solve for dy/dx.`,
    examples: [
      { problem: 'Find d/dx[(x³ + 1)(2x - 5)]', solution: 'Product rule: 3x²(2x-5) + (x³+1)(2) = 6x³ - 15x² + 2x³ + 2 = 8x³ - 15x² + 2.' },
      { problem: 'Find d/dx[sin(x²)]', solution: 'Chain rule: cos(x²) · 2x = 2x·cos(x²).' },
      { problem: 'Find dy/dx if x² + y² = 25', solution: 'Differentiate: 2x + 2y·(dy/dx) = 0. Solve: dy/dx = -x/y.' },
    ],
    quiz: [
      { question: 'd/dx[x⁵] = ?', options: ['5x⁵', '5x⁴', 'x⁴', '4x⁵'], correct: 1, explanation: 'Power rule: bring down the exponent and subtract 1.' },
      { question: 'd/dx[sin(3x)] = ?', options: ['cos(3x)', '3cos(3x)', '-3cos(3x)', 'cos(x)'], correct: 1, explanation: 'Chain rule: cos(3x) · 3 = 3cos(3x).' },
      { question: 'Product rule: d/dx[x·eˣ] = ?', options: ['xeˣ', 'eˣ', 'eˣ + xeˣ', 'xeˣ + eˣ'], correct: 2, explanation: '1·eˣ + x·eˣ = eˣ + xeˣ = eˣ(1+x).' },
    ],
  },
  {
    id: 'linearization',
    title: 'Linearization',
    week: 'Week 6',
    icon: '📐',
    description: 'Linear approximation using derivatives.',
    theory: `**Linearization:**
The linear approximation of f near x = a is:
L(x) = f(a) + f'(a)(x - a)

This is the equation of the tangent line at a, used to approximate f(x) for x near a.

**Differentials:**
If y = f(x), then:
dy = f'(x)·dx

This approximates the change in y for a small change dx in x.`,
    examples: [
      { problem: 'Linearize f(x) = √x at a = 4', solution: 'f(4) = 2, f\'(x) = 1/(2√x), f\'(4) = 1/4. L(x) = 2 + (1/4)(x - 4). Estimate √4.1 ≈ 2 + 0.025 = 2.025.' },
    ],
    quiz: [
      { question: 'Linear approximation of f near a uses:', options: ['f(a) + f\'(a)(x-a)', 'f(a) + f\'\'(a)(x-a)', 'f\'(a)(x-a)', 'f(a)·x'], correct: 0, explanation: 'L(x) = f(a) + f\'(a)(x - a) is the linearization formula.' },
    ],
  },
  {
    id: 'applications_derivatives',
    title: 'Applications of Derivatives',
    week: 'Week 9-10',
    icon: '🔍',
    description: 'Extreme values, first/second derivative tests, optimization, curve sketching.',
    theory: `**Critical Points:**
x = c is a critical point of f if f'(c) = 0 or f'(c) DNE.

**First Derivative Test:**
At a critical point c:
• If f' changes from + to − → Local Maximum
• If f' changes from − to + → Local Minimum
• If no sign change → Neither

**Second Derivative Test:**
At a critical point c (where f'(c) = 0):
• f''(c) > 0 → Local Minimum (concave up)
• f''(c) < 0 → Local Maximum (concave down)
• f''(c) = 0 → Inconclusive

**Absolute Extrema on [a, b]:**
1. Find critical points in (a, b)
2. Evaluate f at critical points AND endpoints
3. Largest = absolute max, smallest = absolute min

**Concavity & Inflection Points:**
• f''(x) > 0 → Concave up
• f''(x) < 0 → Concave down
• Inflection point: where concavity changes (f'' = 0 and changes sign)

**Optimization Strategy:**
1. Define variables and draw a picture
2. Write objective function (what to maximize/minimize)
3. Write constraint equation
4. Express objective as a function of one variable
5. Find critical points, test for max/min
6. Verify answer makes sense

**Curve Sketching Checklist:**
1. Domain, intercepts, symmetry
2. Asymptotes (VA, HA, oblique)
3. f' → increasing/decreasing, critical points
4. f'' → concavity, inflection points
5. Plot key points and sketch`,
    examples: [
      { problem: 'Find extrema of f(x) = x³ - 3x + 2', solution: 'f\'(x) = 3x² - 3 = 0 → x = ±1.\nf\'\'(x) = 6x.\nf\'\'(1) = 6 > 0 → Local min at (1, 0).\nf\'\'(-1) = -6 < 0 → Local max at (-1, 4).' },
      { problem: 'A farmer has 100m of fence. Find dimensions of the largest rectangular area.', solution: 'Perimeter: 2x + 2y = 100, so y = 50 - x.\nArea: A = xy = x(50-x) = 50x - x².\nA\'(x) = 50 - 2x = 0 → x = 25, y = 25.\nA\'\'(x) = -2 < 0 → Maximum.\nMax area = 625 m².' },
    ],
    quiz: [
      { question: 'If f\'(c) = 0 and f\'\'(c) > 0, then x = c is a:', options: ['Local max', 'Local min', 'Inflection point', 'Cannot determine'], correct: 1, explanation: 'Second derivative positive means concave up, so it\'s a local minimum.' },
      { question: 'An inflection point occurs when:', options: ['f\' = 0', 'f\'\' = 0 and changes sign', 'f = 0', 'f\' changes sign'], correct: 1, explanation: 'Inflection points are where concavity changes, meaning f\'\' changes sign.' },
      { question: 'To find absolute max on [a,b], you check:', options: ['Only critical points', 'Only endpoints', 'Critical points and endpoints', 'Where f\'\' = 0'], correct: 2, explanation: 'Absolute extrema can occur at critical points or at endpoints.' },
    ],
  },
  {
    id: 'antiderivatives',
    title: 'Antiderivatives & Integrals',
    week: 'Week 11',
    icon: '∫',
    description: 'Antiderivatives, indefinite integrals, basic integration rules.',
    theory: `**Antiderivative:**
F is an antiderivative of f if F'(x) = f(x).

**Indefinite Integral:**
∫f(x)dx = F(x) + C, where F'(x) = f(x)

**Basic Integration Rules:**
• ∫xⁿ dx = xⁿ⁺¹/(n+1) + C  (n ≠ -1)
• ∫1/x dx = ln|x| + C
• ∫eˣ dx = eˣ + C
• ∫aˣ dx = aˣ/ln(a) + C
• ∫sin(x) dx = -cos(x) + C
• ∫cos(x) dx = sin(x) + C
• ∫sec²(x) dx = tan(x) + C
• ∫1/(1+x²) dx = arctan(x) + C
• ∫1/√(1-x²) dx = arcsin(x) + C

**Definite Integral (FTC):**
∫ₐᵇ f(x)dx = F(b) - F(a)

**Substitution Method:**
∫f(g(x))·g'(x)dx = ∫f(u)du, where u = g(x)`,
    examples: [
      { problem: '∫(3x² + 2x - 1)dx', solution: '= x³ + x² - x + C' },
      { problem: '∫sin(2x)dx', solution: 'Let u = 2x, du = 2dx. ∫sin(u)·(du/2) = -(1/2)cos(2x) + C.' },
    ],
    quiz: [
      { question: '∫x³ dx = ?', options: ['3x²', 'x⁴/4 + C', 'x⁴ + C', '4x⁴ + C'], correct: 1, explanation: 'Power rule: add 1 to exponent, divide by new exponent.' },
      { question: '∫cos(x) dx = ?', options: ['-sin(x) + C', 'sin(x) + C', 'cos(x) + C', '-cos(x) + C'], correct: 1, explanation: 'The antiderivative of cos(x) is sin(x).' },
    ],
  },
  {
    id: 'lhopital',
    title: "L'Hôpital's Rule",
    week: 'Week 13',
    icon: '🏥',
    description: "Using L'Hôpital's rule for indeterminate forms, logarithmic differentiation.",
    theory: `**L'Hôpital's Rule:**
If lim(x→a) f(x)/g(x) gives 0/0 or ∞/∞, then:
lim(x→a) f(x)/g(x) = lim(x→a) f'(x)/g'(x)
(provided the right side exists)

**Indeterminate Forms:**
• 0/0 and ∞/∞ → apply directly
• 0·∞ → rewrite as 0/(1/∞) or ∞/(1/0)
• ∞ - ∞ → combine into a single fraction
• 0⁰, ∞⁰, 1^∞ → take logarithm first

**Logarithmic Differentiation:**
For y = f(x)^g(x):
1. Take ln of both sides: ln(y) = g(x)·ln(f(x))
2. Differentiate: (1/y)·y' = [derivative of right side]
3. Solve for y'`,
    examples: [
      { problem: 'Find lim(x→0) sin(x)/x using L\'Hôpital', solution: '0/0 form. Apply: lim(x→0) cos(x)/1 = cos(0) = 1.' },
      { problem: 'Find lim(x→∞) x/eˣ', solution: '∞/∞ form. L\'Hôpital: lim(x→∞) 1/eˣ = 0.' },
    ],
    quiz: [
      { question: "L'Hôpital's rule applies to:", options: ['Any limit', 'Only 0/0', 'Only ∞/∞', '0/0 or ∞/∞'], correct: 3, explanation: "L'Hôpital's rule applies to indeterminate forms 0/0 or ∞/∞." },
    ],
  },
];

export const CALC_2_TOPICS = [
  {
    id: 'transcendental',
    title: 'Transcendental Functions',
    week: 'Calc II - Week 1',
    icon: 'eˣ',
    description: 'Inverse functions, exponential, logarithmic, and hyperbolic functions.',
    theory: `**Inverse Functions:**
f⁻¹ exists if f is one-to-one (passes horizontal line test).
(f⁻¹)'(b) = 1/f'(f⁻¹(b))

**Exponential & Logarithmic:**
• d/dx[eˣ] = eˣ,  d/dx[aˣ] = aˣ ln(a)
• d/dx[ln x] = 1/x,  d/dx[logₐx] = 1/(x ln a)
• ∫eˣ dx = eˣ + C
• ∫1/x dx = ln|x| + C

**Hyperbolic Functions:**
• sinh(x) = (eˣ - e⁻ˣ)/2
• cosh(x) = (eˣ + e⁻ˣ)/2
• d/dx[sinh x] = cosh x
• d/dx[cosh x] = sinh x`,
    examples: [
      { problem: 'Find d/dx[x^x]', solution: 'Let y = x^x. ln(y) = x·ln(x). (1/y)y\' = ln(x) + 1. y\' = x^x(ln(x) + 1).' },
    ],
    quiz: [
      { question: 'd/dx[ln(3x)] = ?', options: ['1/(3x)', '3/x', '1/x', '3/(3x)'], correct: 2, explanation: 'By chain rule: (1/(3x))·3 = 1/x. Or: ln(3x) = ln3 + lnx, d/dx = 1/x.' },
    ],
  },
  {
    id: 'inverse_trig',
    title: 'Inverse Trigonometric Functions',
    week: 'Calc II - Week 2',
    icon: 'θ',
    description: 'Inverse trig functions and their derivatives.',
    theory: `**Inverse Trig Derivatives:**
• d/dx[arcsin(x)] = 1/√(1-x²)
• d/dx[arccos(x)] = -1/√(1-x²)
• d/dx[arctan(x)] = 1/(1+x²)
• d/dx[arcsec(x)] = 1/(|x|√(x²-1))

**Corresponding Integrals:**
• ∫1/√(1-x²) dx = arcsin(x) + C
• ∫1/(1+x²) dx = arctan(x) + C
• ∫1/(|x|√(x²-1)) dx = arcsec(x) + C`,
    examples: [
      { problem: '∫1/(4+x²) dx', solution: 'Rewrite: ∫1/(4(1+(x/2)²)) dx = (1/2)arctan(x/2) + C.' },
    ],
    quiz: [
      { question: 'd/dx[arctan(x)] = ?', options: ['1/√(1-x²)', '1/(1+x²)', '-1/(1+x²)', '1/x'], correct: 1, explanation: 'The derivative of arctan(x) is 1/(1+x²).' },
    ],
  },
  {
    id: 'integration_techniques',
    title: 'Techniques of Integration',
    week: 'Calc II - Week 2-3',
    icon: '🔧',
    description: 'Trigonometric integrals, trigonometric substitution, partial fractions, integration by parts.',
    theory: `**Integration by Parts:**
∫u dv = uv - ∫v du
Choose u by LIATE: Log, Inverse trig, Algebraic, Trig, Exponential

**Trigonometric Integrals:**
• ∫sinⁿ(x)cosᵐ(x)dx:
  - If m odd: save one cos, convert rest to sin
  - If n odd: save one sin, convert rest to cos
  - If both even: use half-angle formulas

**Trigonometric Substitution:**
• √(a²-x²): let x = a·sin(θ)
• √(a²+x²): let x = a·tan(θ)
• √(x²-a²): let x = a·sec(θ)

**Partial Fractions:**
Decompose P(x)/Q(x) into simpler fractions:
• Linear factor (ax+b): A/(ax+b)
• Repeated: A/(ax+b) + B/(ax+b)²
• Quadratic: (Ax+B)/(ax²+bx+c)`,
    examples: [
      { problem: '∫x·eˣ dx', solution: 'By parts: u=x, dv=eˣdx. du=dx, v=eˣ. = xeˣ - ∫eˣdx = xeˣ - eˣ + C = eˣ(x-1) + C.' },
      { problem: '∫1/(x²-1) dx', solution: 'Partial fractions: 1/(x²-1) = 1/((x-1)(x+1)) = (1/2)/(x-1) - (1/2)/(x+1). = (1/2)ln|x-1| - (1/2)ln|x+1| + C.' },
    ],
    quiz: [
      { question: 'For ∫x²·sin(x) dx, the best method is:', options: ['Substitution', 'Partial fractions', 'Integration by parts', 'Trig substitution'], correct: 2, explanation: 'Algebraic × Trig → use integration by parts (LIATE).' },
      { question: 'For √(9-x²), the correct substitution is:', options: ['x = 3tan(θ)', 'x = 3sin(θ)', 'x = 3sec(θ)', 'u = 9-x²'], correct: 1, explanation: '√(a²-x²) uses x = a·sin(θ), so x = 3sin(θ).' },
    ],
  },
  {
    id: 'improper_integrals',
    title: 'Improper Integrals',
    week: 'Calc II - Week 4',
    icon: '∞',
    description: 'Improper integrals and convergence tests.',
    theory: `**Type I: Infinite Limits**
∫ₐ^∞ f(x)dx = lim(b→∞) ∫ₐᵇ f(x)dx

**Type II: Discontinuous Integrand**
If f has a discontinuity at c in [a,b]:
∫ₐᵇ f(x)dx = lim(t→c⁻) ∫ₐᵗ f(x)dx + lim(t→c⁺) ∫ₜᵇ f(x)dx

**Convergent** if the limit exists and is finite.
**Divergent** if the limit is ±∞ or DNE.

**Comparison Test:**
If 0 ≤ f(x) ≤ g(x):
• ∫g converges → ∫f converges
• ∫f diverges → ∫g diverges

**p-integral:** ∫₁^∞ 1/xᵖ dx converges iff p > 1.`,
    examples: [
      { problem: '∫₁^∞ 1/x² dx', solution: 'lim(b→∞) [-1/x]₁ᵇ = lim(b→∞) (-1/b + 1) = 1. Converges to 1.' },
      { problem: '∫₁^∞ 1/x dx', solution: 'lim(b→∞) [ln|x|]₁ᵇ = lim(b→∞) ln(b) = ∞. Diverges.' },
    ],
    quiz: [
      { question: '∫₁^∞ 1/x³ dx:', options: ['Converges', 'Diverges'], correct: 0, explanation: 'p = 3 > 1, so the p-integral converges.' },
      { question: '∫₁^∞ 1/√x dx:', options: ['Converges', 'Diverges'], correct: 1, explanation: 'p = 1/2 < 1, so it diverges.' },
    ],
  },
  {
    id: 'sequences_series',
    title: 'Sequences & Series',
    week: 'Calc II - Week 5-6',
    icon: 'Σ',
    description: 'Infinite sequences, series, convergence tests.',
    theory: `**Sequences:**
A sequence {aₙ} converges to L if lim(n→∞) aₙ = L.

**Series:**
Σaₙ = a₁ + a₂ + a₃ + ... The series converges if the sequence of partial sums converges.

**Geometric Series:** Σarⁿ = a/(1-r) if |r| < 1; diverges if |r| ≥ 1.

**Convergence Tests:**
• **Divergence Test:** If lim aₙ ≠ 0, then Σaₙ diverges.
• **Integral Test:** If f is positive, continuous, decreasing, and f(n) = aₙ, then Σaₙ converges iff ∫₁^∞ f(x)dx converges.
• **Comparison Test:** Compare with a known series.
• **Limit Comparison:** If lim(aₙ/bₙ) = c > 0, both converge or both diverge.
• **Ratio Test:** L = lim|aₙ₊₁/aₙ|. L < 1 → converges. L > 1 → diverges. L = 1 → inconclusive.
• **Root Test:** L = lim |aₙ|^(1/n). Same criteria.
• **Alternating Series Test:** If aₙ > 0, decreasing, and lim aₙ = 0, then Σ(-1)ⁿaₙ converges.`,
    examples: [
      { problem: 'Does Σ(1/2)ⁿ converge?', solution: 'Geometric series with r = 1/2 < 1. Converges to 1/(1-1/2) = 2.' },
      { problem: 'Test Σn/(n²+1) for convergence', solution: 'aₙ = n/(n²+1) ≈ 1/n for large n. Since Σ1/n diverges and lim(aₙ/(1/n)) = 1, by Limit Comparison, Σaₙ diverges.' },
    ],
    quiz: [
      { question: 'Geometric series Σ(2/3)ⁿ:', options: ['Converges', 'Diverges'], correct: 0, explanation: '|r| = 2/3 < 1, so it converges.' },
      { question: 'If lim aₙ = 5 ≠ 0, then Σaₙ:', options: ['Converges', 'Diverges', 'Cannot determine'], correct: 1, explanation: 'Divergence test: if terms don\'t approach 0, the series diverges.' },
      { question: 'For Ratio Test, if L = lim|aₙ₊₁/aₙ| < 1:', options: ['Diverges', 'Converges', 'Inconclusive'], correct: 1, explanation: 'Ratio less than 1 means the series converges absolutely.' },
    ],
  },
  {
    id: 'power_series',
    title: 'Power Series',
    week: 'Calc II - Week 7',
    icon: '🔋',
    description: 'Power series, radius of convergence, Taylor and Maclaurin series.',
    theory: `**Power Series:**
Σcₙ(x-a)ⁿ centered at a

**Radius of Convergence R:**
Use Ratio Test: R = lim|cₙ/cₙ₊₁|
• Converges for |x-a| < R
• Diverges for |x-a| > R
• Check endpoints separately

**Taylor Series:**
f(x) = Σ f⁽ⁿ⁾(a)/n! · (x-a)ⁿ

**Maclaurin Series (a = 0):**
• eˣ = Σxⁿ/n! = 1 + x + x²/2! + x³/3! + ...
• sin(x) = Σ(-1)ⁿx²ⁿ⁺¹/(2n+1)! = x - x³/3! + x⁵/5! - ...
• cos(x) = Σ(-1)ⁿx²ⁿ/(2n)! = 1 - x²/2! + x⁴/4! - ...
• 1/(1-x) = Σxⁿ = 1 + x + x² + ... for |x| < 1
• ln(1+x) = Σ(-1)ⁿ⁺¹xⁿ/n = x - x²/2 + x³/3 - ... for |x| ≤ 1`,
    examples: [
      { problem: 'Find radius of convergence of Σxⁿ/n!', solution: 'Ratio test: lim|aₙ₊₁/aₙ| = lim|x/(n+1)| = 0 < 1 for all x. R = ∞.' },
    ],
    quiz: [
      { question: 'Maclaurin series for eˣ is:', options: ['Σxⁿ', 'Σxⁿ/n!', 'Σnxⁿ', 'Σ(-1)ⁿxⁿ'], correct: 1, explanation: 'eˣ = 1 + x + x²/2! + x³/3! + ... = Σxⁿ/n!.' },
      { question: 'Radius of convergence of Σxⁿ is:', options: ['0', '1', '∞', 'Cannot determine'], correct: 1, explanation: 'This is a geometric series, converges for |x| < 1.' },
    ],
  },
  {
    id: 'parametric',
    title: 'Parametric Equations',
    week: 'Calc II - Week 9',
    icon: '🌀',
    description: 'Parametric curves, polar coordinates.',
    theory: `**Parametric Equations:**
x = f(t), y = g(t) define a curve as t varies.

**Derivative:**
dy/dx = (dy/dt)/(dx/dt) = g'(t)/f'(t)

**Second Derivative:**
d²y/dx² = (d/dt)(dy/dx) / (dx/dt)

**Arc Length:**
L = ∫ₐᵇ √((dx/dt)² + (dy/dt)²) dt

**Polar Coordinates:**
x = r·cos(θ), y = r·sin(θ)
r² = x² + y², tan(θ) = y/x

**Area in Polar:**
A = (1/2)∫ₐᵇ r² dθ`,
    examples: [
      { problem: 'Find dy/dx for x = t², y = t³', solution: 'dx/dt = 2t, dy/dt = 3t². dy/dx = 3t²/(2t) = 3t/2.' },
    ],
    quiz: [
      { question: 'For parametric curve x=cos(t), y=sin(t), dy/dx =', options: ['-tan(t)', '-cot(t)', 'tan(t)', 'cot(t)'], correct: 1, explanation: 'dy/dx = cos(t)/(-sin(t)) = -cot(t).' },
    ],
  },
];

export const ALL_TOPICS = [...CALC_1_TOPICS, ...CALC_2_TOPICS];