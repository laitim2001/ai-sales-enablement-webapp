/**
 * @fileoverview Dynamics 365 模擬 API 端點功能：- 模擬所有 Dynamics 365 CRM API 端點- 提供測試數據以支持開發和測試- 支持基本的 CRUD 操作作者：Claude Code創建時間：2025-09-28
 * @module app/api/mock/dynamics365/[...path]/route
 * @description
 * Dynamics 365 模擬 API 端點功能：- 模擬所有 Dynamics 365 CRM API 端點- 提供測試數據以支持開發和測試- 支持基本的 CRUD 操作作者：Claude Code創建時間：2025-09-28
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';

// 模擬數據
const mockData = {
  accounts: [
    {
      accountid: '00000000-0000-0000-0000-000000000001',
      name: 'Contoso Corporation',
      telephone1: '+1-425-555-0100',
      emailaddress1: 'info@contoso.com',
      websiteurl: 'https://www.contoso.com',
      address1_city: 'Seattle',
      address1_country: 'USA',
      revenue: 1000000,
      numberofemployees: 500,
      industrycode: 'Technology',
      createdon: '2023-01-01T00:00:00Z',
      modifiedon: '2024-01-01T00:00:00Z'
    },
    {
      accountid: '00000000-0000-0000-0000-000000000002',
      name: 'Fabrikam Inc.',
      telephone1: '+1-425-555-0200',
      emailaddress1: 'contact@fabrikam.com',
      websiteurl: 'https://www.fabrikam.com',
      address1_city: 'Redmond',
      address1_country: 'USA',
      revenue: 2000000,
      numberofemployees: 800,
      industrycode: 'Manufacturing',
      createdon: '2023-02-01T00:00:00Z',
      modifiedon: '2024-02-01T00:00:00Z'
    }
  ],
  contacts: [
    {
      contactid: '00000000-0000-0000-0000-000000000011',
      firstname: 'John',
      lastname: 'Doe',
      emailaddress1: 'john.doe@contoso.com',
      telephone1: '+1-425-555-0101',
      jobtitle: 'CEO',
      parentcustomerid: '00000000-0000-0000-0000-000000000001',
      createdon: '2023-01-15T00:00:00Z',
      modifiedon: '2024-01-15T00:00:00Z'
    },
    {
      contactid: '00000000-0000-0000-0000-000000000012',
      firstname: 'Jane',
      lastname: 'Smith',
      emailaddress1: 'jane.smith@fabrikam.com',
      telephone1: '+1-425-555-0201',
      jobtitle: 'CTO',
      parentcustomerid: '00000000-0000-0000-0000-000000000002',
      createdon: '2023-02-15T00:00:00Z',
      modifiedon: '2024-02-15T00:00:00Z'
    }
  ],
  opportunities: [
    {
      opportunityid: '00000000-0000-0000-0000-000000000021',
      name: 'Contoso Digital Transformation',
      estimatedvalue: 500000,
      estimatedclosedate: '2024-12-31T00:00:00Z',
      closeprobability: 75,
      statuscode: 1,
      parentaccountid: '00000000-0000-0000-0000-000000000001',
      description: 'Complete digital transformation initiative',
      createdon: '2024-01-01T00:00:00Z',
      modifiedon: '2024-09-01T00:00:00Z'
    }
  ]
};

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path || [];
    const entityName = path[0];

    console.log(`🎭 [D365 Mock] GET /${path.join('/')}`);

    // 處理健康檢查
    if (path.length === 0 || entityName === 'health') {
      return NextResponse.json({
        status: 'healthy',
        service: 'Dynamics 365 Mock',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }

    // 處理元數據端點
    if (entityName === '$metadata') {
      return NextResponse.json({
        '@odata.context': 'https://mock.dynamics.com/api/data/v9.2/$metadata',
        '@odata.type': '#Microsoft.Dynamics.CRM.ServiceDocument',
        value: [
          {
            name: 'accounts',
            kind: 'EntitySet',
            url: 'accounts'
          },
          {
            name: 'contacts',
            kind: 'EntitySet',
            url: 'contacts'
          },
          {
            name: 'opportunities',
            kind: 'EntitySet',
            url: 'opportunities'
          }
        ]
      });
    }

    // 處理特定實體查詢
    if (entityName && mockData[entityName as keyof typeof mockData]) {
      const data = mockData[entityName as keyof typeof mockData];

      // 模擬 OData 響應格式
      return NextResponse.json({
        '@odata.context': `https://mock.dynamics.com/api/data/v9.2/$metadata#${entityName}`,
        value: data
      });
    }

    // 處理測試連接端點
    if (entityName === 'accounts' && path.length === 1) {
      return NextResponse.json({
        '@odata.context': 'https://mock.dynamics.com/api/data/v9.2/$metadata#accounts',
        value: mockData.accounts
      });
    }

    // 未找到的端點
    return NextResponse.json(
      {
        error: {
          code: 'NotFound',
          message: `Entity '${entityName}' not found in mock data`
        }
      },
      { status: 404 }
    );

  } catch (error) {
    console.error('🎭 [D365 Mock] Error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'InternalServerError',
          message: 'Mock service internal error'
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path || [];
    const entityName = path[0];
    const body = await request.json();

    console.log(`🎭 [D365 Mock] POST /${path.join('/')}`, body);

    // 模擬創建操作
    if (entityName && mockData[entityName as keyof typeof mockData]) {
      const newId = '00000000-0000-0000-0000-' + Date.now().toString().padStart(12, '0');
      const newRecord = {
        [`${entityName.slice(0, -1)}id`]: newId,
        ...body,
        createdon: new Date().toISOString(),
        modifiedon: new Date().toISOString()
      };

      // 將新記錄添加到模擬數據（僅在內存中）
      mockData[entityName as keyof typeof mockData].push(newRecord as any);

      return NextResponse.json(newRecord, { status: 201 });
    }

    return NextResponse.json(
      {
        error: {
          code: 'BadRequest',
          message: `Cannot create entity '${entityName}'`
        }
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('🎭 [D365 Mock] POST Error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'InternalServerError',
          message: 'Mock service internal error'
        }
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path || [];
    const body = await request.json();

    console.log(`🎭 [D365 Mock] PUT /${path.join('/')}`, body);

    // 模擬更新操作
    return NextResponse.json({
      message: 'Update successful (mock)',
      path: path.join('/'),
      modifiedon: new Date().toISOString()
    });

  } catch (error) {
    console.error('🎭 [D365 Mock] PUT Error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'InternalServerError',
          message: 'Mock service internal error'
        }
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path || [];

    console.log(`🎭 [D365 Mock] DELETE /${path.join('/')}`);

    // 模擬刪除操作
    return NextResponse.json({
      message: 'Delete successful (mock)',
      path: path.join('/'),
      deletedon: new Date().toISOString()
    });

  } catch (error) {
    console.error('🎭 [D365 Mock] DELETE Error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'InternalServerError',
          message: 'Mock service internal error'
        }
      },
      { status: 500 }
    );
  }
}