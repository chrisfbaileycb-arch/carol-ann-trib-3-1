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
  isMock?: boolean;
  badge?: string;
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
        isMock: true,
      },
      {
        review_id: 'rev_g_8814',
        reviewer_name: 'David R.',
        star_rating: 5,
        date: '3 days ago',
        comment: 'Outstanding attention to detail and pristine private work suites. Seamless executive experience.',
        answered: true,
        isMock: true,
      },
      {
        review_id: 'rev_g_8802',
        reviewer_name: 'Julian S.',
        star_rating: 4,
        date: 'Last week',
        comment: 'Serene atmosphere and prompt assistance. Highly recommended for executive retreats.',
        answered: false,
        isMock: true,
      }
    ];

    const filteredReviews = unansweredOnly ? reviews.filter((r) => !r.answered) : reviews;
    const averageRating = 4.8;
    const unansweredCount = reviews.filter((r) => !r.answered).length;

    const chip: PluginExecutionChip = {
      pluginId: 'google-business',
      pluginName: 'Google Business Profile',
      toolName: 'gbp_fetch_reviews',
      status: 'staged',
      latencyMs: 15,
      isMock: true,
      badge: 'DEMO',
    };

    const reviewsFormatted = filteredReviews.map((r) =>
      `⭐ **${r.reviewer_name} — ${r.star_rating}/5 Stars** *(${r.date})* [DEMO FIXTURE]\n` +
      `> *"${r.comment}"*\n` +
      `Status: ${r.answered ? 'Answered (Mock)' : 'Pending reply (Mock)'}`
    ).join('\n\n');

    const replyText =
      `[DEMO FIXTURE] **Google Business Profile (Demo Data — not live)**\n` +
      `*Notice: Simulated response — no live Google Business Profile was contacted.*\n\n` +
      `📍 **Demo Location Rating:** **${averageRating} / 5.0** · **${unansweredCount} review${unansweredCount !== 1 ? 's' : ''}** (Demo fixtures).\n\n` +
      `${reviewsFormatted}\n\n` +
      `*(Demo fixture only — no live data was retrieved from Google).*`;

    return {
      handled: true,
      replyText,
      chip,
      data: { isMock: true, badge: 'DEMO', averageRating, unansweredCount, reviews: filteredReviews },
      isMock: true,
      badge: 'DEMO',
    };
  }

  // gbp_post_update
  const summary = String(args.summary || 'Exclusive Autumn Executive Salon & Private Workspace Inquiries Now Open.');
  const cta = String(args.call_to_action || 'BOOK');
  const actionCard: HydrateFormAction = {
    id: `act_gbp_${Date.now()}`,
    category: 'profile_intake',
    action_name: 'Stage Google Business Update (Demo)',
    target_app: 'Google Business Profile (Demo)',
    requires_user_confirmation: true,
    status: 'pending_confirmation',
    timestamp: new Date().toISOString(),
    isMock: true,
    badge: 'DEMO',
    form_payload: {
      title: '[DEMO] Google Maps Business Update (Simulation)',
      items: [
        `Summary: "${summary}"`,
        `Call-to-Action: ${cta} button enabled`,
        'Status: Simulated — nothing will be dispatched',
        'Placement: Demo Knowledge Panel Preview'
      ],
      target_time: 'Simulated on approval',
      notes: `Simulated — nothing was dispatched. Demo fixture only: "${summary}"`,
      fields: {
        action_button: cta,
        destination_url: 'https://carolann.executive/reserve',
        demo_mode: 'Demo Fixture (isMock: true)'
      }
    }
  };

  const chip: PluginExecutionChip = {
    pluginId: 'google-business',
    pluginName: 'Google Business Profile',
    toolName: 'gbp_post_update',
    status: 'staged',
    latencyMs: 18,
    isMock: true,
    badge: 'DEMO',
  };

  return {
    handled: true,
    replyText: `[DEMO FIXTURE] I have prepared a simulated Google Business Profile announcement. Review below (Simulated — nothing will be dispatched to Google Search or Maps).`,
    chip,
    actionCard,
    data: { staged: true, summary, cta, isMock: true, badge: 'DEMO' },
    isMock: true,
    badge: 'DEMO',
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
      status: 'staged',
      latencyMs: 18,
      isMock: true,
      badge: 'DEMO',
    };

    const replyText =
      `[DEMO FIXTURE] **Shopify Storefront & Orders (Demo Data — not live)**\n` +
      `*Notice: Simulated response — no live Shopify storefront was contacted.*\n\n` +
      `### 🛍️ Demo Store Performance Fixture:\n` +
      `- **Gross Merchandise Value (GMV):** **$18,420.00** across **42 orders** (Mock)\n` +
      `- **Average Order Value (AOV):** **$438.57** (Mock)\n` +
      `- **Wholesale B2B Order #SO-9821:** **$15,000.00** from *Luxe Living Retail Partners* (Mock)\n` +
      `- **Fulfillment Status:** 36 fulfilled · **${unfulfilledCount} unfulfilled** (Mock)\n\n` +
      `*(Demo fixture only — no real storefront records were queried).*`;

    return {
      handled: true,
      replyText,
      chip,
      data: { isMock: true, badge: 'DEMO', totalGmv, ordersCount, unfulfilledCount },
      isMock: true,
      badge: 'DEMO',
    };
  }

  if (toolName === 'shopify_get_inventory') {
    const query = String(args.sku_or_title || 'Sovereign Journal');
    const chip: PluginExecutionChip = {
      pluginId: 'shopify',
      pluginName: 'Shopify Storefront & Orders',
      toolName: 'shopify_get_inventory',
      status: 'staged',
      latencyMs: 16,
      isMock: true,
      badge: 'DEMO',
    };

    const replyText =
      `[DEMO FIXTURE] **Shopify Catalog Inventory (Demo Data — not live)**\n` +
      `*Notice: Simulated response — no live Shopify catalog was queried.*\n\n` +
      `| Variant / SKU | Title | Live Stock | Status |\n` +
      `| :--- | :--- | :--- | :--- |\n` +
      `| **SKU-LUM-01** | Executive Leather Planner (Obsidian) | **84 units** | In Stock (Mock) |\n` +
      `| **SKU-LUM-02** | Executive Leather Planner (Rose Blush) | **12 units** | Low Stock Alert (Mock) |\n` +
      `| **SKU-LUM-03** | Brass Fountain Pen Edition | **140 units** | In Stock (Mock) |\n\n` +
      `*(Demo fixture only — nothing was queried from Shopify).*`;

    return {
      handled: true,
      replyText,
      chip,
      data: { isMock: true, badge: 'DEMO', query, lowStock: true },
      isMock: true,
      badge: 'DEMO',
    };
  }

  // shopify_update_product
  const productId = String(args.product_id || 'prod_9012');
  const price = String(args.price || '165.00');
  const inventoryDelta = Number(args.inventory_delta || 0);

  const actionCard: HydrateFormAction = {
    id: `act_shopify_${Date.now()}`,
    category: 'profile_intake',
    action_name: 'Update Shopify Product Catalog (Demo)',
    target_app: 'Shopify Storefront & Orders (Demo)',
    requires_user_confirmation: true,
    status: 'pending_confirmation',
    timestamp: new Date().toISOString(),
    isMock: true,
    badge: 'DEMO',
    form_payload: {
      title: `[DEMO] Update Product Catalog (${productId})`,
      items: [
        `Target: Shopify Store Catalog (${productId})`,
        `Adjusted Unit Price: $${price} USD`,
        `Inventory Adjustment: ${inventoryDelta >= 0 ? `+${inventoryDelta}` : inventoryDelta} units`,
        'Status: Simulated — nothing will be dispatched'
      ],
      target_time: 'Simulated on approval',
      notes: 'Simulated — nothing was dispatched. Demo fixture only.',
      fields: {
        product_id: productId,
        new_price: `$${price}`,
        inventory_delta: String(inventoryDelta),
        demo_mode: 'Demo Fixture (isMock: true)'
      }
    }
  };

  const chip: PluginExecutionChip = {
    pluginId: 'shopify',
    pluginName: 'Shopify Storefront & Orders',
    toolName: 'shopify_update_product',
    status: 'staged',
    latencyMs: 20,
    isMock: true,
    badge: 'DEMO',
  };

  return {
    handled: true,
    replyText: `[DEMO FIXTURE] I have staged a simulated Shopify product catalog update for \`${productId}\` at $${price}. Review below (Simulated — nothing will be dispatched to Shopify).`,
    chip,
    actionCard,
    data: { isMock: true, badge: 'DEMO', productId, price, inventoryDelta },
    isMock: true,
    badge: 'DEMO',
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
      status: 'staged',
      latencyMs: 12,
      isMock: true,
      badge: 'DEMO',
    };

    const replyText =
      `[DEMO FIXTURE] **Stripe Payments & Billing (Demo Data — not live)**\n` +
      `*Notice: Simulated response — no live Stripe account was contacted.*\n\n` +
      `### 💳 Demo Volume Fixture (Last 24 Hours):\n` +
      `- **Gross Volume:** **$24,650.00** across 18 transactions (Simulated)\n` +
      `- **Net Payout Staged:** **$23,935.15** (Simulated Stripe processing fees: $714.85)\n` +
      `- **Latest Succeeded Charge:** **$5,000.00** from *Meridian Ventures* (ACH Direct Debit — Mock)\n` +
      `- **Failed Charges:** **0** (Demo radar risk check)\n\n` +
      `*(Demo fixture only — no real financial accounts were queried or affected).*`;

    return {
      handled: true,
      replyText,
      chip,
      data: { isMock: true, badge: 'DEMO', grossVolume: 24650.00, netVolume: 23935.15, failedCount: 0 },
      isMock: true,
      badge: 'DEMO',
    };
  }

  // stripe_create_payment_link
  const itemName = String(args.item_name || 'Executive Advisory Retainer');
  const amountCents = Number(args.amount_cents || 250000);
  const formattedAmount = `$${(amountCents / 100).toFixed(2)}`;

  const actionCard: HydrateFormAction = {
    id: `act_stripe_${Date.now()}`,
    category: 'profile_intake',
    action_name: 'Generate Stripe Payment Link (Demo)',
    target_app: 'Stripe Payments & Billing (Demo)',
    requires_user_confirmation: true,
    status: 'pending_confirmation',
    timestamp: new Date().toISOString(),
    isMock: true,
    badge: 'DEMO',
    form_payload: {
      title: `[DEMO] Checkout Link: ${itemName} (${formattedAmount})`,
      items: [
        `Service / Retainer: ${itemName}`,
        `Total Amount: ${formattedAmount} USD`,
        'Payment Methods: Credit Card, Apple Pay, Google Pay, US Bank Transfer (ACH)',
        'Status: Simulated — nothing will be dispatched'
      ],
      target_time: 'Ready to stage',
      notes: `Simulated — nothing was dispatched. Demo fixture only for ${itemName} (${formattedAmount}).`,
      fields: {
        item_name: itemName,
        amount: formattedAmount,
        currency: 'USD',
        hosted_url: 'https://buy.stripe.com/live_carolann_exec_99012',
        demo_mode: 'Demo Fixture (isMock: true)'
      }
    }
  };

  const chip: PluginExecutionChip = {
    pluginId: 'stripe',
    pluginName: 'Stripe Payments & Billing',
    toolName: 'stripe_create_payment_link',
    status: 'staged',
    latencyMs: 14,
    isMock: true,
    badge: 'DEMO',
  };

  return {
    handled: true,
    replyText: `[DEMO FIXTURE] I have prepared a hosted **Stripe Checkout link preview** for **${itemName}** (${formattedAmount}). Review below (Simulated — nothing will be dispatched to Stripe).`,
    chip,
    actionCard,
    data: { isMock: true, badge: 'DEMO', itemName, amountCents, formattedAmount },
    isMock: true,
    badge: 'DEMO',
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
      status: 'staged',
      latencyMs: 24,
      isMock: true,
      badge: 'DEMO',
    };

    const replyText =
      `[DEMO FIXTURE] **QuickBooks Online (Demo Data — not live)**\n` +
      `*Notice: Simulated response — no live Intuit QuickBooks Online ledger was contacted.*\n\n` +
      `- **Liquid Operating Checking (Mock):** **$142,850.00**\n` +
      `- **Accounts Receivable (Mock Open):** **$6,970.00**\n` +
      `- **Accounts Payable (Mock Due in 30d):** **$3,210.00**\n` +
      `- **Net Cash Flow (Mock MTD):** **+$18,420.00**\n\n` +
      `*(Demo fixture only — no financial records were retrieved from QuickBooks).*`;

    return {
      handled: true,
      replyText,
      chip,
      data: { isMock: true, badge: 'DEMO', operatingCash: 142850, arTotal: 6970, apTotal: 3210 },
      isMock: true,
      badge: 'DEMO',
    };
  }

  if (toolName === 'quickbooks_get_invoices') {
    const chip: PluginExecutionChip = {
      pluginId: 'quickbooks',
      pluginName: 'QuickBooks Online',
      toolName: 'quickbooks_get_invoices',
      status: 'staged',
      latencyMs: 18,
      isMock: true,
      badge: 'DEMO',
    };

    const replyText =
      `[DEMO FIXTURE] **QuickBooks Online Accounts Receivable (Demo Data — not live)**\n` +
      `*Notice: Simulated response — no live QuickBooks service was contacted.*\n\n` +
      `Demo AR ledger: **3 unpaid invoices** totaling **$6,970.00** (Mock data):\n\n` +
      `| Invoice | Client | Amount | Due Date | Status |\n` +
      `| :--- | :--- | :--- | :--- | :--- |\n` +
      `| **#INV-1042** | Apex Creative Co. | **$4,250.00** | 3 days ago | Overdue (Aging: 3d · Mock) |\n` +
      `| **#INV-1039** | Horizon Media LLC | **$1,800.00** | Next Friday | Net 30 Pending (Mock) |\n` +
      `| **#INV-1035** | Blue Ridge Studio | **$920.00** | In 14 days | Net 15 Normal (Mock) |\n\n` +
      `*(Demo fixture only — nothing was queried from QuickBooks).*`;

    return {
      handled: true,
      replyText,
      chip,
      data: { isMock: true, badge: 'DEMO', totalUnpaid: 6970, overdueCount: 1 },
      isMock: true,
      badge: 'DEMO',
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
    action_name: 'Create & Dispatch QuickBooks Invoice (Demo)',
    target_app: 'QuickBooks Online (Demo)',
    requires_user_confirmation: true,
    status: 'pending_confirmation',
    timestamp: new Date().toISOString(),
    isMock: true,
    badge: 'DEMO',
    form_payload: {
      title: `[DEMO] Invoice: ${customerName} (${formattedAmount})`,
      items: [
        `Client: ${customerName}`,
        `Amount: ${formattedAmount} USD`,
        `Line Items: ${lineItems.join('; ')}`,
        `Terms: ${dueDate}`,
        'Status: Simulated — nothing will be dispatched'
      ],
      target_time: dueDate,
      notes: `Simulated — nothing was dispatched. Demo fixture only for ${customerName} (${formattedAmount}).`,
      fields: {
        customer_name: customerName,
        total_amount: formattedAmount,
        currency: 'USD',
        tax_rate: '0.00% (Exempt)',
        demo_mode: 'Demo Fixture (isMock: true)'
      }
    }
  };

  const chip: PluginExecutionChip = {
    pluginId: 'quickbooks',
    pluginName: 'QuickBooks Online',
    toolName: 'quickbooks_create_invoice',
    status: 'staged',
    latencyMs: 20,
    isMock: true,
    badge: 'DEMO',
  };

  return {
    handled: true,
    replyText: `[DEMO FIXTURE] I have prepared a mock QuickBooks Online invoice draft for **${customerName}** in the amount of **${formattedAmount}**. Review below (Simulated — nothing will be dispatched to QuickBooks Online).`,
    chip,
    actionCard,
    data: { isMock: true, badge: 'DEMO', customerName, amount, formattedAmount, dueDate },
    isMock: true,
    badge: 'DEMO',
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
      status: 'staged',
      latencyMs: 14,
      isMock: true,
      badge: 'DEMO',
    };

    const replyText =
      `[DEMO FIXTURE] **Gmail & Google Workspace Mail (Demo Data — not live)**\n` +
      `*Notice: Simulated response — no live Gmail account was searched.*\n\n` +
      `- **"Q3 Executive Roadmap & Deliverables"** — *Sarah Jenkins (VP Strategy, Apex)*\n` +
      `  > *"Carol Ann, could you review the final draft by Friday? Looking forward to our sync."*\n` +
      `  *(Received 42 mins ago · Priority Inbox · Mock)*\n\n` +
      `- **"Invoice #INV-1042 Settlement Confirmation"** — *billing@apexcreative.design*\n` +
      `  > *"Wire transfer initiated for our outstanding retainer balance."*\n` +
      `  *(Received 2 hours ago · Mock)*\n\n` +
      `*(Demo fixture only — no live mail was accessed).*`;

    return {
      handled: true,
      replyText,
      chip,
      data: { isMock: true, badge: 'DEMO', query, threadCount: 2 },
      isMock: true,
      badge: 'DEMO',
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
    action_name: 'Draft Gmail Message (Demo)',
    target_app: 'Gmail & Google Workspace Mail (Demo)',
    requires_user_confirmation: true,
    status: 'pending_confirmation',
    timestamp: new Date().toISOString(),
    isMock: true,
    badge: 'DEMO',
    form_payload: {
      title: `[DEMO] Draft to ${to}: "${subject}"`,
      items: [
        `Recipient: ${to}`,
        `Subject: ${subject}`,
        'Action: Stage draft in demo sandbox',
        'Status: Simulated — nothing will be dispatched'
      ],
      target_time: 'Ready to stage in demo sandbox',
      notes: `Simulated — nothing was dispatched. Demo fixture only: ${body}`,
      fields: {
        to,
        subject,
        body,
        demo_mode: 'Demo Fixture (isMock: true)'
      }
    }
  };

  const chip: PluginExecutionChip = {
    pluginId: 'gmail',
    pluginName: 'Gmail & Google Workspace Mail',
    toolName: 'gmail_draft_message',
    status: 'staged',
    latencyMs: 16,
    isMock: true,
    badge: 'DEMO',
  };

  return {
    handled: true,
    replyText: `[DEMO FIXTURE] I have prepared a mock email draft for **${to}**. Review below (Simulated — nothing will be dispatched to Gmail).`,
    chip,
    actionCard,
    data: { isMock: true, badge: 'DEMO', to, subject, body },
    isMock: true,
    badge: 'DEMO',
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
      status: 'staged',
      latencyMs: 38,
      isMock: true,
      badge: 'DEMO',
    };

    const actionsList = zapConfig.actions
      .map((a) => `- **${a.name}** (*${a.app}* · ${a.category}) ${a.requiresConfirmation ? '*(Approval Required)*' : '*(Auto)*'}`)
      .join('\n');

    const replyText =
      `[DEMO FIXTURE] **Zapier Universal MCP Gateway (Demo Data — not live)**\n` +
      `*Notice: Simulated response — no live Zapier webhook was triggered.*\n\n` +
      `Here are the enabled actions in the demo runtime schema:\n\n` +
      `${actionsList}\n\n` +
      `*(Demo fixture only — no live integrations were invoked).*`;

    return {
      handled: true,
      replyText,
      chip,
      data: { isMock: true, badge: 'DEMO', endpoint: zapConfig.endpointUrl, actions: zapConfig.actions },
      isMock: true,
      badge: 'DEMO',
    };
  }

  // zapier_execute_action
  const actionName = String(args.action_name || 'Sync VIP Lead to HubSpot CRM');
  const paramsJson = String(args.parameters_json || '{"lead":"Sarah Jenkins","company":"Apex Global"}');

  const actionCard: HydrateFormAction = {
    id: `act_zapier_${Date.now()}`,
    category: 'profile_intake',
    action_name: `Execute Zapier Action: ${actionName} (Demo)`,
    target_app: 'Zapier Universal MCP Gateway (Demo)',
    requires_user_confirmation: true,
    status: 'pending_confirmation',
    timestamp: new Date().toISOString(),
    isMock: true,
    badge: 'DEMO',
    form_payload: {
      title: `[DEMO] Zapier Workflow: ${actionName}`,
      items: [
        `Action: ${actionName}`,
        'Gateway: Universal MCP Endpoint (Demo Preview)',
        `Payload: ${paramsJson}`,
        'Status: Simulated — nothing will be dispatched'
      ],
      target_time: 'Simulated on approval',
      notes: `Simulated — nothing was dispatched. Demo fixture only for ${actionName}.`,
      fields: {
        action_name: actionName,
        params: paramsJson,
        demo_mode: 'Demo Fixture (isMock: true)'
      }
    }
  };

  const chip: PluginExecutionChip = {
    pluginId: 'zapier-gateway',
    pluginName: 'Zapier Universal MCP Gateway',
    toolName: 'zapier_execute_action',
    status: 'staged',
    latencyMs: 35,
    isMock: true,
    badge: 'DEMO',
  };

  return {
    handled: true,
    replyText: `[DEMO FIXTURE] I have prepared a simulated **Zapier Action (${actionName})** in your safety verification tray. Review below (Simulated — nothing will be dispatched to Zapier or connected apps).`,
    chip,
    actionCard,
    data: { isMock: true, badge: 'DEMO', actionName, paramsJson },
    isMock: true,
    badge: 'DEMO',
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
        status: 'staged',
        latencyMs: 24,
        isMock: true,
        badge: 'DEMO',
      };

      const replyText =
        `[DEMO FIXTURE] **Shopify & QuickBooks Reconciliation (Demo Data — not live)**\n` +
        `*Notice: Simulated response — no live Shopify or QuickBooks service was contacted.*\n\n` +
        `### 🛍️ Demo Store Performance Fixture:\n` +
        `- **Gross Merchandise Value (GMV):** **$18,420.00** across 42 orders (Mock)\n` +
        `- **Direct Consumer Sales:** $3,420.00 (Average Order Value: $83.41 · Mock)\n` +
        `- **B2B Wholesale Order #SO-9821:** **$15,000.00** from *Luxe Living Retail Partners* (Mock)\n` +
        `- **Fulfillment Pipeline:** 36 fulfilled / 6 staged for courier pickup (Mock)\n\n` +
        `### 📚 QuickBooks Online Demo Ledger Cross-Verification:\n` +
        `- **Invoice Reference:** **#INV-1043** ($15,000.00) issued to *Luxe Living Retail Partners* (Mock)\n` +
        `- **Ledger Status:** Matched in Accounts Receivable (Mock Demo)\n` +
        `- **Payment Settlement:** Stripe ACH Transfer fixture · Deposited to Operating Reserve\n` +
        `- **Discrepancy Delta:** **$0.00** (Simulated 100% reconciliation)\n\n` +
        `*(Demo fixture only — no live services were queried or affected).*`;

      return {
        handled: true,
        replyText,
        chip,
        data: { isMock: true, badge: 'DEMO', reconciled: true, gmv: 18420.00, delta: 0 },
        isMock: true,
        badge: 'DEMO',
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
        status: 'staged',
        latencyMs: 16,
        isMock: true,
        badge: 'DEMO',
      };

      const replyText =
        `[DEMO FIXTURE] **Meta / Instagram Reels (Demo Data — not live)**\n` +
        `*Notice: Simulated response — no live Meta Content Graph API was contacted.*\n\n` +
        `🎬 **Demo Caption Fixture:**\n` +
        `> *"Crafted for sovereign minds who value calm execution and quiet luxury. ✨ Meet our latest release — where minimalist form meets daily intentionality.\n\n` +
        `> Available now in limited editions. Link in bio to reserve yours.\n\n` +
        `> #ExecutiveLiving #IntentionalDesign #QuietLuxury #CarolAnnOS #ModernMinimalism #ProductLaunch2026"*\n\n` +
        `🎵 **Recommended Audio Sync (Mock):** *"Refined Ambient Waves"* (Trending in Business/Lifestyle)\n` +
        `📐 **Format Specs:** 9:16 Vertical HD (1080x1920) · First 3-sec visual hook verified.\n\n` +
        `*(Demo fixture only — no live update will be broadcast to Meta Content Graph).*`;

      const actionCard: HydrateFormAction = {
        id: `act_insta_${Date.now()}`,
        category: 'profile_intake',
        action_name: 'Schedule Instagram Reel Draft (Demo)',
        target_app: 'Meta / Instagram Reels (Demo)',
        requires_user_confirmation: true,
        status: 'pending_confirmation',
        timestamp: new Date().toISOString(),
        isMock: true,
        badge: 'DEMO',
        form_payload: {
          title: '[DEMO] New Product Showcase Reel (Simulation)',
          items: [
            'Video Asset: staged_showcase_4k_9x16.mp4',
            'Aspect Ratio: 9:16 Vertical (1080x1920)',
            'Status: Simulated — nothing will be dispatched'
          ],
          target_time: 'Tomorrow at 11:30 AM EST',
          notes: 'Simulated — nothing was dispatched. Demo fixture only.',
          fields: {
            channel: '@carolann.executive',
            placement: 'Reels Hopper Preview (Demo)',
            demo_mode: 'Demo Fixture (isMock: true)'
          }
        },
      };

      return { handled: true, replyText, chip, actionCard, isMock: true, badge: 'DEMO' };
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
        status: 'staged',
        latencyMs: 22,
        isMock: true,
        badge: 'DEMO',
      };

      const replyText =
        `[DEMO FIXTURE] **TripAdvisor Reviews & Listings (Demo Data — not live)**\n` +
        `*Notice: Simulated response — no live TripAdvisor service was contacted.*\n\n` +
        `⭐ **Elena V. — 5/5 Stars** *(Stayed 2 days ago in Oceanfront Executive Suite 402 · Mock)*\n` +
        `> *"Breathtaking ocean views, impeccable hospitality, and seamless executive workspace amenities. The high-speed desk setup on the private terrace was immaculate for remote deep work."*\n\n` +
        `⭐ **Marcus K. — 4/5 Stars** *(Stayed 5 days ago in Grand Deluxe · Mock)*\n` +
        `> *"Exceptional dining and spa service. Check-in had a brief 10-minute wait during the afternoon peak, but the concierge was warm and offered chilled champagne."*\n\n` +
        `*(Demo fixture only — no live reviews were queried).*`;

      const actionCard: HydrateFormAction = {
        id: `act_tripadvisor_${Date.now()}`,
        category: 'profile_intake',
        action_name: 'Post Official Host Response (Demo)',
        target_app: 'TripAdvisor Reviews & Listings (Demo)',
        requires_user_confirmation: true,
        status: 'pending_confirmation',
        timestamp: new Date().toISOString(),
        isMock: true,
        badge: 'DEMO',
        form_payload: {
          title: '[DEMO] Reply to Elena V. (Simulation)',
          items: [
            'Target: TripAdvisor Oceanfront Executive Suite 402',
            'Guest: Elena V. (Mock Booking, 5/5 Stars)',
            'Status: Simulated — nothing will be dispatched'
          ],
          notes: 'Simulated — nothing was dispatched. Demo fixture only.',
          fields: {
            review_id: 'TR-88219',
            platform: 'TripAdvisor Partner API v1 (Demo Sandbox)',
            status: 'Simulated preview'
          }
        },
      };

      return { handled: true, replyText, chip, actionCard, isMock: true, badge: 'DEMO' };
    }
  }

  return null;
}
