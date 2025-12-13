const { v4: uuidv4 } = require('uuid');

class UserService {
  #storage;

  constructor(storage) {
    this.#storage = storage;
    this.#init();
  }

  #init() {
    const data = this.#storage.read();
    if (!data.users) {
      this.#storage.write({ users: {}, payments: {} });
    }
  }

  upsertUser(user) {
    const data = this.#storage.read();
    if (!data.users) {
      data.users = {};
    }
    const existing = data.users[user.id] || {};
    data.users[user.id] = {
      id: String(user.id),
      username: user.username || '',
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      guideDelivered: existing.guideDelivered || false,
      lastPaymentId: existing.lastPaymentId || null,
      consentAccepted: existing.consentAccepted || false,
    };
    this.#storage.write(data);
    return data.users[user.id];
  }

  registerPaymentIntent(userId, { paymentId, amount, currency }) {
    const data = this.#storage.read();
    if (!data.payments) data.payments = {};
    if (!data.users[userId]) {
      data.users[userId] = {
        id: String(userId),
        username: '',
        firstName: '',
        lastName: '',
        guideDelivered: false,
        lastPaymentId: null,
        consentAccepted: false,
      };
    }
    const payment = {
      id: paymentId,
      userId: String(userId),
      amount,
      currency,
      status: 'pending',
      createdAt: new Date().toISOString(),
      idempotenceKey: uuidv4(),
    };
    data.payments[paymentId] = payment;
    data.users[userId].lastPaymentId = paymentId;
    this.#storage.write(data);
    return payment;
  }

  markPaymentStatus(paymentId, status) {
    const data = this.#storage.read();
    if (!data.payments || !data.payments[paymentId]) return null;
    data.payments[paymentId].status = status;
    this.#storage.write(data);
    return data.payments[paymentId];
  }

  getLastPayment(userId) {
    const data = this.#storage.read();
    const user = data.users?.[userId];
    if (!user || !user.lastPaymentId) return null;
    return data.payments?.[user.lastPaymentId] || null;
  }

  markGuideDelivered(userId) {
    const data = this.#storage.read();
    if (!data.users?.[userId]) return null;
    data.users[userId].guideDelivered = true;
    this.#storage.write(data);
    return data.users[userId];
  }

  getUser(userId) {
    const data = this.#storage.read();
    return data.users?.[userId] || null;
  }

  markConsentAccepted(userId) {
    const data = this.#storage.read();
    if (!data.users?.[userId]) return null;
    data.users[userId].consentAccepted = true;
    this.#storage.write(data);
    return data.users[userId];
  }

  hasConsent(userId) {
    const data = this.#storage.read();
    return Boolean(data.users?.[userId]?.consentAccepted);
  }

  getUsers() {
    const data = this.#storage.read();
    return Object.values(data.users || {});
  }
}

module.exports = UserService;
