import { Tabs } from "expo-router/tabs";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" /> {/* index 가 홈 스크린 */}
      <Tabs.Screen name="shopping" /> {/* index 가 홈 스크린 */}
    </Tabs>
  );
}
