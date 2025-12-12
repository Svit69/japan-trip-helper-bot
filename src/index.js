const path = require('path');
const { Telegraf } = require('telegraf');
const config = require('./config');
const JsonStorage = require('./storage/jsonStorage');
const UserService = require('./services/userService');
const GuideService = require('./services/guideService');
const PaymentService = require('./services/paymentService');
const UserPanel = require('./panels/userPanel');
const AdminPanel = require('./panels/adminPanel');

class BotApplication {
  #bot;
  #userService;
  #guideService;
  #paymentService;
  #panels;

  constructor(appConfig) {
    if (!appConfig.telegramToken) {
      throw new Error('TELEGRAM_BOT_TOKEN не задан в окружении');
    }

    this.#bot = new Telegraf(appConfig.telegramToken);
    this.#userService = new UserService(
      new JsonStorage(path.join(appConfig.storageRoot, 'users.json'), {
        users: {},
        payments: {},
      }),
    );
    this.#guideService = new GuideService(new JsonStorage(path.join(appConfig.storageRoot, 'guide.json'), {}));
    this.#paymentService = new PaymentService({
      shopId: appConfig.yookassaShopId,
      apiKey: appConfig.yookassaApiKey,
      returnUrl: appConfig.paymentReturnUrl,
      guidePrice: appConfig.guidePrice,
    });
    this.#panels = [];
    this.registerPanels(appConfig.adminIds);
  }

  registerPanels(adminIds) {
    const userPanel = new UserPanel(this.#bot, {
      paymentService: this.#paymentService,
      userService: this.#userService,
      guideService: this.#guideService,
    });
    const adminPanel = new AdminPanel(this.#bot, {
      userService: this.#userService,
      guideService: this.#guideService,
      adminIds,
    });

    this.#panels.push(userPanel, adminPanel);
    this.#panels.forEach((panel) => panel.register());
  }

  launch() {
    this.#bot.launch();
    process.once('SIGINT', () => this.#bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.#bot.stop('SIGTERM'));
  }
}

const app = new BotApplication(config);
app.launch();
