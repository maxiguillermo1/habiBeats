/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/_sitemap` | `/directmessage` | `/events` | `/forgotpassword` | `/forgotpassword-confirmation` | `/landing` | `/login-signup` | `/match` | `/messages` | `/myevents` | `/profile` | `/profilesettings` | `/search` | `/signup` | `/trending`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
