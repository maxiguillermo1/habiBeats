/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/_sitemap` | `/ai-chatbot` | `/create-group` | `/directmessage` | `/editprofile` | `/events/event-details` | `/events/events` | `/events/myevents` | `/events/search` | `/events/trending` | `/forgot-password` | `/forgot-password-confirmation` | `/group-message` | `/landing` | `/login-signup` | `/match` | `/match-algorithm` | `/messages` | `/notification-page` | `/post-delete-survey` | `/profile` | `/profilesettings` | `/settings` | `/settings/block-list` | `/settings/change-email` | `/settings/change-password` | `/settings/current-liked-list` | `/settings/email-notifications` | `/settings/hidden-words` | `/settings/pause-new-interaction` | `/settings/push-notifications` | `/settings/selfie-verification` | `/signup` | `/view-groups`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
