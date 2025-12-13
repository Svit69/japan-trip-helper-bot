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
    await this.sendConsentRequest(ctx, user);
    return false;
  }

  async sendConsentRequest(ctx, user) {
    const name = this.escapeHtml(user.firstName || user.username || 'Дорогой друг');
    const message = `${name} 🙂, перед тем как я поделюсь полезными материалами прошу подтвердить своё <a href="https://mantsova.tilda.ws/soglasie">Согласие на получение</a> информационных и маркетинговых сообщений от меня, а также на обработку персональных данных в соответствии с <a href="https://mantsova.tilda.ws/politika">Политикой конфиденциальности</a> и <a href="https://mantsova.tilda.ws/oferta">Договором оферты</a>\n\nНажимая на кнопку ниже, Вы соглашаетесь с условиями.`;

    await ctx.reply(message, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...Markup.inlineKeyboard([Markup.button.callback('Соглашаюсь', 'accept_consent')]),
    });
  }

  async handleConsent(ctx) {
    if (ctx.updateType === 'callback_query') {
      await ctx.answerCbQuery();
    }
    const user = this.#userService.upsertUser(ctx.from);
    this.#userService.markConsentAccepted(ctx.from.id);
    await ctx.reply(`${user.firstName || user.username || 'Отлично'}, спасибо! Теперь можете получить гайд.`);
  }

  escapeHtml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

module.exports = ConsentHandler;
