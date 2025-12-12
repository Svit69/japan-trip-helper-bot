const { Markup } = require('telegraf');

class GuideRequestHandler {
  #paymentService;
  #userService;
  #guideService;

  constructor({ paymentService, userService, guideService }) {
    this.#paymentService = paymentService;
    this.#userService = userService;
    this.#guideService = guideService;
  }

  async handleGuideRequest(ctx) {
    this.#userService.upsertUser(ctx.from);

    if (!this.#paymentService.isConfigured()) {
      await ctx.reply('Оплата временно недоступна. Сообщите администратору.');
      return;
    }

    const guide = this.#guideService.getGuide();
    if (!guide) {
      await ctx.reply('Гайд пока не загружен. Пожалуйста, попробуйте позже.');
      return;
    }

    try {
      const payment = await this.#paymentService.createPayment(
        `Оплата гида пользователем ${ctx.from.username || ctx.from.id}`,
      );

      this.#userService.registerPaymentIntent(ctx.from.id, {
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
      });

      await ctx.reply(
        `Ссылка на оплату (${payment.amount} ${payment.currency}):`,
        Markup.inlineKeyboard([
          Markup.button.url('Оплатить', payment.confirmationUrl),
          Markup.button.callback('Проверить оплату', 'check_payment'),
        ]),
      );
    } catch (error) {
      await ctx.reply('Не удалось создать платеж. Попробуйте позже.');
    }
  }
}

module.exports = GuideRequestHandler;
