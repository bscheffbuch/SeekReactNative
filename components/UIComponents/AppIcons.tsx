// Stroke geometry transcribed from lucide-static v1.24.0 (ISC license).
import React from "react";
import Svg, {
  Circle,
  Path,
  Rect,
} from "react-native-svg";

export type GlyphProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

export type GlyphIcon = React.ComponentType<GlyphProps>;

type StrokeIconProps = GlyphProps & React.PropsWithChildren<{
  fill?: string;
  viewBox?: string;
}>;

const StrokeIcon = ( {
  children,
  color = "#14794F",
  fill = "none",
  size = 24,
  strokeWidth = 2,
  viewBox = "0 0 24 24",
}: StrokeIconProps ) => (
  <Svg
    fill={fill}
    height={size}
    stroke={color}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={strokeWidth}
    viewBox={viewBox}
    width={size}
  >
    {children}
  </Svg>
);

// lucide: award
const AwardIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
    <Circle cx="12" cy="8" r="6" />
  </StrokeIcon>
);

// lucide: bell
const BellIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M10.268 21a2 2 0 0 0 3.464 0" />
    <Path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
  </StrokeIcon>
);

// lucide: binoculars
const BinocularsIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M10 10h4" />
    <Path d="M19 7V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3" />
    <Path d="M20 21a2 2 0 0 0 2-2v-3.851c0-1.39-2-2.962-2-4.829V8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2z" />
    <Path d="M 22 16 L 2 16" />
    <Path d="M4 21a2 2 0 0 1-2-2v-3.851c0-1.39 2-2.962 2-4.829V8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2z" />
    <Path d="M9 7V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3" />
  </StrokeIcon>
);

// lucide: camera
const CameraIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />
    <Circle cx="12" cy="13" r="3" />
  </StrokeIcon>
);

// lucide: check
const CheckIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M20 6 9 17l-5-5" />
  </StrokeIcon>
);

// lucide: chevron-down
const ChevronDownIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="m6 9 6 6 6-6" />
  </StrokeIcon>
);

// lucide: chevron-left
const ChevronLeftIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="m15 18-6-6 6-6" />
  </StrokeIcon>
);

// lucide: chevron-right
const ChevronRightIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="m9 18 6-6-6-6" />
  </StrokeIcon>
);

// lucide: circle-help
const CircleHelpIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <Path d="M12 17h.01" />
  </StrokeIcon>
);

// lucide: cloud-upload
const CloudUploadIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M12 13v8" />
    <Path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <Path d="m8 17 4-4 4 4" />
  </StrokeIcon>
);

// lucide: eye
const EyeIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <Circle cx="12" cy="12" r="3" />
  </StrokeIcon>
);

// lucide: zap
const FlashIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
  </StrokeIcon>
);

// lucide: flag
const FlagIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528" />
  </StrokeIcon>
);

// lucide: focus
const FocusIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Circle cx="12" cy="12" r="3" />
    <Path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <Path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <Path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <Path d="M7 21H5a2 2 0 0 1-2-2v-2" />
  </StrokeIcon>
);

// lucide: grid-3x3
const GridIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Rect height="18" rx="2" width="18" x="3" y="3" />
    <Path d="M3 9h18" />
    <Path d="M3 15h18" />
    <Path d="M9 3v18" />
    <Path d="M15 3v18" />
  </StrokeIcon>
);

// lucide: house
const HouseIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
    <Path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </StrokeIcon>
);

// lucide: info
const InfoIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 16v-4" />
    <Path d="M12 8h.01" />
  </StrokeIcon>
);

// lucide: image
const ImageIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
    <Circle cx="9" cy="9" r="2" />
    <Path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </StrokeIcon>
);

// lucide: leaf
const LeafIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <Path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </StrokeIcon>
);

// lucide: map-pin
const MapPinIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
    <Circle cx="12" cy="10" r="3" />
  </StrokeIcon>
);

// lucide: menu
const MenuIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M4 5h16" />
    <Path d="M4 12h16" />
    <Path d="M4 19h16" />
  </StrokeIcon>
);

// lucide: mountain
const MountainIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="m8 3 4 8 5-5 5 15H2L8 3z" />
  </StrokeIcon>
);

// lucide: plus
const PlusIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M5 12h14" />
    <Path d="M12 5v14" />
  </StrokeIcon>
);

// lucide: notepad-text
const QueueIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M8 2v4" />
    <Path d="M12 2v4" />
    <Path d="M16 2v4" />
    <Rect height="18" rx="2" width="16" x="4" y="4" />
    <Path d="M8 10h6" />
    <Path d="M8 14h8" />
    <Path d="M8 18h5" />
  </StrokeIcon>
);

// lucide: switch-camera
const RotateCameraIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
    <Path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
    <Circle cx="12" cy="12" r="3" />
    <Path d="m18 22-3-3 3-3" />
    <Path d="m6 2 3 3-3 3" />
  </StrokeIcon>
);

// lucide: search
const SearchIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="m21 21-4.34-4.34" />
    <Circle cx="11" cy="11" r="8" />
  </StrokeIcon>
);

// lucide: settings
const SettingsIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
    <Circle cx="12" cy="12" r="3" />
  </StrokeIcon>
);

// lucide: sliders-horizontal
const SlidersIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M10 5H3" />
    <Path d="M12 19H3" />
    <Path d="M14 3v4" />
    <Path d="M16 17v4" />
    <Path d="M21 12h-9" />
    <Path d="M21 19h-5" />
    <Path d="M21 5h-7" />
    <Path d="M8 10v4" />
    <Path d="M8 12H3" />
  </StrokeIcon>
);

// lucide: trophy
const TrophyIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
    <Path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
    <Path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
    <Path d="M4 22h16" />
    <Path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
    <Path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
  </StrokeIcon>
);

// lucide: trash-2
const TrashIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M10 11v6" />
    <Path d="M14 11v6" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <Path d="M3 6h18" />
    <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </StrokeIcon>
);

// lucide: x
const XIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M18 6 6 18" />
    <Path d="m6 6 12 12" />
  </StrokeIcon>
);

export {
  AwardIcon,
  BellIcon,
  BinocularsIcon,
  CameraIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  CloudUploadIcon,
  EyeIcon,
  FlashIcon,
  FlagIcon,
  FocusIcon,
  GridIcon,
  HouseIcon,
  ImageIcon,
  InfoIcon,
  LeafIcon,
  MapPinIcon,
  MenuIcon,
  MountainIcon,
  PlusIcon,
  QueueIcon,
  RotateCameraIcon,
  SearchIcon,
  SettingsIcon,
  SlidersIcon,
  TrashIcon,
  TrophyIcon,
  XIcon,
};
