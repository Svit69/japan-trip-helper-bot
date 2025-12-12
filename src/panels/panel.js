class Panel {
  constructor(bot) {
    this.bot = bot;
  }

  register() {
    throw new Error('Метод register должен быть реализован в подклассе');
  }
}

module.exports = Panel;
