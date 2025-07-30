/**
 * Format currency from cents to dollars
 */
export const formatCurrency = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

/**
 * Format currency for display (shorter format for large numbers)
 */
export const formatCurrencyShort = (cents: number): string => {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}K`;
  }
  return formatCurrency(cents);
};

/**
 * Generate MD5 hash for Gravatar (browser-compatible implementation)
 */
const md5 = (str: string): string => {
  // Simple hash function for browser compatibility (for Gravatar identicon consistency)
  const input = str.toLowerCase().trim();
  let hash = 0;
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to hex string (simplified for identicon purposes)
  return Math.abs(hash).toString(16).padStart(8, '0').repeat(4).substring(0, 32);
};

/**
 * Generate Gravatar URL
 */
export const generateGravatarUrl = (email: string, size: number = 80): string => {
  // For demo purposes, we'll use a hash of the player name as email
  const hash = md5(email);
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg`;
};

/**
 * Generate Gravatar URL from player name (fallback for when email isn't available)
 */
export const generateAvatarFromName = (name: string, size: number = 80): string => {
  // Use the player name as a pseudo-email for consistent avatar generation
  const pseudoEmail = `${name.toLowerCase().replace(/\s+/g, '.')}@stockticker.game`;
  return generateGravatarUrl(pseudoEmail, size);
};

/**
 * Generate a random color for player avatars (fallback)
 */
export const generateAvatarColor = (name: string): string => {
  const colors = [
    'var(--st-primary-blue)', 'var(--st-gold)', 'var(--st-green)', 'var(--st-orange)',
    'var(--st-primary-blue-dark)', 'var(--st-gold-dark)', '#7c3aed', '#059669'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Get player initials for avatar
 */
export const getPlayerInitials = (name: string): string => {
  const names = name.trim().split(' ');
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

/**
 * Format stock price change
 */
export const formatPriceChange = (change: number): { text: string; className: string } => {
  if (change > 0) {
    return {
      text: `+${formatCurrency(change)}`,
      className: 'text-green-600'
    };
  } else if (change < 0) {
    return {
      text: formatCurrency(change),
      className: 'text-red-600'
    };
  } else {
    return {
      text: '$0.00',
      className: 'text-gray-600'
    };
  }
};

/**
 * Calculate percentage change
 */
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Format percentage
 */
export const formatPercentage = (percentage: number): string => {
  return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`;
};

/**
 * Debounce function for user input
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Get stock emoji
 */
export const getStockEmoji = (stockType: string): string => {
  const emojis: Record<string, string> = {
    gold: '🥇',
    silver: '🥈',
    bonds: '📊',
    oil: '🛢️',
    industrials: '🏭',
    grain: '🌾'
  };
  
  return emojis[stockType] || '📈';
};

/**
 * Validate player name
 */
export const validatePlayerName = (name: string): { valid: boolean; error?: string } => {
  const trimmed = name.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Player name is required' };
  }
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Player name must be at least 2 characters' };
  }
  
  if (trimmed.length > 20) {
    return { valid: false, error: 'Player name must be less than 20 characters' };
  }
  
  if (!/^[a-zA-Z0-9\s]+$/.test(trimmed)) {
    return { valid: false, error: 'Player name can only contain letters, numbers, and spaces' };
  }
  
  return { valid: true };
};

/**
 * Validate room name
 */
export const validateRoomName = (name: string): { valid: boolean; error?: string } => {
  const trimmed = name.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Room name is required' };
  }
  
  if (trimmed.length < 3) {
    return { valid: false, error: 'Room name must be at least 3 characters' };
  }
  
  if (trimmed.length > 50) {
    return { valid: false, error: 'Room name must be less than 50 characters' };
  }
  
  return { valid: true };
};

/**
 * Validate invite code
 */
export const validateInviteCode = (code: string): { valid: boolean; error?: string } => {
  const trimmed = code.trim().toUpperCase();
  
  if (!trimmed) {
    return { valid: false, error: 'Invite code is required' };
  }
  
  if (trimmed.length !== 6) {
    return { valid: false, error: 'Invite code must be 6 characters' };
  }
  
  if (!/^[A-Z0-9]+$/.test(trimmed)) {
    return { valid: false, error: 'Invite code can only contain letters and numbers' };
  }
  
  return { valid: true };
};

/**
 * Format time duration
 */
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Check if device is mobile
 */
export const isMobile = (): boolean => {
  return window.innerWidth < 768;
};

/**
 * Check if device supports touch
 */
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};