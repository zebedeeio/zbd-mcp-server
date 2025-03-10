import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server instance
const server = new McpServer({
  name: "zbd-mcp-server",
  version: "1.0.0",
});

// Utility function for making ZBD API requests
async function zbdRequest(endpoint: string, options: { 
  method: 'GET' | 'POST',
  body?: any,
  urlParams?: string
}) {
  try {
    const url = `https://api.zebedee.io/v0/${endpoint}${options.urlParams ? `/${options.urlParams}` : ''}`;
    const response = await fetch(url, {
      method: options.method,
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.ZBD_API_KEY || "7JusHK7at5KpvQrNjkCel4JXmX6rHRpa"
      },
      ...(options.body && { body: JSON.stringify(options.body) })
    });

    const data = await response.json();
    return {
      content: [{ 
        type: "text" as const,
        text: JSON.stringify(data, null, 2)
      }]
    };
  } catch (error: any) {
    return {
      content: [{ 
        type: "text" as const,
        text: `Error: ${error.message}`
      }]
    };
  }
}

// Add Lightning payment tool
server.tool(
  "send-lightning-payment",
  "Send a Bitcoin Lightning Network payment to a Lightning Address using ZBD",
  {
    lnAddress: z.string().describe("Lightning Address of the recipient (e.g. andre@zbd.gg)"),
    amount: z.string().describe("Amount in millisatoshis"),
    comment: z.string().optional().describe("Optional note or description"),
    internalId: z.string().optional().describe("Optional metadata string"),
    callbackUrl: z.string().optional().describe("Optional callback URL for payment updates")
  },
  async (params) => zbdRequest("ln-address/send-payment", {
    method: "POST",
    body: params
  })
);

// Add ZBD Gamertag payment tool
server.tool(
  "send-gamertag-payment",
  "Send a Bitcoin payment to a ZBD Gamertag",
  {
    gamertag: z.string().describe("Destination ZBD Gamertag"),
    amount: z.string().describe("Amount in millisatoshis"),
    description: z.string().describe("Note or comment for this Payment (visible to recipient)")
  },
  async (params) => zbdRequest("gamertag/send-payment", {
    method: "POST",
    body: params
  })
);

// Add ZBD Gamertag charge creation tool
server.tool(
  "create-gamertag-charge",
  "Generate a payment request for a ZBD User",
  {
    gamertag: z.string().describe("Destination ZBD Gamertag"),
    amount: z.string().describe("Amount in millisatoshis"),
    description: z.string().optional().describe("Note or comment for this Payment (visible to recipient)"),
    expiresIn: z.number().optional().describe("Time until Charge expiration -> in seconds"),
    internalId: z.string().optional().describe("Open metadata string property"),
    callbackUrl: z.string().optional().describe("The endpoint ZBD will POST Charge updates to")
  },
  async (params) => zbdRequest("gamertag/charges", {
    method: "POST",
    body: params
  })
);

// Add Lightning Address validation tool
server.tool(
  "validate-lightning-address",
  "Verify the validity of a Lightning Address",
  {
    address: z.string().describe("Lightning Address to be verified (e.g. user@domain.com)")
  },
  async ({ address }) => zbdRequest("ln-address/validate", {
    method: "GET",
    urlParams: encodeURIComponent(address)
  })
);

// Add Lightning Address charge creation tool
server.tool(
  "create-lightning-charge",
  "Generate a payment request for a Lightning Address",
  {
    lnaddress: z.string().describe("The Lightning Address of the intended recipient"),
    amount: z.string().describe("The amount for the Charge -> in millisatoshis"),
    description: z.string().optional().describe("Note or comment of this Charge")
  },
  async (params) => zbdRequest("ln-address/fetch-charge", {
    method: "POST",
    body: params
  })
);

// Add Get User ID by Gamertag tool
server.tool(
  "get-userid-by-gamertag",
  "Retrieve User ID from a ZBD Gamertag",
  {
    gamertag: z.string().describe("ZBD Gamertag")
  },
  async ({ gamertag }) => zbdRequest("user-id/gamertag", {
    method: "GET",
    urlParams: encodeURIComponent(gamertag)
  })
);

// Add Get Gamertag by User ID tool
server.tool(
  "get-gamertag-by-userid",
  "Retrieve ZBD Gamertag from a User ID",
  {
    id: z.string().describe("User ID")
  },
  async ({ id }) => zbdRequest("gamertag/user-id", {
    method: "GET",
    urlParams: encodeURIComponent(id)
  })
);

// Add Email payment tool
server.tool(
  "send-email-payment",
  "Send instant Bitcoin payments to any email",
  {
    email: z.string().describe("The Email of the intended recipient (e.g. info@zebedee.io)"),
    amount: z.string().describe("The amount for the Payment -> in millisatoshis"),
    comment: z.string().describe("Note / description of this Payment (may be shown to recipient)")
  },
  async (params) => zbdRequest("email/send-payment", {
    method: "POST",
    body: params
  })
);

// Add Get Wallet Info tool
server.tool(
  "get-wallet-info",
  "Retrieve all data about a ZBD Project's Wallet",
  {},
  async () => zbdRequest("wallet", {
    method: "GET"
  })
);

// Add Region Check tool
server.tool(
  "check-supported-region",
  "Verify if a user is coming from a supported region",
  {
    ipAddress: z.string().describe("IP address to check")
  },
  async ({ ipAddress }) => zbdRequest("is-supported-region", {
    method: "GET",
    urlParams: encodeURIComponent(ipAddress)
  })
);

// Add ZBD IP Addresses tool
server.tool(
  "get-zbd-ip-addresses",
  "Get the official IP addresses of ZBD servers",
  {},
  async () => zbdRequest("prod-ips", {
    method: "GET"
  })
);

// Add Internal Transfer tool
server.tool(
  "internal-transfer",
  "Performs a transfer of funds between two Projects",
  {
    amount: z.string().describe("The amount to be transferred -> in millisatoshis"),
    receiverWalletId: z.string().describe("The Wallet ID of the recipient Project")
  },
  async (params) => zbdRequest("internal-transfer", {
    method: "POST",
    body: params
  })
);

// Add Create Withdrawal Request tool
server.tool(
  "create-withdrawal-request",
  "Create a Bitcoin withdrawal QR code",
  {
    amount: z.string().describe("The amount for the Withdrawal Request -> in millisatoshis"),
    description: z.string().optional().describe("Note or comment for this Withdrawal Request"),
    expiresIn: z.number().optional().describe("Time until Withdrawal Request expiration -> in seconds"),
    internalId: z.string().optional().describe("Open metadata string property"),
    callbackUrl: z.string().optional().describe("The endpoint ZBD will POST updates to")
  },
  async (params) => zbdRequest("withdrawal-requests", {
    method: "POST",
    body: params
  })
);

// Add Get Withdrawal Request tool
server.tool(
  "get-withdrawal-request",
  "Retrieve all data about a single Withdrawal Request",
  {
    id: z.string().describe("Withdrawal Request ID")
  },
  async ({ id }) => zbdRequest("withdrawal-requests", {
    method: "GET",
    urlParams: encodeURIComponent(id)
  })
);

// Add Send Payment tool
server.tool(
  "send-payment",
  "Send a Bitcoin Lightning Network payment",
  {
    invoice: z.string().describe("Lightning Network Payment Request / Charge"),
    description: z.string().optional().describe("Note or comment for this Payment"),
    amount: z.string().optional().describe("Amount to be paid to this Charge/Invoice -> in millisatoshis (only valid if Amountless Invoice)"),
    internalId: z.string().optional().describe("Open metadata string property"),
    callbackUrl: z.string().optional().describe("The endpoint ZBD will POST Payment updates to")
  },
  async (params) => zbdRequest("payments", {
    method: "POST",
    body: params
  })
);

// Add Get Payment tool
server.tool(
  "get-payment",
  "Retrieve all data about a single Payment",
  {
    id: z.string().describe("Payment ID")
  },
  async ({ id }) => zbdRequest("payments", {
    method: "GET",
    urlParams: encodeURIComponent(id)
  })
);

// Add Decode Charge tool
server.tool(
  "decode-charge",
  "Understand the inner properties of a Charge QR code",
  {
    invoice: z.string().describe("The Charge or Invoice QR code contents")
  },
  async (params) => zbdRequest("decode-invoice", {
    method: "POST",
    body: params
  })
);

// Add Create Charge tool
server.tool(
  "create-charge",
  "Create a new Bitcoin Lightning Network charge",
  {
    amount: z.string().describe("The amount for the Charge -> in millisatoshis"),
    description: z.string().describe("Note or comment for this Charge (visible to payer)"),
    expiresIn: z.number().optional().describe("Time until Charge expiration -> in seconds"),
    callbackUrl: z.string().optional().describe("The endpoint ZBD will POST Charge updates to"),
    internalId: z.string().optional().describe("Open metadata string property")
  },
  async (params) => zbdRequest("charges", {
    method: "POST",
    body: params
  })
);

// Add Get Charge tool
server.tool(
  "get-charge",
  "Retrieve all data about a single Charge",
  {
    id: z.string().describe("Charge ID")
  },
  async ({ id }) => zbdRequest("charges", {
    method: "GET",
    urlParams: encodeURIComponent(id)
  })
);

// Add Create Voucher tool
server.tool(
  "create-voucher",
  "Create a single-use ZBD Voucher that can be redeemed by any ZBD user",
  {
    amount: z.string().describe("The amount for the Voucher -> in millisatoshis"),
    description: z.string().optional().describe("Note or comment for this Voucher")
  },
  async (params) => zbdRequest("create-voucher", {
    method: "POST",
    body: params
  })
);

// Add Get Voucher tool
server.tool(
  "get-voucher",
  "Retrieve details about a ZBD Voucher",
  {
    id: z.string().describe("ID of the Voucher")
  },
  async ({ id }) => zbdRequest("vouchers", {
    method: "GET",
    urlParams: encodeURIComponent(id)
  })
);

// Add Redeem Voucher tool
server.tool(
  "redeem-voucher",
  "Redeem a ZBD Voucher to credit your Project wallet",
  {
    code: z.string().describe("Valid 8-digit ZBD Voucher Code")
  },
  async (params) => zbdRequest("redeem-voucher", {
    method: "POST",
    body: params
  })
);

// Add Revoke Voucher tool
server.tool(
  "revoke-voucher",
  "Revoke a valid ZBD Voucher and reclaim the sats to your Project wallet",
  {
    code: z.string().describe("Valid 8-digit ZBD Voucher Code")
  },
  async (params) => zbdRequest("revoke-voucher", {
    method: "POST",
    body: params
  })
);

// Add Batch Lightning Payment tool
server.tool(
  "send-batch-lightning-payments",
  "Send multiple Bitcoin Lightning Network payments to Lightning Addresses in a single request",
  {
    payments: z.array(z.object({
      lnAddress: z.string().describe("Lightning Address of the recipient (e.g. andre@zbd.gg)"),
      amount: z.string().describe("Amount in millisatoshis"),
      comment: z.string().optional().describe("Optional note or description"),
      internalId: z.string().optional().describe("Optional metadata string")
    })).max(10).describe("Array of payment requests (maximum 10)"),
  },
  async ({ payments }) => {
    const results = [];
    
    for (const payment of payments) {
      try {
        const result = await zbdRequest("ln-address/send-payment", {
          method: "POST",
          body: payment
        });
        results.push({
          lnAddress: payment.lnAddress,
          status: "success",
          ...result
        });
      } catch (error: any) {
        results.push({
          lnAddress: payment.lnAddress,
          status: "failed",
          error: error.message
        });
      }
    }

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          totalPayments: payments.length,
          results
        }, null, 2)
      }]
    };
  }
);

// Start the server using stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
