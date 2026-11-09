// Friendly text for the API error codes in the brief.
const FRIENDLY_MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: "Please log in to continue.",
  VALIDATION: "Please check the form and try again.",
  NOT_FOUND: "This circle is not available to you.",
  TIER_TOO_LOW: "This circle needs a higher tier than yours.",
  NATIONALITY_EXCLUDED: "This circle is not open to your nationality.",
  CIRCLE_FULL: "This circle is full.",
  ALREADY_MEMBER: "You are already in this circle.",
  NOT_YOUR_TURN: "Only this cycle's winner can release the payout.",
  POT_NOT_FULL: "Not everyone has paid yet.",
  PAYOUT_ALREADY_RELEASED: "The payout was already sent.",
  COUNTRY_NOT_SUPPORTED: "Payments are not available for your country yet.",
  PAYPAL_ERROR: "PayPal had a problem, please try again.",
  NETWORK: "Could not reach the server. Please try again.",
};

// Fall back to the server's own message when we do not have a code.
export function friendlyError(code: string, fallback: string): string {
  return FRIENDLY_MESSAGES[code] ?? fallback;
}
