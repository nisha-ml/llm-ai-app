import React from 'react';
import Svg, { Path, Line, Circle, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const PlusIcon = ({ size = 20, color = '#4a4a4a' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
    <Line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
  </Svg>
);

export const MicIcon = ({ size = 18, color = '#4a4a4a' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path
      d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" />
    <Line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" />
  </Svg>
);

export const ArrowUpIcon = ({ size = 18, color = '#ffffff' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
    <Line x1="12" y1="19" x2="12" y2="5" strokeLinecap="round" />
    <Path d="M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CopyIcon = ({ size = 15, color = '#8e8ea0' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Rect x="9" y="9" width="13" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CheckIcon = ({ size = 15, color = '#10a37f' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
    <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ShareIcon = ({ size = 15, color = '#8e8ea0' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 6l-4-4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
  </Svg>
);

export const SpeakerIcon = ({ size = 15, color = '#8e8ea0' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M15.5 8.5a5 5 0 0 1 0 7" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 5.5a9 9 0 0 1 0 13" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CloseIcon = ({ size = 12, color = '#4a4a4a' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
    <Line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
    <Line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
  </Svg>
);