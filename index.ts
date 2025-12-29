import { registerRootComponent } from 'expo';

// IMPORTANT: Import notifications module BEFORE App to ensure TaskManager is defined
// This allows background tasks to work even when the app is closed
import './src/utils/notifications';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
