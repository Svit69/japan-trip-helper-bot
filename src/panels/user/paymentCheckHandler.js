class PaymentCheckHandler {
  #paymentService;
  #userService;
  #guideService;

  constructor({ paymentService, userService, guideService }) {
    this.#paymentService = paymentService;
    this.#userService = userService;
    this.#guideService = guideService;
  }

  async handlePaymentCheck(ctx) {
    if (ctx.updateType === 'callback_query') {
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

module.exports = PaymentCheckHandler;
