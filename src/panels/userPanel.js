const { Markup } = require('telegraf');
const Panel = require('./panel');

class UserPanel extends Panel {
  #paymentService;
  #userService;
  #guideService;

  constructor(bot, { paymentService, userService, guideService }) {
    super(bot);
    this.#paymentService = paymentService;
    this.#userService = userService;
    this.#guideService = guideService;
  }

  register() {
    this.bot.start((ctx) => this.showMenu(ctx));
    this.bot.hears('Получить гайд', (ctx) => this.handleGuideRequest(ctx));
    this.bot.hears('Проверить оплату', (ctx) => this.handlePaymentCheck(ctx));
    this.bot.action('check_payment', (ctx) => this.handlePaymentCheck(ctx));
  }

  async showMenu(ctx) {
    this.#userService.upsertUser(ctx.from);
    await ctx.reply(
      'Выберите действие:',
      Markup.keyboard([['Получить гайд'], ['Проверить оплату']]).resize(),
    );
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

  async handlePaymentCheck(ctx) {
    if (ctx.answerCbQuery) {
      await ctx.answerCbQuery();
    }
    this.#userService.upsertUser(ctx.from);
    const user = this.#userService.getUser(ctx.from.id);
    if (user?.guideDelivered) {
      await ctx.reply('Гайд уже был отправлен. Дублирую ссылку.');
      await this.sendGuide(ctx);
      return;
    }
    const payment = this.#userService.getLastPayment(ctx.from.id);
    if (!payment) {
      await ctx.reply('Оплата не найдена. Сначала запросите гайд.');
      return;
    }

    try {
      const status = await this.#paymentService.fetchStatus(payment.id);
      this.#userService.markPaymentStatus(payment.id, status);

      if (status === 'succeeded') {
        await this.sendGuide(ctx);
        this.#userService.markGuideDelivered(ctx.from.id);
        return;
      }

      await ctx.reply(`Статус оплаты: ${status}. Попробуйте ещё раз через минуту.`);
    } catch (error) {
      await ctx.reply('Не удалось проверить платеж. Попробуйте позже.');
    }
  }

  async sendGuide(ctx) {
    const guide = this.#guideService.getGuide();
    if (!guide) {
      await ctx.reply('Гайд пока не загружен.');
      return;
    }

    await ctx.replyWithDocument(guide.fileId, {
      caption: guide.fileName ? `Ваш гайд: ${guide.fileName}` : 'Ваш гайд',
    });
  }
}

module.exports = UserPanel;
