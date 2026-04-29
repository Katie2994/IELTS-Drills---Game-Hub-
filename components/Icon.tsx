import React from 'react';
import { 
  Smile, 
  GraduationCap, 
  Layout, 
  Palette, 
  Flag, 
  DoorOpen, 
  Target,
  Gamepad2,
  Map,
  ScanFace,
  Clapperboard,
  Landmark,
  UtensilsCrossed,
  Orbit,
  Globe,
  Gift,
  Search,
  Leaf,
  Home,
  User,
  Shapes,
  Star,
  Dog,
  Cat,
  Scroll,
  MousePointer2
} from 'lucide-react';

interface IconProps {
  name: string;
}

const ICON_MAP: { [key: string]: React.ElementType } = {
  Joy: Smile,
  Prodigy: GraduationCap,
  Icon: Layout,
  Art: Palette,
  Flags: Flag,
  Escape: DoorOpen,
  Mission: Target,
  Map: Map,
  Face: ScanFace,
  Movie: Clapperboard,
  Museum: Landmark,
  Cooking: UtensilsCrossed,
  Planet: Orbit,
  Earth: Globe,
  Gift: Gift,
  Search: Search,
  Leaf: Leaf,
  Home: Home,
  Body: User,
  Shapes: Shapes,
  Star: Star,
  Doge: Dog,
  Cat: Cat,
  Paper: Scroll,
  Pointer: MousePointer2,
};

const Icon: React.FC<IconProps> = ({ name }) => {
  const IconComponent = ICON_MAP[name] || Gamepad2;
  return <IconComponent className="w-full h-full" strokeWidth={1.5} />;
};

export default Icon;
