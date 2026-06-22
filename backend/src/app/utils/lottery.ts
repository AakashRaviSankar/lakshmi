/**
 * Calculates the winning payout for a ticket based on its game type and purchase price.
 * 
 * - Single (SINGLE_A, SINGLE_B, SINGLE_C): Price ₹11, Win ₹100
 * - Double (DOUBLE_AB, DOUBLE_BC, DOUBLE_AC): Price ₹11, Win ₹1000
 * - Three (THREE_DIGIT):
 *   - Price ₹12 -> Win ₹6,250
 *   - Price ₹28 -> Win ₹15,000
 *   - Price ₹30 -> Win ₹17,500
 *   - Price ₹55 -> Win ₹30,000
 *   - Price ₹60 -> Win ₹35,000
 * - Four (FOUR_DIGIT): Price ₹50, Win ₹100,000
 */
export function getTicketPayout(gameType: string, ticketAmount: number): number {
  if (gameType.startsWith("SINGLE")) {
    return 100;
  }
  if (gameType.startsWith("DOUBLE")) {
    return 1000;
  }
  if (gameType === "THREE_DIGIT") {
    switch (ticketAmount) {
      case 12: return 6250;
      case 28: return 15000;
      case 30: return 17500;
      case 55: return 30000;
      case 60: return 15000; // Updated from 35000 based on user's new rules
      default: return ticketAmount * 900; // fallback
    }
  }
  if (gameType === "FOUR_DIGIT") {
    if (ticketAmount === 50) {
      return 100000;
    }
    return ticketAmount * 9000; // fallback
  }
  return 0;
}

/**
 * Calculates the exact winning payout for a ticket based on the winning number.
 * Supports partial matches for THREE_DIGIT type:
 * - 3 Digits: t === w.substring(1)
 * - Last 2 Digits: t.substring(1) === w.substring(1).substring(1)
 * - Last 1 Digit: t.substring(2) === w.substring(1).substring(2)
 */
export function calculateTicketWinnings(
  gameType: string,
  ticketAmount: number,
  ticketNumber: string,
  winningNumber: string
): number {
  if (!winningNumber || winningNumber.length < 4) {
    return 0;
  }

  const w = winningNumber.trim();
  const t = ticketNumber.trim();

  if (gameType === "THREE_DIGIT") {
    if (t.length !== 3) return 0;
    // The 3-digit winning key is the last 3 digits of the 4-digit winning number (a, b, c)
    const w3 = w.substring(1); 

    const is3Match = t === w3;
    const is2Match = t.substring(1) === w3.substring(1);
    const is1Match = t.substring(2) === w3.substring(2);

    if (is3Match) {
      switch (ticketAmount) {
        case 12: return 6250;
        case 28: return 15000;
        case 30: return 17500;
        case 55: return 30000;
        case 60: return 15000;
        default: return ticketAmount * 900;
      }
    } else if (is2Match) {
      switch (ticketAmount) {
        case 12: return 250;
        case 28: return 500;
        case 30: return 500;
        case 55: return 1000;
        case 60: return 1000;
        default: return ticketAmount * 20;
      }
    } else if (is1Match) {
      switch (ticketAmount) {
        case 12: return 10;
        case 28: return 50;
        case 30: return 50;
        case 55: return 100;
        case 60: return 100;
        default: return ticketAmount * 2;
      }
    }
    return 0;
  }

  // Check winning status for other game types (using last 3 digits as a, b, c)
  // If winningNumber is 1078, then:
  // a = w[1] ('0')
  // b = w[2] ('7')
  // c = w[3] ('8')
  let isWinner = false;
  switch (gameType) {
    case "SINGLE_A":
      isWinner = w[1] === t;
      break;
    case "SINGLE_B":
      isWinner = w[2] === t;
      break;
    case "SINGLE_C":
      isWinner = w[3] === t;
      break;
    case "DOUBLE_AB":
      isWinner = (w[1] + w[2]) === t;
      break;
    case "DOUBLE_BC":
      isWinner = (w[2] + w[3]) === t;
      break;
    case "DOUBLE_AC":
      isWinner = (w[1] + w[3]) === t;
      break;
    case "FOUR_DIGIT":
      isWinner = w === t;
      break;
  }

  if (isWinner) {
    return getTicketPayout(gameType, ticketAmount);
  }

  return 0;
}

