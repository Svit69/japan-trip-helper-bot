class GuideService {
  #storage;

  constructor(storage) {
    this.#storage = storage;
    this.#init();
  }

  #init() {
    const data = this.#storage.read();
    if (!data.fileId) {
      this.#storage.write({});
    }
  }

  saveGuide({ fileId, fileName }) {
    const payload = {
      fileId,
      fileName,
      updatedAt: new Date().toISOString(),
    };
    this.#storage.write(payload);
    return payload;
  }

  getGuide() {
    const data = this.#storage.read();
    if (!data.fileId) {
      return null;
    }
    return data;
  }
}

module.exports = GuideService;
