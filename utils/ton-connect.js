const { createHash } = require("crypto");
const { Address } = require("@ton/core");
const nacl = require("tweetnacl");
const logger = require('./logger');

class TonConnectService {
  constructor() {
    this.tonProofPrefix = "ton-proof-item-v2/";
    this.tonConnectPrefix = "ton-connect";
  }

  signatureVerify(pubkey, message, signature) {
    try {
      return nacl.sign.detached.verify(
        message,
        signature,
        pubkey
      );
    } catch (error) {
      logger.error('Signature Verification Error:', error);
      return false;
    }
  }

  createMessage(message) {
    try {
      const wc = Buffer.alloc(4);
      wc.writeUint32BE(message.Workchain);

      const ts = Buffer.alloc(8);
      ts.writeBigUint64LE(BigInt(message.Timstamp));

      const dl = Buffer.alloc(4);
      dl.writeUint32LE(message.Domain.LengthBytes);

      const m = Buffer.concat([
        Buffer.from(this.tonProofPrefix),
        wc,
        message.Address,
        dl,
        Buffer.from(message.Domain.Value),
        ts,
        Buffer.from(message.Payload)
      ]);

      const messageHash = createHash("sha256").update(m).digest();

      const fullMes = Buffer.concat([
        Buffer.from([0xff, 0xff]),
        Buffer.from(this.tonConnectPrefix),
        Buffer.from(messageHash)
      ]);

      return createHash("sha256").update(fullMes).digest();
    } catch (error) {
      logger.error('Create Message Error:', error);
      throw error;
    }
  }

  convertTonProofMessage(walletInfo, tp) {
    try {
      const address = Address.parse(walletInfo.account.address);

      return {
        Workchain: address.workChain,
        Address: address.hash,
        Domain: {
          LengthBytes: tp.proof.domain.lengthBytes,
          Value: tp.proof.domain.value
        },
        Signature: Buffer.from(tp.proof.signature, "base64"),
        Payload: tp.proof.payload,
        StateInit: walletInfo.account.walletStateInit,
        Timstamp: tp.proof.timestamp
      };
    } catch (error) {
      logger.error('Convert Ton Proof Message Error:', error);
      throw error;
    }
  }

  validateWalletAddress(address) {
    try {
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new TonConnectService();