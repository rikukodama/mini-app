const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

class AeonService {
  constructor() {
    this.url = process.env.AEON_API_URL;
    this.privateKey = process.env.AEON_PRIVATE_KEY;
    this.apiKey = process.env.AEON_API_KEY;
  }

  async create({ amount, orderNo }) {
    try {
      const body = this.createRequestBody({ amount, orderNo });
      const response = await axios.post(`${this.url}/open/api/tg/payment/V2`, body);
      
      if (response.data.error) {
        throw new Error(response.data.msg);
      }

      const model = response.data.model;
      return { 
        id: model.orderNo, 
        url: model.webUrl 
      };
    } catch (err) {
      logger.error('Aeon Payment Creation Error:', err);
      throw new Error(err?.msg || err?.message);
    }
  }

  createRequestBody({ amount, orderNo }) {
    const data = {
      appId: this.apiKey,
      merchantOrderNo: orderNo,
      orderAmount: parseFloat(amount),
      payCurrency: "USD",
      paymentTokens: "USDT",
      userId: "myonis@tontopia.com",
      tgModel: "MINIAPP",
      expiredTime: 1800,
      callbackURL: `${process.env.BASE_HOST}/webhook/aeon`,
      orderModel: "ORDER"
    };

    const signature = this.sign(data);
    return {
      ...data,
      sign: signature
    };
  }

  sign(data) {
    const sortedKeys = Object.keys(data).sort();
    const queryString = sortedKeys.map(key => `${key}=${data[key]}`).join('&');
    const stringToSign = `${queryString}&key=${this.privateKey}`;
  
    return crypto.createHash('sha512')
      .update(stringToSign)
      .digest('hex')
      .toUpperCase();
  }

  async verifyWebhook(payload, signature) {
    try {
      const calculatedSignature = this.sign(payload);
      return calculatedSignature === signature;
    } catch (error) {
      logger.error('Aeon Webhook Verification Error:', error);
      return false;
    }
  }
}

module.exports = new AeonService();