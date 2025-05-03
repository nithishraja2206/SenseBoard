import { MoodType, NodeType, TagCategory } from "@shared/schema";

// Client-specific type extensions and helper interfaces

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface InspirationNodePosition {
  id: number;
  position: Point;
  size: Size;
  zIndex: number;
}

export interface Connection {
  id: number;
  source: number;
  target: number;
  strength: number;
}

export interface DragState {
  isDragging: boolean;
  offset: Point;
  nodeId: number | null;
}

export interface MoodSummary {
  [key: string]: {
    count: number;
    intensity: number;
  };
}

export interface TeamAuraData {
  dominantMood: MoodType;
  alignment: number;
  description: string;
}

export interface MoodIntensity {
  mood: MoodType;
  intensity: number;
}

export interface InspirationData {
  title: string;
  description?: string;
  mood: MoodType;
  intensity: number;
  tags?: string[];
}

export interface SketchData extends InspirationData {
  paths: string;
}

export interface ImageData extends InspirationData {
  imageUrl: string;
}

export interface AudioData extends InspirationData {
  audioUrl: string;
  duration: number;
}

export interface ThoughtData extends InspirationData {
  text: string;
  source?: string;
  date?: string;
}

export interface LinkData extends InspirationData {
  url: string;
  domain: string;
}

export type InspirationContent = 
  | { type: "sketch"; data: SketchData }
  | { type: "image"; data: ImageData }
  | { type: "audio"; data: AudioData }
  | { type: "thought"; data: ThoughtData }
  | { type: "link"; data: LinkData };

export interface ActiveTool {
  type: NodeType | null;
  isOpen: boolean;
}

export interface ProjectData {
  id: number;
  name: string;
  description?: string;
  coverImageUrl?: string;
}

export interface MoodBoardData {
  id: number;
  name: string;
  description?: string;
  projectId: number;
}
