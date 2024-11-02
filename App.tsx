import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DisposableCamera from './app/disposable-camera';
import DisposableGallery from './app/disposable-gallery';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Camera" component={DisposableCamera} />
        <Stack.Screen name="DisposableGallery" component={DisposableGallery} />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 