const token = "8614843379:AAE_zsmHWSxG8oKDcm4gnLmjQo0F4YUw3kc";

async function inspectBot() {
  const getMe = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) => r.json());
  console.log("=== Bot Info ===");
  console.log(JSON.stringify(getMe, null, 2));

  const getWebhook = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`).then((r) => r.json());
  console.log("\n=== Webhook Info ===");
  console.log(JSON.stringify(getWebhook, null, 2));

  const getCommands = await fetch(`https://api.telegram.org/bot${token}/getMyCommands`).then((r) => r.json());
  console.log("\n=== Current Commands ===");
  console.log(JSON.stringify(getCommands, null, 2));

  const getMenu = await fetch(`https://api.telegram.org/bot${token}/getChatMenuButton`).then((r) => r.json());
  console.log("\n=== Current Menu Button ===");
  console.log(JSON.stringify(getMenu, null, 2));
}

inspectBot();
