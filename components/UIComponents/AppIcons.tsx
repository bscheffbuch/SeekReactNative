import React from "react";
import Svg, {
  Circle,
  Line,
  Path,
  Polyline,
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

const AwardIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Circle cx="12" cy="8" r="4.5" />
    <Path d="m8.5 12  -1.2 8 4.7-2.8L16.7 20 15.5 12" />
  </StrokeIcon>
);

const BellIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M18 8.8c0-3.1-2.2-5.3-6-5.3s-6 2.2-6 5.3c0 5.7-2 6.4-2 7.7h16c0-1.3-2-2-2-7.7Z" />
    <Path d="M9.8 19a2.3 2.3 0 0 0 4.4 0" />
  </StrokeIcon>
);

const BinocularsIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M8.5 7.5 6 15.5" />
    <Path d="M15.5 7.5 18 15.5" />
    <Path d="M9 7.5h6" />
    <Circle cx="7" cy="16" r="3.2" />
    <Circle cx="17" cy="16" r="3.2" />
    <Path d="M10.2 16h3.6" />
    <Path d="M9 7.5V5.8c0-.8.6-1.3 1.3-1.3h3.4c.7 0 1.3.5 1.3 1.3v1.7" />
  </StrokeIcon>
);

const CameraIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M6.7 7.2h1.8l1.3-2h4.4l1.3 2h1.8c1.1 0 2 .9 2 2v7.6c0 1.1-.9 2-2 2H6.7c-1.1 0-2-.9-2-2V9.2c0-1.1.9-2 2-2Z" />
    <Circle cx="12" cy="13" r="3.2" />
    <Line x1="17" x2="17.01" y1="10" y2="10" />
  </StrokeIcon>
);

const CheckIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Polyline points="5 12.5 9.5 17 19 7" />
  </StrokeIcon>
);

const ChevronDownIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Polyline points="6 9 12 15 18 9" />
  </StrokeIcon>
);

const ChevronLeftIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Polyline points="15 18 9 12 15 6" />
  </StrokeIcon>
);

const ChevronRightIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Polyline points="9 18 15 12 9 6" />
  </StrokeIcon>
);

const CircleHelpIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Circle cx="12" cy="12" r="9" />
    <Path d="M9.6 9.4a2.7 2.7 0 0 1 5.2 1c0 2-2.8 2.1-2.8 4" />
    <Line x1="12" x2="12.01" y1="17.4" y2="17.4" />
  </StrokeIcon>
);

const CloudUploadIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M17.5 18H18a4 4 0 0 0 .7-7.9 6.2 6.2 0 0 0-12-1.7A4.8 4.8 0 0 0 7 18h.5" />
    <Path d="M12 12v8" />
    <Polyline points="8.5 15.5 12 12 15.5 15.5" />
  </StrokeIcon>
);

const EyeIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
    <Circle cx="12" cy="12" r="2.6" />
  </StrokeIcon>
);

const FlashIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M13 2 5 13h6l-1 9 9-13h-6l0-7Z" />
  </StrokeIcon>
);

const FlagIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M6 21V4" />
    <Path d="M6 5h11l-1.7 4L17 13H6" />
  </StrokeIcon>
);

const FocusIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M4 9V5h4" />
    <Path d="M16 5h4v4" />
    <Path d="M20 15v4h-4" />
    <Path d="M8 19H4v-4" />
    <Circle cx="12" cy="12" r="2.3" />
  </StrokeIcon>
);

const GridIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Rect height="14" rx="2" width="14" x="5" y="5" />
    <Line x1="9.7" x2="9.7" y1="5" y2="19" />
    <Line x1="14.3" x2="14.3" y1="5" y2="19" />
    <Line x1="5" x2="19" y1="9.7" y2="9.7" />
    <Line x1="5" x2="19" y1="14.3" y2="14.3" />
  </StrokeIcon>
);

const HouseIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M3.5 11.4 12 4l8.5 7.4" />
    <Path d="M5.8 10v9h4.5v-5.2h3.4V19h4.5v-9" />
  </StrokeIcon>
);

const InfoIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Circle cx="12" cy="12" r="9" />
    <Line x1="12" x2="12" y1="10.7" y2="16" />
    <Line x1="12" x2="12.01" y1="7.6" y2="7.6" />
  </StrokeIcon>
);

const ImageIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Rect height="14" rx="2" width="16" x="4" y="5" />
    <Circle cx="8.5" cy="9.2" r="1.2" />
    <Path d="m5.5 17 4.2-4.2 2.9 2.9 1.7-1.7 4.2 4.2" />
  </StrokeIcon>
);

const LeafIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M20 4c-7.5.2-12.7 3.1-14.4 8.3-1.1 3.4.5 6.3 3.6 7.1 5.7 1.5 10.1-4.6 10.8-15.4Z" />
    <Path d="M6.8 17.2c2.5-4.6 6-7.5 10.7-9" />
  </StrokeIcon>
);

const MapPinIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M12 21s7-5.7 7-12a7 7 0 0 0-14 0c0 6.3 7 12 7 12Z" />
    <Circle cx="12" cy="9" r="2.3" />
  </StrokeIcon>
);

const MenuIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Line x1="4" x2="20" y1="7" y2="7" />
    <Line x1="4" x2="20" y1="12" y2="12" />
    <Line x1="4" x2="20" y1="17" y2="17" />
  </StrokeIcon>
);

const MountainIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="m3 19 6.5-10 4.3 6 2.2-3 5 7H3Z" />
    <Path d="m9.5 9 1.7 2.4" />
  </StrokeIcon>
);

const PlusIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Line x1="12" x2="12" y1="5" y2="19" />
    <Line x1="5" x2="19" y1="12" y2="12" />
  </StrokeIcon>
);

const QueueIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Rect height="14" rx="2" width="14" x="5" y="5" />
    <Path d="M9 9h6" />
    <Path d="M9 12h6" />
    <Path d="M9 15h3.5" />
  </StrokeIcon>
);

const RotateCameraIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M6.5 7.2h1.8l1.2-1.8h5l1.2 1.8h1.8c1 0 1.8.8 1.8 1.8v7.1c0 1-.8 1.8-1.8 1.8h-11c-1 0-1.8-.8-1.8-1.8V9c0-1 .8-1.8 1.8-1.8Z" />
    <Circle cx="12" cy="12.8" r="2.5" />
    <Path d="M7.3 4.7A7.7 7.7 0 0 1 17.7 5" />
    <Polyline points="16.2 2.8 18.2 5.1 15.8 7" />
    <Path d="M16.7 20a7.7 7.7 0 0 1-10.4-.3" />
    <Polyline points="7.8 21.9 5.8 19.6 8.2 17.7" />
  </StrokeIcon>
);

const SearchIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Circle cx="10.8" cy="10.8" r="6.2" />
    <Line x1="15.4" x2="20" y1="15.4" y2="20" />
  </StrokeIcon>
);

const SettingsIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Z" />
    <Path d="M19 12a7.3 7.3 0 0 0-.1-1.1l2-1.6-2-3.4-2.4 1a7.8 7.8 0 0 0-1.9-1.1L14.3 3h-4.6l-.4 2.8a7.8 7.8 0 0 0-1.9 1.1l-2.4-1-2 3.4 2 1.6A7.3 7.3 0 0 0 5 12c0 .4 0 .8.1 1.1l-2 1.6 2 3.4 2.4-1c.6.5 1.2.8 1.9 1.1l.4 2.8h4.6l.4-2.8c.7-.3 1.3-.6 1.9-1.1l2.4 1 2-3.4-2-1.6c0-.3.1-.7.1-1.1Z" />
  </StrokeIcon>
);

const SlidersIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Line x1="4" x2="20" y1="6" y2="6" />
    <Line x1="4" x2="20" y1="12" y2="12" />
    <Line x1="4" x2="20" y1="18" y2="18" />
    <Circle cx="9" cy="6" r="1.8" fill="none" />
    <Circle cx="15" cy="12" r="1.8" fill="none" />
    <Circle cx="11" cy="18" r="1.8" fill="none" />
  </StrokeIcon>
);

const TrophyIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M8 4h8v4.5a4 4 0 0 1-8 0V4Z" />
    <Path d="M8 6H5.5a2.5 2.5 0 0 0 2.7 4.2" />
    <Path d="M16 6h2.5a2.5 2.5 0 0 1-2.7 4.2" />
    <Path d="M12 12.5V17" />
    <Path d="M8.5 20h7" />
    <Path d="M10 17h4" />
  </StrokeIcon>
);

const TrashIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Path d="M4 7h16" />
    <Path d="M10 11v6" />
    <Path d="M14 11v6" />
    <Path d="M6.5 7 7.3 20h9.4l.8-13" />
    <Path d="M9 7V4.8h6V7" />
  </StrokeIcon>
);

const XIcon = ( props: GlyphProps ) => (
  <StrokeIcon {...props}>
    <Line x1="6" x2="18" y1="6" y2="18" />
    <Line x1="18" x2="6" y1="6" y2="18" />
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
