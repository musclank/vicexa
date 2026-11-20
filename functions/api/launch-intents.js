import { keccak256, toBytes } from "viem";

const CLANKER_V5_FACTORY = "0x572e88D3cD7f23E4241EB6ceDD96667271bF09A0";
const LAUNCHED_TOPIC = keccak256(toBytes("Launched(address,bytes32,address,address,uint256,int24)"));
const addressTopic = (address) => "0x" + address.slice(2).toLowerCase().padStart(64, "0");

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json", "cache-control": "no-store" },
});

async function authenticate(request, env) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: json({ error: "Authentication or server configuration unavailable." }, 401) };
  }
  const response = await fetch(env.SUPABASE_URL + "/auth/v1/user", {
    headers: { apikey: env.SUPABASE_ANON_KEY, authorization: "Bearer " + token },
  });
  if (!response.ok) return { error: json({ error: "Please sign in again." }, 401) };
  return { user: await response.json() };
}

async function dbRequest(env, path, init) {
  return fetch(env.SUPABASE_URL + "/rest/v1/" + path, {
    ...init, headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY, "content-type": "application/json", ...(init.headers || {}) },
  });
}

export async function onRequestPost({ request, env }) {
  const auth = await authenticate(request, env);
  if (auth.error) return auth.error;
  let body; try { body = await request.json(); } catch { return json({ error: "Invalid JSON body." }, 400); }
  const name = String(body.name || "").trim();
  const symbol = String(body.symbol || "").trim().toUpperCase();
  const wallet = String(body.creatorWallet || "").trim();
  const image = String(body.image || "").trim();
  const description = String(body.description || "").trim();
  if (!name || name.length > 64 || !/^[A-Z0-9]{2,16}$/.test(symbol) || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) return json({ error: "Invalid token name, symbol, or creator wallet." }, 400);
  if (image && !(image.startsWith("https://") || image.startsWith("ipfs://"))) return json({ error: "Token image must use HTTPS or IPFS." }, 400);
  if (description.length > 500) return json({ error: "Description is too long." }, 400);
  const row = { user_id: auth.user.id, chain_id: 8453, provider: "clanker", provider_version: "v5", status: "awaiting_wallet", token_name: name, token_symbol: symbol, token_image_url: image || null, description: description || null, creator_wallet: wallet };
  const response = await dbRequest(env, "token_launches", { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify(row) });
  const result = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(result) || !result[0]) return json({ error: "Could not create launch record." }, 502);
  return json({ launch: { id: result[0].id, requestId: result[0].request_id, status: result[0].status } }, 201);
}

export async function onRequestPatch({ request, env }) {
  const auth = await authenticate(request, env);
  if (auth.error) return auth.error;
  let body; try { body = await request.json(); } catch { return json({ error: "Invalid JSON body." }, 400); }
  const id = String(body.id || ""); const status = String(body.status || "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["submitted", "pending_indexing", "confirmed", "failed"].includes(status)) return json({ error: "Invalid launch update." }, 400);
  const lookup = await dbRequest(env, "token_launches?id=eq." + encodeURIComponent(id) + "&user_id=eq." + encodeURIComponent(auth.user.id) + "&select=status,creator_wallet,expected_token_address,transaction_hash", { method: "GET" });
  const existingRows = await lookup.json().catch(() => null);
  if (!lookup.ok || !Array.isArray(existingRows) || !existingRows[0]) return json({ error: "Launch record not found." }, 404);
  const existing = existingRows[0];
  const patch = { status, updated_at: new Date().toISOString() };
  if (status === "submitted") {
    const txHash = String(body.txHash || "");
    const expectedAddress = String(body.expectedAddress || "");
    if (existing.status !== "awaiting_wallet" || !/^0x[a-fA-F0-9]{64}$/.test(txHash) || !/^0x[a-fA-F0-9]{40}$/.test(expectedAddress)) {
      return json({ error: "A valid transaction hash and expected token address are required for a new submitted launch." }, 409);
    }
    patch.transaction_hash = txHash;
    patch.expected_token_address = expectedAddress;
  }
  if (status === "failed") {
    if (!["awaiting_wallet", "submitted"].includes(existing.status)) return json({ error: "This launch can no longer be marked failed." }, 409);
    patch.failure_message = String(body.message || "Launch failed.").slice(0, 300);
  }
  if (status === "pending_indexing" && !["awaiting_wallet", "submitted"].includes(existing.status)) {
    return json({ error: "Only an unconfirmed launch can enter pending indexing." }, 409);
  }
  if (status === "confirmed") {
    const txHash = String(body.txHash || "");
    const tokenAddress = String(body.tokenAddress || "");
    const expectedAddress = String(body.expectedAddress || existing.expected_token_address || "");
    const allowedPriorStates = ["awaiting_wallet", "submitted", "pending_indexing"];
    const storedHash = String(existing.transaction_hash || "");
    if (!allowedPriorStates.includes(existing.status) || !env.BASE_RPC_URL || !/^0x[a-fA-F0-9]{64}$/.test(txHash) || (storedHash && txHash.toLowerCase() !== storedHash.toLowerCase()) || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress) || !/^0x[a-fA-F0-9]{40}$/.test(expectedAddress) || expectedAddress.toLowerCase() !== tokenAddress.toLowerCase()) {
      return json({ error: "Confirmation must match this launch, transaction hash, and predicted token address." }, 409);
    }
    const rpc = async (method, params) => {
      const response = await fetch(env.BASE_RPC_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
      const payload = await response.json();
      if (!response.ok || payload.error) throw new Error("Base RPC verification failed.");
      return payload.result;
    };
    try {
      const receipt = await rpc("eth_getTransactionReceipt", [txHash]);
      if (!receipt || receipt.status !== "0x1" || String(receipt.from || "").toLowerCase() !== String(existing.creator_wallet || "").toLowerCase() || String(receipt.to || "").toLowerCase() !== CLANKER_V5_FACTORY.toLowerCase()) {
        return json({ error: "Transaction receipt is missing, failed, or does not match the creator wallet and Clanker V5 factory." }, 409);
      }
      const tokenTopic = addressTopic(tokenAddress);
      const creatorTopic = addressTopic(existing.creator_wallet);
      const matchingLaunch = (receipt.logs || []).some((log) => String(log.address || "").toLowerCase() === CLANKER_V5_FACTORY.toLowerCase() && Array.isArray(log.topics) && String(log.topics[0] || "").toLowerCase() === LAUNCHED_TOPIC.toLowerCase() && String(log.topics[1] || "").toLowerCase() === tokenTopic.toLowerCase() && String(log.topics[3] || "").toLowerCase() === creatorTopic.toLowerCase());
      if (!matchingLaunch) return json({ error: "The transaction does not contain a matching Clanker V5 launch event for this token and creator." }, 409);
      const deployedCode = await rpc("eth_getCode", [tokenAddress, "latest"]);
      if (!deployedCode || deployedCode === "0x") return json({ error: "The expected token contract is not deployed on Base." }, 409);
    } catch {
      return json({ error: "Could not independently verify the Base transaction. Keep the launch pending and check again." }, 503);
    }
    patch.transaction_hash = txHash;
    patch.expected_token_address = tokenAddress;
    patch.confirmed_at = new Date().toISOString();
  }
  const response = await dbRequest(env, "token_launches?id=eq." + encodeURIComponent(id) + "&user_id=eq." + encodeURIComponent(auth.user.id), { method: "PATCH", headers: { prefer: "return=representation" }, body: JSON.stringify(patch) });
  const rows = await response.json().catch(() => null);
  if (!response.ok) return json({ error: "Could not update launch record." }, 502);
  if (!Array.isArray(rows) || rows.length === 0) return json({ error: "Launch record not found." }, 404);
  return json({ ok: true, status });
}