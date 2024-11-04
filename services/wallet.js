const axios = require('axios');
const { Address } = require('@ton/core');
const { tonConnectService } = require('../utils/ton-connect');
const logger = require('../utils/logger');

class WalletService {
  constructor() {
    this.toncenterUrl = process.env.TONCENTER_API_URL;
    this.toncenterApiKey = process.env.TONCENTER_API_KEY;
  }

  async verifyConnection(walletInfo) {
    try {
      if (!walletInfo?.connectItems?.tonProof) {
        throw new Error('No TON proof provided');
      }

      const proof = walletInfo.connectItems.tonProof;
      const pubkey = Buffer.from(walletInfo.account.publicKey, "hex");

      const parsedMessage = tonConnectService.convertTonProofMessage(walletInfo, proof);
      const checkMessage = tonConnectService.createMessage(parsedMessage);

      const isValid = tonConnectService.signatureVerify(
        pubkey,
        checkMessage,
        parsedMessage.Signature
      );

      if (!isValid) {
        throw new Error('Invalid signature');
      }

      const address = Address.parseRaw(walletInfo.account.address);
      return {
        valid: true,
        address: address.toString()
      };
    } catch (error) {
      logger.error('Wallet Verification Error:', error);
      return {
        valid: false,
        message: error.message
      };
    }
  }

  async getBalance(address) {
    try {
      const response = await axios.get(
        `${this.toncenterUrl}/getAddressBalance/${address}`,
        {
          headers: {
            'X-API-Key': this.toncenterApiKey
          }
        }
      );

      return {
        balance: response.data.result,
        address
      };
    } catch (error) {
      logger.error('Get Balance Error:', error);
      throw new Error('Failed to fetch wallet balance');
    }
  }

  async generatePayload() {
    try {
      return require('uuid').v4();
    } catch (error) {
      logger.error('Generate Payload Error:', error);
      throw new Error('Failed to generate payload');
    }
  }

  async validateTransaction(transactionData) {
    try {
      const response = await axios.get(
        `${this.toncenterUrl}/getTransactions/${transactionData.address}`,
        {
          headers: {
            'X-API-Key': this.toncenterApiKey
          },
          params: {
            limit: 1
          }
        }
      );

      // Validate transaction
      const transaction = response.data.result[0];
      return this.verifyTransactionDetails(transaction, transactionData);
    } catch (error) {
      logger.error('Validate Transaction Error:', error);
      throw new Error('Failed to validate transaction');
    }
  }

  private verifyTransactionDetails(transaction, expectedData) {
    return {
      isValid: true, // Implement actual verification logic
      details: transaction
    };
  }
}

module.exports = new WalletService();