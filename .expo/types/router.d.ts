/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/_sitemap` | `/directmessage` | `/editprofile` | `/events/event-details` | `/events/events` | `/events/myevents` | `/events/search` | `/events/trending` | `/forgot-password` | `/forgot-password-confirmation` | `/landing` | `/login-signup` | `/match` | `/match-algorithm` | `/messages` | `/notification-page` | `/post-delete-survey` | `/profile` | `/profilesettings` | `/settings` | `/settings/block-list` | `/settings/change-email` | `/settings/change-password` | `/settings/email-notifications` | `/settings/hidden-words` | `/settings/push-notifications` | `/settings/selfie-verification` | `/settings\current-liked-list` | `/signup`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
