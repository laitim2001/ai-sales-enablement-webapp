/**
 * 資料加密工具測試套件
 *
 * 測試範圍：
 * - 基本加密/解密功能
 * - 批量欄位加密/解密
 * - 金鑰管理和驗證
 * - 哈希和令牌生成
 * - 錯誤處理和邊界情況
 * - 加密資料完整性驗證
 *
 * @author Claude Code
 * @date 2025-10-01
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  EncryptionService,
  encrypt,
  decrypt,
  hash,
  generateToken,
  generateEncryptionKey,
} from './encryption';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // 保存原始環境變數
    originalEnv = { ...process.env };

    // 設置測試用加密金鑰
    process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');

    // 重置單例實例（通過反射）
    (EncryptionService as any).instance = undefined;

    encryptionService = EncryptionService.getInstance();
  });

  afterEach(() => {
    // 恢復環境變數
    process.env = originalEnv;
  });

  describe('單例模式', () => {
    it('應該返回相同的實例', () => {
      const instance1 = EncryptionService.getInstance();
      const instance2 = EncryptionService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('基本加密/解密', () => {
    it('應該成功加密和解密簡單字符串', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);

      expect(encrypted).not.toBe(plaintext);
      expect(decrypted).toBe(plaintext);
    });

    it('應該成功加密和解密空字符串', async () => {
      const plaintext = '';
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('應該成功加密和解密長字符串', async () => {
      const plaintext = 'a'.repeat(10000);
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('應該成功加密和解密包含特殊字符的字符串', async () => {
      const plaintext = '測試！@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('應該成功加密和解密 Unicode 字符', async () => {
      const plaintext = '你好世界 🌍 こんにちは العالم';
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('每次加密相同明文應該產生不同密文（因為隨機IV）', async () => {
      const plaintext = 'Same plaintext';
      const encrypted1 = await encryptionService.encrypt(plaintext);
      const encrypted2 = await encryptionService.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
      expect(await encryptionService.decrypt(encrypted1)).toBe(plaintext);
      expect(await encryptionService.decrypt(encrypted2)).toBe(plaintext);
    });
  });

  describe('加密資料格式和完整性', () => {
    it('加密結果應該是有效的 Base64 字符串', async () => {
      const plaintext = 'Test data';
      const encrypted = await encryptionService.encrypt(plaintext);

      // Base64 正則表達式
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      expect(base64Regex.test(encrypted)).toBe(true);
    });

    it('加密資料應該包含版本、IV、認證標籤', async () => {
      const plaintext = 'Test data';
      const encrypted = await encryptionService.encrypt(plaintext);

      // 解碼並解析加密資料結構
      const decoded = Buffer.from(encrypted, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);

      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('iv');
      expect(parsed).toHaveProperty('authTag');
      expect(parsed).toHaveProperty('encrypted');
    });

    it('篡改加密資料應該導致解密失敗', async () => {
      const plaintext = 'Sensitive data';
      const encrypted = await encryptionService.encrypt(plaintext);

      // 篡改認證標籤（這肯定會被檢測到）
      const decoded = Buffer.from(encrypted, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);

      // 修改認證標籤的一個字符
      const authTagBuffer = Buffer.from(parsed.authTag, 'base64');
      authTagBuffer[0] = (authTagBuffer[0] + 1) % 256;
      parsed.authTag = authTagBuffer.toString('base64');

      const tampered = Buffer.from(JSON.stringify(parsed)).toString('base64');

      // 解密應該失敗
      await expect(async () => {
        await encryptionService.decrypt(tampered);
      }).rejects.toThrow(/integrity check failed|Decryption failed/i);
    });

    it('使用錯誤版本的加密資料應該拋出錯誤', async () => {
      const plaintext = 'Test data';
      const encrypted = await encryptionService.encrypt(plaintext);

      // 修改版本
      const decoded = Buffer.from(encrypted, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      parsed.version = 'v2';
      const modified = Buffer.from(JSON.stringify(parsed)).toString('base64');

      await expect(async () => {
        await encryptionService.decrypt(modified);
      }).rejects.toThrow(/Unsupported encryption version/);
    });
  });

  describe('批量欄位加密/解密', () => {
    it('應該成功加密物件中的指定欄位', async () => {
      const data = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-234-567-8900',
        public_field: 'Public data',
      };

      const encrypted = await encryptionService.encryptFields(data, ['email', 'phone']);

      expect(encrypted.id).toBe(data.id);
      expect(encrypted.name).toBe(data.name);
      expect(encrypted.email).not.toBe(data.email);
      expect(encrypted.phone).not.toBe(data.phone);
      expect(encrypted.public_field).toBe(data.public_field);
    });

    it('應該成功解密物件中的指定欄位', async () => {
      const data = {
        id: 1,
        email: 'john@example.com',
        phone: '+1-234-567-8900',
      };

      const encrypted = await encryptionService.encryptFields(data, ['email', 'phone']);
      const decrypted = await encryptionService.decryptFields(encrypted, ['email', 'phone']);

      expect(decrypted.email).toBe(data.email);
      expect(decrypted.phone).toBe(data.phone);
    });

    it('批量加密應該不修改原始物件', async () => {
      const data = {
        email: 'test@example.com',
        phone: '123456',
      };

      const originalEmail = data.email;
      const encrypted = await encryptionService.encryptFields(data, ['email']);

      expect(data.email).toBe(originalEmail);
      expect(encrypted.email).not.toBe(originalEmail);
    });

    it('批量加密應該跳過空值和非字符串欄位', async () => {
      const data = {
        email: 'test@example.com',
        phone: '',
        age: 30,
        active: true,
      };

      const encrypted = await encryptionService.encryptFields(data, ['email', 'phone', 'age', 'active'] as any);

      expect(encrypted.email).not.toBe(data.email);
      expect(encrypted.phone).toBe('');
      expect(encrypted.age).toBe(30);
      expect(encrypted.active).toBe(true);
    });
  });

  describe('哈希功能', () => {
    it('應該生成一致的哈希值', () => {
      const data = 'Test data';
      const hash1 = encryptionService.hash(data);
      const hash2 = encryptionService.hash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex = 64 characters
    });

    it('不同資料應該產生不同哈希值', () => {
      const hash1 = encryptionService.hash('Data 1');
      const hash2 = encryptionService.hash('Data 2');

      expect(hash1).not.toBe(hash2);
    });

    it('應該支援使用鹽值', () => {
      const data = 'Test data';
      const salt = 'random_salt';

      const hash1 = encryptionService.hash(data);
      const hash2 = encryptionService.hash(data, salt);

      expect(hash1).not.toBe(hash2);
    });

    it('相同鹽值應該產生一致哈希', () => {
      const data = 'Test data';
      const salt = 'same_salt';

      const hash1 = encryptionService.hash(data, salt);
      const hash2 = encryptionService.hash(data, salt);

      expect(hash1).toBe(hash2);
    });
  });

  describe('令牌生成', () => {
    it('應該生成指定長度的令牌', () => {
      const token = EncryptionService.generateToken(16, 'hex');
      expect(token).toHaveLength(32); // 16 bytes = 32 hex characters
    });

    it('應該生成不同的隨機令牌', () => {
      const token1 = EncryptionService.generateToken();
      const token2 = EncryptionService.generateToken();

      expect(token1).not.toBe(token2);
    });

    it('應該支援 base64url 編碼（URL 安全）', () => {
      const token = EncryptionService.generateToken(32, 'base64url');

      // base64url 不應包含 +, /, = 字符
      expect(token).not.toMatch(/[+/=]/);
    });

    it('應該支援 hex 編碼', () => {
      const token = EncryptionService.generateToken(16, 'hex');
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });
  });

  describe('金鑰管理', () => {
    it('應該生成有效長度的加密金鑰', () => {
      const key = EncryptionService.generateNewKey();
      const keyBuffer = Buffer.from(key, 'base64');

      expect(keyBuffer).toHaveLength(32); // 256位 = 32字節
    });

    it('應該驗證有效的金鑰格式', () => {
      const validKey = Buffer.from('a'.repeat(32)).toString('base64');
      expect(EncryptionService.validateKey(validKey)).toBe(true);
    });

    it('應該拒絕無效長度的金鑰', () => {
      const invalidKey = Buffer.from('a'.repeat(16)).toString('base64');
      expect(EncryptionService.validateKey(invalidKey)).toBe(false);
    });

    it('應該拒絕非 Base64 格式的金鑰', () => {
      const invalidKey = 'not_base64!@#$%^&*()';
      expect(EncryptionService.validateKey(invalidKey)).toBe(false);
    });

    it('生產環境缺少 ENCRYPTION_KEY 應該拋出錯誤', () => {
      const originalNodeEnv = process.env.NODE_ENV
      const originalEncryptionKey = process.env.ENCRYPTION_KEY

      // 使用 Object.defineProperty 修改 readonly 屬性
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      })
      delete process.env.ENCRYPTION_KEY
      ;(EncryptionService as any).instance = undefined

      expect(() => {
        EncryptionService.getInstance()
      }).toThrow(/ENCRYPTION_KEY must be set in production/)

      // 恢復原始環境變數
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
        configurable: true,
      })
      if (originalEncryptionKey) {
        process.env.ENCRYPTION_KEY = originalEncryptionKey
      }
    })
  });

  describe('便利函數', () => {
    it('encrypt 便利函數應該正常工作', async () => {
      const plaintext = 'Test data';
      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('hash 便利函數應該正常工作', () => {
      const data = 'Test data';
      const hashed = hash(data);

      expect(hashed).toHaveLength(64);
    });

    it('generateToken 便利函數應該正常工作', () => {
      const token = generateToken();
      expect(token.length).toBeGreaterThan(0);
    });

    it('generateEncryptionKey 便利函數應該正常工作', () => {
      const key = generateEncryptionKey();
      expect(EncryptionService.validateKey(key)).toBe(true);
    });
  });

  describe('錯誤處理', () => {
    it('解密無效資料應該拋出錯誤', async () => {
      await expect(async () => {
        await encryptionService.decrypt('invalid_encrypted_data');
      }).rejects.toThrow(/Decryption failed/);
    });

    it('解密空字符串應該拋出錯誤', async () => {
      await expect(async () => {
        await encryptionService.decrypt('');
      }).rejects.toThrow();
    });

    it('解密非 JSON 格式應該拋出錯誤', async () => {
      const invalidData = Buffer.from('not json data').toString('base64');

      await expect(async () => {
        await encryptionService.decrypt(invalidData);
      }).rejects.toThrow(/Decryption failed/);
    });
  });

  describe('性能測試', () => {
    it('應該快速完成大量加密操作', async () => {
      const iterations = 1000;
      const plaintext = 'Performance test data';

      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await encryptionService.encrypt(plaintext);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 1000次加密應該在 1 秒內完成
      expect(duration).toBeLessThan(1000);

      console.log(`[Performance] ${iterations} encryptions in ${duration}ms (avg: ${(duration / iterations).toFixed(2)}ms)`);
    });

    it('應該快速完成大量解密操作', async () => {
      const iterations = 1000;
      const plaintext = 'Performance test data';
      const encrypted = await encryptionService.encrypt(plaintext);

      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await encryptionService.decrypt(encrypted);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 1000次解密應該在 1 秒內完成
      expect(duration).toBeLessThan(1000);

      console.log(`[Performance] ${iterations} decryptions in ${duration}ms (avg: ${(duration / iterations).toFixed(2)}ms)`);
    });
  });

  describe('實際使用場景', () => {
    it('應該成功加密客戶敏感資料', async () => {
      const customer = {
        id: 1,
        name: 'ABC Company',
        email: 'contact@abc.com',
        phone: '+60-12-345-6789',
        address: '123 Main St, Kuala Lumpur',
        created_at: new Date(),
      };

      // 加密敏感欄位
      const encrypted = await encryptionService.encryptFields(customer, ['email', 'phone', 'address']);

      expect(encrypted.name).toBe(customer.name);
      expect(encrypted.email).not.toBe(customer.email);
      expect(encrypted.phone).not.toBe(customer.phone);
      expect(encrypted.address).not.toBe(customer.address);

      // 解密驗證
      const decrypted = await encryptionService.decryptFields(encrypted, ['email', 'phone', 'address']);

      expect(decrypted.email).toBe(customer.email);
      expect(decrypted.phone).toBe(customer.phone);
      expect(decrypted.address).toBe(customer.address);
    });

    it('應該成功生成和哈希 API Key', () => {
      // 生成 API Key
      const apiKey = `sk_live_${EncryptionService.generateToken(24, 'base64url')}`;

      // 哈希儲存（不可逆）
      const apiKeyHash = encryptionService.hash(apiKey);

      expect(apiKey).toMatch(/^sk_live_/);
      expect(apiKeyHash).toHaveLength(64);

      // 驗證：使用相同 API Key 生成相同哈希
      const verifyHash = encryptionService.hash(apiKey);
      expect(verifyHash).toBe(apiKeyHash);
    });

    it('應該成功處理提案內容加密', async () => {
      const proposal = {
        id: 1,
        title: 'Enterprise Solution Proposal',
        content: 'Confidential proposal content with sensitive pricing information...',
        customer_notes: 'Internal notes about customer requirements',
        status: 'DRAFT',
      };

      // 加密機密內容
      const encrypted = await encryptionService.encryptFields(proposal, ['content', 'customer_notes']);

      expect(encrypted.title).toBe(proposal.title);
      expect(encrypted.content).not.toBe(proposal.content);
      expect(encrypted.customer_notes).not.toBe(proposal.customer_notes);

      // 解密
      const decrypted = await encryptionService.decryptFields(encrypted, ['content', 'customer_notes']);

      expect(decrypted.content).toBe(proposal.content);
      expect(decrypted.customer_notes).toBe(proposal.customer_notes);
    });
  });
});
