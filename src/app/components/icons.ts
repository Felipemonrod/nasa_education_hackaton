import {
  Activity, ArrowDown, Car, CircleDot, Clock, DoorOpen, Droplets, Filter,
  Footprints, Grid3x3, Hammer, HeartPulse, Home, Microscope, Moon, Mountain,
  Package, Radio, Radiation, Salad, Shield, Sparkle, Sprout, Sun, Wind,
  Wrench, Zap, HelpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Mapa nome -> componente. Cor nunca e o unico canal: todo termo tem icone. */
export const ICONS: Readonly<Record<string, LucideIcon>> = {
  activity: Activity, 'arrow-down': ArrowDown, car: Car, 'circle-dot': CircleDot,
  clock: Clock, 'door-open': DoorOpen, droplets: Droplets, filter: Filter,
  footprints: Footprints, 'grid-3x3': Grid3x3, hammer: Hammer, 'heart-pulse': HeartPulse,
  home: Home, microscope: Microscope, moon: Moon, mountain: Mountain,
  package: Package, radio: Radio, radiation: Radiation, salad: Salad,
  shield: Shield, sparkle: Sparkle, sprout: Sprout, sun: Sun, wind: Wind,
  wrench: Wrench, zap: Zap,
};

export function iconFor(name: string | undefined): LucideIcon {
  if (name === undefined) return HelpCircle;
  return ICONS[name] ?? HelpCircle;
}
