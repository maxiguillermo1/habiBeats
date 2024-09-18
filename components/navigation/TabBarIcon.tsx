
// TabBarIcon.tsx
// Maxwell Guillermo 

// START of Tab Bar Icon component
// START of Maxwell Guillermo Contribution

import Ionicons from '@expo/vector-icons/Ionicons';
import { type IconProps } from '@expo/vector-icons/build/createIconSet';
import { type ComponentProps } from 'react';

export function TabBarIcon({ style, ...rest }: IconProps<ComponentProps<typeof Ionicons>['name']>) {
  return <Ionicons size={28} style={[{ marginBottom: -3 }, style]} {...rest} />;
}

// END of Tab Bar Icon component
// END of Maxwell Guillermo Contribution