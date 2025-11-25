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

/**
 * Initialize Google Analytics
 * Call this once when the app loads
 */
export function initializeGA(): void {
  if (!GA_TRACKING_ID) {
    console.warn('Google Analytics tracking ID not found. Analytics will not be initialized.');
    return;
  }

  // Create dataLayer if it doesn't exist
  window.dataLayer = window.dataLayer || [];
  
  // Define gtag function
  function gtag(
    command: 'config' | 'event' | 'js' | 'set',
    targetId: string | Date,
    config?: Record<string, any>
  ): void {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }
  
  window.gtag = gtag;

  // Initialize GA
  gtag('js', new Date());
  gtag('config', GA_TRACKING_ID, {
    page_path: window.location.pathname,
  });

  // Load the GA script dynamically
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  document.head.appendChild(script);
}

/**
 * Track a page view
 */
export function trackPageView(path: string, title?: string): void {
  if (!GA_TRACKING_ID || !window.gtag) {
    return;
  }

  window.gtag('config', GA_TRACKING_ID, {
    page_path: path,
    page_title: title || document.title,
  });
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  eventParams?: {
    category?: string;
    label?: string;
    value?: number;
    [key: string]: any;
  }
): void {
  if (!GA_TRACKING_ID || !window.gtag) {
    return;
  }

  window.gtag('event', eventName, eventParams);
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
    trackEvent('purchase_credits', {
      category: 'monetization',
      value: amount,
      credits,
    });
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

