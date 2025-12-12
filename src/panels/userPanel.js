const Panel = require('./panel');
const UserMenuHandler = require('./user/userMenuHandler');
const GuideRequestHandler = require('./user/guideRequestHandler');
const PaymentCheckHandler = require('./user/paymentCheckHandler');

class UserPanel extends Panel {
  constructor(bot, { paymentService, userService, guideService }) {
    super(bot);
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
    this.bot.start((ctx) => this.menuHandler.showMenu(ctx));
    this.bot.hears('Получить гайд', (ctx) => this.guideRequestHandler.handleGuideRequest(ctx));
    this.bot.hears('Проверить оплату', (ctx) => this.paymentCheckHandler.handlePaymentCheck(ctx));
    this.bot.action('check_payment', (ctx) => this.paymentCheckHandler.handlePaymentCheck(ctx));
  }
}

module.exports = UserPanel;
