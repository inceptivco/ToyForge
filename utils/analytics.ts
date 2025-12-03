/**
 * Google Analytics Integration
 * 
 * Provides type-safe tracking functions for page views and custom events
 */

import { getOptionalEnv } from './env';

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

// Get GA tracking ID from environment
const GA_TRACKING_ID = getOptionalEnv('VITE_GA_TRACKING_ID');
let isGAScriptLoaded = false;
const pendingCommands: Array<() => void> = [];
let isScriptInjected = false;

function runOrQueue(command: () => void): void {
  // Check if Google's real gtag function is available (it has a different signature than our custom one)
  const hasRealGtag = window.gtag && window.gtag.toString().includes('dataLayer');
  if (isGAScriptLoaded && hasRealGtag) {
    command();
  } else {
    pendingCommands.push(command);
  }
}

function flushPendingCommands(): void {
  if (!isGAScriptLoaded || !window.gtag) {
    return;
  }

  while (pendingCommands.length) {
    const command = pendingCommands.shift();
    command?.();
  }
}

/**
 * Initialize Google Analytics
 * Call this once when the app loads
 */
export function initializeGA(): void {
  if (!GA_TRACKING_ID) {
    console.warn('Google Analytics tracking ID not found. Analytics will not be initialized.');
    return;
  }

  if (typeof window === 'undefined' || isScriptInjected) {
    return;
  }
  isScriptInjected = true;

  // Initialize dataLayer and gtag function before loading the script
  // This follows the standard Google Analytics initialization pattern
  window.dataLayer = window.dataLayer || [];
  
  function gtag(...args: any[]): void {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(args);
  }
  
  window.gtag = gtag as any;

  // Queue initial configuration commands in dataLayer
  // Google's script will process these automatically when it loads
  gtag('js', new Date());
  gtag('config', GA_TRACKING_ID, {
    page_path: window.location.pathname,
  });

  // Load the GA script asynchronously
  // When it loads, it will automatically process the dataLayer
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  
  script.onload = () => {
    // Google's script processes dataLayer automatically
    // Mark as loaded after a short delay to ensure script has executed
    setTimeout(() => {
      isGAScriptLoaded = true;
      flushPendingCommands();
    }, 100);
  };
  
  script.onerror = () => {
    console.error('Failed to load Google Analytics script');
  };
  
  document.head.appendChild(script);
}

/**
 * Track a page view
 */
export function trackPageView(path: string, title?: string): void {
  if (!GA_TRACKING_ID) {
    return;
  }

  runOrQueue(() => {
    window.gtag?.('config', GA_TRACKING_ID, {
      page_path: path,
      page_title: title || document.title,
    });
  });
}

/**
 * Track a custom event
 * @param eventName - Name of the event
 * @param eventParams - Event parameters
 * @param useBeacon - If true, configures beacon transport for reliable delivery during page unload
 */
export function trackEvent(
  eventName: string,
  eventParams?: {
    category?: string;
    label?: string;
    value?: number;
    [key: string]: any;
  },
  useBeacon: boolean = false
): void {
  if (!GA_TRACKING_ID) {
    return;
  }

  runOrQueue(() => {
    if (!window.gtag) {
      return;
    }

    if (useBeacon) {
      window.gtag('config', GA_TRACKING_ID, {
        transport_type: 'beacon',
      });
    }

    // Send the event
    window.gtag('event', eventName, eventParams);

    if (useBeacon) {
      setTimeout(() => {
        window.gtag?.('config', GA_TRACKING_ID, {
          transport_type: undefined,
        });
      }, 0);
    }
  });
}

/**
 * Common event tracking helpers
 */
export const analytics = {
  // User actions
  signIn: (method?: string) => {
    trackEvent('sign_in', { method });
  },
  
  signOut: () => {
    trackEvent('sign_out');
  },
  
  signUp: (method?: string) => {
    trackEvent('sign_up', { method });
  },

  // Character generation
  generateCharacter: (config?: {
    gender?: string;
    ageGroup?: string;
    transparent?: boolean;
  }) => {
    trackEvent('generate_character', {
      category: 'character_generation',
      ...config,
    });
  },

  // Credit purchases
  viewCredits: () => {
    trackEvent('view_credits', {
      category: 'monetization',
    });
  },

  purchaseCredits: (amount: number, credits: number) => {
    // Use beacon transport for critical purchase events before page navigation
    trackEvent('purchase_credits', {
      category: 'monetization',
      value: amount,
      credits,
    }, true); // true = use beacon API
  },

  // API usage
  createApiKey: () => {
    trackEvent('create_api_key', {
      category: 'api',
    });
  },

  apiRequest: (endpoint?: string) => {
    trackEvent('api_request', {
      category: 'api',
      endpoint,
    });
  },

  // Navigation
  clickLink: (destination: string) => {
    trackEvent('click_link', {
      category: 'navigation',
      destination,
    });
  },

  // Developer dashboard
  viewDashboard: (section?: string) => {
    trackEvent('view_dashboard', {
      category: 'developer',
      section,
    });
  },

  // Figma integration
  figmaAuth: () => {
    trackEvent('figma_auth', {
      category: 'integration',
    });
  },
};

