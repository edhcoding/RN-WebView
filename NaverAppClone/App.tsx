import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import ShoppingScreen from './screens/ShoppingScreen';
import {RootStackParamList, RouteNames} from './routes';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import BrowserScreen from './screens/BrowserScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LoginButton from './components/LoginButton';
import LoginScreen from './screens/LoginScreen';
import {WebViewProvider} from './components/WebViewProvider';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const HomeIcon = ({focused, color}: {focused: boolean; color: string}) => {
  const iconName = focused ? 'home' : 'home-outline';

  return <MaterialCommunityIcons name={iconName} color={color} size={26} />;
};

const ShoppingIcon = ({focused, color}: {focused: boolean; color: string}) => {
  const iconName = focused ? 'shopping' : 'shopping-outline';
  return <MaterialCommunityIcons name={iconName} color={color} size={26} />;
};

const HomeTab = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'black',
        },
        tabBarActiveTintColor: 'white', // active 상태인거는 흰색
        tabBarInactiveTintColor: 'white', // inactive 상태인거는 흰색
        headerShown: false,
      }}>
      <Tab.Screen
        name={RouteNames.HOME}
        component={HomeScreen}
        // label 지정안하면 기본적으로 name 출력
        options={{tabBarLabel: '홈', tabBarIcon: HomeIcon}}
      />
      <Tab.Screen
        name={RouteNames.SHOPPING}
        component={ShoppingScreen}
        options={{tabBarLabel: '쇼핑', tabBarIcon: ShoppingIcon}}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  return (
    <WebViewProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name={RouteNames.HOME_TAB}
            component={HomeTab}
            options={{
              title: '',
              headerStyle: {backgroundColor: 'black'},
              headerRight: LoginButton,
            }}
          />
          <Stack.Screen
            name={RouteNames.BROWSER}
            component={BrowserScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name={RouteNames.LOGIN}
            component={LoginScreen}
            options={{
              title: '',
              headerStyle: {backgroundColor: 'black'},
              headerTintColor: 'white', // 헤더 텍스트 색깔
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </WebViewProvider>
  );
}
