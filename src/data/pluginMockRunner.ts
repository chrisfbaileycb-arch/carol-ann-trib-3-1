/**
 * Plugin Mock Runner & Schema Dispatcher for Carol Ann.
 * Handles client-side execution, mock data generators for connected MCP ecosystems
 * (QuickBooks, TripAdvisor, Instagram Reels, Shopify, Zapier Gateway),
 * and generation of interactive Action Confirmation Cards.
 */

import type { HydrateFormAction, PluginExecutionChip } from '@/data/schemas';
import { MCP_PLUGINS_DIRECTORY, loadInstalledPluginIds, loadZapierConfig } from '@/data/mcpPlugins';

export interface PluginExecutionResult {
  handled: boolean;
  replyText: string;
  chip?: PluginExecutionChip;
  actionCard?: HydrateFormAction;
}

export function tryExecutePluginIntent(
  userPrompt: string,
  installedPluginIds: string[] = loadInstalledPluginIds()
): PluginExecutionResult | null {
  const promptLower = userPrompt.toLowerCase().trim();

  const isInstalled = (pluginId: string) => installedPluginIds.includes(pluginId);

  // 1. TripAdvisor Reviews & Draft Polite Reply
  // "Carol, check my TripAdvisor reviews and draft a polite reply to the latest one."
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

      const replyText = `I connected to your claimed TripAdvisor listing via the MCP Bridge and retrieved your 2 most recent guest reviews:\n\n` +
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
        category: 'review_reply',
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

  // 2. Meta / Instagram Reels: Caption & Reel Draft
  // "Generate a caption for our new product and prep an Instagram Reel draft."
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

      const replyText = `I have drafted an aesthetic high-engagement caption optimized for the Instagram Reels algorithm, aligned with your workspace identity:\n\n` +
        `🎬 **Draft Caption:**\n` +
        `> *"Crafted for sovereign minds who value calm execution and quiet luxury. ✨ Meet our latest release — where minimalist form meets daily intentionality.\n\n` +
        `> Available now in limited editions. Link in bio to reserve yours.\n\n` +
        `> #ExecutiveLiving #IntentionalDesign #QuietLuxury #CarolAnnOS #ModernMinimalism #ProductLaunch2026"*\n\n` +
        `🎵 **Recommended Audio Sync:** *"Refined Ambient Waves"* (Trending in Business/Lifestyle — 84k Reels created this week)\n` +
        `📐 **Format Specs:** 9:16 Vertical HD (1080x1920) · First 3-sec visual hook verified.\n\n` +
        `I have staged this Reel draft in your safety verification tray. Review the payload and authorize scheduling below.`;

      const actionCard: HydrateFormAction = {
        id: `act_insta_${Date.now()}`,
        category: 'social_reel',
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
          notes: 'Crafted for sovereign minds who value calm execution and quiet luxury. ✨ Meet our latest release — where minimalist form meets daily intentionality. Available now in limited editions. #ExecutiveLiving #CarolAnnOS',
          fields: {
            channel: '@carolann.executive',
            placement: 'Reels Hopper & Feed Preview'
          }
        },
      };

      return { handled: true, replyText, chip, actionCard };
    }
  }

  // 3. Shopify Sales & QuickBooks Cross-check
  // "Pull our sales numbers from Shopify and verify if the invoice was recorded in QuickBooks."
  if (
    (promptLower.includes('shopify') && promptLower.includes('quickbooks')) ||
    (promptLower.includes('sales') && promptLower.includes('shopify')) ||
    (promptLower.includes('sales numbers') && promptLower.includes('recorded'))
  ) {
    if (isInstalled('shopify') && isInstalled('quickbooks')) {
      const chip: PluginExecutionChip = {
        pluginId: 'shopify',
        pluginName: 'Shopify Storefront & Orders',
        toolName: 'shopify_get_orders',
        status: 'executed',
        latencyMs: 24,
      };

      const replyText = `I simultaneously queried your **Shopify Storefront** and cross-referenced with your **QuickBooks Online** ledger via parallel MCP bridges:\n\n` +
        `### 🛍️ Shopify Store Performance (Today):\n` +
        `- **Gross Merchandise Value (GMV):** **$18,420.00** across 42 orders\n` +
        `- **Direct Consumer Sales:** $3,420.00 (Average Order Value: $83.41)\n` +
        `- **B2B Wholesale Order #SO-9821:** **$15,000.00** from *Luxe Living Retail Partners*\n` +
        `- **Fulfillment Pipeline:** 38 unfulfilled / staged for 2:00 PM courier pickup\n\n` +
        `### 📚 QuickBooks Online Cross-Verification:\n` +
        `- **Invoice Reference:** **#INV-1043** ($15,000.00) issued to *Luxe Living Retail Partners*\n` +
        `- **Ledger Status:** ✅ **Recorded & Matched** in Accounts Receivable\n` +
        `- **Payment Settlement:** Received via Stripe ACH Transfer · Deposited to Operating Reserve\n` +
        `- **Discrepancy Delta:** **$0.00** (100% reconciled between Shopify and QuickBooks)\n\n` +
        `Both systems are synchronized. Would you like me to generate a 30-day revenue forecast or draft a customer thank-you update?`;

      return { handled: true, replyText, chip };
    }
  }

  // 4. QuickBooks Unpaid Invoices
  // "What unpaid invoices do I have?" or "check unpaid invoices in QuickBooks"
  if (
    promptLower.includes('unpaid invoice') ||
    promptLower.includes('unpaid invoices') ||
    (promptLower.includes('quickbooks') && (promptLower.includes('invoice') || promptLower.includes('balance') || promptLower.includes('owing') || promptLower.includes('overdue'))) ||
    (promptLower.includes('invoices') && (promptLower.includes('due') || promptLower.includes('unpaid') || promptLower.includes('owe')))
  ) {
    if (isInstalled('quickbooks') || isInstalled('zapier-gateway')) {
      const chip: PluginExecutionChip = {
        pluginId: 'quickbooks',
        pluginName: 'QuickBooks Online',
        toolName: 'quickbooks_get_invoices',
        status: 'executed',
        latencyMs: 18,
      };

      const replyText = `I connected to QuickBooks Online and inspected your active Accounts Receivable ledger. You currently have **3 unpaid invoices** totaling **$6,970.00**:\n\n` +
        `| Invoice | Client | Amount | Due Date | Status |\n` +
        `| :--- | :--- | :--- | :--- | :--- |\n` +
        `| **#INV-1042** | Apex Creative Co. | **$4,250.00** | 3 days ago | ⚠️ Overdue (Aging: 3d) |\n` +
        `| **#INV-1039** | Horizon Media LLC | **$1,800.00** | Next Friday | ⏱️ Net 30 Pending |\n` +
        `| **#INV-1035** | Blue Ridge Studio | **$920.00** | In 14 days | ⏱️ Net 15 Normal |\n\n` +
        `💡 **Recommendation:** Apex Creative Co. is past its payment terms. Would you like me to draft a polite reminder email via your Gmail plugin, or stage an updated QuickBooks balance statement?`;

      return { handled: true, replyText, chip };
    }
  }

  // 5. Creating a QuickBooks Invoice
  if (
    (promptLower.includes('create') || promptLower.includes('send') || promptLower.includes('dispatch')) &&
    (promptLower.includes('invoice') || promptLower.includes('bill client'))
  ) {
    if (isInstalled('quickbooks') || isInstalled('zapier-gateway')) {
      const chip: PluginExecutionChip = {
        pluginId: 'quickbooks',
        pluginName: 'QuickBooks Online',
        toolName: 'quickbooks_create_invoice',
        status: 'staged',
        latencyMs: 20,
      };

      const replyText = `I have generated a draft QuickBooks Online invoice based on your instructions. Before it is dispatched to the client and recorded in your general ledger, please authorize execution in the safety confirmation tray below:`;

      const actionCard: HydrateFormAction = {
        id: `act_qb_${Date.now()}`,
        category: 'quickbooks_invoice',
        action_name: 'Create & Dispatch QuickBooks Invoice',
        target_app: 'QuickBooks Online',
        requires_user_confirmation: true,
        status: 'pending_confirmation',
        timestamp: new Date().toISOString(),
        form_payload: {
          title: 'Invoice #INV-1044: Apex Creative Co.',
          items: [
            'Client: Apex Creative Co. (billing@apexcreative.design)',
            'Amount: $2,500.00 USD (Net 15 Terms)',
            'Line Items: Executive Workspace Consulting & Q3 Architecture Audit',
            'Payment Option: Stripe Hosted Credit Card / ACH Link enabled'
          ],
          target_time: 'Due in 15 days',
          notes: 'Professional services rendered for August 2026 architecture review. Thank you for your partnership.',
          fields: {
            total_amount: '$2,500.00',
            currency: 'USD',
            tax_rate: '0.00% (B2B Services Exempt)'
          }
        },
      };

      return { handled: true, replyText, chip, actionCard };
    }
  }

  // 6. Generic Zapier Universal MCP Gateway trigger
  if (promptLower.includes('zapier') && isInstalled('zapier-gateway')) {
    const zapConfig = loadZapierConfig();
    const chip: PluginExecutionChip = {
      pluginId: 'zapier-gateway',
      pluginName: 'Zapier Universal MCP Gateway',
      toolName: 'zapier_list_actions',
      status: 'executed',
      latencyMs: 38,
    };

    const actionsList = zapConfig.actions.map(a => `- **${a.name}** (*${a.app}* · ${a.category})`).join('\n');
    const replyText = `Zapier Universal MCP Gateway is connected to \`${zapConfig.endpointUrl}\`.\n\n` +
      `Here are the enabled actions synchronized into Carol Ann's active runtime schema:\n\n` +
      `${actionsList}\n\n` +
      `You can invoke any of these actions in conversation (e.g., *"Carol, post our reel draft using Zapier"* or *"Sync latest Stripe charge to QuickBooks"*).`;

    return { handled: true, replyText, chip };
  }

  return null;
}
