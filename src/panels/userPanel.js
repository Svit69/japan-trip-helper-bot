const Panel = require('./panel');
const UserMenuHandler = require('./user/userMenuHandler');
const GuideRequestHandler = require('./user/guideRequestHandler');
const PaymentCheckHandler = require('./user/paymentCheckHandler');
const ConsentHandler = require('./user/consentHandler');

class UserPanel extends Panel {
  constructor(bot, { paymentService, userService, guideService }) {
    super(bot);
    this.consentHandler = new ConsentHandler(userService);
    this.menuHandler = new UserMenuHandler(userService);
    this.guideRequestHandler = new GuideRequestHandler({
      paymentService,
      userService,
      guideService,
    });
    this.paymentCheckHandler = new PaymentCheckHandler({
      paymentService,
      userService,
      guideService,
    });
  }

  register() {
    this.bot.start((ctx) => this.showMenuGuarded(ctx));
    this.bot.hears('Получить гайд', (ctx) => this.handleGuideGuarded(ctx));
    this.bot.hears('Проверить оплату', (ctx) => this.handlePaymentGuarded(ctx));
    this.bot.action('check_payment', (ctx) => this.handlePaymentGuarded(ctx));
    this.bot.action('accept_consent', (ctx) => this.handleConsent(ctx));
  }

  async showMenuGuarded(ctx) {
    if (!(await this.consentHandler.ensureConsent(ctx))) return;
    await this.menuHandler.showMenu(ctx);
  }

  async handleGuideGuarded(ctx) {
    if (!(await this.consentHandler.ensureConsent(ctx))) return;
    await this.guideRequestHandler.handleGuideRequest(ctx);
  }

  async handlePaymentGuarded(ctx) {
    if (!(await this.consentHandler.ensureConsent(ctx))) return;
    await this.paymentCheckHandler.handlePaymentCheck(ctx);
  }

  async handleConsent(ctx) {
    await this.consentHandler.handleConsent(ctx);
    await this.menuHandler.showMenu(ctx);
  }
}

module.exports = UserPanel;
