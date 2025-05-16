const mineflayer = require("mineflayer");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const config = {
  server: "torchville.aternos.me", // Your Aternos server address
  port: 40708, // Double-check this port in Aternos panel
  username: "Spiderplant", // Bot's username (must be whitelisted)
  version: "1.20.1", // Changed to 1.20.1 for better compatibility
  auth: "offline", // Using offline mode
  reconnect: true, // Enable auto-reconnect
  checkTimeoutInterval: 30000 // Longer timeout
};

// Activity configuration
const activities = {
  messages: [
    "Keeping server alive!",
    "Bot is active!",
    "Just maintaining the server",
    "Beep boop - I'm working",
    "Don't mind me, just existing",
  ],
  directions: ["forward", "back", "left", "right"],
  blocks: ["dirt", "cobblestone", "wood", "stone"]
};

// Create bot instance with improved error handling
function createBot() {
  console.log(`Attempting to connect to ${config.server}:${config.port}`);

  const bot = mineflayer.createBot({
    host: config.server,
    port: config.port,
    username: config.username,
    version: config.version,
    auth: config.auth,
    hideErrors: false,
    checkTimeoutInterval: config.checkTimeoutInterval
  });

  // Bot event handlers
  bot.once("login", () => {
    console.log("Bot has successfully logged in!");
  });

  bot.on("spawn", () => {
    console.log("Bot has spawned in the world!");
    scheduleActivities(bot);
  });

  bot.on("kicked", (reason) => {
    console.log("Bot was kicked:", reason);
    setTimeout(() => {
      console.log("Attempting to reconnect...");
      createBot(); // Recreate bot instead of exiting
    }, 10000);
  });

  bot.on("error", (err) => {
    console.error("Bot connection error:", err.message);
    setTimeout(() => {
      console.log("Attempting to reconnect...");
      createBot(); // Recreate bot instead of exiting
    }, 15000);
  });

  bot.on("end", () => {
    console.log("Connection ended. Reconnecting...");
    setTimeout(createBot, 10000);
  });

  return bot;
}

// Initialize bot
let bot = createBot();

// Activity functions (unchanged but included for completeness)
function randomWalk(bot) {
  const direction = activities.directions[Math.floor(Math.random() * activities.directions.length)];
  const duration = Math.random() * 2000 + 1000;

  bot.setControlState(direction, true);
  setTimeout(() => {
    bot.setControlState(direction, false);
    if (Math.random() > 0.7) {
      bot.setControlState("jump", true);
      setTimeout(() => bot.setControlState("jump", false), 200);
    }
  }, duration);
}

function interactWithBlock(bot) {
  try {
    const blockType = activities.blocks[Math.floor(Math.random() * activities.blocks.length)];
    const block = bot.findBlock({
      matching: bot.registry.blocksByName[blockType]?.id,
      maxDistance: 4,
    });

    if (block && bot.canDigBlock(block)) {
      bot.dig(block);
    }
  } catch (err) {
    console.log("Block interaction error:", err.message);
  }
}

function sendRandomMessage(bot) {
  const message = activities.messages[Math.floor(Math.random() * activities.messages.length)];
  bot.chat(message);
}

function lookAround(bot) {
  const yaw = Math.random() * Math.PI * 2;
  const pitch = Math.random() * Math.PI - Math.PI / 2;
  bot.look(yaw, pitch, false);

  if (Math.random() > 0.7) {
    bot.setControlState("jump", true);
    setTimeout(() => bot.setControlState("jump", false), 200);
  }
}

// Improved activity scheduler
function scheduleActivities(bot) {
  if (!bot.entity || !bot.entity.position) {
    console.log("Bot not ready for activities yet");
    setTimeout(() => scheduleActivities(bot), 10000);
    return;
  }

  const interval = Math.random() * 60000 + 30000;
  console.log(`Next activities in ${Math.round(interval/1000)} seconds`);

  setTimeout(() => {
    const activityCount = Math.floor(Math.random() * 3) + 1;
    const executedActivities = new Set();

    for (let i = 0; i < activityCount; i++) {
      let activity;
      do {
        const activitiesList = ["walk", "block", "message", "look"];
        activity = activitiesList[Math.floor(Math.random() * activitiesList.length)];
      } while (executedActivities.has(activity));

      executedActivities.add(activity);
      console.log(`Performing activity: ${activity}`);

      try {
        switch (activity) {
          case "walk": randomWalk(bot); break;
          case "block": interactWithBlock(bot); break;
          case "message": sendRandomMessage(bot); break;
          case "look": lookAround(bot); break;
        }
      } catch (err) {
        console.error(`Activity ${activity} failed:`, err.message);
      }
    }

    scheduleActivities(bot);
  }, interval);
}

// Enhanced Express server
app.get("/", (req, res) => {
  res.status(200).json({
    status: "online",
    bot: bot && bot.entity ? "connected" : "disconnected",
    uptime: process.uptime(),
    server: `${config.server}:${config.port}`
  });
});

app.get("/health", (req, res) => {
  if (bot && bot.entity) {
    res.status(200).send("OK");
  } else {
    res.status(503).send("Bot disconnected");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Keep-alive server running on port ${PORT}`);
  console.log(`UptimeRobot URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/health`);
});

// Process management
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
