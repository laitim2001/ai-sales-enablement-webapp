/**
 * @fileoverview 提案範本測試 API 路由功能：- 測試範本編譯和渲染- 驗證變數完整性- 預覽範本生成效果- 範本語法檢查作者：Claude Code創建時間：2025-09-28
 * @module app/api/proposal-templates/[id]/test/route
 * @description
 * 提案範本測試 API 路由功能：- 測試範本編譯和渲染- 驗證變數完整性- 預覽範本生成效果- 範本語法檢查作者：Claude Code創建時間：2025-09-28
 *
 * @created 2025-10-08
 * @lastModified 2025-10-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getProposalGenerationService } from '@/lib/ai/proposal-generation-service';

const prisma = new PrismaClient();
const proposalService = getProposalGenerationService();

/**
 * 測試範本渲染
 *
 * @param request HTTP請求對象
 * @param params 路由參數
 * @returns JSON格式的測試結果
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const templateId = params.id;
    const { variables } = await request.json();

    // 檢查範本是否存在
    const template = await prisma.proposalTemplate.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        name: true,
        content: true,
        variables: true,
        is_active: true
      }
    });

    if (!template) {
      return NextResponse.json({
        success: false,
        error: 'TEMPLATE_NOT_FOUND',
        message: '範本不存在'
      }, { status: 404 });
    }

    if (!template.is_active) {
      return NextResponse.json({
        success: false,
        error: 'TEMPLATE_INACTIVE',
        message: '範本已停用，無法測試'
      }, { status: 400 });
    }

    // 驗證提供的變數
    const templateVariables = template.variables as Record<string, any>;
    const providedVariables = variables || {};

    // 檢查必填變數
    const validationResult = validateVariables(templateVariables, providedVariables);

    if (!validationResult.isValid) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: '變數驗證失敗',
        data: {
          missingRequired: validationResult.missingRequired,
          invalidTypes: validationResult.invalidTypes
        }
      }, { status: 400 });
    }

    // 測試範本編譯
    try {
      const compiledContent = await proposalService.testTemplate(templateId, providedVariables);

      // 分析編譯結果
      const analysis = analyzeCompiledContent(compiledContent, templateVariables, providedVariables);

      return NextResponse.json({
        success: true,
        data: {
          content: compiledContent,
          analysis: {
            totalCharacters: compiledContent.length,
            totalWords: compiledContent.split(/\s+/).filter(word => word.length > 0).length,
            totalParagraphs: compiledContent.split(/\n\s*\n/).length,
            variablesUsed: analysis.variablesUsed,
            missingVariables: analysis.missingVariables,
            unusedVariables: analysis.unusedVariables
          },
          validation: {
            syntaxValid: true,
            allRequiredFilled: validationResult.isValid,
            variableCount: Object.keys(providedVariables).length,
            templateVariableCount: Object.keys(templateVariables).length
          }
        },
        message: '範本測試成功',
        timestamp: new Date().toISOString()
      });

    } catch (compileError: any) {
      return NextResponse.json({
        success: false,
        error: 'COMPILATION_ERROR',
        message: '範本編譯失敗',
        data: {
          error: compileError.message,
          content: template.content.substring(0, 500) + '...' // 返回部分內容用於調試
        }
      }, { status: 422 });
    }

  } catch (error: any) {
    console.error('範本測試失敗:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '範本測試時發生錯誤',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * 驗證變數完整性和類型
 *
 * @param templateVariables 範本變數定義
 * @param providedVariables 提供的變數值
 * @returns 驗證結果
 */
function validateVariables(
  templateVariables: Record<string, any>,
  providedVariables: Record<string, any>
): {
  isValid: boolean;
  missingRequired: string[];
  invalidTypes: Array<{ name: string; expected: string; actual: string }>;
} {
  const missingRequired: string[] = [];
  const invalidTypes: Array<{ name: string; expected: string; actual: string }> = [];

  // 檢查必填變數
  for (const [varName, varDef] of Object.entries(templateVariables)) {
    if (varDef.required) {
      const value = providedVariables[varName];
      if (value === undefined || value === null || value === '') {
        missingRequired.push(varName);
      }
    }

    // 檢查變數類型（如果提供了值）
    const value = providedVariables[varName];
    if (value !== undefined && value !== null && value !== '') {
      const expectedType = varDef.type;
      const actualType = getVariableType(value);

      if (!isTypeCompatible(expectedType, actualType, value)) {
        invalidTypes.push({
          name: varName,
          expected: expectedType,
          actual: actualType
        });
      }
    }
  }

  return {
    isValid: missingRequired.length === 0 && invalidTypes.length === 0,
    missingRequired,
    invalidTypes
  };
}

/**
 * 獲取變數的實際類型
 *
 * @param value 變數值
 * @returns 類型字符串
 */
function getVariableType(value: any): string {
  if (typeof value === 'string') return 'text';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date) return 'date';
  if (Array.isArray(value)) return 'array';
  return 'unknown';
}

/**
 * 檢查類型兼容性
 *
 * @param expectedType 期望類型
 * @param actualType 實際類型
 * @param value 實際值
 * @returns 是否兼容
 */
function isTypeCompatible(expectedType: string, actualType: string, value: any): boolean {
  // 文本類型可以接受任何類型（會轉換為字符串）
  if (expectedType === 'text') return true;

  // 嚴格類型匹配
  if (expectedType === actualType) return true;

  // 特殊情況：數字可以是字符串形式
  if (expectedType === 'number' && actualType === 'text') {
    return !isNaN(parseFloat(value));
  }

  // 日期可以是字符串形式
  if (expectedType === 'date' && actualType === 'text') {
    return !isNaN(Date.parse(value));
  }

  // 布爾值可以是字符串形式
  if (expectedType === 'boolean' && actualType === 'text') {
    return ['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase());
  }

  return false;
}

/**
 * 分析編譯後的內容
 *
 * @param content 編譯後的內容
 * @param templateVariables 範本變數定義
 * @param providedVariables 提供的變數值
 * @returns 分析結果
 */
function analyzeCompiledContent(
  content: string,
  templateVariables: Record<string, any>,
  providedVariables: Record<string, any>
): {
  variablesUsed: string[];
  missingVariables: string[];
  unusedVariables: string[];
} {
  const templateVarNames = Object.keys(templateVariables);
  const providedVarNames = Object.keys(providedVariables);

  // 查找內容中仍然存在的變數佔位符（未被替換的）
  const missingVariables: string[] = [];
  const variablePattern = /\{\{(\w+)\}\}/g;
  let match;

  while ((match = variablePattern.exec(content)) !== null) {
    const varName = match[1];
    if (!missingVariables.includes(varName)) {
      missingVariables.push(varName);
    }
  }

  // 查找已使用的變數（在範本中定義且在內容中不再以佔位符形式存在）
  const variablesUsed = templateVarNames.filter(varName =>
    providedVariables[varName] !== undefined &&
    !missingVariables.includes(varName)
  );

  // 查找未使用的變數（提供了但範本中沒有定義的）
  const unusedVariables = providedVarNames.filter(varName =>
    !templateVarNames.includes(varName)
  );

  return {
    variablesUsed,
    missingVariables,
    unusedVariables
  };
}