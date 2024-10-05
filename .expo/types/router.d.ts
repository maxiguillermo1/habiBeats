/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/..\components\EventCards` | `/_sitemap` | `/directmessage` | `/editprofile` | `/events` | `/forgot-password` | `/forgot-password-confirmation` | `/landing` | `/login-signup` | `/match` | `/match-algorithm` | `/messages` | `/myevents` | `/profile` | `/profilesettings` | `/search` | `/settings` | `/settings\block-list` | `/settings\change-email` | `/settings\change-password` | `/settings\email-notifications` | `/settings\hidden-words` | `/settings\push-notifications` | `/settings\selfie-verification` | `/signup` | `/trending`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
