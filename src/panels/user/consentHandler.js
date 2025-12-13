const { Markup } = require('telegraf');

class ConsentHandler {
  #userService;

  constructor(userService) {
    this.#userService = userService;
  }

  async ensureConsent(ctx) {
    const user = this.#userService.upsertUser(ctx.from);
    if (user.consentAccepted) {
      return true;
    }
    await this.sendConsentRequest(ctx);
    return false;
  }

  async sendConsentRequest(ctx) {
    const message =
      'Анастасия 🙂, перед тем как я поделюсь полезными материалами прошу подтвердить своё Согласие на получение (https://mantsova.tilda.ws/soglasie) информационных и маркетинговых сообщений от меня, а также на обработку персональных данных в соответствии с Политикой конфиденциальности (https://mantsova.tilda.ws/politika) и Договором оферты (https://mantsova.tilda.ws/oferta)\n\nНажимая на кнопку ниже, Вы соглашаетесь с условиями.';

    await ctx.reply(message, {
      disable_web_page_preview: true,
      ...Markup.inlineKeyboard([Markup.button.callback('Соглашаюсь', 'accept_consent')]),
    });
  }

  async handleConsent(ctx) {
    if (ctx.updateType === 'callback_query') {
      await ctx.answerCbQuery();
    }
    this.#userService.upsertUser(ctx.from);
    this.#userService.markConsentAccepted(ctx.from.id);
    await ctx.reply('Спасибо! Теперь можете получить гайд.');
  }
}

module.exports = ConsentHandler;
