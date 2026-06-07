/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/?config=dynamic
 */

import type { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { StackScreenProps } from "@react-navigation/stack";

// Note from the documentation:
// The type containing the mapping must be a type alias. It cannot be an interface.
export type BottomTabParamList = {
  Home: undefined;
  Observations: undefined;
  Scan: undefined;
  Challenges: undefined;
  More: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
};

export type ObservationsStackParamList = {
  Observations: undefined;
};

export type ChallengesStackParamList = {
  Challenges: undefined;
};

export type MoreStackParamList = {
  More: undefined;
};

// Note from the documentation:
// The type containing the mapping must be a type alias. It cannot be an interface.
export type RootStackParamList = {
  [key: string]: object | undefined;
  Splash: undefined;
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<BottomTabParamList>;
  Camera: { origin?: "camera" | "queue" } | undefined;
  Match: { origin?: "camera" | "queue" } | undefined;
  Species: undefined;
  ChallengeDetails: undefined;
  QueuedObservations: undefined;
  Notifications: undefined;
  Achievements: undefined;
  iNatStats: undefined;
  About: undefined;
  Settings: undefined;
  DebugEmailScreen: undefined;
  SeekYearInReview: undefined;
  SeekYearInReviewMapScreen: undefined;
  Post: undefined;
  PostStatus: undefined;
  LoginOrSignup: undefined;
  Login: undefined;
  Forgot: undefined;
  PasswordEmail: undefined;
  Age: undefined;
  Parent: undefined;
  ParentCheck: undefined;
  LicensePhotos: undefined;
  Signup: undefined;
  LoginSuccess: undefined;
  Social: undefined;
  TermsOfService: undefined;
  Privacy: undefined;
  CommunityGuidelines: undefined;
  RangeMap: undefined;
  Wikipedia: undefined;
  CameraHelp: undefined;
  Donation: undefined;
  PostingHelp: undefined;
  FullAnnouncement: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<RootStackParamList, T>;

export type BottomTabStackScreenProps<T extends keyof BottomTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<BottomTabParamList, T>,
    RootStackScreenProps<"MainTabs">
  >;

// https://reactnavigation.org/docs/typescript/?config=dynamic#specifying-default-types-for-usenavigation-link-ref-etc
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList, BottomTabParamList {}
  }
}
