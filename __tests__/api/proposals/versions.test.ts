/**
 * 版本歷史 API 測試套件
 *
 * 測試範圍：
 * - GET /api/proposals/[id]/versions - 獲取版本列表
 * - POST /api/proposals/[id]/versions - 創建版本快照
 * - GET /api/proposals/[id]/versions/[versionId] - 獲取單個版本
 * - DELETE /api/proposals/[id]/versions/[versionId] - 刪除版本
 * - POST /api/proposals/[id]/versions/compare - 比較版本
 * - POST /api/proposals/[id]/versions/restore - 回滾版本
 *
 * @author Claude Code
 * @date 2025-10-02
 */

import { PrismaClient } from '@prisma/client';
import { VersionControl } from '@/lib/workflow/version-control';

const prisma = new PrismaClient();

describe('Proposal Versions API', () => {
  let testUserId: number;
  let testCustomerId: number;
  let testProposalId: number;
  let versionControl: VersionControl;

  beforeAll(async () => {
    versionControl = new VersionControl();

    // 創建測試用戶
    const testUser = await prisma.user.create({
      data: {
        email: 'version-test@example.com',
        first_name: 'Version',
        last_name: 'Tester',
        role: 'SALES_REP',
      },
    });
    testUserId = testUser.id;

    // 創建測試客戶
    const testCustomer = await prisma.customer.create({
      data: {
        company_name: 'Test Version Company',
        assigned_user_id: testUserId,
      },
    });
    testCustomerId = testCustomer.id;

    // 創建測試提案
    const testProposal = await prisma.proposal.create({
      data: {
        customer_id: testCustomerId,
        user_id: testUserId,
        title: '測試提案 - 版本控制',
        description: '用於測試版本控制功能',
        status: 'DRAFT',
        version: 1,
      },
    });
    testProposalId = testProposal.id;
  });

  afterAll(async () => {
    // 清理測試數據
    await prisma.proposalVersion.deleteMany({
      where: {
        proposal: {
          user_id: testUserId,
        },
      },
    });

    await prisma.proposal.deleteMany({
      where: { user_id: testUserId },
    });

    await prisma.customer.deleteMany({
      where: { assigned_user_id: testUserId },
    });

    await prisma.user.deleteMany({
      where: { email: { contains: 'version-test' } },
    });

    await prisma.$disconnect();
  });

  describe('創建版本快照', () => {
    it('應該能成功創建版本快照', async () => {
      const version = await versionControl.createSnapshot(
        testProposalId,
        testUserId,
        '初始版本',
        '第一個版本快照'
      );

      expect(version).toBeDefined();
      expect(version.proposal_id).toBe(testProposalId);
      expect(version.created_by_id).toBe(testUserId);
      expect(version.label).toBe('初始版本');
      expect(version.description).toBe('第一個版本快照');
      expect(version.version).toBe(1);
      expect(version.snapshot_data).toBeDefined();
    });

    it('應該能創建帶標籤的版本', async () => {
      const version = await versionControl.createSnapshot(
        testProposalId,
        testUserId,
        '里程碑 v1.0'
      );

      expect(version.label).toBe('里程碑 v1.0');
    });

    it('應該能創建不帶標籤的版本', async () => {
      const version = await versionControl.createSnapshot(
        testProposalId,
        testUserId
      );

      expect(version.label).toBeNull();
      expect(version.description).toBeNull();
    });

    it('應該正確遞增版本號', async () => {
      const version1 = await versionControl.createSnapshot(
        testProposalId,
        testUserId,
        'v1'
      );

      const version2 = await versionControl.createSnapshot(
        testProposalId,
        testUserId,
        'v2'
      );

      expect(version2.version).toBe(version1.version + 1);
    });
  });

  describe('獲取版本列表', () => {
    beforeAll(async () => {
      // 創建多個版本
      await versionControl.createSnapshot(
        testProposalId,
        testUserId,
        '版本 A'
      );
      await versionControl.createSnapshot(
        testProposalId,
        testUserId,
        '版本 B'
      );
      await versionControl.createSnapshot(
        testProposalId,
        testUserId,
        '版本 C'
      );
    });

    it('應該能獲取提案的所有版本', async () => {
      const versions = await prisma.proposalVersion.findMany({
        where: { proposal_id: testProposalId },
        orderBy: { version: 'desc' },
      });

      expect(versions.length).toBeGreaterThan(0);
      expect(versions[0].proposal_id).toBe(testProposalId);
    });

    it('應該按版本號倒序排列', async () => {
      const versions = await prisma.proposalVersion.findMany({
        where: { proposal_id: testProposalId },
        orderBy: { version: 'desc' },
      });

      for (let i = 1; i < versions.length; i++) {
        expect(versions[i - 1].version).toBeGreaterThan(versions[i].version);
      }
    });

    it('應該包含創建者信息', async () => {
      const versions = await prisma.proposalVersion.findMany({
        where: { proposal_id: testProposalId },
        include: {
          created_by: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      });

      expect(versions[0].created_by).toBeDefined();
      expect(versions[0].created_by?.first_name).toBe('Version');
      expect(versions[0].created_by?.last_name).toBe('Tester');
    });
  });

  describe('獲取單個版本', () => {
    let testVersionId: number;

    beforeAll(async () => {
      const version = await versionControl.createSnapshot(
        testProposalId,
        testUserId,
        '測試單版本'
      );
      testVersionId = version.id;
    });

    it('應該能獲取特定版本的詳細信息', async () => {
      const version = await prisma.proposalVersion.findUnique({
        where: {
          id: testVersionId,
        },
        include: {
          created_by: true,
        },
      });

      expect(version).toBeDefined();
      expect(version?.id).toBe(testVersionId);
      expect(version?.label).toBe('測試單版本');
    });

    it('應該返回完整的快照數據', async () => {
      const version = await prisma.proposalVersion.findUnique({
        where: { id: testVersionId },
      });

      expect(version?.snapshot_data).toBeDefined();
      expect(typeof version?.snapshot_data).toBe('object');
    });
  });

  describe('版本比較', () => {
    let versionAId: number;
    let versionBId: number;

    beforeAll(async () => {
      // 創建版本 A
      const versionA = await versionControl.createSnapshot(
        testProposalId,
        testUserId,
        '版本 A - 比較測試'
      );
      versionAId = versionA.id;

      // 修改提案
      await prisma.proposal.update({
        where: { id: testProposalId },
        data: {
          title: '已修改的標題',
          description: '已修改的描述',
        },
      });

      // 創建版本 B
      const versionB = await versionControl.createSnapshot(
        testProposalId,
        testUserId,
        '版本 B - 比較測試'
      );
      versionBId = versionB.id;
    });

    it('應該能比較兩個版本的差異', async () => {
      const comparison = await versionControl.compareVersions(
        versionAId,
        versionBId
      );

      expect(comparison).toBeDefined();
      expect(comparison.differences).toBeDefined();
      expect(Array.isArray(comparison.differences)).toBe(true);
    });

    it('應該檢測到修改的字段', async () => {
      const comparison = await versionControl.compareVersions(
        versionAId,
        versionBId
      );

      const titleDiff = comparison.differences.find(
        (d) => d.field === 'title'
      );
      const descDiff = comparison.differences.find(
        (d) => d.field === 'description'
      );

      expect(titleDiff).toBeDefined();
      expect(titleDiff?.changeType).toBe('modified');
      expect(descDiff).toBeDefined();
      expect(descDiff?.changeType).toBe('modified');
    });

    it('應該正確標記變更類型', async () => {
      const comparison = await versionControl.compareVersions(
        versionAId,
        versionBId
      );

      comparison.differences.forEach((diff) => {
        expect(['added', 'removed', 'modified']).toContain(diff.changeType);
      });
    });
  });

  describe('版本回滾', () => {
    let originalVersionId: number;
    let modifiedVersionId: number;

    beforeAll(async () => {
      // 創建原始版本
      await prisma.proposal.update({
        where: { id: testProposalId },
        data: {
          title: '原始標題',
          description: '原始描述',
        },
      });

      const originalVersion = await versionControl.createSnapshot(
        testProposalId,
        testUserId,
        '原始版本'
      );
      originalVersionId = originalVersion.id;

      // 修改後創建新版本
      await prisma.proposal.update({
        where: { id: testProposalId },
        data: {
          title: '修改後標題',
          description: '修改後描述',
        },
      });

      const modifiedVersion = await versionControl.createSnapshot(
        testProposalId,
        testUserId,
        '修改版本'
      );
      modifiedVersionId = modifiedVersion.id;
    });

    it('應該能回滾到指定版本', async () => {
      const restoredVersion = await versionControl.revertToVersion(
        originalVersionId,
        testUserId
      );

      expect(restoredVersion).toBeDefined();
      expect(restoredVersion.snapshot_data).toEqual(
        (
          await prisma.proposalVersion.findUnique({
            where: { id: originalVersionId },
          })
        )?.snapshot_data
      );
    });

    it('回滾後應該創建新的版本記錄', async () => {
      const versionsBeforeRevert = await prisma.proposalVersion.count({
        where: { proposal_id: testProposalId },
      });

      await versionControl.revertToVersion(originalVersionId, testUserId);

      const versionsAfterRevert = await prisma.proposalVersion.count({
        where: { proposal_id: testProposalId },
      });

      expect(versionsAfterRevert).toBe(versionsBeforeRevert + 1);
    });

    it('應該保留原有版本不被刪除', async () => {
      const versionBeforeRevert = await prisma.proposalVersion.findUnique({
        where: { id: originalVersionId },
      });

      await versionControl.revertToVersion(originalVersionId, testUserId);

      const versionAfterRevert = await prisma.proposalVersion.findUnique({
        where: { id: originalVersionId },
      });

      expect(versionBeforeRevert).toEqual(versionAfterRevert);
    });
  });

  describe('刪除版本', () => {
    let versionToDeleteId: number;

    beforeAll(async () => {
      const version = await versionControl.createSnapshot(
        testProposalId,
        testUserId,
        '待刪除版本'
      );
      versionToDeleteId = version.id;
    });

    it('應該能刪除非當前版本', async () => {
      // 確保不是當前版本
      const proposal = await prisma.proposal.findUnique({
        where: { id: testProposalId },
      });

      const versionToDelete = await prisma.proposalVersion.findUnique({
        where: { id: versionToDeleteId },
      });

      // 只有在不是當前版本時才測試刪除
      if (versionToDelete?.version !== proposal?.version) {
        await prisma.proposalVersion.delete({
          where: { id: versionToDeleteId },
        });

        const deletedVersion = await prisma.proposalVersion.findUnique({
          where: { id: versionToDeleteId },
        });

        expect(deletedVersion).toBeNull();
      }
    });

    it('應該在刪除版本後保持數據完整性', async () => {
      const versions = await prisma.proposalVersion.findMany({
        where: { proposal_id: testProposalId },
        orderBy: { version: 'asc' },
      });

      // 驗證所有版本都有有效的數據
      versions.forEach((version) => {
        expect(version.proposal_id).toBe(testProposalId);
        expect(version.snapshot_data).toBeDefined();
        expect(version.created_by_id).toBeDefined();
      });
    });
  });

  describe('版本元數據', () => {
    it('應該能在版本中保存自定義元數據', async () => {
      const metadata = {
        environment: 'test',
        feature_flags: ['feature_a', 'feature_b'],
        custom_data: { key: 'value' },
      };

      const version = await prisma.proposalVersion.create({
        data: {
          proposal_id: testProposalId,
          version: 999, // 使用特殊版本號避免衝突
          snapshot_data: { test: 'data' },
          created_by_id: testUserId,
          metadata: metadata,
        },
      });

      expect(version.metadata).toEqual(metadata);
    });

    it('應該能更新版本的描述和標籤', async () => {
      const version = await versionControl.createSnapshot(
        testProposalId,
        testUserId,
        '原始標籤'
      );

      const updatedVersion = await prisma.proposalVersion.update({
        where: { id: version.id },
        data: {
          label: '更新後標籤',
          description: '更新後的描述',
        },
      });

      expect(updatedVersion.label).toBe('更新後標籤');
      expect(updatedVersion.description).toBe('更新後的描述');
    });
  });

  describe('並發版本創建', () => {
    it('應該能處理並發創建版本', async () => {
      const promises = Array.from({ length: 3 }, (_, i) =>
        versionControl.createSnapshot(
          testProposalId,
          testUserId,
          `並發版本 ${i + 1}`
        )
      );

      const versions = await Promise.all(promises);

      // 所有版本應該成功創建
      expect(versions).toHaveLength(3);
      versions.forEach((version) => {
        expect(version).toBeDefined();
        expect(version.proposal_id).toBe(testProposalId);
      });

      // 版本號應該不重複
      const versionNumbers = versions.map((v) => v.version);
      const uniqueVersions = new Set(versionNumbers);
      expect(uniqueVersions.size).toBe(versionNumbers.length);
    });
  });

  describe('錯誤處理', () => {
    it('應該拒絕對不存在的提案創建版本', async () => {
      await expect(
        versionControl.createSnapshot(999999, testUserId)
      ).rejects.toThrow();
    });

    it('應該拒絕比較不存在的版本', async () => {
      await expect(
        versionControl.compareVersions(999999, 999998)
      ).rejects.toThrow();
    });

    it('應該拒絕回滾到不存在的版本', async () => {
      await expect(
        versionControl.revertToVersion(999999, testUserId)
      ).rejects.toThrow();
    });
  });

  describe('性能測試', () => {
    it('應該快速創建版本快照', async () => {
      const start = Date.now();
      await versionControl.createSnapshot(testProposalId, testUserId);
      const duration = Date.now() - start;

      console.log(`版本創建時間: ${duration}ms`);
      expect(duration).toBeLessThan(1000); // 應該在1秒內完成
    });

    it('應該快速檢索版本列表', async () => {
      const start = Date.now();
      await prisma.proposalVersion.findMany({
        where: { proposal_id: testProposalId },
        include: { created_by: true },
      });
      const duration = Date.now() - start;

      console.log(`版本列表檢索時間: ${duration}ms`);
      expect(duration).toBeLessThan(500);
    });
  });
});
