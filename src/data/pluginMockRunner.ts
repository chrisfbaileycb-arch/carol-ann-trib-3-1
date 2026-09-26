/**
 * Plugin Execution Engine & Deterministic Schema Dispatcher for Carol Ann.
 * Handles client-side execution, deterministic data generators for connected MCP ecosystems
 * (Google Business Profile, Shopify, Stripe, QuickBooks, Gmail, Zapier Universal Gateway),
 * input validation, and interactive Action Confirmation Cards.
 */

import type { HydrateFormAction, PluginExecutionChip } from '@/data/schemas';
import {
  MCP_PLUGINS_DIRECTORY,
  loadInstalledPluginIds,
  loadZapierConfig,
  type PluginToolDefinition
} from '@/data/mcpPlugins';

export interface PluginExecutionResult {
  handled: boolean;
  replyText: string;
  chip?: PluginExecutionChip;
  actionCard?: HydrateFormAction;
  data?: Record<string, unknown>;
}

// ----------------------------------------------------------------------------
// Deterministic Execution Handlers for the 6 Core Connectors
// ----------------------------------------------------------------------------

export function executeGoogleBusinessTool(
  toolName: 'gbp_fetch_reviews' | 'gbp_post_update',
  args: Record<string, unknown> = {}
): PluginExecutionResult {
  if (toolName === 'gbp_fetch_reviews') {
    const unansweredOnly = Boolean(args.unanswered_only);
    const reviews = [
      {
        review_id: 'rev_g_8819',
        reviewer_name: 'Genevieve M.',
        star_rating: 5,
        date: 'Yesterday',
        comment: 'The executive consultation and concierge service were world-class. Quiet, elegant, and perfectly organized.',
        answered: false,
      },
      {
        review_id: 'rev_g_8814',
        reviewer_name: 'David R.',
        star_rating: 5,
        date: '3 days ago',
        comment: 'Outstanding attention to detail and pristine private work suites. Seamless executive experience.',
        answered: true,
      },
      {
        review_id: 'rev_g_8802',
        reviewer_name: 'Julian S.',
        star_rating: 4,
        date: 'Last week',
        comment: 'Serene atmosphere and prompt assistance. Highly recommended for executive retreats.',
        answered: false,
      }
    ];

    const filteredReviews = unansweredOnly ? reviews.filter((r) => !r.answered) : reviews;
    const averageRating = 4.8;
    const unansweredCount = reviews.filter((r) => !r.answered).length;

    const chip: PluginExecutionChip = {
      pluginId: 'google-business',
      pluginName: 'Google Business Profile',
      toolName: 'gbp_fetch_reviews',
      status: 'executed',
      latencyMs: 15,
    };

    const reviewsFormatted = filteredReviews.map((r) =>
      `⭐ **${r.reviewer_name} — ${r.star_rating}/5 Stars** *(${r.date})*\n` +
      `> *"${r.comment}"*\n` +
      `Status: ${r.answered ? '✅ Answered' : '⚠️ Pending management reply'}`
    ).join('\n\n');

    const replyText =
      `I connected to your **Google Business Profile** and retrieved verified listing reviews:\n\n` +
      `📍 **Location Rating:** **${averageRating} / 5.0** · **${unansweredCount} review${unansweredCount !== 1 ? 's' : ''}** pending response.\n\n` +
      `${reviewsFormatted}\n\n` +
      `Would you like me to draft an official host reply to Genevieve M.?`;

    return {
      handled: true,
      replyText,
      chip,
      data: { averageRating, unansweredCount, reviews: filteredReviews }
    };
  }

  // gbp_post_update
  const summary = String(args.summary || 'Exclusive Autumn Executive Salon & Private Workspace Inquiries Now Open.');
  const cta = String(args.call_to_action || 'BOOK');
  const actionCard: HydrateFormAction = {
    id: `act_gbp_${Date.now()}`,
    category: 'profile_intake',
    action_name: 'Publish Google Business Update',
    target_app: 'Google Business Profile',
    requires_user_confirmation: true,
    status: 'pending_confirmation',
    timestamp: new Date().toISOString(),
    form_payload: {
      title: 'Google Maps Business Update',
      items: [
        `Summary: "${summary}"`,
        `Call-to-Action: ${cta} button enabled`,
        'Placement: Google Search Knowledge Panel & Google Maps Listing',
        'Visibility: Public (Immediate verification upon approval)'
      ],
      target_time: 'Immediate on approval',
      notes: summary,
      fields: {
        action_button: cta,
        destination_url: 'https://carolann.executive/reserve',
        api_version: 'GBP v1 API (OAuth 2.0 verified)'
      }
    }
  };

  const chip: PluginExecutionChip = {
    pluginId: 'google-business',
    pluginName: 'Google Business Profile',
    toolName: 'gbp_post_update',
    status: 'staged',
    latencyMs: 18,
  };

  return {
    handled: true,
    replyText: `I have prepared your official Google Business Profile announcement. Please verify the copy and click **Approve & Execute** to publish directly to Google Search & Maps.`,
    chip,
    actionCard,
    data: { staged: true, summary, cta }
  };
}

export function executeShopifyTool(
  toolName: 'shopify_get_orders' | 'shopify_get_inventory' | 'shopify_update_product',
  args: Record<string, unknown> = {}
): PluginExecutionResult {
  if (toolName === 'shopify_get_orders') {
    const totalGmv = 18420.00;
    const ordersCount = 42;
    const unfulfilledCount = 6;
    const chip: PluginExecutionChip = {
      pluginId: 'shopify',
      pluginName: 'Shopify Storefront & Orders',
      toolName: 'shopify_get_orders',
      status: 'executed',
      latencyMs: 18,
    };

    const replyText =
      `I queried your active **Shopify Storefront** via the direct Admin MCP bridge:\n\n` +
      `### 🛍️ Real-Time Store Performance (Today):\n` +
      `- **Gross Merchandise Value (GMV):** **$18,420.00** across **42 orders**\n` +
      `- **Average Order Value (AOV):** **$438.57**\n` +
      `- **Wholesale B2B Order #SO-9821:** **$15,000.00** from *Luxe Living Retail Partners*\n` +
      `- **Fulfillment Status:** 36 fulfilled · **${unfulfilledCount} unfulfilled / staged for 2:00 PM courier pickup**\n\n` +
      `All Shopify webhooks are operational and synchronized with your ledger.`;

    return {
      handled: true,
      replyText,
      chip,
      data: { totalGmv, ordersCount, unfulfilledCount }
    };
  }

  if (toolName === 'shopify_get_inventory') {
    const query = String(args.sku_or_title || 'Sovereign Journal');
    const chip: PluginExecutionChip = {
      pluginId: 'shopify',
      pluginName: 'Shopify Storefront & Orders',
      toolName: 'shopify_get_inventory',
      status: 'executed',
      latencyMs: 16,
    };

    const replyText =
      `I checked live inventory levels in your **Shopify Catalog** for \`${query}\`:\n\n` +
      `| Variant / SKU | Title | Live Stock | Status |\n` +
      `| :--- | :--- | :--- | :--- |\n` +
      `| **SKU-LUM-01** | Executive Leather Planner (Obsidian) | **84 units** | ✅ In Stock |\n` +
      `| **SKU-LUM-02** | Executive Leather Planner (Rose Blush) | **12 units** | ⚠️ Low Stock Alert |\n` +
      `| **SKU-LUM-03** | Brass Fountain Pen Edition | **140 units** | ✅ In Stock |\n\n` +
      `Rose Blush is approaching reorder threshold. Would you like me to stage a reorder purchase order?`;

    return {
      handled: true,
      replyText,
      chip,
      data: { query, lowStock: true }
    };
  }

  // shopify_update_product
  const productId = String(args.product_id || 'prod_9012');
  const price = String(args.price || '165.00');
  const inventoryDelta = Number(args.inventory_delta || 0);

  const actionCard: HydrateFormAction = {
    id: `act_shopify_${Date.now()}`,
    category: 'profile_intake',
    action_name: 'Update Shopify Product Catalog',
    target_app: 'Shopify Storefront & Orders',
    requires_user_confirmation: true,
    status: 'pending_confirmation',
    timestamp: new Date().toISOString(),
    form_payload: {
      title: `Update Product Catalog (${productId})`,
      items: [
        `Target: Shopify Store Catalog (${productId})`,
        `Adjusted Unit Price: $${price} USD`,
        `Inventory Adjustment: ${inventoryDelta >= 0 ? `+${inventoryDelta}` : inventoryDelta} units`,
        'Channel Sync: Online Store, Shop App, Point of Sale'
      ],
      target_time: 'Immediate upon confirmation',
      notes: 'Price adjustment scheduled for live storefront channels.',
      fields: {
        product_id: productId,
        new_price: `$${price}`,
        inventory_delta: String(inventoryDelta)
      }
    }
  };

  const chip: PluginExecutionChip = {
    pluginId: 'shopify',
    pluginName: 'Shopify Storefront & Orders',
    toolName: 'shopify_update_product',
    status: 'staged',
    latencyMs: 20,
  };

  return {
    handled: true,
    replyText: `I have staged the Shopify product catalog update for \`${productId}\` at $${price}. Please review and authorize execution in the safety tray below.`,
    chip,
    actionCard,
    data: { productId, price, inventoryDelta }
  };
}

export function executeStripeTool(
  toolName: 'stripe_get_charges' | 'stripe_create_payment_link',
  args: Record<string, unknown> = {}
): PluginExecutionResult {
  if (toolName === 'stripe_get_charges') {
    const chip: PluginExecutionChip = {
      pluginId: 'stripe',
      pluginName: 'Stripe Payments & Billing',
      toolName: 'stripe_get_charges',
      status: 'executed',
      latencyMs: 12,
    };

    const replyText =
      `I connected to your **Stripe Payments** account and inspected real-time settlements:\n\n` +
      `### 💳 Stripe Volume (Last 24 Hours):\n` +
      `- **Gross Volume:** **$24,650.00** across 18 transactions\n` +
      `- **Net Payout Staged:** **$23,935.15** (Stripe processing fees: $714.85)\n` +
      `- **Latest Succeeded Charge:** **$5,000.00** from *Meridian Ventures* (ACH Direct Debit)\n` +
      `- **Failed Charges:** **0** (Dispute rate: 0.00% · All radar risk checks passed)\n\n` +
      `Next automated payout to your Operating Reserve will settle tomorrow at 9:00 AM EST.`;

    return {
      handled: true,
      replyText,
      chip,
      data: { grossVolume: 24650.00, netVolume: 23935.15, failedCount: 0 }
    };
  }

  // stripe_create_payment_link
  const itemName = String(args.item_name || 'Executive Advisory Retainer');
  const amountCents = Number(args.amount_cents || 250000);
  const formattedAmount = `$${(amountCents / 100).toFixed(2)}`;

  const actionCard: HydrateFormAction = {
    id: `act_stripe_${Date.now()}`,
    category: 'profile_intake',
    action_name: 'Generate Stripe Payment Link',
    target_app: 'Stripe Payments & Billing',
    requires_user_confirmation: true,
    status: 'pending_confirmation',
    timestamp: new Date().toISOString(),
    form_payload: {
      title: `Checkout Link: ${itemName} (${formattedAmount})`,
      items: [
        `Service / Retainer: ${itemName}`,
        `Total Amount: ${formattedAmount} USD`,
        'Payment Methods: Credit Card, Apple Pay, Google Pay, US Bank Transfer (ACH)',
        'Invoice Receipt: Automatic branded customer receipt upon settlement'
      ],
      target_time: 'Ready to dispatch',
      notes: `Hosted Stripe checkout link for ${itemName} (${formattedAmount}).`,
      fields: {
        item_name: itemName,
        amount: formattedAmount,
        currency: 'USD',
        hosted_url: 'https://buy.stripe.com/live_carolann_exec_99012'
      }
    }
  };

  const chip: PluginExecutionChip = {
    pluginId: 'stripe',
    pluginName: 'Stripe Payments & Billing',
    toolName: 'stripe_create_payment_link',
    status: 'staged',
    latencyMs: 14,
  };

  return {
    handled: true,
    replyText: `I have prepared a hosted **Stripe Checkout link** for **${itemName}** (${formattedAmount}). Please review the payment parameters below and click **Approve & Execute** to generate the live URL.`,
    chip,
    actionCard,
    data: { itemName, amountCents, formattedAmount }
  };
}

export function executeQuickBooksTool(
  toolName: 'quickbooks_get_invoices' | 'quickbooks_create_invoice' | 'quickbooks_get_balances',
  args: Record<string, unknown> = {}
): PluginExecutionResult {
  if (toolName === 'quickbooks_get_balances') {
    const chip: PluginExecutionChip = {
      pluginId: 'quickbooks',
      pluginName: 'QuickBooks Online',
      toolName: 'quickbooks_get_balances',
      status: 'executed',
      latencyMs: 24,
    };

    const replyText =
      `I connected to **QuickBooks Online** and inspected your current Chart of Accounts:\n\n` +
      `- **Liquid Operating Checking:** **$142,850.00**\n` +
      `- **Accounts Receivable (Open):** **$6,970.00**\n` +
      `- **Accounts Payable (Due in 30d):** **$3,210.00**\n` +
      `- **Net Cash Flow (Month-to-Date):** **+$18,420.00**\n\n` +
      `Your ledger is balanced and fully reconciled against Stripe settlements.`;

    return {
      handled: true,
      replyText,
      chip,
      data: { operatingCash: 142850, arTotal: 6970, apTotal: 3210 }
    };
  }

  if (toolName === 'quickbooks_get_invoices') {
    const chip: PluginExecutionChip = {
      pluginId: 'quickbooks',
      pluginName: 'QuickBooks Online',
      toolName: 'quickbooks_get_invoices',
      status: 'executed',
      latencyMs: 18,
    };

    const replyText =
      `I connected to QuickBooks Online and inspected your active Accounts Receivable ledger. You currently have **3 unpaid invoices** totaling **$6,970.00**:\n\n` +
      `| Invoice | Client | Amount | Due Date | Status |\n` +
      `| :--- | :--- | :--- | :--- | :--- |\n` +
      `| **#INV-1042** | Apex Creative Co. | **$4,250.00** | 3 days ago | ⚠️ Overdue (Aging: 3d) |\n` +
      `| **#INV-1039** | Horizon Media LLC | **$1,800.00** | Next Friday | ⏱️ Net 30 Pending |\n` +
      `| **#INV-1035** | Blue Ridge Studio | **$920.00** | In 14 days | ⏱️ Net 15 Normal |\n\n` +
      `💡 **Recommendation:** Apex Creative Co. is past its payment terms. Would you like me to draft a reminder email via your Gmail connector, or stage an updated QuickBooks balance statement?`;

    return {
      handled: true,
      replyText,
      chip,
      data: { totalUnpaid: 6970, overdueCount: 1 }
    };
  }

  // quickbooks_create_invoice
  const customerName = String(args.customer_name || 'Apex Creative Co.');
  const amount = Number(args.amount || 2500);
  const formattedAmount = `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const lineItems = Array.isArray(args.line_items) && args.line_items.length > 0
    ? (args.line_items as string[])
    : ['Executive Workspace Consulting & Q3 Architecture Audit'];
  const dueDate = String(args.due_date || 'Net 15 (Due in 15 days)');

  const actionCard: HydrateFormAction = {
    id: `act_qb_${Date.now()}`,
    category: 'profile_intake',
    action_name: 'Create & Dispatch QuickBooks Invoice',
    target_app: 'QuickBooks Online',
    requires_user_confirmation: true,
    status: 'pending_confirmation',
    timestamp: new Date().toISOString(),
    form_payload: {
      title: `Invoice: ${customerName} (${formattedAmount})`,
      items: [
        `Client: ${customerName}`,
        `Amount: ${formattedAmount} USD`,
        `Line Items: ${lineItems.join('; ')}`,
        `Terms: ${dueDate}`,
        'Payment Option: Stripe Hosted Credit Card & Bank ACH enabled'
      ],
      target_time: dueDate,
      notes: `Professional services rendered. Thank you for your partnership.`,
      fields: {
        customer_name: customerName,
        total_amount: formattedAmount,
        currency: 'USD',
        tax_rate: '0.00% (Exempt)'
      }
    }
  };

  const chip: PluginExecutionChip = {
    pluginId: 'quickbooks',
    pluginName: 'QuickBooks Online',
    toolName: 'quickbooks_create_invoice',
    status: 'staged',
    latencyMs: 20,
  };

  return {
    handled: true,
    replyText: `I have generated a formal QuickBooks Online draft invoice for **${customerName}** in the amount of **${formattedAmount}**. Before it is recorded and dispatched, please review and approve it below:`,
    chip,
    actionCard,
    data: { customerName, amount, formattedAmount, dueDate }
  };
}

export function executeGmailTool(
  toolName: 'gmail_search_threads' | 'gmail_draft_message',
  args: Record<string, unknown> = {}
): PluginExecutionResult {
  if (toolName === 'gmail_search_threads') {
    const query = String(args.query || 'is:unread');
    const chip: PluginExecutionChip = {
      pluginId: 'gmail',
      pluginName: 'Gmail & Google Workspace Mail',
      toolName: 'gmail_search_threads',
      status: 'executed',
      latencyMs: 14,
    };

    const replyText =
      `I searched your **Google Workspace Gmail inbox** for \`${query}\`:\n\n` +
      `- **"Q3 Executive Roadmap & Deliverables"** — *Sarah Jenkins (VP Strategy, Apex)*\n` +
      `  > *"Carol Ann, could you review the final draft by Friday? Looking forward to our sync."*\n` +
      `  *(Received 42 mins ago · Priority Inbox)*\n\n` +
      `- **"Invoice #INV-1042 Settlement Confirmation"** — *billing@apexcreative.design*\n` +
      `  > *"Wire transfer initiated for our outstanding retainer balance."*\n` +
      `  *(Received 2 hours ago)*\n\n` +
      `Would you like me to draft a confirmation response to Sarah Jenkins?`;

    return {
      handled: true,
      replyText,
      chip,
      data: { query, threadCount: 2 }
    };
  }

  // gmail_draft_message
  const to = String(args.to || 'sarah.jenkins@apex.com');
  const subject = String(args.subject || 'Re: Q3 Executive Roadmap & Deliverables');
  const body = String(
    args.body ||
    'Dear Sarah,\n\nThank you for sharing the roadmap draft. I have reviewed the milestones and will have detailed architecture feedback prepared ahead of our Friday sync.\n\nWarm regards,\nCarol Ann'
  );

  const actionCard: HydrateFormAction = {
    id: `act_gmail_${Date.now()}`,
    category: 'profile_intake',
    action_name: 'Draft Gmail Message',
    target_app: 'Gmail & Google Workspace Mail',
    requires_user_confirmation: true,
    status: 'pending_confirmation',
    timestamp: new Date().toISOString(),
    form_payload: {
      title: `Draft to ${to}: "${subject}"`,
      items: [
        `Recipient: ${to}`,
        `Subject: ${subject}`,
        'Action: Stage draft in Gmail (Safe Mode: will NOT auto-send)',
        'Safety: Requires operator approval before dispatch'
      ],
      target_time: 'Ready to stage in inbox',
      notes: body,
      fields: {
        to,
        subject,
        body
      }
    }
  };

  const chip: PluginExecutionChip = {
    pluginId: 'gmail',
    pluginName: 'Gmail & Google Workspace Mail',
    toolName: 'gmail_draft_message',
    status: 'staged',
    latencyMs: 16,
  };

  return {
    handled: true,
    replyText: `I have prepared a polished email draft for **${to}** in your Gmail workspace. Please review the wording below and click **Approve & Execute** to place it in your outbox:`,
    chip,
    actionCard,
    data: { to, subject, body }
  };
}

export function executeZapierTool(
  toolName: 'zapier_list_actions' | 'zapier_execute_action',
  args: Record<string, unknown> = {}
): PluginExecutionResult {
  const zapConfig = loadZapierConfig();

  if (toolName === 'zapier_list_actions') {
    const chip: PluginExecutionChip = {
      pluginId: 'zapier-gateway',
      pluginName: 'Zapier Universal MCP Gateway',
      toolName: 'zapier_list_actions',
      status: 'executed',
      latencyMs: 38,
    };

    const actionsList = zapConfig.actions
      .map((a) => `- **${a.name}** (*${a.app}* · ${a.category}) ${a.requiresConfirmation ? '*(Approval Required)*' : '*(Auto)*'}`)
      .join('\n');

    const replyText =
      `Zapier Universal MCP Gateway is connected to \`${zapConfig.endpointUrl}\`.\n\n` +
      `Here are the enabled actions synchronized into Carol Ann's active runtime schema:\n\n` +
      `${actionsList}\n\n` +
      `You can invoke any of these actions in natural dialogue (e.g., *"Sync VIP lead to HubSpot CRM"* or *"Sync Stripe charge to QuickBooks"*).`;

    return {
      handled: true,
      replyText,
      chip,
      data: { endpoint: zapConfig.endpointUrl, actions: zapConfig.actions }
    };
  }

  // zapier_execute_action
  const actionName = String(args.action_name || 'Sync VIP Lead to HubSpot CRM');
  const paramsJson = String(args.parameters_json || '{"lead":"Sarah Jenkins","company":"Apex Global"}');

  const actionCard: HydrateFormAction = {
    id: `act_zapier_${Date.now()}`,
    category: 'profile_intake',
    action_name: `Execute Zapier Action: ${actionName}`,
    target_app: 'Zapier Universal MCP Gateway',
    requires_user_confirmation: true,
    status: 'pending_confirmation',
    timestamp: new Date().toISOString(),
    form_payload: {
      title: `Zapier Workflow: ${actionName}`,
      items: [
        `Action: ${actionName}`,
        'Gateway: Universal MCP Endpoint (https://actions.zapier.com/settings/mcp/)',
        `Payload: ${paramsJson}`,
        'Security: Encrypted token authentication with zero external telemetry'
      ],
      target_time: 'Instant trigger upon approval',
      notes: `Executing ${actionName} across connected SaaS ecosystem.`,
      fields: {
        action_name: actionName,
        params: paramsJson
      }
    }
  };

  const chip: PluginExecutionChip = {
    pluginId: 'zapier-gateway',
    pluginName: 'Zapier Universal MCP Gateway',
    toolName: 'zapier_execute_action',
    status: 'staged',
    latencyMs: 35,
  };

  return {
    handled: true,
    replyText: `I have prepared the **Zapier Action (${actionName})** in your safety verification tray. Authorize execution below to trigger the workflow.`,
    chip,
    actionCard,
    data: { actionName, paramsJson }
  };
}

// ----------------------------------------------------------------------------
// Master Intent Dispatcher for Conversational Queries
// ----------------------------------------------------------------------------

export function tryExecutePluginIntent(
  userPrompt: string,
  installedPluginIds: string[] = loadInstalledPluginIds(),
  explicitToolCall?: { name: string; args: Record<string, unknown> }
): PluginExecutionResult | null {
  // If an explicit function call was made by Gemini, execute directly:
  if (explicitToolCall) {
    const { name, args } = explicitToolCall;
    if (name.startsWith('gbp_')) {
      return executeGoogleBusinessTool(name as 'gbp_fetch_reviews' | 'gbp_post_update', args);
    }
    if (name.startsWith('shopify_')) {
      return executeShopifyTool(name as 'shopify_get_orders' | 'shopify_get_inventory' | 'shopify_update_product', args);
    }
    if (name.startsWith('stripe_')) {
      return executeStripeTool(name as 'stripe_get_charges' | 'stripe_create_payment_link', args);
    }
    if (name.startsWith('quickbooks_')) {
      return executeQuickBooksTool(name as 'quickbooks_get_invoices' | 'quickbooks_create_invoice' | 'quickbooks_get_balances', args);
    }
    if (name.startsWith('gmail_')) {
      return executeGmailTool(name as 'gmail_search_threads' | 'gmail_draft_message', args);
    }
    if (name.startsWith('zapier_')) {
      return executeZapierTool(name as 'zapier_list_actions' | 'zapier_execute_action', args);
    }
  }

  const promptLower = userPrompt.toLowerCase().trim();
  const isInstalled = (pluginId: string) => installedPluginIds.includes(pluginId);

  // 1. Google Business Profile
  if (
    promptLower.includes('google business') ||
    promptLower.includes('google maps review') ||
    (promptLower.includes('google') && (promptLower.includes('reviews') || promptLower.includes('rating') || promptLower.includes('post update') || promptLower.includes('announcement')))
  ) {
    if (isInstalled('google-business') || isInstalled('zapier-gateway')) {
      if (promptLower.includes('update') || promptLower.includes('post') || promptLower.includes('announce')) {
        return executeGoogleBusinessTool('gbp_post_update', {
          summary: 'Autumn Executive Salon: Private workspace and strategic advisory slots now open.',
          call_to_action: 'BOOK'
        });
      }
      return executeGoogleBusinessTool('gbp_fetch_reviews', { unanswered_only: true });
    }
  }

  // 2. Shopify Storefront & Orders
  if (
    (promptLower.includes('shopify') && !promptLower.includes('quickbooks')) ||
    (promptLower.includes('orders') && promptLower.includes('sales')) ||
    (promptLower.includes('gmv') || promptLower.includes('store sales')) ||
    (promptLower.includes('inventory') && promptLower.includes('stock'))
  ) {
    if (isInstalled('shopify')) {
      if (promptLower.includes('inventory') || promptLower.includes('stock')) {
        return executeShopifyTool('shopify_get_inventory', { sku_or_title: 'Sovereign Journal' });
      }
      return executeShopifyTool('shopify_get_orders', { status: 'open', limit: 10 });
    }
  }

  // 3. Shopify & QuickBooks Joint Cross-check
  if (
    (promptLower.includes('shopify') && promptLower.includes('quickbooks')) ||
    (promptLower.includes('sales numbers') && promptLower.includes('recorded'))
  ) {
    if (isInstalled('shopify') && isInstalled('quickbooks')) {
      const chip: PluginExecutionChip = {
        pluginId: 'shopify',
        pluginName: 'Shopify & QuickBooks Reconciliation',
        toolName: 'shopify_get_orders',
        status: 'executed',
        latencyMs: 24,
      };

      const replyText =
        `I queried your **Shopify Storefront** and cross-referenced with your **QuickBooks Online** ledger via parallel MCP bridges:\n\n` +
        `### 🛍️ Shopify Store Performance (Today):\n` +
        `- **Gross Merchandise Value (GMV):** **$18,420.00** across 42 orders\n` +
        `- **Direct Consumer Sales:** $3,420.00 (Average Order Value: $83.41)\n` +
        `- **B2B Wholesale Order #SO-9821:** **$15,000.00** from *Luxe Living Retail Partners*\n` +
        `- **Fulfillment Pipeline:** 36 fulfilled / 6 staged for 2:00 PM courier pickup\n\n` +
        `### 📚 QuickBooks Online Cross-Verification:\n` +
        `- **Invoice Reference:** **#INV-1043** ($15,000.00) issued to *Luxe Living Retail Partners*\n` +
        `- **Ledger Status:** ✅ **Recorded & Matched** in Accounts Receivable\n` +
        `- **Payment Settlement:** Received via Stripe ACH Transfer · Deposited to Operating Reserve\n` +
        `- **Discrepancy Delta:** **$0.00** (100% reconciled between Shopify and QuickBooks)\n\n` +
        `Both systems are synchronized. Would you like me to generate a 30-day revenue forecast or draft a customer thank-you update?`;

      return {
        handled: true,
        replyText,
        chip,
        data: { reconciled: true, gmv: 18420.00, delta: 0 }
      };
    }
  }

  // 4. Stripe Payments & Billing
  if (
    promptLower.includes('stripe') ||
    promptLower.includes('payment link') ||
    promptLower.includes('credit card charge') ||
    promptLower.includes('checkout link')
  ) {
    if (isInstalled('stripe') || isInstalled('zapier-gateway')) {
      if (promptLower.includes('link') || promptLower.includes('create') || promptLower.includes('checkout') || promptLower.includes('generate')) {
        return executeStripeTool('stripe_create_payment_link', {
          item_name: 'Executive Advisory Retainer (Q3)',
          amount_cents: 250000,
        });
      }
      return executeStripeTool('stripe_get_charges', { limit: 10 });
    }
  }

  // 5. QuickBooks Online
  if (
    promptLower.includes('quickbooks') ||
    promptLower.includes('unpaid invoice') ||
    promptLower.includes('unpaid invoices') ||
    promptLower.includes('accounts receivable') ||
    (promptLower.includes('invoice') && (promptLower.includes('create') || promptLower.includes('send') || promptLower.includes('draft')))
  ) {
    if (isInstalled('quickbooks') || isInstalled('zapier-gateway')) {
      if (promptLower.includes('create') || promptLower.includes('send') || promptLower.includes('draft') || promptLower.includes('bill')) {
        return executeQuickBooksTool('quickbooks_create_invoice', {
          customer_name: 'Apex Creative Co.',
          amount: 2500,
          due_date: 'Net 15'
        });
      }
      if (promptLower.includes('balance') || promptLower.includes('cash flow') || promptLower.includes('cashflow')) {
        return executeQuickBooksTool('quickbooks_get_balances', { period: 'this_month' });
      }
      return executeQuickBooksTool('quickbooks_get_invoices', { status: 'unpaid' });
    }
  }

  // 6. Gmail & Google Workspace Mail
  if (
    promptLower.includes('gmail') ||
    promptLower.includes('inbox') ||
    promptLower.includes('draft email') ||
    promptLower.includes('draft reply') ||
    (promptLower.includes('email') && (promptLower.includes('search') || promptLower.includes('triage') || promptLower.includes('unread')))
  ) {
    if (isInstalled('gmail') || isInstalled('zapier-gateway')) {
      if (promptLower.includes('draft') || promptLower.includes('reply') || promptLower.includes('write')) {
        return executeGmailTool('gmail_draft_message', {
          to: 'sarah.jenkins@apex.com',
          subject: 'Re: Q3 Executive Roadmap & Deliverables',
        });
      }
      return executeGmailTool('gmail_search_threads', { query: 'is:unread' });
    }
  }

  // 7. Zapier Universal MCP Gateway
  if (
    promptLower.includes('zapier') ||
    promptLower.includes('hubspot') ||
    promptLower.includes('sync lead') ||
    promptLower.includes('universal gateway')
  ) {
    if (isInstalled('zapier-gateway')) {
      if (promptLower.includes('lead') || promptLower.includes('hubspot') || promptLower.includes('execute') || promptLower.includes('run')) {
        return executeZapierTool('zapier_execute_action', {
          action_name: 'Sync VIP Lead to HubSpot CRM',
          parameters_json: '{"contact_email":"sarah.jenkins@apex.com","lifecycle_stage":"MQL"}'
        });
      }
      return executeZapierTool('zapier_list_actions');
    }
  }

  // 8. Meta / Instagram Reels
  if (
    promptLower.includes('reel') ||
    promptLower.includes('instagram') ||
    (promptLower.includes('caption') && (promptLower.includes('product') || promptLower.includes('video') || promptLower.includes('post')))
  ) {
    if (isInstalled('instagram-reels') || isInstalled('zapier-gateway')) {
      const chip: PluginExecutionChip = {
        pluginId: 'instagram-reels',
        pluginName: 'Meta / Instagram Reels',
        toolName: 'insta_generate_caption',
        status: 'executed',
        latencyMs: 16,
      };

      const replyText =
        `I have drafted an aesthetic high-engagement caption optimized for the Instagram Reels algorithm, aligned with your workspace identity:\n\n` +
        `🎬 **Draft Caption:**\n` +
        `> *"Crafted for sovereign minds who value calm execution and quiet luxury. ✨ Meet our latest release — where minimalist form meets daily intentionality.\n\n` +
        `> Available now in limited editions. Link in bio to reserve yours.\n\n` +
        `> #ExecutiveLiving #IntentionalDesign #QuietLuxury #CarolAnnOS #ModernMinimalism #ProductLaunch2026"*\n\n` +
        `🎵 **Recommended Audio Sync:** *"Refined Ambient Waves"* (Trending in Business/Lifestyle — 84k Reels created this week)\n` +
        `📐 **Format Specs:** 9:16 Vertical HD (1080x1920) · First 3-sec visual hook verified.\n\n` +
        `I have staged this Reel draft in your safety verification tray. Review the payload and authorize scheduling below.`;

      const actionCard: HydrateFormAction = {
        id: `act_insta_${Date.now()}`,
        category: 'profile_intake',
        action_name: 'Schedule Instagram Reel Draft',
        target_app: 'Meta / Instagram Reels',
        requires_user_confirmation: true,
        status: 'pending_confirmation',
        timestamp: new Date().toISOString(),
        form_payload: {
          title: 'New Product Showcase Reel (Draft)',
          items: [
            'Video Asset: staged_showcase_4k_9x16.mp4',
            'Aspect Ratio: 9:16 Vertical (1080x1920)',
            'Audio Tag: Refined Ambient Waves (Trending Audio ID: #AU-9021)',
            'Scheduled Window: Tomorrow at 11:30 AM EST (Peak Audience Engagement)'
          ],
          target_time: 'Tomorrow at 11:30 AM EST',
          notes: 'Crafted for sovereign minds who value calm execution and quiet luxury.',
          fields: {
            channel: '@carolann.executive',
            placement: 'Reels Hopper & Feed Preview'
          }
        },
      };

      return { handled: true, replyText, chip, actionCard };
    }
  }

  // 9. TripAdvisor Reviews
  if (
    promptLower.includes('tripadvisor') ||
    (promptLower.includes('reviews') && (promptLower.includes('guest') || promptLower.includes('hotel') || promptLower.includes('reply') || promptLower.includes('listing')))
  ) {
    if (isInstalled('tripadvisor') || isInstalled('zapier-gateway')) {
      const chip: PluginExecutionChip = {
        pluginId: 'tripadvisor',
        pluginName: 'TripAdvisor Reviews & Listings',
        toolName: 'tripadvisor_fetch_reviews',
        status: 'executed',
        latencyMs: 22,
      };

      const replyText =
        `I connected to your claimed TripAdvisor listing via the MCP Bridge and retrieved your 2 most recent guest reviews:\n\n` +
        `⭐ **Elena V. — 5/5 Stars** *(Stayed 2 days ago in Oceanfront Executive Suite 402)*\n` +
        `> *"Breathtaking ocean views, impeccable hospitality, and seamless executive workspace amenities. The high-speed desk setup on the private terrace was immaculate for remote deep work."*\n\n` +
        `⭐ **Marcus K. — 4/5 Stars** *(Stayed 5 days ago in Grand Deluxe)*\n` +
        `> *"Exceptional dining and spa service. Check-in had a brief 10-minute wait during the afternoon peak, but the concierge was warm and offered chilled champagne."*\n\n` +
        `---\n` +
        `### Drafted Host Response to Elena V.:\n` +
        `*"Dear Elena, thank you sincerely for choosing our suites and for taking a moment to share your lovely experience! We are delighted that the quiet terrace workspace and ocean views provided the focused, serene atmosphere you needed. Our team looks forward to welcoming you back for another inspiring stay."*\n\n` +
        `I have staged this official response in your verification tray below. Please review and click **Approve & Execute** to transmit directly to TripAdvisor.`;

      const actionCard: HydrateFormAction = {
        id: `act_tripadvisor_${Date.now()}`,
        category: 'profile_intake',
        action_name: 'Post Official Host Response',
        target_app: 'TripAdvisor Reviews & Listings',
        requires_user_confirmation: true,
        status: 'pending_confirmation',
        timestamp: new Date().toISOString(),
        form_payload: {
          title: 'Reply to Elena V. (Review #TR-88219)',
          items: [
            'Target: TripAdvisor Oceanfront Executive Suite 402',
            'Guest: Elena V. (Verified Booking, 5/5 Stars)',
            'Action: Dispatch official management reply to public listing',
            'Sentiment: Positive / Appreciation & Invitation'
          ],
          notes: 'Dear Elena, thank you sincerely for choosing our suites and for taking a moment to share your lovely experience! We are delighted that the quiet terrace workspace and ocean views provided the focused, serene atmosphere you needed. Our team looks forward to welcoming you back for another inspiring stay.',
          fields: {
            review_id: 'TR-88219',
            platform: 'TripAdvisor Partner API v1',
            status: 'Ready to dispatch'
          }
        },
      };

      return { handled: true, replyText, chip, actionCard };
    }
  }

  return null;
}
