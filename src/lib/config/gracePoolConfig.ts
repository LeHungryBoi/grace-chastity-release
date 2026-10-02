/**
 * ============================================================================
 * GRACE CHALLENGES POOL CONFIGURATION
 * ============================================================================
 * 
 * This file contains the self-contained pool of "Grace" challenges.
 * When a player has run low on Action Points (AP) or wishes to invoke Grace,
 * they can activate this consumable mechanic to petition for mercy.
 * 
 * Psychological Theme:
 * - Submissive obedience, asking for permission, humbling penance, and verbal devotion.
 * 
 * HOW TO ADD MORE CHALLENGES:
 * Simply add a new object to the `GRACE_CHALLENGES_POOL` array below with:
 * - id: Unique string identifier
 * - title: Concise title
 * - category: 'permission' | 'confession' | 'devotion' | 'penance' | 'posture'
 * - prompt: The exact action or verbal plea the player must perform
 * - subtext: Secondary humbling note or condition
 * - apReward: Number of Action Points granted upon clicking "Submit" (e.g., 2 or 3)
 * - flavorQuote: Humorous or psychological flavor line
 */

export interface GraceChallenge {
  id: string;
  title: string;
  category: 'permission' | 'confession' | 'devotion' | 'penance' | 'posture' | 'verbal';
  prompt: string;
  subtext?: string;
  apReward: number; // Amount of AP awarded if completed
  flavorQuote?: string;
}

export const GRACE_CHALLENGES_POOL: GraceChallenge[] = [
  {
    id: 'grace_plea_permission',
    title: 'The Formal Petition for Permission',
    category: 'permission',
    prompt: 'Look directly toward your partner or the DM, lower your gaze respectfully, and state aloud: "I respectfully beg for your gracious permission to continue my turn."',
    subtext: 'You may not speak or take another breath until permission is audibly granted or acknowledged.',
    apReward: 3,
    flavorQuote: '"A pathetic subject moves only when authorized by supreme authority."',
  },
  {
    id: 'grace_kneel_penance',
    title: 'Kneeling Submission of the Weak',
    category: 'posture',
    prompt: 'Drop to both knees with hands clasped behind your back for 15 seconds. Recite: "I acknowledge my complete weakness and accept whatever mercy is bestowed upon me."',
    subtext: 'Maintain the posture without fidgeting until timer concludes.',
    apReward: 3,
    flavorQuote: '"True discipline begins on the floor looking upward."',
  },
  {
    id: 'grace_pathetic_admission',
    title: 'Public Confession of Desperation',
    category: 'confession',
    prompt: 'State aloud clearly: "I am completely dependent on the mercy of this room, and I have zero control over my own release without explicit permission."',
    subtext: 'Tone must be sincere and devoid of arrogance or defensive laughter.',
    apReward: 2,
    flavorQuote: '"Acknowledging your pathetic helplessness is the first requirement of Grace."',
  },
  {
    id: 'grace_shoe_devotion',
    title: 'Grounded Reverence',
    category: 'devotion',
    prompt: 'Gently bow your head to ground level or toward the DM/partner\'s feet and declare: "Thank you for tolerating my presence and granting me unearned moments of play."',
    subtext: 'Hold position for 10 seconds of silent contemplation.',
    apReward: 3,
    flavorQuote: '"Unearned privileges require genuine gratitude."',
  },
  {
    id: 'grace_hands_flat_surrender',
    title: 'Physical Surrender on All Fours',
    category: 'posture',
    prompt: 'Place hands and knees flat on the floor, head bowed, and state 3 times: "I am here solely at your discretion."',
    subtext: 'Do not rise until you click Submit.',
    apReward: 3,
    flavorQuote: '"Posture reflects the internal hierarchy."',
  },
  {
    id: 'grace_permission_to_breathe',
    title: 'Begging for Action Allowance',
    category: 'permission',
    prompt: 'Address the DM or partner: "May I please have the privilege of taking another step in your gauntlet? I do not deserve it on my own merits."',
    subtext: 'Wait 5 seconds in respectful silence before confirming.',
    apReward: 2,
    flavorQuote: '"Permission is a gift, never a right."',
  },
  {
    id: 'grace_sensory_denial_preview',
    title: 'Sensory Deprivation Hold',
    category: 'penance',
    prompt: 'Close your eyes tightly and place both hands flat over your ears for 20 seconds while maintaining completely rigid, obedient stillness.',
    subtext: 'Any twitching or peeking forfeits the Grace token.',
    apReward: 3,
    flavorQuote: '"Darkness teaches the restless mind to yield."',
  },
  {
    id: 'grace_verbal_ownership',
    title: 'Declaration of Total Subservience',
    category: 'verbal',
    prompt: 'Recite in an earnest tone: "Every roll I make, every tile I step upon, and any release I might hope for is strictly under the control of my superiors."',
    subtext: 'Maintain unbroken eye contact or head bowed as dictated by house rules.',
    apReward: 2,
    flavorQuote: '"Freedom is an illusion; submission is absolute."',
  },
  {
    id: 'grace_silent_humiliation_clock',
    title: 'The Silent 20-Second Penance',
    category: 'penance',
    prompt: 'Remain completely motionless on the floor with your palms facing upward in supplication for 20 continuous seconds.',
    subtext: 'No speaking, smiling, or shifting weight.',
    apReward: 3,
    flavorQuote: '"Stillness tests whether the ego has truly crumbled."',
  },
  {
    id: 'grace_gratitude_plea',
    title: 'Plea of the Denied Petitioner',
    category: 'confession',
    prompt: 'Look at the group and proclaim: "I confess that I crave permission more than victory, and I thank you for keeping me in my rightful place."',
    subtext: 'Must be delivered with authentic humility.',
    apReward: 2,
    flavorQuote: '"A true submissive finds peace in the refusal of autonomy."',
  },
  {
    id: 'grace_wifey_tribute',
    title: 'The Wifey Command Tribute',
    category: 'permission',
    prompt: 'Send a quick message, text, or state aloud to your partner: "Humbly reporting in for permission to take an extra turn in the gauntlet. Awaiting your judgment."',
    subtext: 'If playing hotseat with partner present, deliver directly to her face while looking down.',
    apReward: 3,
    flavorQuote: '"Dan and Mark know best: the wife holds all the keys."',
  },
  {
    id: 'grace_chastity_confession',
    title: 'The Denial Oath',
    category: 'confession',
    prompt: 'Place your hand over your heart and swear aloud: "I swear that I will not attempt to release or touch myself without passing the Final Apex Gauntlet and receiving unanimous authorization."',
    subtext: 'A solemn binding oath for the remainder of the session.',
    apReward: 3,
    flavorQuote: '"An oath sworn in desperation is doubly binding."',
  },
];

/**
 * Helper to draw a random Grace challenge from the pool.
 */
export function getRandomGraceChallenge(): GraceChallenge {
  const index = Math.floor(Math.random() * GRACE_CHALLENGES_POOL.length);
  return GRACE_CHALLENGES_POOL[index];
}
