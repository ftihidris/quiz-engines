import { LocalStorage } from 'node-localstorage';

// --- Types ---
type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

interface QuestionnaireResponse {
  codingConfidence: 'none' | 'some' | 'comfortable' | 'confident';
  repetitionPreference: 'low' | 'medium' | 'high' | 'auto';
  usageFrequency: 'daily' | 'weekly' | 'occasional' | 'unsure';
  learningGoal: 'memorize' | 'apply' | 'problemSolving' | 'all';
  progressionPreference: 'fixed' | 'accuracy' | 'auto' | 'manual';
}

interface LearningConfig {
  startLevel: SkillLevel;
  repetitions: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  progression: 'fixed' | 'accuracy' | 'auto' | 'manual';
}

interface UserProfile {
  name: string;
  config: LearningConfig;
  progress: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

// --- In-Memory Store (optional fallback) ---
const userProfiles: Record<string, UserProfile> = {};

// --- Configure Learning Settings from Questionnaire ---
function configureLearning(response: QuestionnaireResponse): LearningConfig {
  let startLevel: SkillLevel;

  switch (response.codingConfidence) {
    case 'none':
    case 'some':
      startLevel = 'beginner';
      break;
    case 'comfortable':
      startLevel = 'intermediate';
      break;
    case 'confident':
      startLevel = 'advanced';
      break;
  }

  let reps = { beginner: 3, intermediate: 3, advanced: 2 };

  switch (response.repetitionPreference) {
    case 'low':
      reps = { beginner: 2, intermediate: 2, advanced: 1 };
      break;
    case 'medium':
      reps = { beginner: 3, intermediate: 3, advanced: 2 };
      break;
    case 'high':
      reps = { beginner: 5, intermediate: 5, advanced: 3 };
      break;
    case 'auto':
      reps = {
        beginner: startLevel === 'beginner' ? 4 : 2,
        intermediate: startLevel === 'intermediate' ? 4 : 2,
        advanced: 2,
      };
      break;
  }

  const progression = response.progressionPreference;

  return {
    startLevel,
    repetitions: reps,
    progression,
  };
}

// Set up localStorage folder (e.g., './scratch')
const localStorage = new LocalStorage('./scratch');

// Now your save/load functions can use localStorage as usual
function saveProfileToCache(profile: UserProfile): void {
  localStorage.setItem(`profile_${profile.name}`, JSON.stringify(profile));
}

function loadProfileFromCache(name: string): UserProfile | null {
  const data = localStorage.getItem(`profile_${name}`);
  return data ? JSON.parse(data) : null;
}

// --- Create and Cache User Profile ---
function createUserProfile(name: string, response: QuestionnaireResponse): UserProfile {
  const config = configureLearning(response);
  const newProfile: UserProfile = {
    name,
    config,
    progress: {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    },
  };
  userProfiles[name] = newProfile;
  saveProfileToCache(newProfile);
  return newProfile;
}

// --- Example Usage ---
console.log('🚀 TypeScript is running!');

const response: QuestionnaireResponse = {
  codingConfidence: 'some',
  repetitionPreference: 'medium',
  usageFrequency: 'daily',
  learningGoal: 'all',
  progressionPreference: 'auto',
};

const profile = createUserProfile('Ali', response);
console.log('Created Profile:', profile);

const cached = loadProfileFromCache('Ali');
console.log('Loaded from cache:', cached);