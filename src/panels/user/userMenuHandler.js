const { Markup } = require('telegraf');

class UserMenuHandler {
  #userService;

  constructor(userService) {
    this.#userService = userService;
  }

  async showMenu(ctx) {
    this.#userService.upsertUser(ctx.from);
    await ctx.reply(
      'Выберите действие:',
      Markup.keyboard([['Получить гайд'], ['Проверить оплату']]).resize(),
    );
  }
}

module.exports = UserMenuHandler;
