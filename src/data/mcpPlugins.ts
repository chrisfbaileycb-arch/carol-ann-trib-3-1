/**
 * Single source of truth for Carol Ann's MCP Plugins & Connectors Marketplace,
 * Connected Ecosystems & Channels (Social, Hospitality, Commerce, Zapier Universal Gateway),
 * and dynamic tool schemas.
 */

export type PluginCategory =
  | 'popular'
  | 'commerce'
  | 'social'
  | 'hospitality'
  | 'productivity'
  | 'finance';

export interface PluginToolDefinition {
  name: string;
  displayName: string;
  description: string;
  actionType: 'read' | 'write';
  requiresConfirmation: boolean;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

export interface MCPPlugin {
  id: string;
  name: string;
  category: PluginCategory;
  description: string;
  vendor: string;
  iconType:
    | 'instagram'
    | 'facebook'
    | 'tiktok'
    | 'youtube'
    | 'tripadvisor'
    | 'yelp'
    | 'google'
    | 'shopify'
    | 'quickbooks'
    | 'stripe'
    | 'zapier'
    | 'gmail'
    | 'gdrive'
    | 'gcalendar'
    | 'github'
    | 'slack'
    | 'notion'
    | 'canva'
    | 'hubspot'
    | 'wordpress'
    | 'trello'
    | 'asana'
    | 'monday'
    | 'box'
    | 'clickup'
    | 'coda'
    | 'plaid'
    | 'ibkr'
    | 'expensify'
    | 'wave';
  badge?: string;
  ecosystemGroup?: 'social' | 'hospitality' | 'commerce' | 'universal';
  authType: 'OAuth 2.0' | 'API Key' | 'Zapier Bridge' | 'Sovereign Bus';
  endpoint: string;
  latencyMs: number;
  tools: PluginToolDefinition[];
}

export interface ZapierActionMeta {
  id: string;
  name: string;
  app: string;
  description: string;
  category: string;
  actionType: 'read' | 'write';
  requiresConfirmation: boolean;
  enabled: boolean;
  testedAt?: string;
}

export interface ZapierConfig {
  endpointUrl: string;
  apiKey: string;
  isConnected: boolean;
  lastSyncedAt?: string;
  actions: ZapierActionMeta[];
}

// ----------------------------------------------------------------------------
// Pre-configured Directory of Plugins & MCP Bridges
// ----------------------------------------------------------------------------

export const MCP_PLUGINS_DIRECTORY: MCPPlugin[] = [
  // 1. Social & Marketing
  {
    id: 'instagram-reels',
    name: 'Meta / Instagram Reels',
    category: 'social',
    description: 'Schedule Instagram Reels, generate trend-aligned captions, sync viral audios, and monitor video reach.',
    vendor: 'Meta Platforms Inc.',
    iconType: 'instagram',
    badge: 'Trending',
    ecosystemGroup: 'social',
    authType: 'OAuth 2.0',
    endpoint: 'https://graph.instagram.com/v19.0/mcp',
    latencyMs: 14,
    tools: [
      {
        name: 'insta_schedule_reel',
        displayName: 'Schedule Instagram Reel',
        description: 'Preps and schedules a video Reel with captions, cover frame, and audio tags.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            caption: { type: 'STRING', description: 'Reel caption with hashtags' },
            video_url: { type: 'STRING', description: 'Staged media asset URL' },
            scheduled_time: { type: 'STRING', description: 'ISO date or relative schedule time' },
          },
          required: ['caption'],
        },
      },
      {
        name: 'insta_generate_caption',
        displayName: 'Generate Trend Caption',
        description: 'Generates high-engagement captions with optimal hashtags and CTA for Instagram.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            topic: { type: 'STRING', description: 'Product, mood, or subject matter' },
            tone: { type: 'STRING', description: 'Aesthetic, luxury, playful, or professional' },
          },
          required: ['topic'],
        },
      },
      {
        name: 'insta_get_analytics',
        displayName: 'Fetch Reel Analytics',
        description: 'Pulls views, saves, watch-time retention, and audience demographics.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            period: { type: 'STRING', description: '7d, 30d, or 90d' },
          },
        },
      },
    ],
  },
  {
    id: 'facebook-pages',
    name: 'Facebook Pages & Groups',
    category: 'social',
    description: 'Broadcast updates to linked brand pages, manage community group inquiries, and schedule posts.',
    vendor: 'Meta Platforms Inc.',
    iconType: 'facebook',
    ecosystemGroup: 'social',
    authType: 'OAuth 2.0',
    endpoint: 'https://graph.facebook.com/v19.0/mcp',
    latencyMs: 16,
    tools: [
      {
        name: 'facebook_publish_post',
        displayName: 'Publish Facebook Post',
        description: 'Dispatches announcements, photo galleries, or links to managed Facebook Pages.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            page_id: { type: 'STRING', description: 'Target Page or Group identifier' },
            message: { type: 'STRING', description: 'Post text content' },
          },
          required: ['message'],
        },
      },
      {
        name: 'facebook_get_group_feed',
        displayName: 'Fetch Group Feed',
        description: 'Retrieves unanswered member inquiries and trending discussions.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            group_id: { type: 'STRING', description: 'Community Group ID' },
          },
        },
      },
    ],
  },
  {
    id: 'tiktok-creator',
    name: 'TikTok Creator Studio',
    category: 'social',
    description: 'Draft TikTok posts, analyze sound trending charts, auto-generate captions, and stage video publishing.',
    vendor: 'ByteDance Ltd.',
    iconType: 'tiktok',
    badge: 'Popular',
    ecosystemGroup: 'social',
    authType: 'OAuth 2.0',
    endpoint: 'https://open.tiktokapis.com/v2/mcp',
    latencyMs: 19,
    tools: [
      {
        name: 'tiktok_schedule_draft',
        displayName: 'Schedule TikTok Draft',
        description: 'Stages a formatted video draft in Creator Studio for one-tap publishing.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Video title & tags' },
            privacy: { type: 'STRING', description: 'public, friends, or private' },
          },
          required: ['title'],
        },
      },
      {
        name: 'tiktok_get_analytics',
        displayName: 'Query Video Performance',
        description: 'Reads profile views, follower conversions, and viral velocity metrics.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            video_id: { type: 'STRING', description: 'Target video identifier' },
          },
        },
      },
    ],
  },
  {
    id: 'youtube-studio',
    name: 'YouTube Studio & Shorts',
    category: 'social',
    description: 'Publish Shorts, optimize title/tags SEO metadata, inspect real-time CTR, and conduct community polls.',
    vendor: 'Google LLC',
    iconType: 'youtube',
    ecosystemGroup: 'social',
    authType: 'OAuth 2.0',
    endpoint: 'https://youtube.googleapis.com/youtube/v3/mcp',
    latencyMs: 11,
    tools: [
      {
        name: 'youtube_publish_short',
        displayName: 'Stage YouTube Short',
        description: 'Preps a vertical Short draft with auto-chapters and recommended SEO tags.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Short title' },
            tags: { type: 'STRING', description: 'Comma-separated SEO tags' },
          },
          required: ['title'],
        },
      },
      {
        name: 'youtube_get_channel_metrics',
        displayName: 'Inspect Channel Metrics',
        description: 'Retrieves subscriber velocity, top performing videos, and estimated revenue.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            metrics: { type: 'STRING', description: 'views, subscribers, watchTime' },
          },
        },
      },
    ],
  },

  // 2. Hospitality & Reviews
  {
    id: 'tripadvisor',
    name: 'TripAdvisor Reviews & Listings',
    category: 'hospitality',
    description: 'Fetch guest reviews, track hospitality rankings, and draft empathetic, polite host responses.',
    vendor: 'Tripadvisor LLC',
    iconType: 'tripadvisor',
    badge: 'Essential',
    ecosystemGroup: 'hospitality',
    authType: 'API Key',
    endpoint: 'https://api.content.tripadvisor.com/api/v1/mcp',
    latencyMs: 22,
    tools: [
      {
        name: 'tripadvisor_fetch_reviews',
        displayName: 'Fetch TripAdvisor Reviews',
        description: 'Pulls latest guest reviews, star ratings, reviewer details, and sentiment tags.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            location_id: { type: 'STRING', description: 'Listing location identifier' },
            filter: { type: 'STRING', description: 'recent, unaddressed, or 5-star' },
          },
        },
      },
      {
        name: 'tripadvisor_post_reply',
        displayName: 'Post Host Response',
        description: 'Submits an official management response to a guest review on TripAdvisor.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            review_id: { type: 'STRING', description: 'Review ID to answer' },
            response_text: { type: 'STRING', description: 'Polite, customized host reply' },
          },
          required: ['review_id', 'response_text'],
        },
      },
    ],
  },
  {
    id: 'yelp-business',
    name: 'Yelp for Business',
    category: 'hospitality',
    description: 'Monitor business reputation, review alerts, customer photos, and manage special hours & announcements.',
    vendor: 'Yelp Inc.',
    iconType: 'yelp',
    ecosystemGroup: 'hospitality',
    authType: 'API Key',
    endpoint: 'https://api.yelp.com/v3/mcp',
    latencyMs: 25,
    tools: [
      {
        name: 'yelp_get_reviews',
        displayName: 'Query Yelp Reviews',
        description: 'Fetches recent customer ratings, reviews, and sentiment scoring.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            business_id: { type: 'STRING', description: 'Yelp Business alias or ID' },
          },
        },
      },
      {
        name: 'yelp_update_hours',
        displayName: 'Update Operating Hours',
        description: 'Syncs holiday or seasonal hours across your Yelp profile.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            special_hours: { type: 'STRING', description: 'Date and opening/closing intervals' },
          },
          required: ['special_hours'],
        },
      },
    ],
  },
  {
    id: 'google-business',
    name: 'Google Business Profile',
    category: 'hospitality',
    description: 'Local search rankings, Google Maps verified reviews, customer Q&A, and business attributes.',
    vendor: 'Google LLC',
    iconType: 'google',
    ecosystemGroup: 'hospitality',
    authType: 'OAuth 2.0',
    endpoint: 'https://mybusinessbusinessinformation.googleapis.com/v1/mcp',
    latencyMs: 15,
    tools: [
      {
        name: 'gbp_fetch_reviews',
        displayName: 'Get Google Reviews',
        description: 'Fetches verified customer reviews from Google Maps listing.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            unanswered_only: { type: 'STRING', description: 'true or false' },
          },
        },
      },
      {
        name: 'gbp_post_update',
        displayName: 'Post Google Business Update',
        description: 'Publishes an event or announcement directly onto Google Search & Maps.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            summary: { type: 'STRING', description: 'Announcement text' },
            call_to_action: { type: 'STRING', description: 'BOOK, ORDER, or LEARN_MORE' },
          },
          required: ['summary'],
        },
      },
    ],
  },

  // 3. Commerce & Finance
  {
    id: 'shopify',
    name: 'Shopify Storefront & Orders',
    category: 'commerce',
    description: 'Real-time GMV sales numbers, order fulfillment status, customer lookups, and inventory tracking.',
    vendor: 'Shopify Inc.',
    iconType: 'shopify',
    badge: 'High Demand',
    ecosystemGroup: 'commerce',
    authType: 'OAuth 2.0',
    endpoint: 'https://api.shopify.com/admin/2024-01/mcp',
    latencyMs: 18,
    tools: [
      {
        name: 'shopify_get_orders',
        displayName: 'Fetch Orders & Sales',
        description: 'Pulls today\'s gross merchandise value, unfulfilled orders, and customer details.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            status: { type: 'STRING', description: 'open, fulfilled, or any' },
            limit: { type: 'STRING', description: 'Number of orders to retrieve' },
          },
        },
      },
      {
        name: 'shopify_get_inventory',
        displayName: 'Inspect Product Inventory',
        description: 'Checks live stock levels and alerts on depleted product variants.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            sku_or_title: { type: 'STRING', description: 'Product title or SKU' },
          },
        },
      },
      {
        name: 'shopify_update_product',
        displayName: 'Update Product Details',
        description: 'Updates price, stock quantities, or description on Shopify catalog.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            product_id: { type: 'STRING', description: 'Product ID' },
            price: { type: 'STRING', description: 'New pricing value' },
            inventory_delta: { type: 'STRING', description: 'Stock delta (+/-)' },
          },
          required: ['product_id'],
        },
      },
    ],
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    category: 'commerce',
    description: 'Accounts receivable, balance sheets, expense tracking, and automated invoice creation & dispatch.',
    vendor: 'Intuit Inc.',
    iconType: 'quickbooks',
    badge: 'Enterprise',
    ecosystemGroup: 'commerce',
    authType: 'OAuth 2.0',
    endpoint: 'https://quickbooks.api.intuit.com/v3/company/mcp',
    latencyMs: 24,
    tools: [
      {
        name: 'quickbooks_get_invoices',
        displayName: 'Fetch Invoices & Overdue Ledger',
        description: 'Pulls open, paid, and overdue customer invoices with balances and aging.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            status: { type: 'STRING', description: 'unpaid, overdue, or all' },
          },
        },
      },
      {
        name: 'quickbooks_create_invoice',
        displayName: 'Create & Dispatch Invoice',
        description: 'Generates a formal invoice for a client with line items, tax, and payment terms.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            customer_name: { type: 'STRING', description: 'Client or business name' },
            amount: { type: 'STRING', description: 'Total invoice amount' },
            line_items: { type: 'STRING', description: 'Services or items delivered' },
            due_date: { type: 'STRING', description: 'Invoice payment due date' },
          },
          required: ['customer_name', 'amount'],
        },
      },
      {
        name: 'quickbooks_get_balances',
        displayName: 'Query Account Balances',
        description: 'Inspects operating bank balances, total accounts receivable, and net expenses.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            period: { type: 'STRING', description: 'this_month, this_quarter, or year_to_date' },
          },
        },
      },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe Payments & Billing',
    category: 'commerce',
    description: 'Payment intents, subscription management, failed charge diagnostics, and payout transfers.',
    vendor: 'Stripe Inc.',
    iconType: 'stripe',
    ecosystemGroup: 'commerce',
    authType: 'API Key',
    endpoint: 'https://api.stripe.com/v1/mcp',
    latencyMs: 12,
    tools: [
      {
        name: 'stripe_get_charges',
        displayName: 'Query Recent Charges',
        description: 'Returns real-time customer payments, charge statuses, and fee breakdowns.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            limit: { type: 'STRING', description: 'Record count' },
          },
        },
      },
      {
        name: 'stripe_create_payment_link',
        displayName: 'Generate Payment Link',
        description: 'Creates a hosted checkout link for one-off charges or subscriptions.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            item_name: { type: 'STRING', description: 'Product or retainer label' },
            amount_cents: { type: 'STRING', description: 'Amount in cents (e.g. 50000 for $500.00)' },
          },
          required: ['item_name', 'amount_cents'],
        },
      },
    ],
  },

  // 4. Universal Automation Bridge: Zapier MCP Gateway
  {
    id: 'zapier-gateway',
    name: 'Zapier Universal MCP Gateway',
    category: 'popular',
    description: 'One single endpoint connecting Carol Ann to 7,000+ pre-authenticated SaaS actions & AI workflows.',
    vendor: 'Zapier Inc.',
    iconType: 'zapier',
    badge: 'Universal Bridge',
    ecosystemGroup: 'universal',
    authType: 'Zapier Bridge',
    endpoint: 'https://actions.zapier.com/settings/mcp/',
    latencyMs: 38,
    tools: [
      {
        name: 'zapier_execute_action',
        displayName: 'Execute Zapier AI Action',
        description: 'Invokes any pre-authenticated Zapier Action across linked apps (Slack, Gmail, Notion, etc.).',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            action_name: { type: 'STRING', description: 'Registered Zapier Action (e.g., Post Reel, Send Invoice)' },
            parameters_json: { type: 'STRING', description: 'JSON string of input arguments' },
          },
          required: ['action_name'],
        },
      },
      {
        name: 'zapier_list_actions',
        displayName: 'Discover Enabled Actions',
        description: 'Discovers all configured actions on your Zapier MCP endpoint.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
    ],
  },

  // 5. Popular / Essentials
  {
    id: 'gmail',
    name: 'Gmail & Google Workspace Mail',
    category: 'popular',
    description: 'Search VIP threads, triage correspondence, summarize attachments, and draft polite replies.',
    vendor: 'Google LLC',
    iconType: 'gmail',
    authType: 'OAuth 2.0',
    endpoint: 'https://gmail.googleapis.com/gmail/v1/mcp',
    latencyMs: 14,
    tools: [
      {
        name: 'gmail_search_threads',
        displayName: 'Search Inbox Threads',
        description: 'Queries email threads by sender, subject query, or unread priority.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            query: { type: 'STRING', description: 'Search term or label:unread' },
          },
        },
      },
      {
        name: 'gmail_draft_message',
        displayName: 'Draft Email Reply',
        description: 'Prepares a polished response draft for your review before dispatch.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            to: { type: 'STRING', description: 'Recipient email address' },
            subject: { type: 'STRING', description: 'Email subject' },
            body: { type: 'STRING', description: 'Email content' },
          },
          required: ['to', 'body'],
        },
      },
    ],
  },
  {
    id: 'google-drive',
    name: 'Google Drive & Docs',
    category: 'popular',
    description: 'Semantic document retrieval, executive brief generation, and folder sharing permissions.',
    vendor: 'Google LLC',
    iconType: 'gdrive',
    authType: 'OAuth 2.0',
    endpoint: 'https://www.googleapis.com/drive/v3/mcp',
    latencyMs: 16,
    tools: [
      {
        name: 'gdrive_search_files',
        displayName: 'Search Drive Documents',
        description: 'Finds PDFs, spreadsheets, and Google Docs by semantic content.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            search_query: { type: 'STRING', description: 'Keywords or document title' },
          },
        },
      },
    ],
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar (Executive Engine)',
    category: 'popular',
    description: 'Real-time schedule buffer analysis, conflicts resolution, and automated meeting holds.',
    vendor: 'Google LLC',
    iconType: 'gcalendar',
    badge: 'Active Native',
    authType: 'OAuth 2.0',
    endpoint: 'https://www.googleapis.com/calendar/v3/mcp',
    latencyMs: 12,
    tools: [
      {
        name: 'gcal_check_availability',
        displayName: 'Check Free/Busy Slots',
        description: 'Inspects calendar availability and identifies uncommitted focus blocks.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            date: { type: 'STRING', description: 'Target date (YYYY-MM-DD)' },
          },
        },
      },
      {
        name: 'gcal_create_event',
        displayName: 'Schedule Calendar Event',
        description: 'Creates a calendar event with location, buffer times, and attendees.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            summary: { type: 'STRING', description: 'Meeting or errand title' },
            start_time: { type: 'STRING', description: 'ISO start timestamp' },
            duration_minutes: { type: 'STRING', description: 'Duration in minutes' },
          },
          required: ['summary'],
        },
      },
    ],
  },
  {
    id: 'github',
    name: 'GitHub Cloud Repositories',
    category: 'popular',
    description: 'Inspect PR diffs, review CI/CD build failures, create issues, and manage release milestones.',
    vendor: 'GitHub / Microsoft',
    iconType: 'github',
    authType: 'OAuth 2.0',
    endpoint: 'https://api.github.com/mcp',
    latencyMs: 20,
    tools: [
      {
        name: 'github_list_pull_requests',
        displayName: 'List Active PRs',
        description: 'Lists open pull requests with review status and CI checks.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            repo: { type: 'STRING', description: 'owner/repository name' },
          },
        },
      },
      {
        name: 'github_create_issue',
        displayName: 'Create GitHub Issue',
        description: 'Stages a feature ticket or bug report on the selected repository.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            repo: { type: 'STRING', description: 'owner/repository name' },
            title: { type: 'STRING', description: 'Issue title' },
            body: { type: 'STRING', description: 'Detailed issue description' },
          },
          required: ['repo', 'title'],
        },
      },
    ],
  },
  {
    id: 'slack',
    name: 'Slack Enterprise Grid',
    category: 'popular',
    description: 'Read channels, triage mentions, send announcements, and trigger workflow builder steps.',
    vendor: 'Slack Technologies LLC',
    iconType: 'slack',
    authType: 'OAuth 2.0',
    endpoint: 'https://slack.com/api/mcp',
    latencyMs: 14,
    tools: [
      {
        name: 'slack_post_message',
        displayName: 'Post Slack Message',
        description: 'Dispatches a formatted message or announcement to a Slack channel.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            channel: { type: 'STRING', description: '#channel-name or user ID' },
            text: { type: 'STRING', description: 'Message markdown text' },
          },
          required: ['channel', 'text'],
        },
      },
    ],
  },
  {
    id: 'notion',
    name: 'Notion Workspace',
    category: 'popular',
    description: 'Query product roadmaps, append research memos, update database records, and draft wikis.',
    vendor: 'Notion Labs Inc.',
    iconType: 'notion',
    authType: 'OAuth 2.0',
    endpoint: 'https://api.notion.com/v1/mcp',
    latencyMs: 18,
    tools: [
      {
        name: 'notion_query_database',
        displayName: 'Query Notion Database',
        description: 'Queries filtered rows from a Notion database.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            database_name: { type: 'STRING', description: 'Database title or filter' },
          },
        },
      },
      {
        name: 'notion_append_block',
        displayName: 'Append Notion Page Content',
        description: 'Appends formatted notes or meeting action items to a Notion page.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            page_title: { type: 'STRING', description: 'Target page' },
            content: { type: 'STRING', description: 'Bullet points or markdown text' },
          },
          required: ['content'],
        },
      },
    ],
  },
  {
    id: 'canva',
    name: 'Canva Design Studio',
    category: 'popular',
    description: 'Auto-generate branded social graphic layouts, resize assets, and export presentation decks.',
    vendor: 'Canva Pty Ltd',
    iconType: 'canva',
    authType: 'OAuth 2.0',
    endpoint: 'https://api.canva.com/v1/mcp',
    latencyMs: 26,
    tools: [
      {
        name: 'canva_generate_asset',
        displayName: 'Generate Social Banner',
        description: 'Renders branded graphic templates based on headline and brand colors.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            headline: { type: 'STRING', description: 'Display title on image' },
            format: { type: 'STRING', description: 'story_1080x1920 or square_1080x1080' },
          },
          required: ['headline'],
        },
      },
    ],
  },

  // 6. Productivity
  {
    id: 'trello',
    name: 'Trello Boards & Power-Ups',
    category: 'productivity',
    description: 'Organize sprint cards, move items across Kanban lanes, and attach execution checklists.',
    vendor: 'Atlassian Inc.',
    iconType: 'trello',
    authType: 'API Key',
    endpoint: 'https://api.trello.com/1/mcp',
    latencyMs: 15,
    tools: [
      {
        name: 'trello_create_card',
        displayName: 'Create Trello Card',
        description: 'Creates a task card on a specified list with due date and labels.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            board: { type: 'STRING', description: 'Board name' },
            list: { type: 'STRING', description: 'To Do, In Progress, or Done' },
            name: { type: 'STRING', description: 'Task title' },
          },
          required: ['name'],
        },
      },
    ],
  },
  {
    id: 'asana',
    name: 'Asana Project Management',
    category: 'productivity',
    description: 'Milestone tracking, team workload balance, task creation, and sprint burndowns.',
    vendor: 'Asana Inc.',
    iconType: 'asana',
    authType: 'OAuth 2.0',
    endpoint: 'https://app.asana.com/api/1.0/mcp',
    latencyMs: 17,
    tools: [
      {
        name: 'asana_create_task',
        displayName: 'Create Asana Task',
        description: 'Assigns tasks to team members with projects and milestones.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            project: { type: 'STRING', description: 'Project title' },
            name: { type: 'STRING', description: 'Task title' },
          },
          required: ['name'],
        },
      },
    ],
  },
  {
    id: 'monday',
    name: 'Monday.com Work OS',
    category: 'productivity',
    description: 'Custom board status automations, group sync, and client deliverables management.',
    vendor: 'Monday.com Ltd.',
    iconType: 'monday',
    authType: 'API Key',
    endpoint: 'https://api.monday.com/v2/mcp',
    latencyMs: 21,
    tools: [
      {
        name: 'monday_update_pulse',
        displayName: 'Update Item Status',
        description: 'Updates column statuses on Monday.com board.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            item_name: { type: 'STRING', description: 'Deliverable name' },
            status: { type: 'STRING', description: 'Working on it, Stuck, or Done' },
          },
          required: ['item_name', 'status'],
        },
      },
    ],
  },
  {
    id: 'box',
    name: 'Box Enterprise Cloud',
    category: 'productivity',
    description: 'Enterprise encrypted cloud file storage, document sharing links, and compliance retention.',
    vendor: 'Box Inc.',
    iconType: 'box',
    authType: 'OAuth 2.0',
    endpoint: 'https://api.box.com/2.0/mcp',
    latencyMs: 20,
    tools: [
      {
        name: 'box_search_files',
        displayName: 'Search Box Storage',
        description: 'Locates contracts, agreements, and assets in enterprise storage.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            query: { type: 'STRING', description: 'Keywords or folder name' },
          },
        },
      },
    ],
  },
  {
    id: 'clickup',
    name: 'ClickUp All-in-One',
    category: 'productivity',
    description: 'Goals, subtask dependencies, sprint backlogs, and customized field automation.',
    vendor: 'ClickUp Inc.',
    iconType: 'clickup',
    authType: 'OAuth 2.0',
    endpoint: 'https://api.clickup.com/api/v2/mcp',
    latencyMs: 19,
    tools: [
      {
        name: 'clickup_create_task',
        displayName: 'Stage ClickUp Task',
        description: 'Stages a task in ClickUp with priority tag and estimate.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Task title' },
          },
          required: ['title'],
        },
      },
    ],
  },
  {
    id: 'coda',
    name: 'Coda Intelligent Docs',
    category: 'productivity',
    description: 'Formulas, relational tables, dynamic buttons, and cross-doc workspace pipelines.',
    vendor: 'Coda Project Inc.',
    iconType: 'coda',
    authType: 'API Key',
    endpoint: 'https://coda.io/apis/v1/mcp',
    latencyMs: 23,
    tools: [
      {
        name: 'coda_insert_row',
        displayName: 'Insert Row in Coda Table',
        description: 'Inserts structured record row into a Coda table.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            doc_id: { type: 'STRING', description: 'Doc ID' },
            table_name: { type: 'STRING', description: 'Target table name' },
          },
          required: ['table_name'],
        },
      },
    ],
  },

  // 7. Finance
  {
    id: 'plaid',
    name: 'Plaid Financial Data Engine',
    category: 'finance',
    description: 'Read-only bank verification, real-time transaction streaming, and liquidity balance reporting.',
    vendor: 'Plaid Inc.',
    iconType: 'plaid',
    badge: 'Secure Read',
    authType: 'API Key',
    endpoint: 'https://production.plaid.com/mcp',
    latencyMs: 31,
    tools: [
      {
        name: 'plaid_get_transactions',
        displayName: 'Stream Bank Transactions',
        description: 'Fetches categorized transactions across linked accounts.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            days: { type: 'STRING', description: 'Lookback window in days (e.g. 7 or 30)' },
          },
        },
      },
      {
        name: 'plaid_check_balance',
        displayName: 'Check Liquidity Balance',
        description: 'Checks aggregate checking and reserve balances.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
    ],
  },
  {
    id: 'ibkr',
    name: 'Interactive Brokers (IBKR)',
    category: 'finance',
    description: 'Portfolio valuation, equity positions, margin ratios, and dividend projections.',
    vendor: 'Interactive Brokers LLC',
    iconType: 'ibkr',
    authType: 'OAuth 2.0',
    endpoint: 'https://api.ibkr.com/v1/mcp',
    latencyMs: 42,
    tools: [
      {
        name: 'ibkr_get_portfolio_value',
        displayName: 'Query Portfolio Value',
        description: 'Reads total net liquidation value, cash balances, and day unrealized P&L.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
    ],
  },
  {
    id: 'expensify',
    name: 'Expensify SmartScan',
    category: 'finance',
    description: 'Receipt OCR scanning, expense report generation, corporate policy checks, and reimbursements.',
    vendor: 'Expensify Inc.',
    iconType: 'expensify',
    authType: 'API Key',
    endpoint: 'https://integrations.expensify.com/mcp',
    latencyMs: 25,
    tools: [
      {
        name: 'expensify_report_status',
        displayName: 'Check Reimbursement Status',
        description: 'Queries active expense reports and reimbursement approval states.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
    ],
  },
  {
    id: 'wave-finance',
    name: 'Wave & Mint Financial Suite',
    category: 'finance',
    description: 'Cash-flow forecasting, small business bookkeeping reconciliation, and estimated tax calculations.',
    vendor: 'Wave Financial USA Inc.',
    iconType: 'wave',
    authType: 'OAuth 2.0',
    endpoint: 'https://api.waveapps.com/mcp',
    latencyMs: 29,
    tools: [
      {
        name: 'wave_get_cashflow',
        displayName: 'Forecast Monthly Cash Flow',
        description: 'Calculates 30-day projected incoming vs. committed outgoing expenditures.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
    ],
  },
];

// Default pre-installed plugins for immediate rich demo capabilities
export const DEFAULT_INSTALLED_PLUGIN_IDS: string[] = [
  'quickbooks',
  'tripadvisor',
  'instagram-reels',
  'shopify',
  'zapier-gateway',
  'google-calendar',
  'gmail',
];

const STORAGE_INSTALLED_PLUGINS_KEY = 'carol_mcp_installed_plugins';
const STORAGE_ZAPIER_CONFIG_KEY = 'carol_mcp_zapier_config';

export function loadInstalledPluginIds(): string[] {
  if (typeof window === 'undefined') return DEFAULT_INSTALLED_PLUGIN_IDS;
  try {
    const raw = localStorage.getItem(STORAGE_INSTALLED_PLUGINS_KEY);
    if (!raw) return DEFAULT_INSTALLED_PLUGIN_IDS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (e) {
    console.warn('Failed to load installed plugins from localStorage:', e);
  }
  return DEFAULT_INSTALLED_PLUGIN_IDS;
}

export function saveInstalledPluginIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_INSTALLED_PLUGINS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.warn('Failed to save installed plugins to localStorage:', e);
  }
}

// Default Zapier Remote Actions discovered from endpoint
export const DEFAULT_ZAPIER_ACTIONS: ZapierActionMeta[] = [
  {
    id: 'zap_act_1',
    name: 'Post Instagram Reel Draft',
    app: 'Instagram for Business',
    description: 'Transfers processed video asset and caption directly to Instagram draft hopper.',
    category: 'Social Media',
    actionType: 'write',
    requiresConfirmation: true,
    enabled: true,
    testedAt: '2 mins ago',
  },
  {
    id: 'zap_act_2',
    name: 'Fetch TripAdvisor Recent Reviews',
    app: 'TripAdvisor Partner',
    description: 'Pulls reviews from your claimed property listing and categorizes review sentiment.',
    category: 'Hospitality',
    actionType: 'read',
    requiresConfirmation: false,
    enabled: true,
    testedAt: '12 mins ago',
  },
  {
    id: 'zap_act_3',
    name: 'Create QuickBooks Online Invoice',
    app: 'QuickBooks Online',
    description: 'Generates branded PDF invoice, calculates sales tax, and stages dispatch email.',
    category: 'Accounting',
    actionType: 'write',
    requiresConfirmation: true,
    enabled: true,
    testedAt: '1 hour ago',
  },
  {
    id: 'zap_act_4',
    name: 'Update Shopify Product Inventory',
    app: 'Shopify Admin',
    description: 'Modifies live SKU inventory levels or price changes across store channels.',
    category: 'Commerce',
    actionType: 'write',
    requiresConfirmation: true,
    enabled: true,
    testedAt: '3 hours ago',
  },
  {
    id: 'zap_act_5',
    name: 'Send VIP Slack Announcement',
    app: 'Slack Enterprise',
    description: 'Dispatches high-priority executive alerts to designated channels.',
    category: 'Communication',
    actionType: 'write',
    requiresConfirmation: true,
    enabled: true,
    testedAt: 'Yesterday',
  },
  {
    id: 'zap_act_6',
    name: 'Sync Stripe Charge to QuickBooks Account',
    app: 'Stripe & QuickBooks',
    description: 'Reconciles incoming customer payments automatically against invoice ledgers.',
    category: 'Finance Reconciliation',
    actionType: 'write',
    requiresConfirmation: true,
    enabled: true,
    testedAt: '2 days ago',
  },
];

export function loadZapierConfig(): ZapierConfig {
  if (typeof window === 'undefined') {
    return {
      endpointUrl: 'https://actions.zapier.com/settings/mcp/',
      apiKey: 'zp_sec_live_9f81a7b8e4c291d',
      isConnected: true,
      lastSyncedAt: new Date(Date.now() - 3600e3 * 2).toISOString(),
      actions: DEFAULT_ZAPIER_ACTIONS,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_ZAPIER_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        endpointUrl: parsed.endpointUrl || 'https://actions.zapier.com/settings/mcp/',
        apiKey: parsed.apiKey || 'zp_sec_live_9f81a7b8e4c291d',
        isConnected: Boolean(parsed.isConnected),
        lastSyncedAt: parsed.lastSyncedAt || new Date().toISOString(),
        actions: Array.isArray(parsed.actions) && parsed.actions.length > 0 ? parsed.actions : DEFAULT_ZAPIER_ACTIONS,
      };
    }
  } catch (e) {
    console.warn('Failed to load zapier config:', e);
  }

  return {
    endpointUrl: 'https://actions.zapier.com/settings/mcp/',
    apiKey: 'zp_sec_live_9f81a7b8e4c291d',
    isConnected: true,
    lastSyncedAt: new Date(Date.now() - 3600e3 * 2).toISOString(),
    actions: DEFAULT_ZAPIER_ACTIONS,
  };
}

export function saveZapierConfig(config: ZapierConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ZAPIER_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save zapier config:', e);
  }
}
