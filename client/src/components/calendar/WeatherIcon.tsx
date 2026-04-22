import {
  FiSun,
  FiCloud,
  FiCloudRain,
  FiCloudSnow,
  FiCloudLightning,
  FiCloudDrizzle,
  FiWind,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';

interface WeatherIconConfig {
  Icon: IconType;
  color: string;
}

function getConfig(code: number): WeatherIconConfig {
  if (code === 0 || code === 1) return { Icon: FiSun, color: '#f5a623' };
  if (code === 2)               return { Icon: FiCloud, color: '#9daab5' };
  if (code === 3)               return { Icon: FiCloud, color: '#6b7a85' };
  if (code === 45 || code === 48) return { Icon: FiWind, color: '#b0b8c1' };
  if (code >= 51 && code <= 55) return { Icon: FiCloudDrizzle, color: '#74b9e0' };
  if ((code >= 61 && code <= 65) || (code >= 80 && code <= 82))
    return { Icon: FiCloudRain, color: '#5b9bd5' };
  if ((code >= 71 && code <= 75) || code === 85 || code === 86)
    return { Icon: FiCloudSnow, color: '#90c8e0' };
  if (code >= 95) return { Icon: FiCloudLightning, color: '#e67e22' };
  return { Icon: FiCloud, color: '#9daab5' };
}

interface Props {
  code: number;
  size?: number;
}

export default function WeatherIcon({ code, size = 13 }: Props) {
  const { Icon, color } = getConfig(code);
  return <Icon size={size} color={color} />;
}
