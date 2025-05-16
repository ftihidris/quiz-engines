"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_localstorage_1 = require("node-localstorage");
// --- In-Memory Store (optional fallback) ---
var userProfiles = {};
// --- Configure Learning Settings from Questionnaire ---
function configureLearning(response) {
    var startLevel;
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
    var reps = { beginner: 3, intermediate: 3, advanced: 2 };
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
    var progression = response.progressionPreference;
    return {
        startLevel: startLevel,
        repetitions: reps,
        progression: progression,
    };
}
// Set up localStorage folder (e.g., './scratch')
var localStorage = new node_localstorage_1.LocalStorage('./scratch');
// Now your save/load functions can use localStorage as usual
function saveProfileToCache(profile) {
    localStorage.setItem("profile_".concat(profile.name), JSON.stringify(profile));
}
function loadProfileFromCache(name) {
    var data = localStorage.getItem("profile_".concat(name));
    return data ? JSON.parse(data) : null;
}
// --- Create and Cache User Profile ---
function createUserProfile(name, response) {
    var config = configureLearning(response);
    var newProfile = {
        name: name,
        config: config,
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
var response = {
    codingConfidence: 'some',
    repetitionPreference: 'medium',
    usageFrequency: 'daily',
    learningGoal: 'all',
    progressionPreference: 'auto',
};
var profile = createUserProfile('Ali', response);
console.log('Created Profile:', profile);
var cached = loadProfileFromCache('Ali');
console.log('Loaded from cache:', cached);
