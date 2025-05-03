import { MoodType } from "@shared/schema";
import { MoodSummary, TeamAuraData } from "@/types";

// Colors for different moods
export const moodColors: Record<MoodType, string> = {
  calm: "#4FC3F7",
  energetic: "#FF9800",
  focused: "#7E57C2",
  playful: "#FF4081",
  serious: "#607D8B",
};

// Gradients for different moods
export const moodGradients: Record<MoodType, string> = {
  calm: "from-[#4FC3F7]/20 to-[#42A5F5]/40",
  energetic: "from-[#FF9800]/20 to-[#FF5722]/40",
  focused: "from-[#7E57C2]/20 to-[#673AB7]/40",
  playful: "from-[#FF4081]/20 to-[#F50057]/40",
  serious: "from-[#607D8B]/20 to-[#455A64]/40",
};

// Icons for different moods
export const moodIcons: Record<MoodType, string> = {
  calm: "waves",
  energetic: "zap",
  focused: "target",
  playful: "sparkles",
  serious: "shield",
};

// Descriptions for different moods
export const moodDescriptions: Record<MoodType, string> = {
  calm: "Peaceful, serene, and balanced. Ideal for wellness and meditation experiences.",
  energetic: "Vibrant, lively, and active. Great for engaging and exciting experiences.",
  focused: "Concentrated, precise, and clear. Perfect for productivity and workflows.",
  playful: "Fun, creative, and exploratory. Excellent for games and interactive experiences.",
  serious: "Professional, formal, and structured. Suitable for business applications.",
};

// Calculate the dominant mood from mood summary
export function calculateDominantMood(moodSummary: MoodSummary): MoodType {
  if (Object.keys(moodSummary).length === 0) {
    return "energetic"; // Default mood
  }
  
  let dominant: MoodType = "energetic";
  let highestCount = 0;
  
  Object.entries(moodSummary).forEach(([mood, data]) => {
    if (data.count > highestCount) {
      highestCount = data.count;
      dominant = mood as MoodType;
    }
  });
  
  return dominant;
}

// Calculate team aura data from mood summary
export function calculateTeamAura(moodSummary: MoodSummary): TeamAuraData {
  const dominantMood = calculateDominantMood(moodSummary);
  
  // Calculate alignment score (0-100)
  // Higher when more team members have the same mood
  let totalMoods = 0;
  let dominantCount = 0;
  
  Object.entries(moodSummary).forEach(([mood, data]) => {
    totalMoods += data.count;
    if (mood === dominantMood) {
      dominantCount = data.count;
    }
  });
  
  const alignment = totalMoods > 0 ? Math.round((dominantCount / totalMoods) * 100) : 50;
  
  // Generate description based on alignment and dominant mood
  let description = "";
  
  if (alignment >= 80) {
    description = "Team is in perfect sync";
  } else if (alignment >= 60) {
    description = "Team is aligned & flowing";
  } else if (alignment >= 40) {
    description = "Team has mixed feelings";
  } else {
    description = "Team needs alignment";
  }
  
  return {
    dominantMood,
    alignment,
    description,
  };
}

// Get mood badge class
export function getMoodBadgeClass(mood: MoodType): string {
  return `mood-badge-${mood}`;
}

// Get mood gradient class
export function getMoodGradientClass(mood: MoodType): string {
  return `bg-gradient-to-br ${moodGradients[mood]}`;
}

// Get mood name with first letter capitalized
export function getMoodName(mood: MoodType): string {
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}
