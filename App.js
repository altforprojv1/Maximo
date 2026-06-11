import React, { useState, useRef, createContext, useContext } from 'react';
import {
  View, Text, TouchableOpacity, TouchableWithoutFeedback,
  Animated, StyleSheet,
} from 'react-native';
// SafeAreaProvider must wrap the whole tree so useSafeAreaInsets works anywhere
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
// createNavigationContainerRef lets us drive navigation from outside the
// component tree (e.g. from the drawer) without prop-drilling the navigator
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SolverScreen from './src/screens/SolverScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import VisualizerScreen from './src/screens/VisualizerScreen';
import LearnScreen from './src/screens/LearnScreen';
import TopicScreen from './src/screens/TopicScreen';
import QuizScreen from './src/screens/QuizScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const DRAWER_WIDTH = 240;
const Stack = createNativeStackNavigator();
// Separate stack for Learn so Topic/Quiz screens keep their own nested header
const LearnStack = createNativeStackNavigator();

// navRef is module-level so CustomDrawer can call navRef.reset() without being
// inside a NavigationContainer descendant
const navRef = createNavigationContainerRef();

// DrawerContext exposes the open() function to any screen header button
// without threading it through navigation params
export const DrawerContext = createContext({ open: () => {} });

/** Hamburger button rendered inside each screen's header via screenOptions. */
function HamburgerButton() {
  const { open } = useContext(DrawerContext);
  return (
    <TouchableOpacity onPress={open} style={{ paddingLeft: 4, paddingRight: 12 }}>
      <Text style={{ color: '#fff', fontSize: 22, lineHeight: 26 }}>☰</Text>
    </TouchableOpacity>
  );
}

// Centralised route → label map so the drawer and stack definitions stay in sync
const MENU_ITEMS = [
  { name: 'Solver',     label: 'Problem Solver' },
  { name: 'AITools',    label: 'AI Tools'       },
  { name: 'Visualizer', label: 'Visualizer'     },
  { name: 'Learn',      label: 'Learn'          },
  { name: 'Settings',   label: 'Settings'       },
];

/**
 * Slide-in side drawer rendered as a sibling overlay above the NavigationContainer.
 * Placed outside the navigator so it persists across screen transitions.
 *
 * @param {boolean} isOpen  - Controls whether the drawer is visible.
 * @param {Function} onClose - Called when the backdrop or a menu item is tapped.
 */
function CustomDrawer({ isOpen, onClose }) {
  // useSafeAreaInsets provides the top inset so the title clears the status bar
  // without a fixed pixel value (varies by device notch / dynamic island)
  const insets = useSafeAreaInsets();

  // Start fully off-screen to the left; animated to 0 when open
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  // Slide in/out whenever isOpen changes
  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOpen ? 0 : -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true, // transform animations can run on the UI thread
    }).start();
  }, [isOpen]);

  /**
   * Navigates to a top-level route using navRef.reset() instead of navigate().
   * reset() clears the back stack so the user can't "go back" to the previous
   * screen after switching sections — matching expected drawer behaviour.
   */
  const navigate = (name) => {
    onClose();
    if (navRef.isReady()) {
      navRef.reset({ index: 0, routes: [{ name }] });
    }
  };

  return (
    <>
      {/* Semi-transparent backdrop — tapping it closes the drawer */}
      {isOpen && (
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={s.overlay} />
        </TouchableWithoutFeedback>
      )}
      {/* Drawer panel slides in from the left over the overlay.
          pointerEvents="none" when closed so the off-screen hitbox doesn't
          block touches on the main content (transform moves visuals only,
          not the touch area — without this, the left 240px of every screen
          would be untappable while the drawer is closed). */}
      <Animated.View
        style={[s.drawer, { transform: [{ translateX }] }]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        {/* paddingTop from insets ensures title is below the status bar */}
        <View style={{ flex: 1, paddingTop: insets.top }}>
          <Text style={s.drawerTitle}>Maximo</Text>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity key={item.name} style={s.drawerItem} onPress={() => navigate(item.name)}>
              <Text style={s.drawerItemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </>
  );
}

/**
 * Nested stack for the Learn section.
 * Kept separate so Topic and Quiz screens push onto their own stack while
 * still showing the hamburger button in their headers.
 */
function LearnStackScreen() {
  return (
    <LearnStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#16213e' }, headerTintColor: '#fff', headerLeft: () => <HamburgerButton /> }}>
      <LearnStack.Screen name="Topics" component={LearnScreen} options={{ title: 'Learn Calculus' }} />
      <LearnStack.Screen name="Topic" component={TopicScreen} options={({ route }) => ({ title: route.params?.title || 'Topic' })} />
      <LearnStack.Screen name="Quiz" component={QuizScreen} options={({ route }) => ({ title: route.params?.title || 'Quiz' })} />
    </LearnStack.Navigator>
  );
}

export default function App() {
  // Single boolean drives both the backdrop and the drawer slide animation
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    // SafeAreaProvider must be the outermost wrapper so insets are available
    // to both the NavigationContainer headers and the CustomDrawer
    <SafeAreaProvider>
    {/* Provide the open() action to all descendant screens via context */}
    <DrawerContext.Provider value={{ open: () => setDrawerOpen(true) }}>
      {/* Plain View (not SafeAreaView) — individual components handle their own insets */}
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        {/* ref={navRef} wires the container to the module-level ref so the
            drawer can call navRef.reset() without being inside this tree */}
        <NavigationContainer ref={navRef}>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: '#16213e' },
              headerTintColor: '#fff',
              // Inject the hamburger into every screen header automatically
              headerLeft: () => <HamburgerButton />,
            }}
          >
            <Stack.Screen name="Solver"     component={SolverScreen}     options={{ title: 'Problem Solver' }} />
            <Stack.Screen name="AITools"    component={ScannerScreen}    options={{ title: 'AI Tools' }} />
            <Stack.Screen name="Visualizer" component={VisualizerScreen} options={{ title: 'Visualizer' }} />
            {/* headerShown:false because LearnStackScreen has its own inner header */}
            <Stack.Screen name="Learn"      component={LearnStackScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Settings"   component={SettingsScreen}   options={{ title: 'Settings' }} />
          </Stack.Navigator>
        </NavigationContainer>

        {/* Drawer lives outside NavigationContainer so it overlays all screens.
            zIndex in its stylesheet (20) puts it above the overlay (10). */}
        <CustomDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </View>
    </DrawerContext.Provider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  // Full-screen backdrop sits above all screen content (zIndex 10)
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  // Drawer panel above the overlay (zIndex 20); elevation for Android shadow
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#0f3460',
    zIndex: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  drawerTitle: {
    color: '#e94560',
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a6e',
  },
  drawerItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1a3a6e',
  },
  drawerItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
