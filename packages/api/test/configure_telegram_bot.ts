const token = "8614843379:AAE_zsmHWSxG8oKDcm4gnLmjQo0F4YUw3kc";

async function configureBot() {
  console.log("Configuring @alpha_cut_bot basics...");

  // 1. Set Chat Menu Button (Persistent Client Portal button in chat UI)
  const menuRes = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      menu_button: {
        type: "web_app",
        text: "Client Portal",
        web_app: {
          url: "https://alpha-cut.com/portal",
        },
      },
    }),
  });
  const menuData = await menuRes.json();
  console.log("1. setChatMenuButton:", menuData);

  // 2. Set Bot Description (What users see before starting the bot)
  const descRes = await fetch(`https://api.telegram.org/bot${token}/setMyDescription`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: "Welcome to Alpha Cut Video Editing Agency 🎬\n\nWe engineer retention-driven, cinematic video edits for creators, founders, and modern brands.\n\nUse this bot to:\n• Launch the Client Workspace & submit briefs\n• Review and accept custom video proposals\n• Track live editing milestones & delivery\n• Request revisions and approve final cuts",
    }),
  });
  const descData = await descRes.json();
  console.log("2. setMyDescription:", descData);

  // 3. Set Bot Short Description (Visible in bot profile & share links)
  const shortDescRes = await fetch(`https://api.telegram.org/bot${token}/setMyShortDescription`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      short_description: "Alpha Cut Video Editing Agency — High-retention video editing, client portal & active project tracking.",
    }),
  });
  const shortDescData = await shortDescRes.json();
  console.log("3. setMyShortDescription:", shortDescData);

  // 4. Set Bot Commands list in Telegram menu
  const cmdRes = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commands: [
        { command: "start", description: "Launch bot & main menu" },
        { command: "menu", description: "Open role-based control menu" },
        { command: "status", description: "Check live active work status" },
        { command: "projects", description: "View all video projects & contracts" },
        { command: "packages", description: "View pricing & rate ranges" },
        { command: "styles", description: "Browse signature editing styles" },
        { command: "deadlines", description: "Check deliverable deadlines" },
        { command: "about", description: "About Alpha Cut Agency" },
        { command: "help", description: "Get help and instructions" },
      ],
    }),
  });
  const cmdData = await cmdRes.json();
  console.log("4. setMyCommands:", cmdData);
}

configureBot().catch(console.error);

