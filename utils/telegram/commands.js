const { Composer, CommandContext } = require("grammy");
const logger = require('../logger');

const commands = new Composer();

commands.command("start", async (ctx) => {
  try {
    // Extract start parameter if exists (for referrals)
    const startParam = ctx.message.text.split(' ')[1];
    if (startParam) {
      // Handle referral logic
      await handleReferral(ctx, startParam);
    }
    
    // Show main menu
    return await ctx.Menu();
  } catch (error) {
    logger.error('Start Command Error:', error);
    await ctx.reply("Sorry, something went wrong. Please try again.");
  }
});

commands.command("menu", async (ctx) => {
  try {
    return await ctx.Menu();
  } catch (error) {
    logger.error('Menu Command Error:', error);
    await ctx.reply("Sorry, something went wrong. Please try again.");
  }
});

async function handleReferral(ctx, code) {
  try {
    // Find user by referral code
    const referrer = await prisma.users.findFirst({
      where: { referralCode: code }
    });

    if (referrer) {
      // Create referral record
      await prisma.referrals.create({
        data: {
          invitedById: referrer.id,
          invitedId: ctx.from.id
        }
      });

      // Optionally notify the referrer
      await ctx.api.sendMessage(
        referrer.telegram_id,
        `New user joined using your referral link!`
      );
    }
  } catch (error) {
    logger.error('Handle Referral Error:', error);
  }
}

module.exports = commands;