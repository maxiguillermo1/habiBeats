/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/_sitemap` | `/events` | `/forgotpassword` | `/forgotpassword-confirmation` | `/login-signup` | `/match` | `/messages` | `/myevents` | `/profile` | `/profilesettings` | `/search` | `/signup` | `/trending`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
