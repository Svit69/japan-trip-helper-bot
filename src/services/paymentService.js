const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class PaymentService {
  #shopId;
  #apiKey;
  #returnUrl;
  #price;

  constructor({ shopId, apiKey, returnUrl, guidePrice }) {
    this.#shopId = shopId;
    this.#apiKey = apiKey;
    this.#returnUrl = returnUrl;
    this.#price = guidePrice;
  }

  isConfigured() {
    return Boolean(this.#shopId && this.#apiKey);
  }

  async createPayment(description) {
    const idempotenceKey = uuidv4();
    const payload = {
      amount: {
        value: this.#price.toFixed(2),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: this.#returnUrl,
      },
      capture: true,
      description,
    };

    const response = await axios.post('https://api.yookassa.ru/v3/payments', payload, {
      headers: {
        'Idempotence-Key': idempotenceKey,
        Authorization: `Basic ${Buffer.from(`${this.#shopId}:${this.#apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      paymentId: response.data.id,
      confirmationUrl: response.data?.confirmation?.confirmation_url,
      status: response.data.status,
      amount: payload.amount.value,
      currency: payload.amount.currency,
    };
  }

  async fetchStatus(paymentId) {
    const response = await axios.get(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.#shopId}:${this.#apiKey}`).toString('base64')}`,
      },
    });
    return response.data.status;
  }
}

module.exports = PaymentService;
