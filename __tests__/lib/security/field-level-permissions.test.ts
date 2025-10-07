/**
 * Field-Level Permissions Service Tests
 *
 * Tests for fine-grained field-level permission control
 *
 * @author Claude Code
 * @date 2025-10-07
 * @epic Sprint 3 Week 9 - Fine-Grained Permissions
 */

import {
  FieldLevelPermissionService,
  FieldSensitivityLevel,
  filterResponseFields,
} from '@/lib/security/field-level-permissions';
import { Resource, UserRole } from '@/lib/security/rbac';

describe('FieldLevelPermissionService', () => {
  describe('canAccessField', () => {
    test('ADMIN can access all sensitive fields', () => {
      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.ADMIN,
          Resource.CUSTOMERS,
          'revenue'
        )
      ).toBe(true);

      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.ADMIN,
          Resource.PROPOSALS,
          'internalCost'
        )
      ).toBe(true);

      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.ADMIN,
          Resource.USERS,
          'salary'
        )
      ).toBe(true);
    });

    test('SALES_MANAGER can access CONFIDENTIAL fields but not RESTRICTED', () => {
      // CONFIDENTIAL - should have access
      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.SALES_MANAGER,
          Resource.CUSTOMERS,
          'revenue'
        )
      ).toBe(true);

      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.SALES_MANAGER,
          Resource.PROPOSALS,
          'margin'
        )
      ).toBe(true);

      // RESTRICTED - should NOT have access
      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.SALES_MANAGER,
          Resource.CUSTOMERS,
          'creditScore'
        )
      ).toBe(false);

      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.SALES_MANAGER,
          Resource.USERS,
          'salary'
        )
      ).toBe(false);

      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.SALES_MANAGER,
          Resource.USERS,
          'performance'
        )
      ).toBe(false);
    });

    test('SALES_REP has limited access to sensitive fields', () => {
      // INTERNAL - should have access
      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.SALES_REP,
          Resource.CUSTOMERS,
          'email'
        )
      ).toBe(true);

      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.SALES_REP,
          Resource.CUSTOMER_CONTACTS,
          'phone'
        )
      ).toBe(true);

      // CONFIDENTIAL - should NOT have access
      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.SALES_REP,
          Resource.CUSTOMERS,
          'revenue'
        )
      ).toBe(false);

      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.SALES_REP,
          Resource.PROPOSALS,
          'cost'
        )
      ).toBe(false);
    });

    test('MARKETING has very limited access', () => {
      // INTERNAL fields - MARKETING does NOT have access to CUSTOMERS.email
      // (only ADMIN, SALES_MANAGER, SALES_REP can access)
      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.MARKETING,
          Resource.CUSTOMERS,
          'email'
        )
      ).toBe(false);

      // CONFIDENTIAL - NO access
      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.MARKETING,
          Resource.CUSTOMERS,
          'revenue'
        )
      ).toBe(false);

      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.MARKETING,
          Resource.PROPOSALS,
          'margin'
        )
      ).toBe(false);
    });

    test('VIEWER has minimal access to sensitive fields', () => {
      // PUBLIC fields - can access (but none configured as PUBLIC in sensitive fields)
      // INTERNAL - NO access
      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.VIEWER,
          Resource.CUSTOMERS,
          'email'
        )
      ).toBe(false);

      // CONFIDENTIAL - NO access
      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.VIEWER,
          Resource.CUSTOMERS,
          'revenue'
        )
      ).toBe(false);
    });

    test('non-sensitive fields are always accessible', () => {
      // Fields not in SENSITIVE_FIELDS config should be accessible to all
      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.VIEWER,
          Resource.CUSTOMERS,
          'name'
        )
      ).toBe(true);

      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.SALES_REP,
          Resource.PROPOSALS,
          'title'
        )
      ).toBe(true);
    });

    test('unconfigured resources allow all field access', () => {
      // Resources not in SENSITIVE_FIELDS config should allow all access
      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.VIEWER,
          Resource.TEMPLATES,
          'anyField'
        )
      ).toBe(true);

      expect(
        FieldLevelPermissionService.canAccessField(
          UserRole.SALES_REP,
          Resource.KNOWLEDGE_BASE,
          'content'
        )
      ).toBe(true);
    });
  });

  describe('filterFields', () => {
    test('ADMIN sees all fields', () => {
      const customer = {
        id: 1,
        name: 'Test Corp',
        email: 'test@example.com',
        phone: '+1234567890',
        revenue: 1000000,
        creditScore: 750,
        internalNotes: 'VIP customer',
        paymentTerms: 'Net 30',
      };

      const filtered = FieldLevelPermissionService.filterFields(
        UserRole.ADMIN,
        Resource.CUSTOMERS,
        customer
      );

      expect(filtered).toEqual(customer);
      expect(Object.keys(filtered)).toHaveLength(8);
    });

    test('SALES_MANAGER sees most fields but not RESTRICTED ones', () => {
      const customer = {
        id: 1,
        name: 'Test Corp',
        email: 'test@example.com',
        phone: '+1234567890',
        revenue: 1000000,
        creditScore: 750,
        internalNotes: 'VIP customer',
        paymentTerms: 'Net 30',
      };

      const filtered = FieldLevelPermissionService.filterFields(
        UserRole.SALES_MANAGER,
        Resource.CUSTOMERS,
        customer
      );

      // Should have INTERNAL and CONFIDENTIAL fields
      expect(filtered.revenue).toBe(1000000);
      expect(filtered.email).toBe('test@example.com');
      expect(filtered.phone).toBe('+1234567890');
      expect(filtered.internalNotes).toBe('VIP customer');
      expect(filtered.paymentTerms).toBe('Net 30');

      // RESTRICTED field should be removed
      expect(filtered.creditScore).toBeUndefined();

      // Should have 7 fields (8 - 1 RESTRICTED)
      expect(Object.keys(filtered)).toHaveLength(7);
    });

    test('SALES_REP has restricted fields filtered out', () => {
      const customer = {
        id: 1,
        name: 'Test Corp',
        email: 'test@example.com',
        phone: '+1234567890',
        revenue: 1000000,
        creditScore: 750,
        internalNotes: 'VIP customer',
        paymentTerms: 'Net 30',
      };

      const filtered = FieldLevelPermissionService.filterFields(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        customer
      );

      // Should have INTERNAL fields but not CONFIDENTIAL
      expect(filtered.id).toBe(1);
      expect(filtered.name).toBe('Test Corp');
      expect(filtered.email).toBe('test@example.com');
      expect(filtered.phone).toBe('+1234567890');

      // CONFIDENTIAL fields should be removed
      expect(filtered.revenue).toBeUndefined();
      expect(filtered.creditScore).toBeUndefined();
      expect(filtered.internalNotes).toBeUndefined();
      expect(filtered.paymentTerms).toBeUndefined();
    });

    test('VIEWER has most sensitive fields filtered out', () => {
      const customer = {
        id: 1,
        name: 'Test Corp',
        email: 'test@example.com',
        phone: '+1234567890',
        revenue: 1000000,
        creditScore: 750,
      };

      const filtered = FieldLevelPermissionService.filterFields(
        UserRole.VIEWER,
        Resource.CUSTOMERS,
        customer
      );

      // Should only have non-sensitive fields
      expect(filtered.id).toBe(1);
      expect(filtered.name).toBe('Test Corp');

      // All sensitive fields should be removed
      expect(filtered.email).toBeUndefined();
      expect(filtered.phone).toBeUndefined();
      expect(filtered.revenue).toBeUndefined();
      expect(filtered.creditScore).toBeUndefined();
    });

    test('handles null and undefined data gracefully', () => {
      expect(
        FieldLevelPermissionService.filterFields(
          UserRole.ADMIN,
          Resource.CUSTOMERS,
          null as any
        )
      ).toEqual({});

      expect(
        FieldLevelPermissionService.filterFields(
          UserRole.ADMIN,
          Resource.CUSTOMERS,
          undefined as any
        )
      ).toEqual({});
    });

    test('filters proposal fields correctly', () => {
      const proposal = {
        id: 1,
        title: 'Enterprise Deal',
        cost: 50000,
        margin: 0.35,
        discount: 0.10,
        approvalNotes: 'Approved by CEO',
        internalCost: 32500,
      };

      // SALES_REP should see INTERNAL fields but not CONFIDENTIAL/RESTRICTED
      const filtered = FieldLevelPermissionService.filterFields(
        UserRole.SALES_REP,
        Resource.PROPOSALS,
        proposal
      );

      expect(filtered.id).toBe(1);
      expect(filtered.title).toBe('Enterprise Deal');

      // approvalNotes is INTERNAL - SALES_REP can see it
      expect(filtered.approvalNotes).toBe('Approved by CEO');

      // CONFIDENTIAL fields should be removed
      expect(filtered.cost).toBeUndefined();
      expect(filtered.margin).toBeUndefined();
      expect(filtered.discount).toBeUndefined();

      // RESTRICTED field should be removed
      expect(filtered.internalCost).toBeUndefined();
    });
  });

  describe('filterFieldsArray', () => {
    test('filters array of objects correctly', () => {
      const customers = [
        {
          id: 1,
          name: 'Corp A',
          email: 'a@example.com',
          revenue: 1000000,
        },
        {
          id: 2,
          name: 'Corp B',
          email: 'b@example.com',
          revenue: 2000000,
        },
      ];

      const filtered = FieldLevelPermissionService.filterFieldsArray(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        customers
      );

      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe(1);
      expect(filtered[0].name).toBe('Corp A');
      expect(filtered[0].email).toBe('a@example.com');
      expect(filtered[0].revenue).toBeUndefined();

      expect(filtered[1].id).toBe(2);
      expect(filtered[1].name).toBe('Corp B');
      expect(filtered[1].email).toBe('b@example.com');
      expect(filtered[1].revenue).toBeUndefined();
    });

    test('handles empty arrays', () => {
      const filtered = FieldLevelPermissionService.filterFieldsArray(
        UserRole.ADMIN,
        Resource.CUSTOMERS,
        []
      );

      expect(filtered).toEqual([]);
    });

    test('handles null/undefined arrays', () => {
      expect(
        FieldLevelPermissionService.filterFieldsArray(
          UserRole.ADMIN,
          Resource.CUSTOMERS,
          null as any
        )
      ).toEqual([]);

      expect(
        FieldLevelPermissionService.filterFieldsArray(
          UserRole.ADMIN,
          Resource.CUSTOMERS,
          undefined as any
        )
      ).toEqual([]);
    });
  });

  describe('getAccessibleFields', () => {
    test('ADMIN gets all fields including sensitive ones', () => {
      const fields = FieldLevelPermissionService.getAccessibleFields(
        UserRole.ADMIN,
        Resource.CUSTOMERS
      );

      // Should include all sensitive fields
      expect(fields).toContain('email');
      expect(fields).toContain('phone');
      expect(fields).toContain('revenue');
      expect(fields).toContain('creditScore');
      expect(fields).toContain('internalNotes');
      expect(fields).toContain('paymentTerms');
    });

    test('SALES_REP gets limited fields', () => {
      const fields = FieldLevelPermissionService.getAccessibleFields(
        UserRole.SALES_REP,
        Resource.CUSTOMERS
      );

      // Should include INTERNAL fields
      expect(fields).toContain('email');
      expect(fields).toContain('phone');

      // Should NOT include CONFIDENTIAL fields
      expect(fields).not.toContain('revenue');
      expect(fields).not.toContain('creditScore');
      expect(fields).not.toContain('internalNotes');
      expect(fields).not.toContain('paymentTerms');
    });

    test('returns empty array for unconfigured resources', () => {
      const fields = FieldLevelPermissionService.getAccessibleFields(
        UserRole.VIEWER,
        Resource.TEMPLATES
      );

      expect(fields).toEqual([]);
    });
  });

  describe('getRestrictedFields', () => {
    test('ADMIN has no restricted fields', () => {
      const fields = FieldLevelPermissionService.getRestrictedFields(
        UserRole.ADMIN,
        Resource.CUSTOMERS
      );

      expect(fields).toEqual([]);
    });

    test('SALES_REP has CONFIDENTIAL fields restricted', () => {
      const fields = FieldLevelPermissionService.getRestrictedFields(
        UserRole.SALES_REP,
        Resource.CUSTOMERS
      );

      expect(fields).toContain('revenue');
      expect(fields).toContain('creditScore');
      expect(fields).toContain('internalNotes');
      expect(fields).toContain('paymentTerms');

      expect(fields).not.toContain('email');
      expect(fields).not.toContain('phone');
    });

    test('VIEWER has most fields restricted', () => {
      const fields = FieldLevelPermissionService.getRestrictedFields(
        UserRole.VIEWER,
        Resource.CUSTOMERS
      );

      // All sensitive fields should be restricted
      expect(fields.length).toBeGreaterThan(0);
      expect(fields).toContain('email');
      expect(fields).toContain('phone');
      expect(fields).toContain('revenue');
      expect(fields).toContain('creditScore');
    });
  });

  describe('getResourceFieldConfig', () => {
    test('returns config for configured resources', () => {
      const config = FieldLevelPermissionService.getResourceFieldConfig(
        Resource.CUSTOMERS
      );

      expect(config).toBeDefined();
      expect(config?.resource).toBe(Resource.CUSTOMERS);
      expect(config?.fields.length).toBeGreaterThan(0);
    });

    test('returns undefined for unconfigured resources', () => {
      const config = FieldLevelPermissionService.getResourceFieldConfig(
        Resource.TEMPLATES
      );

      expect(config).toBeUndefined();
    });
  });

  describe('getFieldSensitivity', () => {
    test('returns correct sensitivity levels', () => {
      expect(
        FieldLevelPermissionService.getFieldSensitivity(
          Resource.CUSTOMERS,
          'revenue'
        )
      ).toBe(FieldSensitivityLevel.CONFIDENTIAL);

      expect(
        FieldLevelPermissionService.getFieldSensitivity(
          Resource.CUSTOMERS,
          'email'
        )
      ).toBe(FieldSensitivityLevel.INTERNAL);

      expect(
        FieldLevelPermissionService.getFieldSensitivity(
          Resource.USERS,
          'salary'
        )
      ).toBe(FieldSensitivityLevel.RESTRICTED);
    });

    test('returns PUBLIC for non-sensitive fields', () => {
      expect(
        FieldLevelPermissionService.getFieldSensitivity(
          Resource.CUSTOMERS,
          'name'
        )
      ).toBe(FieldSensitivityLevel.PUBLIC);

      expect(
        FieldLevelPermissionService.getFieldSensitivity(
          Resource.CUSTOMERS,
          'id'
        )
      ).toBe(FieldSensitivityLevel.PUBLIC);
    });

    test('returns PUBLIC for unconfigured resources', () => {
      expect(
        FieldLevelPermissionService.getFieldSensitivity(
          Resource.TEMPLATES,
          'anyField'
        )
      ).toBe(FieldSensitivityLevel.PUBLIC);
    });
  });

  describe('isSensitiveField', () => {
    test('correctly identifies sensitive fields', () => {
      expect(
        FieldLevelPermissionService.isSensitiveField(
          Resource.CUSTOMERS,
          'revenue'
        )
      ).toBe(true);

      expect(
        FieldLevelPermissionService.isSensitiveField(
          Resource.CUSTOMERS,
          'email'
        )
      ).toBe(true);

      expect(
        FieldLevelPermissionService.isSensitiveField(
          Resource.PROPOSALS,
          'margin'
        )
      ).toBe(true);
    });

    test('correctly identifies non-sensitive fields', () => {
      expect(
        FieldLevelPermissionService.isSensitiveField(
          Resource.CUSTOMERS,
          'name'
        )
      ).toBe(false);

      expect(
        FieldLevelPermissionService.isSensitiveField(
          Resource.CUSTOMERS,
          'id'
        )
      ).toBe(false);
    });

    test('returns false for unconfigured resources', () => {
      expect(
        FieldLevelPermissionService.isSensitiveField(
          Resource.TEMPLATES,
          'anyField'
        )
      ).toBe(false);
    });
  });

  describe('filterResponseFields helper', () => {
    test('filters single object', () => {
      const data = {
        id: 1,
        name: 'Test',
        revenue: 1000000,
      };

      const filtered = filterResponseFields(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        data
      );

      expect(filtered.id).toBe(1);
      expect(filtered.name).toBe('Test');
      expect(filtered.revenue).toBeUndefined();
    });

    test('filters array of objects', () => {
      const data = [
        { id: 1, name: 'Test A', revenue: 1000000 },
        { id: 2, name: 'Test B', revenue: 2000000 },
      ];

      const filtered = filterResponseFields(
        UserRole.SALES_REP,
        Resource.CUSTOMERS,
        data
      );

      expect(filtered).toHaveLength(2);
      expect(filtered[0].revenue).toBeUndefined();
      expect(filtered[1].revenue).toBeUndefined();
    });

    test('handles primitive values', () => {
      expect(
        filterResponseFields(UserRole.ADMIN, Resource.CUSTOMERS, 'string')
      ).toBe('string');

      expect(
        filterResponseFields(UserRole.ADMIN, Resource.CUSTOMERS, 123)
      ).toBe(123);

      expect(
        filterResponseFields(UserRole.ADMIN, Resource.CUSTOMERS, null)
      ).toBe(null);
    });
  });
});
