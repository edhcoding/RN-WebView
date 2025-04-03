import React from "react";
import { Tabs } from "expo-router/tabs";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const HomeIcon = ({ focused, color }: { focused: boolean; color: string }) => {
  return (
    <MaterialCommunityIcons
      name={focused ? "home" : "home-outline"}
      color={color}
      size={26}
    />
  );
};

const ShoppingIcon = ({
  focused,
  color,
}: {
  focused: boolean;
  color: string;
}) => {
  return (
    <MaterialCommunityIcons
      name={focused ? "cart" : "cart-outline"}
      color={color}
      size={26}
    />
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "black",
        },
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "gray",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "홈",
          tabBarIcon: HomeIcon,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          tabBarLabel: "쇼핑",
          tabBarIcon: ShoppingIcon,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
