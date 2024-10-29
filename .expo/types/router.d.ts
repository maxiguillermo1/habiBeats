/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/..\api\spotify-api` | `/..\components\search-album` | `/..\components\search-artist` | `/..\components\search-song` | `/_sitemap` | `/ai-chatbot` | `/create-group` | `/directmessage` | `/editprofile` | `/events/event-details` | `/events/events` | `/events/myevents` | `/events/search` | `/events/trending` | `/forgot-password` | `/forgot-password-confirmation` | `/landing` | `/login-signup` | `/match` | `/match-algorithm` | `/messages` | `/notification-page` | `/post-delete-survey` | `/profile` | `/profilesettings` | `/settings` | `/settings/block-list` | `/settings/change-email` | `/settings/change-password` | `/settings/current-liked-list` | `/settings/email-notifications` | `/settings/hidden-words` | `/settings/push-notifications` | `/settings/selfie-verification` | `/settings\hidden-words` | `/signup`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
