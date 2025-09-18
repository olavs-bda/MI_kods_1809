/**
 * Task 3.3: Enhanced Shame Message Generation System
 *
 * Dynamic shame message templates with escalating intensity levels
 * Supports customization and personalization based on context
 */

export const SHAME_MESSAGE_TEMPLATES = {
  // Level 1: Gentle Reminder (Friendly nudge)
  1: {
    subjects: [
      '⏰ Gentle Reminder: {ownerName} missed "{taskTitle}" deadline',
      "🔔 Hey {contactName}, {ownerName} could use your support",
      '⏰ {ownerName} missed their deadline for "{taskTitle}"',
    ],
    openings: [
      "Hi {contactName}, just a gentle nudge from AccountaList!",
      "Hey {contactName}, hope you're doing well!",
      "Hi {contactName}, this is a friendly reminder from AccountaList.",
    ],
    shameMessages: [
      '{ownerName} missed their deadline for "{taskTitle}" which was due {dueDate}. As their accountability contact, maybe a friendly check-in would help?',
      '{ownerName} was supposed to complete "{taskTitle}" by {dueDate}, but they haven\'t marked it as done yet. They might need some encouragement!',
      'Your accountability buddy {ownerName} missed their "{taskTitle}" deadline. Time for some friendly motivation?',
      '{ownerName} is {hoursOverdue} behind on "{taskTitle}". A gentle nudge from you could make all the difference!',
    ],
    callsToAction: [
      "Consider sending them a supportive message or checking if they need help!",
      "Maybe reach out and see if they need assistance or motivation?",
      "A friendly text or call might be just what they need to get back on track.",
      "Your encouragement could help them push through and complete this task!",
    ],
  },

  // Level 2: Escalation Alert (Serious concern)
  2: {
    subjects: [
      '🚨 Escalation Alert: {ownerName} still hasn\'t completed "{taskTitle}"',
      '🔥 Second Warning: {ownerName} is seriously behind on "{taskTitle}"',
      '🚨 {ownerName} needs intervention - "{taskTitle}" still incomplete',
    ],
    openings: [
      "Hi {contactName}, this is a more serious escalation from AccountaList.",
      "{contactName}, we need your help - this is escalation level 2.",
      "Hey {contactName}, time for stronger intervention.",
    ],
    shameMessages: [
      'This is the SECOND escalation for {ownerName}. They\'re now {hoursOverdue} overdue on "{taskTitle}" and clearly struggling with accountability.',
      '{ownerName} is {hoursOverdue} behind schedule on "{taskTitle}". The gentle approach didn\'t work - time for tougher love!',
      'Houston, we have a problem! {ownerName} has ignored their commitment to "{taskTitle}" for {hoursOverdue}. They need your intervention.',
      'Red alert! {ownerName} is failing their accountability system. "{taskTitle}" was due {dueDate} and they\'re {hoursOverdue} overdue.',
    ],
    callsToAction: [
      "This calls for stronger encouragement - maybe it's time for a direct conversation?",
      "Consider escalating your support - a phone call or in-person check-in might be needed.",
      "Time to apply some pressure! They clearly need more than gentle encouragement.",
      "Your buddy is struggling. Time to step up the accountability game!",
    ],
  },

  // Level 3: Maximum Shame (Public accountability failure)
  3: {
    subjects: [
      '💀 MAXIMUM SHAME: {ownerName} has officially failed "{taskTitle}"',
      "🔥💀 FINAL ESCALATION: {ownerName} completely dropped the ball",
      '💀 SHAME ALERT: {ownerName} has broken their commitment to "{taskTitle}"',
    ],
    openings: [
      "💀 MAXIMUM SHAME ACTIVATED 💀",
      "🔥 FINAL ESCALATION - NO MORE MR. NICE GUY 🔥",
      "💀 This is it, {contactName}. Maximum accountability mode. 💀",
    ],
    shameMessages: [
      '💀 OFFICIAL FAILURE NOTICE 💀\n\n{ownerName} has completely failed their commitment to "{taskTitle}". They are now {hoursOverdue} overdue and have ignored TWO previous escalations. This is public accountability failure.',
      '🔥 SHAME LEVEL: MAXIMUM 🔥\n\n{ownerName} promised to complete "{taskTitle}" by {dueDate}. They are now {hoursOverdue} overdue and have officially broken their word. Time for consequences!',
      '💀 ACCOUNTABILITY BREAKDOWN 💀\n\n{ownerName} has demonstrated they cannot be trusted to keep their commitments. "{taskTitle}" remains incomplete after {hoursOverdue}. The gentle approach failed. The escalation failed. Maximum shame is now justified.',
      '🚨 COMMITMENT VIOLATION 🚨\n\n{ownerName} made a promise to complete "{taskTitle}" and broke it. {hoursOverdue} overdue. Two escalations ignored. Your accountability buddy has failed the system.',
    ],
    callsToAction: [
      "Time for the consequences they agreed to. No more excuses!",
      "They agreed to maximum shame for a reason. Time to deliver!",
      "This is why they added you as an accountability contact. Don't hold back!",
      "Public accountability failure demands public consequences. You know what to do!",
    ],
  },
};

/**
 * Generate shame message content based on escalation level and context
 */
export function generateShameMessage({
  escalationLevel = 1,
  taskTitle,
  ownerName,
  ownerEmail,
  contactName,
  dueDate,
  hoursOverdue,
  relationship = "friend",
  customMessage = "",
  messageVariant = null, // Optional: specify which variant to use
}) {
  const level = Math.min(Math.max(escalationLevel, 1), 3);
  const template = SHAME_MESSAGE_TEMPLATES[level];

  if (!template) {
    throw new Error(`Invalid escalation level: ${escalationLevel}`);
  }

  // Select random variants unless specific variant requested
  const subject = selectVariant(template.subjects, messageVariant);
  const opening = selectVariant(template.openings, messageVariant);
  const shameMessage = selectVariant(template.shameMessages, messageVariant);
  const callToAction = selectVariant(template.callsToAction, messageVariant);

  // Template variables for replacement
  const variables = {
    taskTitle,
    ownerName,
    ownerEmail,
    contactName,
    dueDate: new Date(dueDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    hoursOverdue: formatOverdueTime(hoursOverdue),
    relationship,
    customMessage,
  };

  return {
    subject: replaceVariables(subject, variables),
    opening: replaceVariables(opening, variables),
    shameMessage: replaceVariables(shameMessage, variables),
    callToAction: replaceVariables(callToAction, variables),
    level,
    intensity: getIntensityLabel(level),
  };
}

/**
 * Select a random variant from array, or specific index if provided
 */
function selectVariant(variants, index = null) {
  if (index !== null && index >= 0 && index < variants.length) {
    return variants[index];
  }
  return variants[Math.floor(Math.random() * variants.length)];
}

/**
 * Replace template variables in message
 */
function replaceVariables(template, variables) {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{${key}}`, "g");
    result = result.replace(regex, value || "");
  }

  return result;
}

/**
 * Format overdue time in human-readable format
 */
function formatOverdueTime(totalMinutes) {
  if (totalMinutes < 60) {
    return `${totalMinutes} minutes`;
  } else if (totalMinutes < 1440) {
    // Less than a day
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ?
        `${hours} hours and ${minutes} minutes`
      : `${hours} hours`;
  } else {
    // Days
    const days = Math.floor(totalMinutes / 1440);
    const remainingHours = Math.floor((totalMinutes % 1440) / 60);
    return remainingHours > 0 ?
        `${days} days and ${remainingHours} hours`
      : `${days} days`;
  }
}

/**
 * Get intensity label for escalation level
 */
function getIntensityLabel(level) {
  const labels = {
    1: "friendly nudge",
    2: "serious concern",
    3: "maximum shame",
  };
  return labels[level] || "unknown";
}

/**
 * Generate contextual shame adjectives based on escalation level
 */
export function getShameAdjectives(level) {
  const adjectives = {
    1: ["behind", "overdue", "delayed", "late"],
    2: ["seriously behind", "chronically late", "unreliable", "struggling"],
    3: [
      "completely failed",
      "utterly unreliable",
      "broken their word",
      "accountability failure",
    ],
  };
  return adjectives[level] || adjectives[1];
}

/**
 * Generate escalation-appropriate emojis
 */
export function getEscalationEmojis(level) {
  const emojis = {
    1: ["⏰", "🔔", "💙", "🤝"],
    2: ["🚨", "🔥", "⚠️", "😟"],
    3: ["💀", "🔥", "⚡", "💯", "🚨"],
  };
  return emojis[level] || emojis[1];
}
