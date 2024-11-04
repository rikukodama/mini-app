const { v4: uuid } = require('uuid');
const { Response } = require('../utils/response');
const prisma = require('../config/database');
const logger = require('../utils/logger');
const { aeon, arcpay, stars } = require('../services');

class PaymentController {
  constructor() {
    this.starInUsd = 0.0198;
    this.coinInStar = 10;
    this.methodPayments = {
      aeon: 'aeon',
      arcpay: 'arcpay',
      stars: 'stars'
    };
  }

  async getPaymentItems(req, res) {
    try {
      const priceItems = [
        { coins: 500 },
        { coins: 1000 },
        { coins: 2000 },
        { coins: 2500 },
        { coins: 3000 },
        { coins: 4000 },
        { coins: 5000 }
      ];

      const items = await Promise.all(
        priceItems.map(item => this.calculateItemPrice(item))
      );

      return res.json(new Response().data(items));
    } catch (error) {
      logger.error('Get Payment Items Error:', error);
      return res.status(500).json(new Response().error('Failed to get payment items'));
    }
  }

  async createPayment(req, res) {
    try {
      const { coins, currencyToken, amount } = req.body;
      const paymentMethod = req.params.payment;

      if (!this.validatePayment(coins, amount, currencyToken)) {
        return res.status(400).json(new Response().error('Invalid payment parameters'));
      }

      const paymentService = this.getPaymentService(paymentMethod);
      if (!paymentService) {
        return res.status(400).json(new Response().error('Unsupported payment method'));
      }

      const orderNo = uuid();
      const payment = await this.processPayment(paymentService, {
        userId: req.user.id,
        coins,
        amount,
        currencyToken,
        orderNo
      });

      return res.json(new Response().data(payment));
    } catch (error) {
      logger.error('Create Payment Error:', error);
      return res.status(500).json(new Response().error('Failed to create payment'));
    }
  }

  async processPayment(service, paymentData) {
    const { userId, coins, amount, currencyToken, orderNo } = paymentData;

    const order = await prisma.orders.create({
      data: {
        payment: service.name,
        amount: amount.toString(),
        status: "created",
        currency: currencyToken,
        item: { coins },
        token: this.methodPayments[service.name],
        user_id: userId,
        order_no: orderNo
      }
    });

    const payment = await service.create({
      amount,
      name: `${coins} coins`,
      description: "Game currency",
      orderNo,
      imageUrl: `${process.env.BASE_HOST}/images/coin.png`
    });

    if (service.name === this.methodPayments.arcpay) {
      payment.transactions = await service.checkout(payment.id, {
        customerWalletAddress: req.user.address
      });
    }

    return {
      ...payment,
      order_id: order.id
    };
  }

  // Helper methods...
  private async calculateItemPrice(item) {
    const stars = item.coins / this.coinInStar;
    const usd = (stars * this.starInUsd).toFixed(2);
    const tonPrice = await this.getTonPrice();

    return {
      coins: item.coins,
      stars,
      usd,
      ton: (usd / tonPrice).toFixed(2)
    };
  }

  private async getTonPrice() {
    const response = await axios.get('https://connect.tonhubapi.com/price');
    return response.data.price.usd;
  }

  private getPaymentService(method) {
    return {
      [this.methodPayments.aeon]: aeon,
      [this.methodPayments.arcpay]: arcpay,
      [this.methodPayments.stars]: stars
    }[method];
  }
}

module.exports = new PaymentController();