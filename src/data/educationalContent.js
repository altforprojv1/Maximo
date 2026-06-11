/**
 * @file educationalContent.js
 * @description Complete educational curriculum data for Calculus I (9 topics)
 * and Calculus II (7 topics), aligned with MATH 111-121 syllabus.
 *
 * Each topic has:
 *   id, title, week, icon, description
 *   theory   — LaTeX-marked string rendered by MathRenderer (KaTeX).
 *              Inline math uses $...$, displayed equations use $$...$$
 *              Section headers use **bold** markers (→ <strong> in MathRenderer).
 *              Bullet points use • prefix (→ <li> in MathRenderer).
 *   examples — [{problem, solution}] rendered by MathRenderer (compact mode).
 *              Both fields contain $...$ LaTeX markers.
 *   quiz     — [{question, options[], correct, explanation}] rendered by
 *              MathRenderer (KaTeX) in QuizScreen — uses $...$ LaTeX delimiters.
 *
 * @note All backslashes in LaTeX must be doubled (\\frac, \\lim, etc.) because
 *       this is a JavaScript string — \\frac in source → \frac in the string
 *       value → correct KaTeX input.
 *
 * @see BinderMATH.pdf - Professor's lecture slides used as source material
 *
 * @changelog
 * - Initial creation with all 16 topics covering Calc I and Calc II
 * - Theory text uses **bold** markers parsed by TopicScreen's regex split
 * - Unicode subscripts/superscripts used where possible in display strings
 * - Replaced all math notation in theory/examples with $...$ and $$...$$ LaTeX
 *   delimiters so MathRenderer (KaTeX) renders them properly
 * - Updated all quiz fields to use $...$ LaTeX delimiters; QuizScreen now
 *   renders them with MathRenderer (KaTeX) instead of plain Text
 * - Added slideImages arrays to 8 topics (functions, limits, limits_infinity,
 *   ivt_derivatives_intro, differentiation, applications_derivatives,
 *   antiderivatives). Each entry is a professor lecture slide (BinderMATH_Page_NNN.jpg)
 *   with crop parameters that remove the ~65 px decorative left bar and any
 *   excess whitespace. Rendered by ZoomableSlide in TopicScreen.
 */

export const CALC_1_TOPICS = [
  {
    id: 'functions',
    title: 'Functions & Graphs',
    week: 'Week 2',
    icon: '📐',
    description: 'Types of functions, domain/range, increasing/decreasing, even/odd functions, and graph transformations.',
    theory: `A function $f$ is a rule that assigns each element $x$ in a set $D$ (domain) exactly one element $f(x)$ in a set $R$ (range).

**Types of Functions:**
• Polynomial: $f(x) = a_n x^n + \\cdots + a_1 x + a_0$
• Rational: $f(x) = \\dfrac{P(x)}{Q(x)}$
• Trigonometric: $\\sin(x),\\ \\cos(x),\\ \\tan(x)$, etc.
• Exponential: $f(x) = a^x$
• Logarithmic: $f(x) = \\log_a(x)$

**Properties:**
• Increasing: $f(x_1) < f(x_2)$ when $x_1 < x_2$
• Decreasing: $f(x_1) > f(x_2)$ when $x_1 < x_2$
• Even: $f(-x) = f(x)$ — symmetric about $y$-axis
• Odd: $f(-x) = -f(x)$ — symmetric about origin

**Graph Transformations:**
• $y = f(x) + c$ → shift up by $c$
• $y = f(x - c)$ → shift right by $c$
• $y = c \\cdot f(x)$ → vertical stretch by $c$
• $y = f(cx)$ → horizontal compression by $c$
• $y = -f(x)$ → reflect over $x$-axis
• $y = f(-x)$ → reflect over $y$-axis`,
    examples: [
      {
        problem: 'Is $f(x) = x^3 + x$ even, odd, or neither?',
        solution: '$f(-x) = (-x)^3 + (-x) = -x^3 - x = -(x^3 + x) = -f(x)$. Since $f(-x) = -f(x)$, the function is **odd**.',
      },
      {
        problem: 'Describe the graph of $y = (x-2)^2 + 3$.',
        solution: 'Start with $y = x^2$. Shift 2 units **right** and 3 units **up**. The vertex is at $(2,\\ 3)$.',
      },
      {
        problem: 'Find the domain of $f(x) = \\sqrt{4 - x^2}$.',
        solution: 'We need $4 - x^2 \\geq 0$, so $x^2 \\leq 4$, meaning $-2 \\leq x \\leq 2$. Domain: $[-2,\\ 2]$.',
      },
    ],
    // Quiz items use $...$ LaTeX — rendered by MathRenderer (KaTeX) in QuizScreen
    quiz: [
      {
        question: 'The function $f(x) = x^4 + x^2$ is:',
        options: ['Even', 'Odd', 'Neither'],
        correct: 0,
        explanation: '$f(-x) = (-x)^4 + (-x)^2 = x^4 + x^2 = f(x)$, so it is **even**.',
      },
      {
        question: 'The transformation $y = f(x) - 5$ shifts the graph:',
        options: ['$5$ units left', '$5$ units down', '$5$ units right', '$5$ units up'],
        correct: 1,
        explanation: 'Subtracting from the function output shifts the graph **down** by $5$ units.',
      },
      {
        question: 'The domain of $f(x) = \\dfrac{1}{x-3}$ is:',
        options: ['All real numbers', '$x \\neq 3$', '$x > 3$', '$x \\geq 3$'],
        correct: 1,
        explanation: 'The denominator cannot equal zero, so $x - 3 \\neq 0$, meaning $x \\neq 3$.',
      },
    ],
    // Lecture slides from BinderMATH — four visuals covering the key ideas
    slideImages: [
      {
        // Domain→range "machine" diagram and formal definition box
        source: require('../../assets/BinderMATH_Page_002.jpg'),
        caption: 'Definition: a function as a domain → range machine',
        cropLeft: 65, cropTop: 0, cropBottom: 0,
      },
      {
        // Annotated wave curve + cubic with "uphill/downhill" cartoon analogy
        source: require('../../assets/BinderMATH_Page_011.jpg'),
        caption: 'Increasing vs. decreasing: the "uphill/downhill" intuition',
        cropLeft: 65, cropTop: 0, cropBottom: 0,
      },
      {
        // y=x² (y-axis symmetry) and y=x³ (origin symmetry) side by side
        source: require('../../assets/BinderMATH_Page_012.jpg'),
        caption: 'Even (y-axis symmetry) and odd (origin symmetry) functions',
        cropLeft: 65, cropTop: 0, cropBottom: 0,
      },
      {
        // x, x², x³, x⁴, x⁵ plotted together with domain/range/parity labels
        source: require('../../assets/BinderMATH_Page_014.jpg'),
        caption: 'Power functions y=x through y=x⁵: shape, parity, and monotonicity at a glance',
        cropLeft: 65, cropTop: 0, cropBottom: 0,
      },
    ],
  },
  {
    id: 'limits',
    title: 'Limits & Continuity',
    week: 'Week 3',
    icon: '→',
    description: 'Limit definition, limit rules, Sandwich Theorem, one-sided limits, and continuity.',
    theory: `**Definition:** $\\lim_{x \\to a} f(x) = L$ means $f(x)$ gets arbitrarily close to $L$ as $x$ approaches $a$.

**Limit Laws:**
• $\\lim[f(x) + g(x)] = \\lim f(x) + \\lim g(x)$
• $\\lim[f(x) \\cdot g(x)] = \\lim f(x) \\cdot \\lim g(x)$
• $\\lim\\left[\\dfrac{f(x)}{g(x)}\\right] = \\dfrac{\\lim f(x)}{\\lim g(x)}$ (if $\\lim g(x) \\neq 0$)
• $\\lim[f(x)]^n = [\\lim f(x)]^n$
• $\\lim c = c$ (constant),  $\\lim x = a$

**Sandwich (Squeeze) Theorem:**
If $g(x) \\leq f(x) \\leq h(x)$ near $a$, and $\\lim g(x) = \\lim h(x) = L$, then $\\lim f(x) = L$.

**Important Limits:**
• $\\displaystyle\\lim_{x \\to 0} \\dfrac{\\sin x}{x} = 1$
• $\\displaystyle\\lim_{x \\to 0} \\dfrac{1 - \\cos x}{x} = 0$
• $\\displaystyle\\lim_{n \\to \\infty} \\left(1 + \\dfrac{1}{n}\\right)^n = e$

**One-Sided Limits:**
• $\\lim_{x \\to a^-} f(x)$ = left-hand limit
• $\\lim_{x \\to a^+} f(x)$ = right-hand limit
• The two-sided limit exists iff both one-sided limits exist and are equal.

**Continuity:** $f$ is continuous at $a$ if:
1. $f(a)$ is defined
2. $\\lim_{x \\to a} f(x)$ exists
3. $\\lim_{x \\to a} f(x) = f(a)$`,
    examples: [
      {
        problem: 'Find $\\displaystyle\\lim_{x \\to 2} \\dfrac{x^2 - 4}{x - 2}$.',
        solution: 'Factor: $\\dfrac{x^2-4}{x-2} = \\dfrac{(x-2)(x+2)}{x-2} = x+2$. So $\\lim_{x \\to 2}(x+2) = 4$.',
      },
      {
        problem: 'Find $\\displaystyle\\lim_{x \\to 0} \\dfrac{\\sin(3x)}{x}$.',
        solution: 'Rewrite: $\\dfrac{\\sin(3x)}{x} = 3 \\cdot \\dfrac{\\sin(3x)}{3x}$. As $x \\to 0$, $3x \\to 0$, so $\\dfrac{\\sin(3x)}{3x} \\to 1$. Answer: $3$.',
      },
      {
        problem: 'Is $f(x) = |x|/x$ continuous at $x = 0$?',
        solution: '$\\lim_{x \\to 0^+} = 1$, $\\lim_{x \\to 0^-} = -1$. One-sided limits differ, so the limit DNE, and $f$ is **not continuous** at $0$.',
      },
    ],
    quiz: [
      {
        question: '$\\displaystyle\\lim_{x \\to 3} \\dfrac{x^2-9}{x-3} = ?$',
        options: ['$0$', '$3$', '$6$', 'DNE'],
        correct: 2,
        explanation: '$\\dfrac{x^2-9}{x-3} = \\dfrac{(x+3)(x-3)}{x-3} = x+3$. At $x=3$: $3+3=6$.',
      },
      {
        question: '$\\displaystyle\\lim_{x \\to 0} \\dfrac{\\sin x}{x} = ?$',
        options: ['$0$', '$1$', '$\\infty$', 'DNE'],
        correct: 1,
        explanation: 'This is a fundamental trigonometric limit equal to $1$.',
      },
      {
        question: 'If $\\lim_{x \\to a^-} f(x) = 3$ and $\\lim_{x \\to a^+} f(x) = 5$, then $\\lim_{x \\to a} f(x)$ is:',
        options: ['$3$', '$5$', '$4$', 'Does not exist'],
        correct: 3,
        explanation: 'The two-sided limit exists only if the left-hand and right-hand limits are **equal**.',
      },
    ],
    // Lecture slides: two visuals showing the numerical and algebraic approaches
    slideImages: [
      {
        // Table of values approaching x=1 for f(x)=(x²−1)/(x−1), with graph
        source: require('../../assets/BinderMATH_Page_030.jpg'),
        caption: 'Numerical approach: f(x)=(x²−1)/(x−1) converging to 2 as x→1',
        cropLeft: 65, cropTop: 0, cropBottom: 0,
      },
      {
        // Theorem 2 (polynomial limits) and Theorem 3 (rational limits) with example
        source: require('../../assets/BinderMATH_Page_040.jpg'),
        caption: 'Direct substitution theorems for polynomial and rational limits',
        cropLeft: 65, cropTop: 0, cropBottom: 0,
      },
    ],
  },
  {
    id: 'limits_infinity',
    title: 'Limits at Infinity',
    week: 'Week 3.2',
    icon: '∞',
    description: 'Limits involving infinity, horizontal and vertical asymptotes.',
    theory: `**Limits at Infinity:**
$\\lim_{x \\to \\infty} f(x) = L$ means $f(x)$ approaches $L$ as $x$ grows without bound.

**Key Rules:**
• $\\lim_{x \\to \\infty} \\dfrac{1}{x^n} = 0$ for $n > 0$
• For rational functions $\\dfrac{P(x)}{Q(x)}$, compare highest powers:
  - $\\deg(P) < \\deg(Q)$: limit $= 0$
  - $\\deg(P) = \\deg(Q)$: limit $=$ leading coefficient ratio
  - $\\deg(P) > \\deg(Q)$: limit $= \\pm\\infty$

**Horizontal Asymptote:** $y = L$ if $\\lim_{x \\to \\pm\\infty} f(x) = L$

**Vertical Asymptote:** $x = a$ if $\\lim_{x \\to a} f(x) = \\pm\\infty$`,
    examples: [
      {
        problem: 'Find $\\displaystyle\\lim_{x \\to \\infty} \\dfrac{3x^2 + 1}{2x^2 - 5}$.',
        solution: 'Divide top and bottom by $x^2$: $\\dfrac{3 + 1/x^2}{2 - 5/x^2} \\to \\dfrac{3}{2}$ as $x \\to \\infty$.',
      },
      {
        problem: 'Find the horizontal asymptotes of $f(x) = \\dfrac{2x}{x^2 + 1}$.',
        solution: '$\\deg(\\text{numerator})=1 < \\deg(\\text{denominator})=2$, so $\\lim_{x \\to \\pm\\infty} f(x) = 0$. Horizontal asymptote: $y = 0$.',
      },
    ],
    quiz: [
      {
        question: '$\\displaystyle\\lim_{x \\to \\infty} \\dfrac{5x^3+2}{3x^3-1} = ?$',
        options: ['$0$', '$\\dfrac{5}{3}$', '$\\infty$', '$\\dfrac{3}{5}$'],
        correct: 1,
        explanation: 'Same degree in numerator and denominator → ratio of leading coefficients $= \\dfrac{5}{3}$.',
      },
      {
        question: '$\\displaystyle\\lim_{x \\to \\infty} \\dfrac{x+1}{x^2} = ?$',
        options: ['$0$', '$1$', '$\\infty$', '$-1$'],
        correct: 0,
        explanation: '$\\deg(\\text{numerator}) < \\deg(\\text{denominator})$, so the limit is $0$.',
      },
    ],
    // Lecture slides: formal ε-M definition and the classic 1/x asymptote diagram
    slideImages: [
      {
        // Formal ε-M definition of lim_{x→∞} f(x)=L and lim_{x→−∞} f(x)=L
        source: require('../../assets/BinderMATH_Page_050.jpg'),
        caption: 'Formal ε-M definition of finite limits as x → ±∞',
        cropLeft: 65, cropTop: 0, cropBottom: 0,
      },
      {
        // y=1/x graph with both asymptotes labelled; one-sided limits at 0
        source: require('../../assets/BinderMATH_Page_060.jpg'),
        caption: 'y = 1/x: horizontal asymptote y = 0, vertical asymptote x = 0',
        cropLeft: 65, cropTop: 0, cropBottom: 0,
      },
    ],
  },
  {
    id: 'ivt_derivatives_intro',
    title: 'IVT & Intro to Derivatives',
    week: 'Week 4',
    icon: '📏',
    description: 'Intermediate Value Theorem and the definition of the derivative.',
    theory: `**Intermediate Value Theorem (IVT):**
If $f$ is continuous on $[a, b]$ and $N$ is between $f(a)$ and $f(b)$, then there exists $c \\in (a, b)$ such that $f(c) = N$.

**Application:** If $f(a) > 0$ and $f(b) < 0$ (or vice versa), then $f$ has a root between $a$ and $b$.

**The Derivative — Definition:**
$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$

This represents:
• The slope of the tangent line at $x$
• The instantaneous rate of change of $f$ at $x$

**Geometric Meaning:**
$f'(a)$ is the slope of the tangent line to $y = f(x)$ at $x = a$.
Tangent line equation: $y - f(a) = f'(a)(x - a)$`,
    examples: [
      {
        problem: 'Show $x^3 + x - 1 = 0$ has a root in $(0, 1)$.',
        solution: '$f(0) = -1 < 0$, $f(1) = 1 > 0$. Since $f$ is continuous and changes sign, by IVT there exists $c \\in (0,1)$ with $f(c) = 0$.',
      },
      {
        problem: "Find $f'(x)$ for $f(x) = x^2$ using the definition.",
        solution: "$f'(x) = \\lim_{h \\to 0} \\dfrac{(x+h)^2 - x^2}{h} = \\lim_{h \\to 0} \\dfrac{2xh + h^2}{h} = \\lim_{h \\to 0}(2x + h) = 2x$.",
      },
    ],
    quiz: [
      {
        question: 'The Intermediate Value Theorem requires $f$ to be:',
        options: ['Differentiable', 'Continuous', 'Increasing', 'Bounded'],
        correct: 1,
        explanation: 'The IVT requires $f$ to be **continuous** on the closed interval $[a, b]$.',
      },
      {
        question: 'The derivative of $f(x) = x^2$ at $x = 3$ is:',
        options: ['$3$', '$6$', '$9$', '$12$'],
        correct: 1,
        explanation: "$f'(x) = 2x$, so $f'(3) = 2 \\cdot 3 = 6$.",
      },
    ],
    // Lecture slide: the formal limit definition of the derivative at a point
    slideImages: [
      {
        // DEFINITION box: f′(x₀) = lim_{h→0} [f(x₀+h)−f(x₀)]/h
        // Large bottom whitespace removed so the box fills the thumbnail
        source: require('../../assets/BinderMATH_Page_110.jpg'),
        caption: 'The derivative at a point: limit of the difference quotient',
        cropLeft: 65, cropTop: 0, cropBottom: 270,
      },
    ],
  },
  {
    id: 'differentiation',
    title: 'Differentiation Rules',
    week: 'Week 5',
    icon: '∂',
    description: 'Power rule, product rule, quotient rule, and chain rule.',
    theory: `**Basic Rules:**
• Constant: $\\dfrac{d}{dx}[c] = 0$
• Power Rule: $\\dfrac{d}{dx}[x^n] = nx^{n-1}$
• Constant Multiple: $\\dfrac{d}{dx}[c \\cdot f(x)] = c \\cdot f'(x)$
• Sum/Difference: $\\dfrac{d}{dx}[f \\pm g] = f' \\pm g'$

**Product Rule:**
$$\\frac{d}{dx}[f(x) \\cdot g(x)] = f'(x) \\cdot g(x) + f(x) \\cdot g'(x)$$

**Quotient Rule:**
$$\\frac{d}{dx}\\left[\\frac{f(x)}{g(x)}\\right] = \\frac{f'(x) \\cdot g(x) - f(x) \\cdot g'(x)}{[g(x)]^2}$$

**Common Derivatives:**
• $\\dfrac{d}{dx}[\\sin x] = \\cos x$
• $\\dfrac{d}{dx}[\\cos x] = -\\sin x$
• $\\dfrac{d}{dx}[\\tan x] = \\sec^2 x$
• $\\dfrac{d}{dx}[e^x] = e^x$
• $\\dfrac{d}{dx}[\\ln x] = \\dfrac{1}{x}$
• $\\dfrac{d}{dx}[a^x] = a^x \\ln a$

**Chain Rule:**
$$\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)$$
"Derivative of outer × derivative of inner"

**Implicit Differentiation:**
Differentiate both sides with respect to $x$, treating $y$ as a function of $x$ (use chain rule for $y$ terms), then solve for $\\dfrac{dy}{dx}$.`,
    examples: [
      {
        problem: 'Find $\\dfrac{d}{dx}\\left[(x^3 + 1)(2x - 5)\\right]$.',
        solution: 'Product rule: $3x^2(2x-5) + (x^3+1)(2) = 6x^3 - 15x^2 + 2x^3 + 2 = 8x^3 - 15x^2 + 2$.',
      },
      {
        problem: 'Find $\\dfrac{d}{dx}[\\sin(x^2)]$.',
        solution: 'Chain rule: $\\cos(x^2) \\cdot 2x = 2x\\cos(x^2)$.',
      },
      {
        problem: 'Find $\\dfrac{dy}{dx}$ if $x^2 + y^2 = 25$.',
        solution: 'Differentiate: $2x + 2y \\cdot \\dfrac{dy}{dx} = 0$. Solve: $\\dfrac{dy}{dx} = -\\dfrac{x}{y}$.',
      },
    ],
    quiz: [
      {
        question: '$\\dfrac{d}{dx}[x^5] = ?$',
        options: ['$5x^5$', '$5x^4$', '$x^4$', '$4x^5$'],
        correct: 1,
        explanation: 'Power rule: bring down the exponent and subtract $1$. $\\dfrac{d}{dx}[x^5] = 5x^4$.',
      },
      {
        question: '$\\dfrac{d}{dx}[\\sin(3x)] = ?$',
        options: ['$\\cos(3x)$', '$3\\cos(3x)$', '$-3\\cos(3x)$', '$\\cos(x)$'],
        correct: 1,
        explanation: 'Chain rule: $\\cos(3x) \\cdot 3 = 3\\cos(3x)$.',
      },
      {
        question: 'Product rule: $\\dfrac{d}{dx}[x \\cdot e^x] = ?$',
        options: ['$xe^x$', '$e^x$', '$e^x + xe^x$', '$xe^x + e^x$'],
        correct: 2,
        explanation: '$1 \\cdot e^x + x \\cdot e^x = e^x + xe^x = e^x(1+x)$.',
      },
    ],
    // Lecture slides: three core rules shown as professor-authored slides
    slideImages: [
      {
        // Power Rule (General Version) definition box: d/dx[xⁿ] = nxⁿ⁻¹
        // Cropped to remove the large blank lower half of the slide
        source: require('../../assets/BinderMATH_Page_132.jpg'),
        caption: 'Power Rule (General Version): d/dx[xⁿ] = nxⁿ⁻¹',
        cropLeft: 65, cropTop: 0, cropBottom: 210,
      },
      {
        // Sum/Difference Rule box + full polynomial worked example (EXAMPLE 3)
        source: require('../../assets/BinderMATH_Page_136.jpg'),
        caption: 'Sum and Difference Rules with a polynomial worked example',
        cropLeft: 65, cropTop: 0, cropBottom: 0,
      },
      {
        // "Outside-Inside" Chain Rule box + sin(x²+x) worked example
        source: require('../../assets/BinderMATH_Page_155.jpg'),
        caption: 'Chain Rule: differentiate outside, keep inside, multiply by inside derivative',
        cropLeft: 65, cropTop: 0, cropBottom: 0,
      },
    ],
  },
  {
    id: 'linearization',
    title: 'Linearization',
    week: 'Week 6',
    icon: '📐',
    description: 'Linear approximation using derivatives.',
    theory: `**Linearization:**
The linear approximation of $f$ near $x = a$ is:
$$L(x) = f(a) + f'(a)(x - a)$$

This is the equation of the tangent line at $a$, used to approximate $f(x)$ for $x$ near $a$.

**Differentials:**
If $y = f(x)$, then:
$$dy = f'(x)\\,dx$$

This approximates the change in $y$ for a small change $dx$ in $x$.`,
    examples: [
      {
        problem: 'Linearize $f(x) = \\sqrt{x}$ at $a = 4$.',
        solution: "$f(4) = 2$, $f'(x) = \\dfrac{1}{2\\sqrt{x}}$, $f'(4) = \\dfrac{1}{4}$. So $L(x) = 2 + \\dfrac{1}{4}(x - 4)$. Estimate: $\\sqrt{4.1} \\approx 2.025$.",
      },
    ],
    quiz: [
      {
        question: 'The linear approximation of $f$ near $a$ is:',
        options: ["$f(a) + f'(a)(x-a)$", "$f(a) + f''(a)(x-a)$", "$f'(a)(x-a)$", '$f(a) \\cdot x$'],
        correct: 0,
        explanation: "$L(x) = f(a) + f'(a)(x - a)$ is the linearization (tangent line) formula.",
      },
    ],
  },
  {
    id: 'applications_derivatives',
    title: 'Applications of Derivatives',
    week: 'Week 9-10',
    icon: '🔍',
    description: 'Extreme values, first/second derivative tests, optimization, curve sketching.',
    theory: `**Critical Points:**
$x = c$ is a critical point of $f$ if $f'(c) = 0$ or $f'(c)$ DNE.

**First Derivative Test:**
At a critical point $c$:
• If $f'$ changes from $+$ to $-$ → **Local Maximum**
• If $f'$ changes from $-$ to $+$ → **Local Minimum**
• If no sign change → **Neither**

**Second Derivative Test:**
At a critical point $c$ where $f'(c) = 0$:
• $f''(c) > 0$ → Local Minimum (concave up)
• $f''(c) < 0$ → Local Maximum (concave down)
• $f''(c) = 0$ → Inconclusive

**Absolute Extrema on $[a, b]$:**
1. Find critical points in $(a, b)$
2. Evaluate $f$ at critical points **and** endpoints
3. Largest = absolute max, smallest = absolute min

**Concavity & Inflection Points:**
• $f''(x) > 0$ → Concave up
• $f''(x) < 0$ → Concave down
• Inflection point: where concavity changes ($f'' = 0$ and changes sign)

**Optimization Strategy:**
1. Define variables and draw a picture
2. Write objective function (what to maximize/minimize)
3. Write constraint equation
4. Express objective as a function of one variable
5. Find critical points, test for max/min
6. Verify answer makes sense`,
    examples: [
      {
        problem: 'Find extrema of $f(x) = x^3 - 3x + 2$.',
        solution: "$f'(x) = 3x^2 - 3 = 0 \\Rightarrow x = \\pm 1$.\n$f''(x) = 6x$.\n$f''(1) = 6 > 0$ → Local min at $(1,\\ 0)$.\n$f''(-1) = -6 < 0$ → Local max at $(-1,\\ 4)$.",
      },
      {
        problem: 'A farmer has 100 m of fence. Find dimensions of the largest rectangular area.',
        solution: 'Perimeter: $2x + 2y = 100 \\Rightarrow y = 50 - x$.\nArea: $A = xy = x(50-x) = 50x - x^2$.\n$A\'(x) = 50 - 2x = 0 \\Rightarrow x = 25,\\ y = 25$.\n$A\'\'(x) = -2 < 0$ → Maximum.\nMax area $= 625\\ \\text{m}^2$.',
      },
    ],
    quiz: [
      {
        question: "If $f'(c) = 0$ and $f''(c) > 0$, then $x = c$ is a:",
        options: ['Local max', 'Local min', 'Inflection point', 'Cannot determine'],
        correct: 1,
        explanation: "$f''(c) > 0$ means concave up at $c$, so $c$ is a **local minimum**.",
      },
      {
        question: 'An inflection point occurs when:',
        options: ["$f' = 0$", "$f'' = 0$ and changes sign", '$f = 0$', "$f'$ changes sign"],
        correct: 1,
        explanation: "Inflection points are where concavity changes — $f''$ changes sign.",
      },
      {
        question: 'To find absolute extrema on $[a, b]$, you check:',
        options: ['Only critical points', 'Only endpoints', 'Critical points and endpoints', "Where $f'' = 0$"],
        correct: 2,
        explanation: 'Absolute extrema can occur at critical points in $(a, b)$ **or** at the endpoints $a$ and $b$.',
      },
    ],
    // Lecture slide: annotated diagram of all First Derivative Test cases on one curve
    slideImages: [
      {
        // Full curve f(x)=x³−x²−2x+3.5 with c₁–c₅ labelled, showing where
        // f′=0, f′>0, f′<0, and which cases give local max/min or neither
        source: require('../../assets/BinderMATH_Page_200.jpg'),
        caption: 'First Derivative Test: reading local extrema from sign changes of f′',
        cropLeft: 0, cropTop: 0, cropBottom: 0,
      },
    ],
  },
  {
    id: 'antiderivatives',
    title: 'Antiderivatives & Integrals',
    week: 'Week 11',
    icon: '∫',
    description: 'Antiderivatives, indefinite integrals, basic integration rules.',
    theory: `**Antiderivative:**
$F$ is an antiderivative of $f$ if $F'(x) = f(x)$.

**Indefinite Integral:**
$$\\int f(x)\\,dx = F(x) + C, \\quad \\text{where } F'(x) = f(x)$$

**Basic Integration Rules:**
• $\\int x^n\\,dx = \\dfrac{x^{n+1}}{n+1} + C$ $\\;(n \\neq -1)$
• $\\int \\dfrac{1}{x}\\,dx = \\ln|x| + C$
• $\\int e^x\\,dx = e^x + C$
• $\\int a^x\\,dx = \\dfrac{a^x}{\\ln a} + C$
• $\\int \\sin x\\,dx = -\\cos x + C$
• $\\int \\cos x\\,dx = \\sin x + C$
• $\\int \\sec^2 x\\,dx = \\tan x + C$
• $\\int \\dfrac{1}{1+x^2}\\,dx = \\arctan x + C$
• $\\int \\dfrac{1}{\\sqrt{1-x^2}}\\,dx = \\arcsin x + C$

**Fundamental Theorem of Calculus:**
$$\\int_a^b f(x)\\,dx = F(b) - F(a)$$

**Substitution Method:**
$$\\int f(g(x))\\cdot g'(x)\\,dx = \\int f(u)\\,du, \\quad u = g(x)$$`,
    examples: [
      {
        problem: 'Evaluate $\\int (3x^2 + 2x - 1)\\,dx$.',
        solution: '$= x^3 + x^2 - x + C$',
      },
      {
        problem: 'Evaluate $\\int \\sin(2x)\\,dx$.',
        solution: 'Let $u = 2x$, $du = 2\\,dx$. $\\displaystyle\\int \\sin u \\cdot \\dfrac{du}{2} = -\\dfrac{1}{2}\\cos(2x) + C$.',
      },
    ],
    quiz: [
      {
        question: '$\\int x^3\\,dx = ?$',
        options: ['$3x^2$', '$\\dfrac{x^4}{4} + C$', '$x^4 + C$', '$4x^4 + C$'],
        correct: 1,
        explanation: 'Power rule for integration: add $1$ to the exponent, divide by the new exponent. $\\int x^3\\,dx = \\dfrac{x^4}{4} + C$.',
      },
      {
        question: '$\\int \\cos x\\,dx = ?$',
        options: ['$-\\sin x + C$', '$\\sin x + C$', '$\\cos x + C$', '$-\\cos x + C$'],
        correct: 1,
        explanation: 'The antiderivative of $\\cos x$ is $\\sin x + C$.',
      },
    ],
    // Lecture slides: the derivative↔integral connection and six integral properties
    slideImages: [
      {
        // Single diagram: tangent line (slope = dy/dx) and shaded area (= ∫ydx)
        // side by side on the same curve — the fundamental calculus duality
        source: require('../../assets/BinderMATH_Page_131.jpg'),
        caption: 'The calculus duality: slope (derivative) ↔ area (integral)',
        cropLeft: 65, cropTop: 0, cropBottom: 0,
      },
      {
        // Six mini-diagrams illustrating: zero-width, constant-multiple, sum,
        // additivity, max-min inequality, and domination rules for definite integrals
        source: require('../../assets/BinderMATH_Page_250.jpg'),
        caption: 'Six geometric properties of definite integrals illustrated',
        cropLeft: 0, cropTop: 0, cropBottom: 0,
      },
    ],
  },
  {
    id: 'lhopital',
    title: "L'Hôpital's Rule",
    week: 'Week 13',
    icon: '🏥',
    description: "Using L'Hôpital's rule for indeterminate forms, logarithmic differentiation.",
    theory: `**L'Hôpital's Rule:**
If $\\lim_{x \\to a} \\dfrac{f(x)}{g(x)}$ gives $\\dfrac{0}{0}$ or $\\dfrac{\\infty}{\\infty}$, then:
$$\\lim_{x \\to a} \\frac{f(x)}{g(x)} = \\lim_{x \\to a} \\frac{f'(x)}{g'(x)}$$
(provided the right side exists)

**Indeterminate Forms:**
• $0/0$ and $\\infty/\\infty$ → apply directly
• $0 \\cdot \\infty$ → rewrite as $\\dfrac{0}{1/\\infty}$ or $\\dfrac{\\infty}{1/0}$
• $\\infty - \\infty$ → combine into a single fraction
• $0^0,\\ \\infty^0,\\ 1^\\infty$ → take logarithm first

**Logarithmic Differentiation:**
For $y = f(x)^{g(x)}$:
1. Take $\\ln$ of both sides: $\\ln y = g(x) \\cdot \\ln(f(x))$
2. Differentiate: $\\dfrac{1}{y} \\cdot y' = \\left[\\text{derivative of RHS}\\right]$
3. Solve for $y'$`,
    examples: [
      {
        problem: "Find $\\displaystyle\\lim_{x \\to 0} \\dfrac{\\sin x}{x}$ using L'Hôpital's rule.",
        solution: "$\\dfrac{0}{0}$ form. Apply: $\\lim_{x \\to 0} \\dfrac{\\cos x}{1} = \\cos 0 = 1$.",
      },
      {
        problem: 'Find $\\displaystyle\\lim_{x \\to \\infty} \\dfrac{x}{e^x}$.',
        solution: "$\\dfrac{\\infty}{\\infty}$ form. L'Hôpital: $\\lim_{x \\to \\infty} \\dfrac{1}{e^x} = 0$.",
      },
    ],
    quiz: [
      {
        question: "L'Hôpital's rule applies to indeterminate forms:",
        options: ['Any limit', '$\\dfrac{0}{0}$ only', '$\\dfrac{\\infty}{\\infty}$ only', '$\\dfrac{0}{0}$ or $\\dfrac{\\infty}{\\infty}$'],
        correct: 3,
        explanation: "L'Hôpital's rule applies to the indeterminate forms $\\dfrac{0}{0}$ and $\\dfrac{\\infty}{\\infty}$.",
      },
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
$f^{-1}$ exists if $f$ is one-to-one (passes horizontal line test).
$$(f^{-1})'(b) = \\frac{1}{f'(f^{-1}(b))}$$

**Exponential & Logarithmic:**
• $\\dfrac{d}{dx}[e^x] = e^x$, $\\quad \\dfrac{d}{dx}[a^x] = a^x \\ln a$
• $\\dfrac{d}{dx}[\\ln x] = \\dfrac{1}{x}$, $\\quad \\dfrac{d}{dx}[\\log_a x] = \\dfrac{1}{x \\ln a}$
• $\\int e^x\\,dx = e^x + C$
• $\\int \\dfrac{1}{x}\\,dx = \\ln|x| + C$

**Hyperbolic Functions:**
• $\\sinh x = \\dfrac{e^x - e^{-x}}{2}$
• $\\cosh x = \\dfrac{e^x + e^{-x}}{2}$
• $\\dfrac{d}{dx}[\\sinh x] = \\cosh x$
• $\\dfrac{d}{dx}[\\cosh x] = \\sinh x$`,
    examples: [
      {
        problem: 'Find $\\dfrac{d}{dx}[x^x]$.',
        solution: 'Let $y = x^x$. Then $\\ln y = x \\ln x$. Differentiate: $\\dfrac{1}{y} y\' = \\ln x + 1$. So $y\' = x^x(\\ln x + 1)$.',
      },
    ],
    quiz: [
      {
        question: '$\\dfrac{d}{dx}[\\ln(3x)] = ?$',
        options: ['$\\dfrac{1}{3x}$', '$\\dfrac{3}{x}$', '$\\dfrac{1}{x}$', '$\\dfrac{3}{3x}$'],
        correct: 2,
        explanation: 'By chain rule: $\\dfrac{1}{3x} \\cdot 3 = \\dfrac{1}{x}$. Or: $\\ln(3x) = \\ln 3 + \\ln x$, so $\\dfrac{d}{dx} = \\dfrac{1}{x}$.',
      },
    ],
  },
  {
    id: 'inverse_trig',
    title: 'Inverse Trigonometric Functions',
    week: 'Calc II - Week 2',
    icon: 'θ',
    description: 'Inverse trig functions and their derivatives.',
    theory: `**Inverse Trig Derivatives:**
• $\\dfrac{d}{dx}[\\arcsin x] = \\dfrac{1}{\\sqrt{1-x^2}}$
• $\\dfrac{d}{dx}[\\arccos x] = -\\dfrac{1}{\\sqrt{1-x^2}}$
• $\\dfrac{d}{dx}[\\arctan x] = \\dfrac{1}{1+x^2}$
• $\\dfrac{d}{dx}[\\text{arcsec}\\, x] = \\dfrac{1}{|x|\\sqrt{x^2-1}}$

**Corresponding Integrals:**
• $\\displaystyle\\int \\dfrac{1}{\\sqrt{1-x^2}}\\,dx = \\arcsin x + C$
• $\\displaystyle\\int \\dfrac{1}{1+x^2}\\,dx = \\arctan x + C$
• $\\displaystyle\\int \\dfrac{1}{|x|\\sqrt{x^2-1}}\\,dx = \\text{arcsec}\\, x + C$`,
    examples: [
      {
        problem: 'Evaluate $\\displaystyle\\int \\dfrac{1}{4+x^2}\\,dx$.',
        solution: 'Rewrite: $\\displaystyle\\int \\dfrac{1}{4\\left(1+(x/2)^2\\right)}\\,dx = \\dfrac{1}{2}\\arctan\\!\\left(\\dfrac{x}{2}\\right) + C$.',
      },
    ],
    quiz: [
      {
        question: '$\\dfrac{d}{dx}[\\arctan x] = ?$',
        options: ['$\\dfrac{1}{\\sqrt{1-x^2}}$', '$\\dfrac{1}{1+x^2}$', '$-\\dfrac{1}{1+x^2}$', '$\\dfrac{1}{x}$'],
        correct: 1,
        explanation: 'The derivative of $\\arctan x$ is $\\dfrac{1}{1+x^2}$.',
      },
    ],
  },
  {
    id: 'integration_techniques',
    title: 'Techniques of Integration',
    week: 'Calc II - Week 2-3',
    icon: '🔧',
    description: 'Trigonometric integrals, trigonometric substitution, partial fractions, integration by parts.',
    theory: `**Integration by Parts:**
$$\\int u\\,dv = uv - \\int v\\,du$$
Choose $u$ by **LIATE**: Logarithm, Inverse trig, Algebraic, Trig, Exponential.

**Trigonometric Integrals** $\\int \\sin^n x \\cos^m x\\,dx$:
• $m$ odd: save one $\\cos$, convert rest via $\\cos^2 = 1-\\sin^2$
• $n$ odd: save one $\\sin$, convert rest via $\\sin^2 = 1-\\cos^2$
• Both even: use half-angle formulas

**Trigonometric Substitution:**
• $\\sqrt{a^2 - x^2}$: let $x = a\\sin\\theta$
• $\\sqrt{a^2 + x^2}$: let $x = a\\tan\\theta$
• $\\sqrt{x^2 - a^2}$: let $x = a\\sec\\theta$

**Partial Fractions** — decompose $\\dfrac{P(x)}{Q(x)}$:
• Linear factor $(ax+b)$: $\\dfrac{A}{ax+b}$
• Repeated: $\\dfrac{A}{ax+b} + \\dfrac{B}{(ax+b)^2}$
• Irreducible quadratic: $\\dfrac{Ax+B}{ax^2+bx+c}$`,
    examples: [
      {
        problem: 'Evaluate $\\displaystyle\\int x e^x\\,dx$.',
        solution: 'By parts: $u=x$, $dv=e^x\\,dx$. Then $du=dx$, $v=e^x$.\n$= xe^x - \\displaystyle\\int e^x\\,dx = xe^x - e^x + C = e^x(x-1) + C$.',
      },
      {
        problem: 'Evaluate $\\displaystyle\\int \\dfrac{1}{x^2-1}\\,dx$.',
        solution: 'Partial fractions: $\\dfrac{1}{(x-1)(x+1)} = \\dfrac{1/2}{x-1} - \\dfrac{1/2}{x+1}$.\n$= \\dfrac{1}{2}\\ln|x-1| - \\dfrac{1}{2}\\ln|x+1| + C$.',
      },
    ],
    quiz: [
      {
        question: 'For $\\int x^2 \\sin(x)\\,dx$, the best method is:',
        options: ['Substitution', 'Partial fractions', 'Integration by parts', 'Trig substitution'],
        correct: 2,
        explanation: 'Algebraic $\\times$ Trig product $\\Rightarrow$ use integration by parts (LIATE: Algebraic before Trig).',
      },
      {
        question: 'For $\\sqrt{9-x^2}$, the correct substitution is:',
        options: ['$x = 3\\tan\\theta$', '$x = 3\\sin\\theta$', '$x = 3\\sec\\theta$', '$u = 9-x^2$'],
        correct: 1,
        explanation: '$\\sqrt{a^2-x^2}$ uses $x = a\\sin\\theta$, so here $x = 3\\sin\\theta$.',
      },
    ],
  },
  {
    id: 'improper_integrals',
    title: 'Improper Integrals',
    week: 'Calc II - Week 4',
    icon: '∞',
    description: 'Improper integrals and convergence tests.',
    theory: `**Type I: Infinite Limits**
$$\\int_a^{\\infty} f(x)\\,dx = \\lim_{b \\to \\infty} \\int_a^b f(x)\\,dx$$

**Type II: Discontinuous Integrand**
If $f$ has a discontinuity at $c$ in $[a, b]$:
$$\\int_a^b f(x)\\,dx = \\lim_{t \\to c^-} \\int_a^t f(x)\\,dx + \\lim_{t \\to c^+} \\int_t^b f(x)\\,dx$$

**Convergent** if the limit exists and is finite. **Divergent** if the limit is $\\pm\\infty$ or DNE.

**Comparison Test:**
If $0 \\leq f(x) \\leq g(x)$ for $x \\geq a$:
• $\\int g$ converges $\\Rightarrow$ $\\int f$ converges
• $\\int f$ diverges $\\Rightarrow$ $\\int g$ diverges

**$p$-integral:** $\\displaystyle\\int_1^{\\infty} \\dfrac{1}{x^p}\\,dx$ converges if and only if $p > 1$.`,
    examples: [
      {
        problem: 'Evaluate $\\displaystyle\\int_1^{\\infty} \\dfrac{1}{x^2}\\,dx$.',
        solution: '$\\displaystyle\\lim_{b \\to \\infty} \\left[-\\dfrac{1}{x}\\right]_1^b = \\lim_{b \\to \\infty}\\!\\left(-\\dfrac{1}{b} + 1\\right) = 1$. Converges to $1$.',
      },
      {
        problem: 'Does $\\displaystyle\\int_1^{\\infty} \\dfrac{1}{x}\\,dx$ converge?',
        solution: '$\\displaystyle\\lim_{b \\to \\infty} [\\ln x]_1^b = \\lim_{b \\to \\infty} \\ln b = \\infty$. **Diverges.**',
      },
    ],
    quiz: [
      {
        question: 'Does $\\displaystyle\\int_1^{\\infty} \\dfrac{1}{x^3}\\,dx$ converge?',
        options: ['Converges', 'Diverges'],
        correct: 0,
        explanation: '$p = 3 > 1$, so the $p$-integral **converges**.',
      },
      {
        question: 'Does $\\displaystyle\\int_1^{\\infty} \\dfrac{1}{\\sqrt{x}}\\,dx$ converge?',
        options: ['Converges', 'Diverges'],
        correct: 1,
        explanation: '$p = \\tfrac{1}{2} < 1$, so the $p$-integral **diverges**.',
      },
    ],
  },
  {
    id: 'sequences_series',
    title: 'Sequences & Series',
    week: 'Calc II - Week 5-6',
    icon: 'Σ',
    description: 'Infinite sequences, series, convergence tests.',
    theory: `**Sequences:**
A sequence $\\{a_n\\}$ converges to $L$ if $\\lim_{n \\to \\infty} a_n = L$.

**Series:**
$\\sum a_n = a_1 + a_2 + a_3 + \\cdots$. The series converges if the sequence of partial sums converges.

**Geometric Series:** $\\sum ar^n = \\dfrac{a}{1-r}$ if $|r| < 1$; diverges if $|r| \\geq 1$.

**Convergence Tests:**
• **Divergence Test:** If $\\lim a_n \\neq 0$, then $\\sum a_n$ diverges.
• **Integral Test:** If $f$ is positive, continuous, decreasing and $f(n) = a_n$, then $\\sum a_n$ converges iff $\\int_1^{\\infty} f(x)\\,dx$ converges.
• **Comparison Test:** Compare with a known series.
• **Limit Comparison:** If $\\lim(a_n/b_n) = c > 0$, both converge or both diverge.
• **Ratio Test:** $L = \\lim\\left|\\dfrac{a_{n+1}}{a_n}\\right|$. $L < 1$ → converges. $L > 1$ → diverges. $L = 1$ → inconclusive.
• **Root Test:** $L = \\lim |a_n|^{1/n}$. Same criteria as Ratio Test.
• **Alternating Series Test:** If $a_n > 0$, decreasing, and $\\lim a_n = 0$, then $\\sum(-1)^n a_n$ converges.`,
    examples: [
      {
        problem: 'Does $\\sum_{n=0}^{\\infty} \\left(\\dfrac{1}{2}\\right)^n$ converge?',
        solution: 'Geometric series with $r = \\dfrac{1}{2} < 1$. Converges to $\\dfrac{1}{1-1/2} = 2$.',
      },
      {
        problem: 'Test $\\sum \\dfrac{n}{n^2+1}$ for convergence.',
        solution: '$a_n = \\dfrac{n}{n^2+1} \\approx \\dfrac{1}{n}$ for large $n$. Since $\\sum \\dfrac{1}{n}$ diverges and $\\lim(a_n/(1/n)) = 1$, by Limit Comparison $\\sum a_n$ **diverges**.',
      },
    ],
    quiz: [
      {
        question: 'The geometric series $\\displaystyle\\sum\\!\\left(\\dfrac{2}{3}\\right)^n$:',
        options: ['Converges', 'Diverges'],
        correct: 0,
        explanation: '$|r| = \\dfrac{2}{3} < 1$, so the series **converges**.',
      },
      {
        question: 'If $\\lim_{n \\to \\infty} a_n = 5 \\neq 0$, then $\\sum a_n$:',
        options: ['Converges', 'Diverges', 'Cannot determine'],
        correct: 1,
        explanation: 'Divergence test: if $\\lim a_n \\neq 0$, the series **diverges**.',
      },
      {
        question: 'For the Ratio Test, if $L = \\lim\\left|\\dfrac{a_{n+1}}{a_n}\\right| < 1$:',
        options: ['Diverges', 'Converges', 'Inconclusive'],
        correct: 1,
        explanation: '$L < 1$ means the series **converges absolutely**.',
      },
    ],
  },
  {
    id: 'power_series',
    title: 'Power Series',
    week: 'Calc II - Week 7',
    icon: '🔋',
    description: 'Power series, radius of convergence, Taylor and Maclaurin series.',
    theory: `**Power Series:**
$$\\sum_{n=0}^{\\infty} c_n (x-a)^n \\quad \\text{centered at } a$$

**Radius of Convergence $R$:**
Use Ratio Test: $R = \\lim\\left|\\dfrac{c_n}{c_{n+1}}\\right|$
• Converges for $|x - a| < R$
• Diverges for $|x - a| > R$
• Check endpoints separately

**Taylor Series:**
$$f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n$$

**Maclaurin Series ($a = 0$):**
• $e^x = \\displaystyle\\sum_{n=0}^{\\infty} \\dfrac{x^n}{n!} = 1 + x + \\dfrac{x^2}{2!} + \\dfrac{x^3}{3!} + \\cdots$
• $\\sin x = \\displaystyle\\sum_{n=0}^{\\infty} \\dfrac{(-1)^n x^{2n+1}}{(2n+1)!} = x - \\dfrac{x^3}{3!} + \\dfrac{x^5}{5!} - \\cdots$
• $\\cos x = \\displaystyle\\sum_{n=0}^{\\infty} \\dfrac{(-1)^n x^{2n}}{(2n)!} = 1 - \\dfrac{x^2}{2!} + \\dfrac{x^4}{4!} - \\cdots$
• $\\dfrac{1}{1-x} = \\displaystyle\\sum_{n=0}^{\\infty} x^n = 1 + x + x^2 + \\cdots$ for $|x| < 1$
• $\\ln(1+x) = \\displaystyle\\sum_{n=1}^{\\infty} \\dfrac{(-1)^{n+1} x^n}{n}$ for $|x| \\leq 1$`,
    examples: [
      {
        problem: 'Find the radius of convergence of $\\displaystyle\\sum_{n=0}^{\\infty} \\dfrac{x^n}{n!}$.',
        solution: 'Ratio test: $\\lim\\left|\\dfrac{a_{n+1}}{a_n}\\right| = \\lim\\left|\\dfrac{x}{n+1}\\right| = 0 < 1$ for all $x$. So $R = \\infty$.',
      },
    ],
    quiz: [
      {
        question: 'The Maclaurin series for $e^x$ is:',
        options: ['$\\sum x^n$', '$\\sum \\dfrac{x^n}{n!}$', '$\\sum nx^n$', '$\\sum (-1)^n x^n$'],
        correct: 1,
        explanation: '$e^x = 1 + x + \\dfrac{x^2}{2!} + \\dfrac{x^3}{3!} + \\cdots = \\displaystyle\\sum_{n=0}^{\\infty} \\dfrac{x^n}{n!}$.',
      },
      {
        question: 'The radius of convergence of $\\sum x^n$ is:',
        options: ['$0$', '$1$', '$\\infty$', 'Cannot determine'],
        correct: 1,
        explanation: 'This is a geometric series; it converges for $|x| < 1$, so $R = 1$.',
      },
    ],
  },
  {
    id: 'parametric',
    title: 'Parametric Equations',
    week: 'Calc II - Week 9',
    icon: '🌀',
    description: 'Parametric curves, polar coordinates.',
    theory: `**Parametric Equations:**
$x = f(t),\\ y = g(t)$ define a curve as $t$ varies.

**First Derivative:**
$$\\frac{dy}{dx} = \\frac{dy/dt}{dx/dt} = \\frac{g'(t)}{f'(t)}$$

**Second Derivative:**
$$\\frac{d^2y}{dx^2} = \\frac{\\dfrac{d}{dt}\\!\\left(\\dfrac{dy}{dx}\\right)}{dx/dt}$$

**Arc Length:**
$$L = \\int_a^b \\sqrt{\\left(\\frac{dx}{dt}\\right)^2 + \\left(\\frac{dy}{dt}\\right)^2}\\,dt$$

**Polar Coordinates:**
$x = r\\cos\\theta,\\quad y = r\\sin\\theta$
$r^2 = x^2 + y^2,\\quad \\tan\\theta = y/x$

**Area in Polar:**
$$A = \\frac{1}{2}\\int_\\alpha^\\beta r^2\\,d\\theta$$`,
    examples: [
      {
        problem: 'Find $\\dfrac{dy}{dx}$ for $x = t^2,\\ y = t^3$.',
        solution: '$\\dfrac{dx}{dt} = 2t$, $\\dfrac{dy}{dt} = 3t^2$. So $\\dfrac{dy}{dx} = \\dfrac{3t^2}{2t} = \\dfrac{3t}{2}$.',
      },
    ],
    quiz: [
      {
        question: 'For $x = \\cos t,\\ y = \\sin t$, find $\\dfrac{dy}{dx}$:',
        options: ['$-\\tan t$', '$-\\cot t$', '$\\tan t$', '$\\cot t$'],
        correct: 1,
        explanation: '$\\dfrac{dy}{dx} = \\dfrac{dy/dt}{dx/dt} = \\dfrac{\\cos t}{-\\sin t} = -\\cot t$.',
      },
    ],
  },
];

export const ALL_TOPICS = [...CALC_1_TOPICS, ...CALC_2_TOPICS];
