const BAD_WORDS = [
  "anal", "anus", "arse", "ass", "ballsack", "balls", "bastard", "bitch", "biatch", "bloody", "blowjob", "bollock", "bollok", "boner", "boob", "bugger", "buttplug", "clitoris", "cock", "coon", "crap", "cunt", "damn", "dick", "dildo", "dyke", "fag", "feck", "fellate", "fellatio", "felching", "fuck", "fudgepacker", "flange", "goddamn", "hell", "homo", "jizz", "knobend", "labia", "muff", "nigger", "nigga", "penis", "piss", "prick", "pube", "pussy", "queer", "scrotum", "sex", "shit", "sh1t", "slut", "smegma", "spunk", "tit", "tosser", "turd", "twat", "vagina", "wank", "whore"
];

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return BAD_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
}