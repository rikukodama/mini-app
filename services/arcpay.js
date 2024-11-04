const axios = require('axios');
const logger = require('../utils/logger');

class ArcpayService {
  constructor() {
    this.apiUrl = process.env.ARCPAY_API_URL;
    this.apiKey = process.env.ARCPAY_API_KEY;
    this.secretKey = process.env.ARCPAY_SECRET_KEY;
  }

  async create({ amount, name, description, imageUrl, orderNo }) {
    try {
      const payload = {
        name,
        description,
        amount: parseFloat(amount),
        currency: "TON",
        order_id: orderNo,
        success_url: `${process.env.APP_URL}/payment/success`,
        cancel_url: `${process.env.APP_URL}/payment/cancel`,
        webhook_url: `${process.env.BASE_HOST}/webhook/arcpay`,
        image_url: imageUrl
      };

      const response = await axios.post(`${this.apiUrl}/orders`, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        id: response.data.id,
        url: response.data.payment_url
      };

    } catch (error) {
      logger.error('Arcpay Payment Creation Error:', error);
      throw new Error('Failed to create payment');
    }
  }

  async checkout(orderId, { customerWalletAddress }) {
    try {
      const payload = {
        wallet_address: customerWalletAddress
      };

      const response = await axios.post(
        `${this.apiUrl}/orders/${orderId}/checkout`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;

    } catch (error) {
      logger.error('Arcpay Checkout Error:', error);
      throw new Error('Failed to checkout payment');
    }
  }

  async verifyWebhook(payload, signature) {
    try {
      // Implement webhook signature verification
      return true; // Replace with actual verification
    } catch (error) {
      logger.error('Arcpay Webhook Verification Error:', error);
      return false;
    }
  }
}

module.exports = new ArcpayService();