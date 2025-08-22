// Semantic Grouping Utility for Multi-Tab Summarizer

class SemanticGrouping {
  constructor() {
    this.commonCategories = {
      'Social Media': ['facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com', 'reddit.com', 'tiktok.com', 'snapchat.com', 'pinterest.com', 'discord.com', 'slack.com', 'teams.microsoft.com'],
      'News & Media': ['news', 'bbc.com', 'cnn.com', 'reuters.com', 'ap.org', 'npr.org', 'nytimes.com', 'wsj.com', 'guardian.com', 'telegraph.co.uk', 'washingtonpost.com', 'bloomberg.com', 'techcrunch.com', 'verge.com', 'wired.com'],
      'E-commerce': ['amazon.com', 'ebay.com', 'etsy.com', 'shopify.com', 'alibaba.com', 'walmart.com', 'target.com', 'bestbuy.com', 'shop', 'store', 'buy', 'cart', 'checkout', 'product'],
      'Entertainment': ['netflix.com', 'youtube.com', 'twitch.tv', 'spotify.com', 'apple.com/music', 'disney.com', 'hulu.com', 'primevideo.com', 'hbo.com', 'paramount.com', 'peacocktv.com', 'stream', 'watch', 'movie', 'tv', 'show'],
      'Development': ['github.com', 'stackoverflow.com', 'developer.mozilla.org', 'w3schools.com', 'codepen.io', 'jsfiddle.net', 'codesandbox.io', 'replit.com', 'glitch.com', 'heroku.com', 'vercel.com', 'netlify.com', 'aws.amazon.com', 'cloud.google.com', 'azure.microsoft.com'],
      'Education': ['coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org', 'pluralsight.com', 'lynda.com', 'udacity.com', 'skillshare.com', 'masterclass.com', 'mit.edu', 'stanford.edu', 'harvard.edu', 'learn', 'course', 'tutorial', 'education'],
      'Productivity': ['google.com/docs', 'google.com/sheets', 'google.com/slides', 'office.com', 'notion.so', 'trello.com', 'asana.com', 'monday.com', 'airtable.com', 'calendly.com', 'zoom.us', 'meet.google.com', 'dropbox.com', 'drive.google.com', 'onedrive.com'],
      'Finance': ['paypal.com', 'stripe.com', 'square.com', 'mint.com', 'robinhood.com', 'fidelity.com', 'schwab.com', 'vanguard.com', 'etrade.com', 'wellsfargo.com', 'bankofamerica.com', 'chase.com', 'citibank.com', 'credit', 'bank', 'finance', 'investment'],
      'Health & Fitness': ['webmd.com', 'mayoclinic.org', 'healthline.com', 'myfitnesspal.com', 'fitbit.com', 'strava.com', 'peloton.com', 'nike.com', 'health', 'fitness', 'exercise', 'nutrition', 'medical', 'doctor'],
      'Travel': ['booking.com', 'expedia.com', 'airbnb.com', 'tripadvisor.com', 'kayak.com', 'priceline.com', 'hotels.com', 'uber.com', 'lyft.com', 'maps.google.com', 'waze.com', 'travel', 'hotel', 'flight', 'vacation']
    };
    
    this.keywordPatterns = {
      'Social Media': ['social', 'chat', 'message', 'post', 'share', 'follow', 'like', 'comment', 'friend', 'network'],
      'News & Media': ['news', 'article', 'breaking', 'report', 'journalist', 'press', 'media', 'headline', 'story', 'politics'],
      'E-commerce': ['buy', 'sell', 'price', 'discount', 'sale', 'order', 'shipping', 'review', 'rating', 'product'],
      'Entertainment': ['watch', 'play', 'stream', 'music', 'video', 'game', 'movie', 'tv', 'episode', 'series'],
      'Development': ['code', 'programming', 'developer', 'api', 'documentation', 'tutorial', 'framework', 'library', 'repository', 'bug'],
      'Education': ['learn', 'course', 'lesson', 'tutorial', 'study', 'education', 'university', 'school', 'academic', 'research'],
      'Productivity': ['document', 'spreadsheet', 'presentation', 'calendar', 'meeting', 'task', 'project', 'collaboration', 'workflow', 'template'],
      'Finance': ['money', 'payment', 'transaction', 'account', 'balance', 'investment', 'stock', 'crypto', 'loan', 'insurance'],
      'Health & Fitness': ['health', 'fitness', 'exercise', 'diet', 'nutrition', 'medical', 'doctor', 'wellness', 'workout', 'symptom'],
      'Travel': ['travel', 'hotel', 'flight', 'destination', 'vacation', 'trip', 'booking', 'reservation', 'itinerary', 'map']
    };
  }

  /**
   * Groups tabs semantically based on their titles, URLs, and content
   * @param {Array} tabs - Array of tab objects with id, title, url, and optional content
   * @returns {Object} - Groups object with category names as keys and arrays of tabs as values
   */
  groupTabs(tabs) {
    const groups = {};
    const uncategorized = [];

    for (const tab of tabs) {
      const category = this.categorizeTab(tab);
      
      if (category) {
        if (!groups[category]) {
          groups[category] = {
            name: category,
            description: this.getCategoryDescription(category),
            tabs: []
          };
        }
        groups[category].tabs.push(tab);
      } else {
        uncategorized.push(tab);
      }
    }

    // If there are uncategorized tabs, add them to a generic group
    if (uncategorized.length > 0) {
      groups['Other'] = {
        name: 'Other',
        description: 'Miscellaneous tabs that don\'t fit into specific categories',
        tabs: uncategorized
      };
    }

    return groups;
  }

  /**
   * Categorizes a single tab based on its URL, title, and content
   * @param {Object} tab - Tab object with title, url, and optional content
   * @returns {string|null} - Category name or null if no category matches
   */
  categorizeTab(tab) {
    const url = tab.url.toLowerCase();
    const title = tab.title.toLowerCase();
    const content = (tab.content || '').toLowerCase();
    const hostname = this.extractHostname(url);

    // First, check for exact domain matches
    for (const [category, domains] of Object.entries(this.commonCategories)) {
      for (const domain of domains) {
        if (hostname.includes(domain) || url.includes(domain)) {
          return category;
        }
      }
    }

    // Then check for keyword matches in title and content
    for (const [category, keywords] of Object.entries(this.keywordPatterns)) {
      for (const keyword of keywords) {
        if (title.includes(keyword) || content.includes(keyword)) {
          return category;
        }
      }
    }

    // Special URL pattern matching
    if (url.includes('github.com') || url.includes('gitlab.com') || url.includes('bitbucket.org')) {
      return 'Development';
    }
    
    if (url.includes('google.com/search') || url.includes('bing.com/search') || url.includes('duckduckgo.com')) {
      return 'Search & Reference';
    }

    return null;
  }

  /**
   * Extracts hostname from URL
   * @param {string} url - Full URL
   * @returns {string} - Hostname
   */
  extractHostname(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  /**
   * Gets description for a category
   * @param {string} category - Category name
   * @returns {string} - Category description
   */
  getCategoryDescription(category) {
    const descriptions = {
      'Social Media': 'Social networking and communication platforms',
      'News & Media': 'News websites, blogs, and media outlets',
      'E-commerce': 'Online shopping and retail websites',
      'Entertainment': 'Streaming services, games, and entertainment content',
      'Development': 'Programming resources, documentation, and development tools',
      'Education': 'Learning platforms, courses, and educational content',
      'Productivity': 'Work tools, documents, and productivity applications',
      'Finance': 'Banking, payments, and financial services',
      'Health & Fitness': 'Health information, fitness tracking, and wellness content',
      'Travel': 'Travel planning, booking, and navigation services',
      'Search & Reference': 'Search engines and reference materials',
      'Other': 'Miscellaneous content that doesn\'t fit specific categories'
    };
    
    return descriptions[category] || `${category} related content`;
  }

  /**
   * Analyzes tab content to extract key topics
   * @param {string} content - Tab content text
   * @returns {Array} - Array of detected topics
   */
  extractTopics(content) {
    if (!content) return [];
    
    const text = content.toLowerCase();
    const topics = [];
    
    // Simple keyword extraction
    const topicKeywords = {
      'Technology': ['tech', 'software', 'hardware', 'computer', 'digital', 'internet', 'web', 'app', 'mobile'],
      'Business': ['business', 'company', 'corporate', 'market', 'industry', 'revenue', 'profit', 'startup'],
      'Science': ['research', 'study', 'science', 'scientific', 'experiment', 'discovery', 'theory', 'analysis'],
      'Politics': ['political', 'government', 'policy', 'election', 'vote', 'democracy', 'congress', 'senate'],
      'Sports': ['sport', 'game', 'team', 'player', 'match', 'championship', 'league', 'tournament'],
      'Arts': ['art', 'music', 'culture', 'artist', 'creative', 'design', 'painting', 'sculpture']
    };
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const matches = keywords.filter(keyword => text.includes(keyword));
      if (matches.length >= 2) {
        topics.push(topic);
      }
    }
    
    return topics;
  }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SemanticGrouping;
} else if (typeof window !== 'undefined') {
  window.SemanticGrouping = SemanticGrouping;
}