# Maximo

**SENG390 Senior Project I  |  Group 12 ROOK**

A mobile application for solving and visualizing calculus-based optimization
problems. Built with React Native and Expo, runs on Android phones, supports
three AI providers for image-based math scanning.

## Features

The app has five tabs at the bottom of the screen, each one a separate module.

**Solver.** Type a math expression and get the derivative, find critical points
with classification, approximate limits numerically, or send the problem to an
AI for a step-by-step solution. The AI Solve mode lets the user write a custom
instruction like "integrate this" or "find the limit as x approaches 0".

**Scanner.** Take a photo of a calculus problem from a textbook or notebook,
or pick one from the gallery. The image is sent to the configured AI provider
as base64 data and the response comes back rendered with KaTeX so fractions,
roots, and integrals all look proper.

**Visualizer.** Plot any function on a canvas with sharp HiDPI rendering.
Critical points are marked with colored dots (green for minimums, red for
maximums, blue for inflection points). Tangent lines can be drawn at any
x value with the slope and y-intercept calculated automatically.

**Learn.** Sixteen calculus topics covering MATH 111-121 syllabus. Nine
topics for Calculus I and seven for Calculus II. Each one has theory text,
worked examples with show or hide solutions, and a quiz at the end.

**Settings.** Pick the AI provider (Claude, OpenAI, or Gemini), enter the
API key, and choose a model. The key is saved locally on the device through
AsyncStorage and is never sent anywhere except directly to the provider.

## Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React Native | 0.81.5 | Mobile UI framework |
| Expo SDK | 54.0.0 | Build system, camera access, dev tooling |
| math.js | 13.0.0 | Symbolic derivatives and expression evaluation |
| React Navigation | 7.0.0 | Tab and stack navigation |
| Expo Camera | 17.0.10 | Hardware camera for the scanner |
| Expo Image Picker | 17.0.10 | Gallery access for scanner |
| React Native WebView | 13.15.0 | KaTeX rendering and canvas plot |
| KaTeX | 0.16.9 | LaTeX math rendering, loaded from CDN |
| AsyncStorage | 2.2.0 | Local API key and config storage |
| React Native SVG | 15.12.1 | Vector graphics support |

## Setup

### Step 1, install Node.js

Download and install the LTS version from nodejs.org. After install, open a
terminal and verify with `node --version`. Should print something like v20.x
or higher.

### Step 2, install Expo CLI globally

```
npm install -g expo-cli eas-cli
```

### Step 3, install project dependencies

In the project root, run the install command. This pulls all the packages
listed in package.json.

```
npm install
```

If npm install gives any peer dependency warnings, you can usually ignore
them. If it fails outright, try clearing the cache first.

```
npm cache clean --force
npm install
```

If you want to install dependencies one by one for any reason, here is the
full list with their exact versions.

```
npm install react@19.1.0
npm install react-native@0.81.5
npm install expo@~54.0.0
npm install expo-status-bar@~3.0.9
npm install expo-asset@~12.0.12
npm install expo-camera@~17.0.10
npm install expo-image-picker@~17.0.10
npm install expo-file-system@~19.0.21
npm install expo-image-manipulator@~14.0.8
npm install expo-linear-gradient@~15.0.8
npm install @react-native-async-storage/async-storage@2.2.0
npm install @react-navigation/native@^7.0.0
npm install @react-navigation/bottom-tabs@^7.0.0
npm install @react-navigation/native-stack@^7.0.0
npm install react-native-safe-area-context@~5.6.0
npm install react-native-screens@~4.16.0
npm install react-native-webview@13.15.0
npm install react-native-svg@15.12.1
npm install mathjs@^13.0.0
```

For dev dependencies.

```
npm install --save-dev @babel/core@^7.25.2
```

### Step 4, run the app on a phone

Install the Expo Go app from Google Play on an Android device. Then in the
project terminal run.

```
npx expo start
```

A QR code shows up. Scan it with the Expo Go app. The phone and the laptop
must be on the same wifi network.

### Step 5, configure the AI scanner

Open the app on the phone, go to the Settings tab. Pick a provider. Google
Gemini has a free tier and is the cheapest option to start with. Paste the
API key, choose a model, save. The key stays on the phone.

To get a key, the signup links inside the Settings screen take you to the
right pages. console.anthropic.com for Claude, platform.openai.com for
OpenAI, aistudio.google.com for Gemini.

### Step 6, build a standalone APK

When everything works in Expo Go and you want an installable APK file.

```
npx eas build -p android --profile preview
```

The build runs on Expo's cloud servers, takes around ten minutes. When done,
a download link appears in the terminal and on the EAS dashboard. Install
the APK on any Android phone and the app runs without needing the laptop.

## Cost Estimate

The whole project cost less than five dollars to develop. React Native, Expo,
and math.js are open source. Testing happened on a personal laptop and a
personal Android phone, so no hardware spending. The only money spent went
to AI API testing. Five dollars of Anthropic credits, most of which is still
unused. Google Gemini's free tier covered the bulk of scanner testing at
fifteen requests per minute.

For deployment to the Play Store, Google asks a one time twenty five dollar
developer fee. We did not pay this since the APK is distributed directly.

## Project Structure

```
Maximo/
  App.js                          Tab navigator setup, dark theme
  app.json                        Expo config and Android permissions
  package.json                    Dependency list
  eas.json                        EAS build profiles
  src/
    components/
      MathDisplay.js              Native unicode math renderer
      MathKeyboard.js             Custom five-tab scientific keyboard
      MathRenderer.js             WebView with KaTeX for AI output
    screens/
      SolverScreen.js             Derivative, optimize, limit, AI modes
      ScannerScreen.js            Camera and gallery input
      VisualizerScreen.js         Canvas plotter with tangent line
      LearnScreen.js              Topic list for Calc I and II
      TopicScreen.js              Theory and examples for one topic
      QuizScreen.js               Multiple choice quiz with scoring
      SettingsScreen.js           AI provider and key configuration
    services/
      aiService.js                Claude, OpenAI, Gemini wrapper
      apiConfig.js                AsyncStorage config and provider definitions
      mathSolver.js               Math engine, bisection, plot data
    data/
      educationalContent.js       Sixteen topics with theory, examples, quizzes
```

## Known Limitations

The scanner and AI solve mode need internet. Without internet the user can
still compute derivatives, find critical points, plot graphs, and read
through the entire Learn module since math.js runs locally and educational
content is bundled into the app.

The visualizer handles single variable functions only. For multivariable
problems a 3D plotter would be needed and that is outside our scope.

KaTeX is loaded from a CDN. If the CDN is down, AI responses still arrive
but the math shows as raw text with dollar sign delimiters instead of
formatted equations.

Symbolic integration is not supported by math.js, which is why integrals
are routed through the AI providers instead of computed locally.

## Future Work

Backend server to hide API keys so users do not need their own keys. Progress
tracking for the Learn section so students can see which topics they finished
and what quiz scores they got. Better keyboard layout with smaller key spacing
and missing operators on the calc tab. Camera cropping so the user can isolate
a specific problem from a wider photo. More imagery and worked examples in
the Learn module.

## License

Educational project, not licensed for commercial use. Source code provided
for academic review.

## Authors

Group 12 ROOK, Hasan Kalyoncu University, Faculty of Engineering, Software
Engineering Department.

Serken Gür (231504001), Mehmet Can Şahan (231504018), Coşkun Sönmezoğlu
(231504002).

Supervisor, Assoc. Prof. Ece Yetkin Çelikel, Ph.D.