/**
 * @file MathKeyboard.js
 * @description Context-aware scientific keyboard with eight layout modes.
 *
 * Expression layouts (share 123, f(x), sin tabs; differ in 4th tab):
 *
 *  'derivative' — 4th tab (∂): variables, common differentiable function
 *    shortcuts (eˣ, ln(x), xⁿ, 1/x, √x), Greek letters, coefficients.
 *
 *  'integrate' — 4th tab (∫): substitution variables (u, v), common
 *    integrands, reciprocal trig for trig substitution.
 *
 *  'optimize' — 4th tab (xyz): polynomial power shortcuts (x², x³, x⁴, x⁵),
 *    coefficient variables, Greek letters.
 *
 *  'limit' — 4th tab (lim): infinity constants (∞, −∞), common limit
 *    building blocks (eˣ, ln(x), 1/x, √x), approach value helpers.
 *
 *  'ai-solve' — 4th tab (∑∫): full calculus notation (∫, d/dx, Σ, lim, →,
 *    dx, dy, ∞) for AI interpretation. Richest symbol set.
 *
 *  'visualizer' — 4th tab (xyz): general variables, Greek, extra functions
 *    (min, max, mod, factorial, sum).
 *
 *  'expression' — alias for visualizer (backward compatibility).
 *
 * Scalar layouts (no tab bar):
 *
 *  'numeric' — compact 4-row number pad for integration bounds and limit
 *    approach value. Includes π, e, ∞, and basic arithmetic.
 *
 *  'variable' — letter-only pad for the differentiation variable field.
 *    Shows common single-letter variable names and Greek letters.
 *
 * Each key object: { label, insert, action?, style?, wide? }
 *   - insert   : string appended to current value on press
 *   - action   : 'backspace' removes last char
 *   - style    : 'danger' (red bg) | 'var' (blue italic)
 *   - wide     : flex:2 (takes double horizontal space in its row)
 *
 * @changelog
 * - Created with 5 fixed tabs: basic, ops, trig, calc (hint-only), greek
 * - Removed hint-only calc tab (popups instead of inserting — confusing UX)
 * - Removed redundant standalone greek tab
 * - Replaced entire TABS/KEYS structure with 3 context-aware LAYOUTS
 * - Added 'layout' prop; tab bar hidden for single-tab layouts
 * - Tab resets to first tab automatically when layout prop changes
 * - Expanded to 8 layouts: 6 expression variants (derivative, integrate,
 *   optimize, limit, ai-solve, visualizer) + numeric + variable. Each
 *   expression variant shares 123/f(x)/sin tabs but has a unique 4th tab
 *   with mode-appropriate keys.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Shared key rows (used by all 6 expression layouts) ────────────────────

const BASIC_KEYS = [
  [
    { label: '7', insert: '7' },
    { label: '8', insert: '8' },
    { label: '9', insert: '9' },
    { label: '÷', insert: '/' },
    { label: '⌫', action: 'backspace', style: 'danger' },
  ],
  [
    { label: '4', insert: '4' },
    { label: '5', insert: '5' },
    { label: '6', insert: '6' },
    { label: '×', insert: '*' },
    { label: '(', insert: '(' },
  ],
  [
    { label: '1', insert: '1' },
    { label: '2', insert: '2' },
    { label: '3', insert: '3' },
    { label: '−', insert: '-' },
    { label: ')', insert: ')' },
  ],
  [
    { label: '0', insert: '0' },
    { label: '.', insert: '.' },
    { label: 'x', insert: 'x', style: 'var' },
    { label: '+', insert: '+' },
    { label: '^', insert: '^' },
  ],
];

const FUNCS_KEYS = [
  [
    { label: 'x²',    insert: '^2'       },
    { label: 'x³',    insert: '^3'       },
    { label: 'xⁿ',    insert: '^'        },
    { label: '√',     insert: 'sqrt('    },
    { label: 'ⁿ√',    insert: 'nthRoot(' },
  ],
  [
    { label: 'eˣ',    insert: 'e^'       },
    { label: 'ln',    insert: 'log('     },
    { label: 'log₁₀', insert: 'log10('   },
    { label: '|x|',   insert: 'abs('     },
    { label: '1/x',   insert: '1/'       },
  ],
  [
    { label: 'π',     insert: 'pi'       },
    { label: 'e',     insert: 'e'        },
    { label: '∞',     insert: 'Infinity' },
    { label: 'floor', insert: 'floor('   },
    { label: 'ceil',  insert: 'ceil('    },
  ],
  [
    { label: '(',     insert: '('  },
    { label: ')',     insert: ')'  },
    { label: ',',     insert: ','  },
    { label: 'space', insert: ' '  },
    { label: '⌫',     action: 'backspace', style: 'danger' },
  ],
];

const TRIG_KEYS = [
  [
    { label: 'sin',   insert: 'sin('    },
    { label: 'cos',   insert: 'cos('    },
    { label: 'tan',   insert: 'tan('    },
    { label: 'π',     insert: 'pi'      },
    { label: '⌫',     action: 'backspace', style: 'danger' },
  ],
  [
    { label: 'sin⁻¹', insert: 'asin('  },
    { label: 'cos⁻¹', insert: 'acos('  },
    { label: 'tan⁻¹', insert: 'atan('  },
    { label: 'π/2',   insert: 'pi/2'   },
    { label: '2π',    insert: '2*pi'   },
  ],
  [
    { label: 'sinh',  insert: 'sinh('   },
    { label: 'cosh',  insert: 'cosh('   },
    { label: 'tanh',  insert: 'tanh('   },
    { label: '°→rad', insert: '*pi/180' },
    { label: 'rad→°', insert: '*180/pi' },
  ],
  [
    { label: 'csc',   insert: '1/sin('  },
    { label: 'sec',   insert: '1/cos('  },
    { label: 'cot',   insert: '1/tan('  },
    { label: '(',     insert: '('       },
    { label: ')',     insert: ')'       },
  ],
];

// ─── Mode-specific 4th-tab keys ────────────────────────────────────────────

// Derivative: variables, common differentiable patterns, Greek, coefficients
const DERIVATIVE_EXTRAS = [
  [
    { label: 'x', insert: 'x', style: 'var' },
    { label: 'y', insert: 'y', style: 'var' },
    { label: 't', insert: 't', style: 'var' },
    { label: 'θ', insert: 'theta', style: 'var' },
    { label: '⌫', action: 'backspace', style: 'danger' },
  ],
  [
    { label: 'eˣ',    insert: 'e^x'     },
    { label: 'ln(x)', insert: 'log(x)'  },
    { label: 'xⁿ',    insert: 'x^'      },
    { label: '1/x',   insert: '1/x'     },
    { label: '√x',    insert: 'sqrt(x)' },
  ],
  [
    { label: 'α', insert: 'alpha', style: 'var' },
    { label: 'β', insert: 'beta',  style: 'var' },
    { label: 'φ', insert: 'phi',   style: 'var' },
    { label: 'ω', insert: 'omega', style: 'var' },
    { label: 'n', insert: 'n',     style: 'var' },
  ],
  [
    { label: 'a', insert: 'a', style: 'var' },
    { label: 'b', insert: 'b', style: 'var' },
    { label: 'c', insert: 'c', style: 'var' },
    { label: '(', insert: '(' },
    { label: ')', insert: ')' },
  ],
];

// Integrate: substitution variables (u, v), common integrands, reciprocal trig
const INTEGRATE_EXTRAS = [
  [
    { label: 'x', insert: 'x', style: 'var' },
    { label: 'u', insert: 'u', style: 'var' },
    { label: 'v', insert: 'v', style: 'var' },
    { label: 't', insert: 't', style: 'var' },
    { label: '⌫', action: 'backspace', style: 'danger' },
  ],
  [
    { label: 'eˣ',    insert: 'e^x'     },
    { label: 'ln(x)', insert: 'log(x)'  },
    { label: '1/x',   insert: '1/x'     },
    { label: '√x',    insert: 'sqrt(x)' },
    { label: 'xⁿ',    insert: 'x^'      },
  ],
  [
    { label: 'θ', insert: 'theta', style: 'var' },
    { label: 'α', insert: 'alpha', style: 'var' },
    { label: 'β', insert: 'beta',  style: 'var' },
    { label: 'a', insert: 'a',     style: 'var' },
    { label: 'b', insert: 'b',     style: 'var' },
  ],
  [
    { label: 'sec(',  insert: '1/cos(' },
    { label: 'csc(',  insert: '1/sin(' },
    { label: '|x|',   insert: 'abs('   },
    { label: '(',     insert: '('      },
    { label: ')',     insert: ')'      },
  ],
];

// Optimize: polynomial power shortcuts, coefficient variables, Greek
const OPTIMIZE_EXTRAS = [
  [
    { label: 'x', insert: 'x', style: 'var' },
    { label: 'y', insert: 'y', style: 'var' },
    { label: 't', insert: 't', style: 'var' },
    { label: 'n', insert: 'n', style: 'var' },
    { label: '⌫', action: 'backspace', style: 'danger' },
  ],
  [
    { label: 'x²', insert: 'x^2' },
    { label: 'x³', insert: 'x^3' },
    { label: 'x⁴', insert: 'x^4' },
    { label: 'x⁵', insert: 'x^5' },
    { label: 'xⁿ', insert: 'x^'  },
  ],
  [
    { label: 'a', insert: 'a', style: 'var' },
    { label: 'b', insert: 'b', style: 'var' },
    { label: 'c', insert: 'c', style: 'var' },
    { label: 'k', insert: 'k', style: 'var' },
    { label: 'r', insert: 'r', style: 'var' },
  ],
  [
    { label: 'θ', insert: 'theta', style: 'var' },
    { label: 'α', insert: 'alpha', style: 'var' },
    { label: 'β', insert: 'beta',  style: 'var' },
    { label: '(', insert: '(' },
    { label: ')', insert: ')' },
  ],
];

// Limit: infinity/approach values, common limit building blocks
const LIMIT_EXTRAS = [
  [
    { label: 'x', insert: 'x', style: 'var' },
    { label: 'y', insert: 'y', style: 'var' },
    { label: 't', insert: 't', style: 'var' },
    { label: 'n', insert: 'n', style: 'var' },
    { label: '⌫', action: 'backspace', style: 'danger' },
  ],
  [
    { label: '∞',   insert: 'Infinity'  },
    { label: '−∞',  insert: '-Infinity' },
    { label: 'π',   insert: 'pi'        },
    { label: 'e',   insert: 'e'         },
    { label: '0',   insert: '0'         },
  ],
  [
    { label: 'eˣ',    insert: 'e^x'     },
    { label: 'ln(x)', insert: 'log(x)'  },
    { label: '1/x',   insert: '1/x'     },
    { label: '√x',    insert: 'sqrt(x)' },
    { label: '|x|',   insert: 'abs('    },
  ],
  [
    { label: 'θ', insert: 'theta', style: 'var' },
    { label: 'α', insert: 'alpha', style: 'var' },
    { label: 'a', insert: 'a',     style: 'var' },
    { label: '(', insert: '(' },
    { label: ')', insert: ')' },
  ],
];

// AI Solve: full calculus notation (∫, d/dx, Σ, lim, →, dx, dy) for AI
const AI_SOLVE_EXTRAS = [
  [
    { label: 'x', insert: 'x', style: 'var' },
    { label: 'y', insert: 'y', style: 'var' },
    { label: 't', insert: 't', style: 'var' },
    { label: 'n', insert: 'n', style: 'var' },
    { label: '⌫', action: 'backspace', style: 'danger' },
  ],
  [
    { label: '∫',    insert: '∫'     },
    { label: 'd/dx', insert: 'd/dx ' },
    { label: 'Σ',    insert: 'Σ'     },
    { label: 'lim',  insert: 'lim '  },
    { label: '→',    insert: '→'     },
  ],
  [
    { label: 'θ', insert: 'theta', style: 'var' },
    { label: 'α', insert: 'alpha', style: 'var' },
    { label: 'β', insert: 'beta',  style: 'var' },
    { label: 'φ', insert: 'phi',   style: 'var' },
    { label: 'ω', insert: 'omega', style: 'var' },
  ],
  [
    { label: '∞',  insert: '∞'  },
    { label: 'dx', insert: 'dx' },
    { label: 'dy', insert: 'dy' },
    { label: '(',  insert: '('  },
    { label: ')',  insert: ')'  },
  ],
];

// Visualizer / general: variables, Greek, extra functions
const GENERAL_EXTRAS = [
  [
    { label: 'x', insert: 'x', style: 'var' },
    { label: 'y', insert: 'y', style: 'var' },
    { label: 't', insert: 't', style: 'var' },
    { label: 'n', insert: 'n', style: 'var' },
    { label: '⌫', action: 'backspace', style: 'danger' },
  ],
  [
    { label: 'a', insert: 'a', style: 'var' },
    { label: 'b', insert: 'b', style: 'var' },
    { label: 'c', insert: 'c', style: 'var' },
    { label: 'k', insert: 'k', style: 'var' },
    { label: 'r', insert: 'r', style: 'var' },
  ],
  [
    { label: 'θ', insert: 'theta', style: 'var' },
    { label: 'α', insert: 'alpha', style: 'var' },
    { label: 'β', insert: 'beta',  style: 'var' },
    { label: 'φ', insert: 'phi',   style: 'var' },
    { label: 'ω', insert: 'omega', style: 'var' },
  ],
  [
    { label: 'min(',  insert: 'min('       },
    { label: 'max(',  insert: 'max('       },
    { label: 'mod(',  insert: 'mod('       },
    { label: '!',     insert: 'factorial(' },
    { label: 'Σ',     insert: 'sum('       },
  ],
];

// ─── Layout builder + definitions ──────────────────────────────────────────

/** Builds a 4-tab expression layout from shared tabs + custom 4th-tab keys. */
const makeExprLayout = (extraLabel, extraKeys) => ({
  tabs: [
    { key: 'basic',  label: '123'       },
    { key: 'funcs',  label: 'f(x)'      },
    { key: 'trig',   label: 'sin'       },
    { key: 'extras', label: extraLabel   },
  ],
  keys: { basic: BASIC_KEYS, funcs: FUNCS_KEYS, trig: TRIG_KEYS, extras: extraKeys },
});

const LAYOUTS = {

  // ── 6 expression variants (differ only in 4th tab) ───────────────────────
  derivative:  makeExprLayout('∂',   DERIVATIVE_EXTRAS),
  integrate:   makeExprLayout('∫',   INTEGRATE_EXTRAS),
  optimize:    makeExprLayout('xyz', OPTIMIZE_EXTRAS),
  limit:       makeExprLayout('lim', LIMIT_EXTRAS),
  'ai-solve':  makeExprLayout('∑∫',  AI_SOLVE_EXTRAS),
  visualizer:  makeExprLayout('xyz', GENERAL_EXTRAS),

  // Backward-compatible alias — resolves to the general/visualizer layout
  expression:  makeExprLayout('xyz', GENERAL_EXTRAS),

  // ── numeric ───────────────────────────────────────────────────────────────
  // Compact number pad for scalar input fields: integration bounds (a, b)
  // and limit approach value. Supports math constants and basic arithmetic
  // so values like "pi/2" and "-Infinity" are still typeable. No tab bar.
  numeric: {
    tabs: [{ key: 'num', label: '123' }],
    keys: {
      num: [
        [
          { label: '7', insert: '7' },
          { label: '8', insert: '8' },
          { label: '9', insert: '9' },
          { label: '÷', insert: '/' },
          { label: '⌫', action: 'backspace', style: 'danger' },
        ],
        [
          { label: '4',  insert: '4'        },
          { label: '5',  insert: '5'        },
          { label: '6',  insert: '6'        },
          { label: 'π',  insert: 'pi'       },
          { label: 'e',  insert: 'e'        },
        ],
        [
          { label: '1',  insert: '1'        },
          { label: '2',  insert: '2'        },
          { label: '3',  insert: '3'        },
          { label: '∞',  insert: 'Infinity' },
          { label: '(',  insert: '('        },
        ],
        [
          { label: '0',  insert: '0'  },
          { label: '.',  insert: '.'  },
          { label: '−',  insert: '-'  },
          { label: '+',  insert: '+'  },
          { label: ')',  insert: ')'  },
        ],
      ],
    },
  },

  // ── variable ──────────────────────────────────────────────────────────────
  // Letter-only pad for the differentiation variable field in Solver.
  // Shows only identifiers that math.js accepts as variable names.
  // No numbers, no operators — the field only ever holds a single letter.
  variable: {
    tabs: [{ key: 'letters', label: 'var' }],
    keys: {
      letters: [
        [
          { label: 'x', insert: 'x', style: 'var' },
          { label: 'y', insert: 'y', style: 'var' },
          { label: 't', insert: 't', style: 'var' },
          { label: 'n', insert: 'n', style: 'var' },
          { label: '⌫', action: 'backspace', style: 'danger' },
        ],
        [
          { label: 'a', insert: 'a', style: 'var' },
          { label: 'b', insert: 'b', style: 'var' },
          { label: 'c', insert: 'c', style: 'var' },
          { label: 'k', insert: 'k', style: 'var' },
          { label: 'r', insert: 'r', style: 'var' },
        ],
        [
          { label: 'u',  insert: 'u',     style: 'var' },
          { label: 'v',  insert: 'v',     style: 'var' },
          { label: 'θ',  insert: 'theta', style: 'var' },
          { label: 'α',  insert: 'alpha', style: 'var' },
          { label: 'β',  insert: 'beta',  style: 'var' },
        ],
      ],
    },
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Context-aware math keyboard.
 *
 * @param {Object}   props
 * @param {string}   props.value          Current input string (used for backspace).
 * @param {function} props.onChangeText   Called with the updated string on each key press.
 * @param {function} [props.onHint]       Called with a hint string (legacy, currently unused).
 * @param {'derivative'|'integrate'|'optimize'|'limit'|'ai-solve'|'visualizer'|'expression'|'numeric'|'variable'} [props.layout='expression']
 *   Which key layout to display. Changes automatically reset to the first tab.
 */
export default function MathKeyboard({ value, onChangeText, onHint, layout = 'expression' }) {
  const insets = useSafeAreaInsets();

  // Fall back to expression if an unknown layout string is passed
  const { tabs, keys } = LAYOUTS[layout] || LAYOUTS.expression;

  // Start on the first tab of the current layout
  const [tab, setTab] = useState(tabs[0].key);

  // When the caller switches layout (e.g. user moves from expr field to var
  // field in SolverScreen), reset to the first tab of the new layout so the
  // user never sees a stale tab from the previous layout.
  React.useEffect(() => {
    setTab(tabs[0].key);
  }, [layout]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKey = (key) => {
    if (key.action === 'backspace') {
      onChangeText(value.slice(0, -1));
    } else if (key.action === 'hint') {
      onHint && onHint(key.hint);
    } else if (key.insert !== undefined) {
      onChangeText(value + key.insert);
    }
  };

  return (
    // paddingBottom includes the gesture nav bar inset so the bottom key row
    // is never obscured on devices using swipe navigation.
    <View style={[s.container, { paddingBottom: insets.bottom + 4 }]}>

      {/* Tab bar — hidden for single-tab layouts (numeric, variable) */}
      {tabs.length > 1 && (
        <View style={s.tabBar}>
          {tabs.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[s.tab, tab === t.key && s.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Key grid */}
      <View style={s.keysContainer}>
        {(keys[tab] || []).map((row, ri) => (
          <View key={ri} style={s.keyRow}>
            {row.map((key, ki) => (
              <TouchableOpacity
                key={ki}
                style={[
                  s.key,
                  key.style === 'danger' && s.keyDanger,
                  key.style === 'var'    && s.keyVar,
                  key.wide               && { flex: 2 },
                ]}
                onPress={() => handleKey(key)}
                activeOpacity={0.6}
              >
                <Text style={[
                  s.keyLabel,
                  key.style === 'danger' && s.keyLabelDanger,
                  key.style === 'var'    && s.keyLabelVar,
                ]}>
                  {key.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { backgroundColor: '#0d1b2a', borderTopWidth: 1, borderTopColor: '#16213e' },
  tabBar:          { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#16213e' },
  tab:             { flex: 1, paddingVertical: 8, alignItems: 'center' },
  tabActive:       { borderBottomWidth: 2, borderBottomColor: '#e94560' },
  tabText:         { color: '#666', fontSize: 12, fontWeight: '600' },
  tabTextActive:   { color: '#e94560' },
  keysContainer:   { padding: 4 },
  keyRow:          { flexDirection: 'row', marginBottom: 4, gap: 4 },
  key:             { flex: 1, backgroundColor: '#16213e', borderRadius: 8, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  keyDanger:       { backgroundColor: '#2a1520' },
  keyVar:          { backgroundColor: '#1a2a3e' },
  keyLabel:        { color: '#ddd', fontSize: 14, fontWeight: '600' },
  keyLabelDanger:  { color: '#e94560' },
  keyLabelVar:     { color: '#00aaff', fontStyle: 'italic' },
});
