import { createStackNavigator } from '@react-navigation/stack';

export type RootStackParamList = {
  Default: undefined;
  Prepare: undefined;
  Question: undefined;
  Admin: undefined;
  // Add other screens here as needed
};

const Stack = createStackNavigator<RootStackParamList>();

export default Stack;
