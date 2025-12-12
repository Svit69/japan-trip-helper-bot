const fs = require('fs');
const path = require('path');

class JsonStorage {
  #filePath;

  constructor(filePath, fallback = {}) {
    this.#filePath = filePath;
    this.fallback = fallback;
    this.ensureFile();
  }

  ensureFile() {
    const dir = path.dirname(this.#filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.#filePath)) {
      fs.writeFileSync(this.#filePath, JSON.stringify(this.fallback, null, 2), 'utf-8');
    }
  }

  read() {
    try {
      const content = fs.readFileSync(this.#filePath, 'utf-8');
      return JSON.parse(content || '{}');
    } catch (error) {
      return { ...this.fallback };
    }
  }

  write(payload) {
    fs.writeFileSync(this.#filePath, JSON.stringify(payload, null, 2), 'utf-8');
  }
}

module.exports = JsonStorage;
