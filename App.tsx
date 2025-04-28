// App.tsx (or index.js if using that)
import 'react-native-gesture-handler'; // MUST BE THE VERY FIRST IMPORT
import { ExpoRoot } from 'expo-router';
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';

export function App() {
  // Loads the ./app folder
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

AppRegistry.registerComponent(appName, () => App);

export default App; // Optional default export
