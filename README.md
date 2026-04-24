# n8n-nodes-taboola

This is an [n8n](https://n8n.io/) community node that integrates with the [Taboola Backstage API](https://developers.taboola.com/backstage-api/reference/welcome). It allows you to manage your Taboola advertising campaigns, campaign items, accounts, and reports directly from n8n workflows.

## Table of Contents

- [Installation](#installation)
- [Credentials](#credentials)
- [Resources & Operations](#resources--operations)
- [Usage](#usage)
- [Compatibility](#compatibility)
- [License](#license)

## Installation

### Community Node (Recommended)

1. Open your n8n instance
2. Go to **Settings > Community Nodes**
3. Select **Install a community node**
4. Enter `n8n-nodes-taboola`
5. Confirm the installation

### Manual Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-repo/n8n-nodes-taboola.git
   cd n8n-nodes-taboola
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Link to your n8n installation:
   ```bash
   npm link
   cd /path/to/your/n8n
   npm link n8n-nodes-taboola
   ```
5. Restart n8n. The **Taboola** node will appear in the node list.

### Docker

If you are running n8n with Docker, add the following to your `docker-compose.yml` environment:

```yaml
environment:
  - N8N_COMMUNITY_PACKAGES=n8n-nodes-taboola
```

## Credentials

This node uses the **Taboola Backstage API** OAuth2 Client Credentials flow for authentication.

You will need:

| Field | Description |
|---|---|
| **Client ID** | Provided by your Taboola account manager |
| **Client Secret** | Provided by your Taboola account manager |

The node automatically requests an access token from `https://backstage.taboola.com/backstage/oauth/token` using your credentials. Tokens are valid for 12 hours.

To set up credentials in n8n:

1. Go to **Credentials** in the n8n sidebar
2. Click **Add Credential**
3. Search for **Taboola API**
4. Enter your Client ID and Client Secret
5. Click **Save**

## Resources & Operations

### Account

| Operation | Description |
|---|---|
| **Get All** | Retrieve all advertiser/publisher accounts you have access to |

### Campaign

| Operation | Description |
|---|---|
| **Create** | Create a new campaign with name, branding text, CPC, spending limit, and optional targeting |
| **Get** | Retrieve a single campaign by ID |
| **Get All** | Retrieve all campaigns for an account |
| **Update** | Update an existing campaign (name, CPC, spending limit, status, dates, delivery model) |
| **Delete** | Delete a campaign by ID |

**Campaign creation fields:**

- Campaign Name (required)
- Brand Text (required)
- CPC - Cost Per Click (required)
- Spending Limit
- Spending Limit Model (Entire / Monthly / Daily)
- Start Date / End Date
- Active status
- Daily Ad Delivery Model (Accelerated / Balanced / Strict)
- Marketing Objective (Brand Awareness / Drive Website Traffic / Online Purchases / Lead Generation)
- Country Targeting (comma-separated country codes)
- Platform Targeting (Desktop / Mobile / Tablet)

### Campaign Item

| Operation | Description |
|---|---|
| **Create** | Create a new campaign item (ad) with a landing page URL, title, and thumbnail |
| **Get All** | Retrieve all items for a campaign |
| **Update** | Update an existing item (title, URL, thumbnail, active status) |
| **Delete** | Delete a campaign item by ID |

### Report

| Operation | Description |
|---|---|
| **Campaign Summary** | Get a campaign summary report grouped by day, week, or month |
| **Top Campaign Content** | Get the top campaign content report (top 1,000 items) |

**Report parameters:**

- Dimension (Day / Week / Month)
- Start Date (required, YYYY-MM-DD)
- End Date (required, YYYY-MM-DD)
- Campaign ID (optional filter)

## Usage

### Example: Get All Campaigns

1. Add a **Taboola** node to your workflow
2. Select your Taboola API credentials
3. Set **Resource** to `Campaign`
4. Set **Operation** to `Get All`
5. Enter your **Account ID**
6. Execute the node

### Example: Create a Campaign

1. Add a **Taboola** node to your workflow
2. Select your Taboola API credentials
3. Set **Resource** to `Campaign`
4. Set **Operation** to `Create`
5. Enter your **Account ID**
6. Fill in the campaign name, brand text, and CPC
7. Optionally configure spending limits, dates, and targeting
8. Execute the node

### Example: Generate a Report

1. Add a **Taboola** node to your workflow
2. Select your Taboola API credentials
3. Set **Resource** to `Report`
4. Set **Operation** to `Campaign Summary`
5. Enter your **Account ID**, start date, end date, and dimension
6. Execute the node

## Compatibility

- **n8n version:** 1.0.0 or later
- **Node.js version:** 22 or later

## API Reference

This node is built on the [Taboola Backstage API v1.0](https://developers.taboola.com/backstage-api/reference/welcome).

- Base URL: `https://backstage.taboola.com/backstage/api/1.0`
- Authentication: [Client Credentials Flow](https://developers.taboola.com/backstage-api/reference/client-credentials-flow)

## License

[MIT](LICENSE.md)
