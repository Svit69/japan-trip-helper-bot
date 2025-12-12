const path = require('path');
require('dotenv').config();

const adminIdsFromEnv = process.env.ADMIN_IDS
  ? process.env.ADMIN_IDS.split(',').map((id) => id.trim()).filter(Boolean)
  : [];

module.exports = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  yookassaShopId: process.env.YOOKASSA_SHOP_ID || '',
  yookassaApiKey: process.env.YOOKASSA_API_KEY || '',
  paymentReturnUrl: process.env.PAYMENT_RETURN_URL || 'https://t.me/your_bot',
  guidePrice: Number(process.env.GUIDE_PRICE || '99.00'),
  adminIds: adminIdsFromEnv.length > 0 ? adminIdsFromEnv : ['389411230', '265485424'],
  storageRoot: path.join(__dirname, '..', 'data'),
};
