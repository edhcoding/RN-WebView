export const RouteNames = {
  HOME_TAB: 'home-tab',
  HOME: 'home',
  SHOPPING: 'shopping',
  BROWSER: 'browser',
} as const;

export type RootStackParamList = {
  [RouteNames.HOME_TAB]: undefined;
  [RouteNames.BROWSER]: undefined;
};
