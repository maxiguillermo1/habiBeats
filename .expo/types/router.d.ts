/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/_sitemap` | `/ai-chatbot` | `/context/ThemeContext` | `/create-group` | `/directmessage` | `/discography` | `/disposable-camera` | `/disposable-gallery` | `/editprofile` | `/events/artist-details` | `/events/event-details` | `/events/event-location` | `/events/event-tickets` | `/events/events` | `/events/myevents` | `/events/search` | `/events/trending` | `/forgot-password` | `/forgot-password-confirmation` | `/group-message` | `/landing` | `/legal-pages/privacy-policy` | `/legal-pages/privacy-policy-page` | `/legal-pages/terms-of-service` | `/legal-pages/terms-of-service-page` | `/login-signup` | `/match` | `/match-algorithm` | `/messages` | `/notification-page` | `/post-delete-survey` | `/profile` | `/settings` | `/settings/block-list` | `/settings/change-email` | `/settings/change-password` | `/settings/current-liked-list` | `/settings/download-data` | `/settings/email-notifications` | `/settings/hidden-words` | `/settings/pause-new-interaction` | `/settings/push-notifications` | `/settings/safety-resources/ai-at-habibeats` | `/settings/safety-resources/faq` | `/settings/safety-resources/help-center` | `/settings/safety-resources/safety` | `/settings/safety-resources/support` | `/settings/safety-resources/tips-for-matching` | `/settings/selfie-verification` | `/signup` | `/theme/theme` | `/view-groups`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
