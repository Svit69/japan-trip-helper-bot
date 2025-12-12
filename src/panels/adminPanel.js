const { Markup } = require('telegraf');
const Panel = require('./panel');

class AdminPanel extends Panel {
  #userService;
  #guideService;
  #adminIds;

  constructor(bot, { userService, guideService, adminIds }) {
    super(bot);
    this.#userService = userService;
    this.#guideService = guideService;
    this.#adminIds = adminIds;
  }

  register() {
    this.bot.command('admin', (ctx) => this.showMenu(ctx));
    this.bot.hears('Список пользователей', (ctx) => this.handleUserList(ctx));
    this.bot.hears('Загрузить гайд', (ctx) => this.askForGuide(ctx));
    this.bot.on('document', (ctx) => this.handleDocument(ctx));
  }

  isAdmin(ctx) {
    return this.#adminIds.includes(String(ctx.from.id));
  }

  async showMenu(ctx) {
    if (!this.isAdmin(ctx)) return;

    await ctx.reply(
      'Админ-панель:',
      Markup.keyboard([['Список пользователей'], ['Загрузить гайд']]).resize(),
    );
  }

  async handleUserList(ctx) {
    if (!this.isAdmin(ctx)) return;
    const users = this.#userService.getUsers();
    if (users.length === 0) {
      await ctx.reply('Пользователей пока нет.');
      return;
    }

    const lines = users.map(
      (user) =>
        `ID: ${user.id} | ${user.username ? '@' + user.username : 'без username'} | Гайд: ${
          user.guideDelivered ? 'выдан' : 'не выдан'
        } | Последний платеж: ${user.lastPaymentId || 'нет'}`,
    );

    await ctx.reply(lines.join('\n'));
  }

  async askForGuide(ctx) {
    if (!this.isAdmin(ctx)) return;
    await ctx.reply('Пришлите PDF-файл гайда, чтобы сохранить его.');
  }

  async handleDocument(ctx) {
    if (!this.isAdmin(ctx)) return;
    const document = ctx.message?.document;
    if (!document) return;

    if (document.mime_type !== 'application/pdf') {
      await ctx.reply('Нужен PDF-файл.');
      return;
    }

    const saved = this.#guideService.saveGuide({
      fileId: document.file_id,
      fileName: document.file_name,
    });

    await ctx.reply(`Гайд обновлён: ${saved.fileName || 'PDF'}`);
  }
}

module.exports = AdminPanel;
