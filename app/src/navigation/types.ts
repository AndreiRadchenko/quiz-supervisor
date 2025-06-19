import { createStackNavigator } from '@react-navigation/stack';

export type RootStackParamList = {
  Default: undefined;
  Admin: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default Stack;
