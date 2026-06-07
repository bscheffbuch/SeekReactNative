import React, { useRef } from "react";
import type { StackCardInterpolationProps } from "@react-navigation/stack";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { useReactNavigationDevTools } from "@rozenite/react-navigation-plugin";

import BottomTabs from "./BottomTabs";
import Splash from "../Splash";
import Onboarding from "../Onboarding/OnboardingScreen";
import Wikipedia from "../Species/WikipediaView";
import ARCamera from "../Camera/ARCamera/ARCamera";
import CameraHelp from "../Camera/CameraHelpScreen";
import Achievements from "../Achievements/AchievementsScreen";
import ChallengeDetails from "../Challenges/ChallengeDetails/ChallengeDetailsScreen";
import QueuedObservations from "../Observations/QueuedObservations";
import iNatStats from "../iNaturalist/iNatStats";
import About from "../About/AboutScreen";
import Settings from "../Settings/Settings";
import Match from "../Match/MatchScreen";
import DebugEmailScreen from "../UIComponents/DebugEmailScreen";
import Species from "../Species/SpeciesDetail";
import SeekYearInReview from "../SeekYearInReview/SeekYearInReviewScreen";
import SeekYearInReviewMapScreen from "../SeekYearInReview/SeekYearInReviewMapScreen";
import Notifications from "../Notifications/Notifications";
import Post from "../PostToiNat/PostScreen";
import PostStatus from "../PostToiNat/PostStatus";
import PostingHelp from "../PostToiNat/PostingHelpScreen";
import RangeMap from "../Species/OnlineOnlyCards/RangeMap";
import Donation from "../Donation";
import FullAnnouncement from "../FullWebView/FullAnnouncement";
import PrivacyPolicyScreen from "../Auth/PrivacyPolicyScreen";
import TermsOfServiceScreen from "../Auth/TermsOfServiceScreen";
import CommunityGuidelines from "../Auth/CommunityGuidelines";
import LoginOrSignupScreen from "../Auth/LoginOrSignupScreen";
import LoginScreen from "../Auth/Login/LoginScreen";
import LoginSuccessScreen from "../Auth/Login/LoginSuccessScreen";
import ForgotPasswordScreen from "../Auth/Login/ForgotPasswordScreen";
import PasswordEmailScreen from "../Auth/Login/PasswordEmailScreen";
import AgeVerifyScreen from "../Auth/Signup/AgeVerifyScreen";
import ParentalConsentScreen from "../Auth/Signup/ParentalConsentScreen";
import ParentCheckEmailScreen from "../Auth/Signup/ParentCheckEmailScreen";
import LicensePhotosScreen from "../Auth/Signup/LicensePhotosScreen";
import SignUpScreen from "../Auth/Signup/SignUpScreen";
import Social from "../Social/SocialScreen";
import useAppLog from "./hooks/useAppLog";
import type { RootStackParamList } from "./types";

const forFade = ( { current }: StackCardInterpolationProps ) => ( { cardStyle: { opacity: current.progress } } );

const config = { headerShown: false } as const;

const defaultConfig = { ...config, cardStyleInterpolator: forFade } as const;
const verticalConfig = { ...config, cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS } as const;
// animation is off for resetting screen from AR Camera
const tabConfig = { ...config, animation: "none" } as const;

const screenOptions = { gestureEnabled: false } as const;
const modal = { presentation: "modal" } as const;

const Stack = createStackNavigator<RootStackParamList>( );

const App = ( ) => {
  useAppLog( );

  const navigationRef = useRef( null );
  // Enable React Navigation DevTools in development
  useReactNavigationDevTools( { ref: navigationRef } );

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator id={undefined}>
        <Stack.Group screenOptions={screenOptions}>
          <Stack.Screen name="Splash" component={Splash} options={defaultConfig} />
          <Stack.Screen name="Onboarding" component={Onboarding} options={defaultConfig} />
          <Stack.Screen name="Camera" component={ARCamera} options={verticalConfig} />
          <Stack.Screen name="MainTabs" component={BottomTabs} options={tabConfig} />
          <Stack.Screen name="Match" component={Match} options={defaultConfig} />
          <Stack.Screen name="Species" component={Species} options={defaultConfig} />
          <Stack.Screen name="ChallengeDetails" component={ChallengeDetails} options={defaultConfig} />
          <Stack.Screen name="QueuedObservations" component={QueuedObservations} options={defaultConfig} />
          <Stack.Screen name="Notifications" component={Notifications} options={defaultConfig} />
          <Stack.Screen name="Achievements" component={Achievements} options={defaultConfig} />
          <Stack.Screen name="iNatStats" component={iNatStats} options={defaultConfig} />
          <Stack.Screen name="About" component={About} options={defaultConfig} />
          <Stack.Screen name="Settings" component={Settings} options={defaultConfig} />
          <Stack.Screen name="DebugEmailScreen" component={DebugEmailScreen} options={defaultConfig} />
          <Stack.Screen name="SeekYearInReview" component={SeekYearInReview} options={defaultConfig} />
          <Stack.Screen name="SeekYearInReviewMapScreen" component={SeekYearInReviewMapScreen} options={defaultConfig} />
          <Stack.Screen name="Post" component={Post} options={defaultConfig} />
          <Stack.Screen name="PostStatus" component={PostStatus} options={defaultConfig} />
          <Stack.Screen name="LoginOrSignup" component={LoginOrSignupScreen} options={defaultConfig} />
          <Stack.Screen name="Login" component={LoginScreen} options={defaultConfig} />
          <Stack.Screen name="Forgot" component={ForgotPasswordScreen} options={defaultConfig} />
          <Stack.Screen name="PasswordEmail" component={PasswordEmailScreen} options={defaultConfig} />
          <Stack.Screen name="Age" component={AgeVerifyScreen} options={defaultConfig} />
          <Stack.Screen name="Parent" component={ParentalConsentScreen} options={defaultConfig} />
          <Stack.Screen name="ParentCheck" component={ParentCheckEmailScreen} options={defaultConfig} />
          <Stack.Screen name="LicensePhotos" component={LicensePhotosScreen} options={defaultConfig} />
          <Stack.Screen name="Signup" component={SignUpScreen as React.ComponentType<any>} options={defaultConfig} />
          <Stack.Screen name="LoginSuccess" component={LoginSuccessScreen} options={defaultConfig} />
          {/* TODO: Social screen needs Lato font restyling, or can it be deleted? */}
          <Stack.Screen name="Social" component={Social} options={defaultConfig} />
        </Stack.Group>
        <Stack.Group screenOptions={modal}>
          <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={defaultConfig} />
          <Stack.Screen name="Privacy" component={PrivacyPolicyScreen} options={defaultConfig} />
          <Stack.Screen
            name="CommunityGuidelines"
            component={CommunityGuidelines}
            options={defaultConfig}
          />
          <Stack.Screen name="RangeMap" component={RangeMap} options={defaultConfig} />
          <Stack.Screen name="Wikipedia" component={Wikipedia} options={verticalConfig} />
          <Stack.Screen name="CameraHelp" component={CameraHelp} options={defaultConfig} />
          <Stack.Screen name="Donation" component={Donation} options={verticalConfig} />
          <Stack.Screen name="PostingHelp" component={PostingHelp} options={defaultConfig} />
          <Stack.Screen
            name="FullAnnouncement"
            component={FullAnnouncement}
            options={verticalConfig}
          />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
