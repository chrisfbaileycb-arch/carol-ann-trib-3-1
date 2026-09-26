/**
 * Single source of truth for Carol Ann's MCP Plugins & Connectors Marketplace,
 * Connected Ecosystems & Channels (Social, Hospitality, Commerce, Zapier Universal Gateway),
 * and dynamic tool schemas with deterministic return types and JSON schema parameters.
 */

export type PluginCategory =
  | 'popular'
  | 'commerce'
  | 'social'
  | 'hospitality'
  | 'productivity'
  | 'finance';

export interface PluginToolParameterProperty {
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'ARRAY' | 'OBJECT';
  description: string;
  enum?: string[];
  items?: {
    type: string;
    description?: string;
  };
}

export interface PluginToolReturns {
  type: 'OBJECT' | 'ARRAY' | 'STRING' | 'BOOLEAN';
  description: string;
  properties?: Record<string, {
    type: string;
    description: string;
  }>;
}

export interface PluginToolDefinition {
  name: string;
  displayName: string;
  description: string;
  actionType: 'read' | 'write';
  requiresConfirmation: boolean;
  parameters: {
    type: 'OBJECT';
    properties: Record<string, PluginToolParameterProperty>;
    required?: string[];
  };
  returns: PluginToolReturns;
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
  lastSyncedAt: string | null;
  actions: ZapierActionMeta[];
}

// ----------------------------------------------------------------------------
// Pre-configured Directory of Plugins & MCP Bridges with Deterministic Schemas
// ----------------------------------------------------------------------------

export const MCP_PLUGINS_DIRECTORY: MCPPlugin[] = [
  // 1. Google Business Profile (Hospitality / Local Commerce)
  {
    id: 'google-business',
    name: 'Google Business Profile',
    category: 'hospitality',
    description: 'Local search rankings, verified Google Maps customer reviews, business announcements, and Q&A.',
    vendor: 'Google LLC',
    iconType: 'google',
    badge: 'Verified',
    ecosystemGroup: 'hospitality',
    authType: 'OAuth 2.0',
    endpoint: 'https://mybusinessbusinessinformation.googleapis.com/v1/mcp',
    latencyMs: 15,
    tools: [
      {
        name: 'gbp_fetch_reviews',
        displayName: 'Fetch Google Reviews',
        description: 'Retrieves verified customer reviews, star ratings, and sentiment from Google Maps listing.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            unanswered_only: {
              type: 'BOOLEAN',
              description: 'Filter only reviews that have not yet received an official management reply'
            },
            min_rating: {
              type: 'NUMBER',
              description: 'Minimum star rating filter (1 to 5)'
            }
          },
        },
        returns: {
          type: 'OBJECT',
          description: 'Verified listing reviews list with aggregate sentiment statistics',
          properties: {
            reviews: { type: 'ARRAY', description: 'List of review objects with author, rating, text, and date' },
            average_rating: { type: 'NUMBER', description: 'Average rating across the location' },
            unanswered_count: { type: 'NUMBER', description: 'Number of pending reviews needing reply' }
          }
        }
      },
      {
        name: 'gbp_post_update',
        displayName: 'Post Google Business Update',
        description: 'Publishes an official announcement, special promotion, or event onto Google Search & Maps.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            summary: {
              type: 'STRING',
              description: 'Announcement body text or update copy'
            },
            call_to_action: {
              type: 'STRING',
              description: 'Action button type: BOOK, ORDER, LEARN_MORE, or CALL',
              enum: ['BOOK', 'ORDER', 'LEARN_MORE', 'CALL']
            },
            event_date: {
              type: 'STRING',
              description: 'Optional ISO date or timeframe for scheduled announcements'
            }
          },
          required: ['summary'],
        },
        returns: {
          type: 'OBJECT',
          description: 'Published post status on Google Maps listing',
          properties: {
            post_id: { type: 'STRING', description: 'Unique GBP post reference ID' },
            status: { type: 'STRING', description: 'LIVE or SCHEDULED' },
            published_url: { type: 'STRING', description: 'Direct link to Google listing post' }
          }
        }
      },
    ],
  },

  // 2. Shopify Storefront & Orders (Commerce)
  {
    id: 'shopify',
    name: 'Shopify Storefront & Orders',
    category: 'commerce',
    description: 'Real-time GMV sales numbers, order fulfillment tracking, customer order history, and inventory levels.',
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
        displayName: 'Fetch Orders & Sales GMV',
        description: 'Pulls today\'s gross merchandise value, unfulfilled orders, and customer transaction details.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            status: {
              type: 'STRING',
              description: 'Order fulfillment status filter',
              enum: ['open', 'unfulfilled', 'fulfilled', 'any']
            },
            limit: {
              type: 'NUMBER',
              description: 'Maximum number of orders to retrieve (default: 10)'
            },
          },
        },
        returns: {
          type: 'OBJECT',
          description: 'Sales breakdown with order items and fulfillment metrics',
          properties: {
            total_gmv: { type: 'NUMBER', description: 'Total gross merchandise value in USD' },
            orders_count: { type: 'NUMBER', description: 'Total count of orders in time window' },
            unfulfilled_count: { type: 'NUMBER', description: 'Orders pending warehouse dispatch' },
            orders: { type: 'ARRAY', description: 'List of order records' }
          }
        }
      },
      {
        name: 'shopify_get_inventory',
        displayName: 'Inspect Product Inventory',
        description: 'Checks live warehouse stock levels and alerts on depleted product variants.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            sku_or_title: {
              type: 'STRING',
              description: 'Product title, handle, or SKU barcode identifier'
            },
          },
          required: ['sku_or_title'],
        },
        returns: {
          type: 'OBJECT',
          description: 'Product variant inventory records',
          properties: {
            sku: { type: 'STRING', description: 'Product SKU' },
            title: { type: 'STRING', description: 'Product title' },
            available_stock: { type: 'NUMBER', description: 'Units available for sale' },
            low_stock_warning: { type: 'BOOLEAN', description: 'True if below safety reorder threshold' }
          }
        }
      },
      {
        name: 'shopify_update_product',
        displayName: 'Update Product Details',
        description: 'Updates price, stock quantities, or description across your Shopify store catalog.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            product_id: {
              type: 'STRING',
              description: 'Shopify product or variant identifier'
            },
            price: {
              type: 'STRING',
              description: 'New price in USD format (e.g. 145.00)'
            },
            inventory_delta: {
              type: 'NUMBER',
              description: 'Stock quantity adjustment (+/- count)'
            },
          },
          required: ['product_id'],
        },
        returns: {
          type: 'OBJECT',
          description: 'Confirmation of updated Shopify product catalog record',
          properties: {
            success: { type: 'BOOLEAN', description: 'Whether update applied successfully' },
            product_id: { type: 'STRING', description: 'Modified product ID' },
            new_price: { type: 'STRING', description: 'Updated price' },
            new_stock_level: { type: 'NUMBER', description: 'Updated stock count' }
          }
        }
      },
    ],
  },

  // 3. Stripe Payments & Billing (Finance & Commerce)
  {
    id: 'stripe',
    name: 'Stripe Payments & Billing',
    category: 'commerce',
    description: 'Payment intents, customer balance queries, failed transaction diagnostics, and checkout payment links.',
    vendor: 'Stripe Inc.',
    iconType: 'stripe',
    badge: 'Essential',
    ecosystemGroup: 'commerce',
    authType: 'API Key',
    endpoint: 'https://api.stripe.com/v1/mcp',
    latencyMs: 12,
    tools: [
      {
        name: 'stripe_get_charges',
        displayName: 'Query Recent Charges',
        description: 'Returns real-time customer payments, charge statuses, net amounts, and processing fees.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            limit: {
              type: 'NUMBER',
              description: 'Number of charge records to retrieve (default: 10)'
            },
            status: {
              type: 'STRING',
              description: 'Charge state filter',
              enum: ['succeeded', 'pending', 'failed', 'all']
            }
          },
        },
        returns: {
          type: 'OBJECT',
          description: 'Payment charges list with gross and net financial totals',
          properties: {
            total_volume_cents: { type: 'NUMBER', description: 'Total charge volume in cents' },
            successful_count: { type: 'NUMBER', description: 'Count of successful payments' },
            charges: { type: 'ARRAY', description: 'List of individual payment charge records' }
          }
        }
      },
      {
        name: 'stripe_create_payment_link',
        displayName: 'Generate Hosted Payment Link',
        description: 'Creates a secure Stripe hosted checkout link for retainers, invoices, or one-off products.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            item_name: {
              type: 'STRING',
              description: 'Product description or retainer label'
            },
            amount_cents: {
              type: 'NUMBER',
              description: 'Amount in cents (e.g. 250000 for $2,500.00)'
            },
            currency: {
              type: 'STRING',
              description: 'Three-letter ISO currency code (default: usd)'
            },
          },
          required: ['item_name', 'amount_cents'],
        },
        returns: {
          type: 'OBJECT',
          description: 'Stripe payment link details',
          properties: {
            link_id: { type: 'STRING', description: 'Unique Stripe payment link identifier' },
            url: { type: 'STRING', description: 'Hosted checkout URL ready to dispatch to client' },
            amount_cents: { type: 'NUMBER', description: 'Configured charge amount' },
            status: { type: 'STRING', description: 'active' }
          }
        }
      },
    ],
  },

  // 4. QuickBooks Online (Accounting & Invoicing)
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    category: 'commerce',
    description: 'Accounts receivable, balance sheets, expense tracking, and automated client invoice dispatch.',
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
        description: 'Pulls open, paid, and overdue customer invoices with aging brackets and remaining balances.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            status: {
              type: 'STRING',
              description: 'Invoice payment status filter',
              enum: ['unpaid', 'overdue', 'paid', 'all']
            },
          },
        },
        returns: {
          type: 'OBJECT',
          description: 'Accounts receivable summary and invoice list',
          properties: {
            total_unpaid_amount: { type: 'NUMBER', description: 'Total unpaid AR balance in USD' },
            overdue_count: { type: 'NUMBER', description: 'Number of past-due invoices' },
            invoices: { type: 'ARRAY', description: 'List of invoice records with customer, terms, and status' }
          }
        }
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
            customer_name: {
              type: 'STRING',
              description: 'Client or business entity name'
            },
            customer_email: {
              type: 'STRING',
              description: 'Recipient billing email address'
            },
            amount: {
              type: 'NUMBER',
              description: 'Total invoice dollar amount'
            },
            line_items: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Services or items delivered on this invoice'
            },
            due_date: {
              type: 'STRING',
              description: 'Invoice payment due date or Net terms'
            },
          },
          required: ['customer_name', 'amount'],
        },
        returns: {
          type: 'OBJECT',
          description: 'Created QuickBooks invoice record',
          properties: {
            invoice_id: { type: 'STRING', description: 'QuickBooks DocNumber/Invoice ID' },
            customer_name: { type: 'STRING', description: 'Client name' },
            amount: { type: 'NUMBER', description: 'Total amount invoiced' },
            status: { type: 'STRING', description: 'Pending dispatch / Sent' },
            pdf_url: { type: 'STRING', description: 'Link to preview invoice PDF' }
          }
        }
      },
      {
        name: 'quickbooks_get_balances',
        displayName: 'Query Account Balances',
        description: 'Inspects operating bank balances, total accounts receivable, and net monthly expenses.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            period: {
              type: 'STRING',
              description: 'Financial period to inspect',
              enum: ['this_month', 'this_quarter', 'year_to_date']
            },
          },
        },
        returns: {
          type: 'OBJECT',
          description: 'General ledger account balances overview',
          properties: {
            operating_cash: { type: 'NUMBER', description: 'Current liquid operating checking balance' },
            accounts_receivable: { type: 'NUMBER', description: 'Total outstanding accounts receivable' },
            accounts_payable: { type: 'NUMBER', description: 'Upcoming accounts payable' },
            net_cashflow: { type: 'NUMBER', description: 'Net operating margin for the period' }
          }
        }
      },
    ],
  },

  // 5. Gmail & Google Workspace (Email & Inbox)
  {
    id: 'gmail',
    name: 'Gmail & Google Workspace Mail',
    category: 'popular',
    description: 'Triage correspondence, search VIP threads, draft polite executive replies, and track attachments.',
    vendor: 'Google LLC',
    iconType: 'gmail',
    badge: 'Active Native',
    ecosystemGroup: 'social',
    authType: 'OAuth 2.0',
    endpoint: 'https://gmail.googleapis.com/gmail/v1/mcp',
    latencyMs: 14,
    tools: [
      {
        name: 'gmail_search_threads',
        displayName: 'Search Inbox Threads',
        description: 'Queries email threads by sender, subject keywords, or unread priority labels.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'Gmail search query syntax (e.g., is:unread, from:client@apex.com)'
            },
            max_results: {
              type: 'NUMBER',
              description: 'Maximum threads to retrieve (default: 5)'
            }
          },
        },
        returns: {
          type: 'OBJECT',
          description: 'Matching email threads list',
          properties: {
            thread_count: { type: 'NUMBER', description: 'Number of matching threads' },
            threads: { type: 'ARRAY', description: 'List of threads with subject, sender, snippet, and timestamp' }
          }
        }
      },
      {
        name: 'gmail_draft_message',
        displayName: 'Draft Email Reply',
        description: 'Prepares a polished response draft in your Gmail inbox for your review before sending.',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            to: {
              type: 'STRING',
              description: 'Recipient email address'
            },
            subject: {
              type: 'STRING',
              description: 'Subject line'
            },
            body: {
              type: 'STRING',
              description: 'Email message text (markdown or formatted plain text)'
            },
            cc: {
              type: 'STRING',
              description: 'Optional CC email address'
            }
          },
          required: ['to', 'body'],
        },
        returns: {
          type: 'OBJECT',
          description: 'Staged Gmail draft reference',
          properties: {
            draft_id: { type: 'STRING', description: 'Gmail Draft ID' },
            status: { type: 'STRING', description: 'DRAFT_STAGED' },
            recipient: { type: 'STRING', description: 'To email' },
            subject: { type: 'STRING', description: 'Subject line' }
          }
        }
      },
    ],
  },

  // 6. Zapier Universal MCP Gateway (Automation)
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
        name: 'zapier_list_actions',
        displayName: 'Discover Enabled Actions',
        description: 'Discovers all configured and pre-authenticated SaaS actions on your Zapier MCP endpoint.',
        actionType: 'read',
        requiresConfirmation: false,
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
        returns: {
          type: 'OBJECT',
          description: 'List of discovered Zapier actions and connection status',
          properties: {
            endpoint: { type: 'STRING', description: 'Configured Zapier MCP endpoint URL' },
            actions_count: { type: 'NUMBER', description: 'Number of active actions' },
            actions: { type: 'ARRAY', description: 'List of enabled actions with app, name, and confirmation requirement' }
          }
        }
      },
      {
        name: 'zapier_execute_action',
        displayName: 'Execute Zapier AI Action',
        description: 'Invokes any pre-authenticated Zapier Action across linked apps (Slack, HubSpot, Notion, Google Sheets).',
        actionType: 'write',
        requiresConfirmation: true,
        parameters: {
          type: 'OBJECT',
          properties: {
            action_name: {
              type: 'STRING',
              description: 'Registered Zapier Action (e.g., Post Reel, Send Invoice, Sync Lead)'
            },
            parameters_json: {
              type: 'STRING',
              description: 'JSON string of input arguments passed to the underlying action'
            },
          },
          required: ['action_name'],
        },
        returns: {
          type: 'OBJECT',
          description: 'Execution response from the Zapier MCP action',
          properties: {
            execution_id: { type: 'STRING', description: 'Zapier execution run ID' },
            status: { type: 'STRING', description: 'SUCCESS or PENDING_USER_CONFIRMATION' },
            summary: { type: 'STRING', description: 'Summary of action outcome' }
          }
        }
      },
    ],
  },

  // 7. Meta / Instagram Reels (Social)
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
        returns: {
          type: 'OBJECT',
          description: 'Staged Reel publication status',
          properties: {
            reel_id: { type: 'STRING', description: 'Instagram container ID' },
            status: { type: 'STRING', description: 'SCHEDULED' }
          }
        }
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
        returns: {
          type: 'OBJECT',
          description: 'Generated caption and recommended hashtags',
          properties: {
            caption: { type: 'STRING', description: 'Formatted caption copy' },
            hashtags: { type: 'ARRAY', description: 'Recommended hashtags' }
          }
        }
      },
    ],
  },

  // 8. TripAdvisor (Hospitality & Reviews)
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
        returns: {
          type: 'OBJECT',
          description: 'TripAdvisor guest reviews',
          properties: {
            reviews: { type: 'ARRAY', description: 'List of guest reviews' }
          }
        }
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
        returns: {
          type: 'OBJECT',
          description: 'Management reply status',
          properties: {
            success: { type: 'BOOLEAN', description: 'Reply staged or submitted' },
            review_id: { type: 'STRING', description: 'Target review ID' }
          }
        }
      },
    ],
  },
];

export const DEFAULT_INSTALLED_PLUGIN_IDS: string[] = [
  'google-business',
  'shopify',
  'stripe',
  'quickbooks',
  'gmail',
  'zapier-gateway'
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

export const DEFAULT_ZAPIER_ACTIONS: ZapierActionMeta[] = [
  {
    id: 'zap_act_1',
    name: 'Sync VIP Lead to HubSpot CRM',
    app: 'HubSpot',
    description: 'Enrolls new inbound contact and pipeline deal into HubSpot sales sequence.',
    category: 'CRM & Sales',
    actionType: 'write',
    requiresConfirmation: true,
    enabled: true,
    testedAt: '10 mins ago',
  },
  {
    id: 'zap_act_2',
    name: 'Sync Stripe Charge to QuickBooks Ledger',
    app: 'QuickBooks & Stripe',
    description: 'Reconciles incoming customer payments automatically against invoice ledgers.',
    category: 'Finance Reconciliation',
    actionType: 'write',
    requiresConfirmation: true,
    enabled: true,
    testedAt: '25 mins ago',
  },
  {
    id: 'zap_act_3',
    name: 'Post Instagram Reel Draft',
    app: 'Instagram for Business',
    description: 'Transfers processed video asset and caption directly to Instagram draft hopper.',
    category: 'Social Media',
    actionType: 'write',
    requiresConfirmation: true,
    enabled: true,
    testedAt: '1 hour ago',
  },
  {
    id: 'zap_act_4',
    name: 'Create Branded QuickBooks Online Invoice',
    app: 'QuickBooks Online',
    description: 'Generates branded PDF invoice, calculates sales tax, and stages dispatch email.',
    category: 'Accounting',
    actionType: 'write',
    requiresConfirmation: true,
    enabled: true,
    testedAt: '2 hours ago',
  },
  {
    id: 'zap_act_5',
    name: 'Update Shopify Product Inventory',
    app: 'Shopify Admin',
    description: 'Modifies live SKU inventory levels or price changes across store channels.',
    category: 'Commerce',
    actionType: 'write',
    requiresConfirmation: true,
    enabled: true,
    testedAt: '4 hours ago',
  },
  {
    id: 'zap_act_6',
    name: 'Send Executive VIP Slack Announcement',
    app: 'Slack Enterprise',
    description: 'Dispatches high-priority executive alerts to designated channels.',
    category: 'Communication',
    actionType: 'write',
    requiresConfirmation: true,
    enabled: true,
    testedAt: 'Yesterday',
  },
];

export function loadZapierConfig(): ZapierConfig {
  // Demo sandbox defaults: no API key is ever pre-filled, and the connector
  // is never presented as connected until the user configures it.
  const demoDefaults: ZapierConfig = {
    endpointUrl: 'https://actions.zapier.com/settings/mcp/',
    apiKey: '',
    isConnected: false,
    lastSyncedAt: null,
    actions: DEFAULT_ZAPIER_ACTIONS,
  };

  if (typeof window === 'undefined') {
    return demoDefaults;
  }

  try {
    const raw = localStorage.getItem(STORAGE_ZAPIER_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        endpointUrl: parsed.endpointUrl || demoDefaults.endpointUrl,
        apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
        // Never restore a persisted "connected" claim — the demo sandbox
        // must not present itself as a live connection.
        isConnected: false,
        lastSyncedAt: null,
        actions: Array.isArray(parsed.actions) && parsed.actions.length > 0 ? parsed.actions : DEFAULT_ZAPIER_ACTIONS,
      };
    }
  } catch (e) {
    console.warn('Failed to load zapier config:', e);
  }

  return demoDefaults;
}
export function saveZapierConfig(config: ZapierConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ZAPIER_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save zapier config:', e);
  }
}
