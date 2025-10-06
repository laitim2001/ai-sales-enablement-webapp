# Dashboard Pages and Session Issues Analysis
**Date**: 2025-10-06
**Status**: Investigation Complete - Fixes in Progress

## 📋 Summary of Issues

### 1. Missing Dashboard Pages ✅ ANALYZED
**Status**: 7 routes not implemented
**Impact**: Navigation broken for these routes

**Implemented Pages** (10):
- ✅ `/dashboard` - Main dashboard
- ✅ `/dashboard/search` - Search page
- ✅ `/dashboard/settings` - Settings
- ✅ `/dashboard/tasks` - Tasks management
- ✅ `/dashboard/proposals` - Proposals
- ✅ `/dashboard/notifications` - Notifications
- ✅ `/dashboard/templates` - Templates
- ✅ `/dashboard/knowledge` - Knowledge base
- ✅ `/dashboard/customers` - Customers
- ✅ `/dashboard/assistant` - AI Assistant

**Missing Pages** (7):
- ❌ `/dashboard/activities` - Activity feed/timeline
- ❌ `/dashboard/opportunities` - Sales opportunities
- ❌ `/dashboard/analytics` - Analytics dashboard
- ❌ `/dashboard/chat` - Chat/messaging
- ❌ `/dashboard/conversation-analysis` - Conversation analytics
- ❌ `/dashboard/documents` - Document management
- ❌ `/dashboard/favorites` - Favorites/bookmarks

**Recommendation**: These pages are not part of current MVP scope and should be marked as "Coming Soon" in navigation.

---

### 2. Session Persistence Issue 🔴 CRITICAL
**Status**: Under investigation
**Symptom**: Page refresh redirects to `/login`
**Root Cause**: Identified in `hooks/use-auth.ts`

**Problem Analysis**:
```typescript
// hooks/use-auth.ts:189-231
const checkAuthStatus = async () => {
  try {
    const token = localStorage.getItem('auth-token')
    if (!token) {
      setIsLoading(false)
      return
    }

    const response = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        setUser(result.data)
      } else {
        // ⚠️ ISSUE: Removes token even if API structure just changed
        localStorage.removeItem('auth-token')  // LINE 219
      }
    } else {
      // ⚠️ ISSUE: Removes token on ANY non-200 response
      localStorage.removeItem('auth-token')  // LINE 223
    }
  } catch (error) {
    console.error('Auth status check failed:', error)
    // ⚠️ ISSUE: Removes token on network errors
    localStorage.removeItem('auth-token')  // LINE 227
  } finally {
    setIsLoading(false)
  }
}
```

**Why This Causes Session Loss**:
1. On page refresh, React re-mounts and runs `useEffect(() => checkAuthStatus(), [])`
2. If `/api/auth/me` has ANY issue (network blip, server restart, etc.), token gets deleted
3. User gets immediately redirected to login even though their token was valid
4. This is TOO aggressive - should only remove token if it's actually invalid/expired

**Fix Strategy**:
Only remove token when:
- ✅ 401 Unauthorized (token expired or invalid)
- ✅ 403 Forbidden (user deactivated)
- ❌ NOT on 500 errors (server issues)
- ❌ NOT on network errors (temporary connectivity)
- ❌ NOT on response format changes

---

### 3. Proposal Template Save Error 🟡 HIGH PRIORITY
**Status**: Not investigated yet
**Symptom**: 500 Internal Server Error when creating proposal template
**Error Message**: "創建提案範本時發生錯誤"

**Next Steps**:
1. Check browser console for detailed error
2. Check server logs for backend error
3. Identify which API endpoint is being called
4. Review proposal template creation logic

---

### 4. Knowledge Base API Error 🟡 HIGH PRIORITY
**Status**: Partially analyzed
**Symptom**: 500 Internal Server Error on knowledge base page
**API**: `GET /api/knowledge-base?page=1&limit=20&sort=updated_at&order=desc`
**File**: `app/api/knowledge-base/route.ts`

**Potential Causes**:
1. Database connection issue (Prisma)
2. Missing user context in token
3. Schema validation error
4. Query construction error

**Next Steps**:
1. Check server logs for exact error
2. Test API endpoint directly with curl/Postman
3. Verify database schema matches Prisma models
4. Check if user relations exist

---

## 🔧 Immediate Action Plan

### Priority 1: Fix Session Persistence (CRITICAL)
**File**: `hooks/use-auth.ts:199-231`
**Change**: Only remove token on 401/403, retry on 500/network errors

### Priority 2: Investigate Knowledge Base Error
**Check**: Server logs, database queries, Prisma schema

### Priority 3: Fix Proposal Template Error
**Check**: Browser console, server logs, API endpoint

### Priority 4: Document Missing Pages
**Action**: Update navigation with "Coming Soon" badges

---

## 📊 Technical Context

**Authentication Flow**:
```
1. User logs in → Token stored in localStorage
2. App mounts → useAuth checks token with /api/auth/me
3. /api/auth/me verifies token → returns user data
4. On page refresh → REPEAT step 2-3
   ⚠️ Problem: If step 3 fails for ANY reason, token deleted
```

**Token Verification Chain**:
```
Frontend: localStorage.getItem('auth-token')
    ↓
Frontend: fetch('/api/auth/me', { Authorization: Bearer ${token} })
    ↓
Backend: verifyToken(token) in /app/api/auth/me/route.ts
    ↓
Backend: Check user exists and is_active in database
    ↓
Backend: Return user data
```

---

## 🎯 Success Criteria

### Session Persistence Fix:
- [ ] Page refresh maintains login state
- [ ] Only logout on actual auth failures (401/403)
- [ ] Network errors don't cause logout
- [ ] Server errors don't cause logout

### Knowledge Base Fix:
- [ ] API returns 200 OK
- [ ] Data loads successfully in UI
- [ ] No console errors

### Proposal Template Fix:
- [ ] Can create templates successfully
- [ ] No 500 errors
- [ ] Data saves to database

### Missing Pages:
- [ ] Navigation updated with status indicators
- [ ] User understands which features are available
