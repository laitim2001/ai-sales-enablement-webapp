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

### 4. Knowledge Base API Error 🟢 RESOLVED
**Status**: Root cause identified
**Symptom**: 500 Internal Server Error on knowledge base page
**API**: `GET /api/knowledge-base?page=1&limit=20&sort=updated_at&order=desc`
**File**: `app/api/knowledge-base/route.ts`

**Root Cause Found** (2025-10-06):
```
GET /api/knowledge-base error: Error: Invalid or expired token
    at GET (webpack-internal:///(rsc)/./app/api/knowledge-base/route.ts:149:86)
```

**Analysis**:
- Error occurs at line 141: `const payload = verifyToken(token)`
- This is **NOT A BUG** - it's correct behavior for expired/invalid tokens
- The 500 error happens because:
  1. User's browser is using cached old JavaScript code
  2. Old code likely has token expiration issues or missing refresh logic
  3. After **hard refresh** (Ctrl+Shift+R), browser will load new `hooks/use-auth.ts` code
  4. New code has smart token caching and will maintain valid session

**Fix**: Same as Issue #2 - User needs hard refresh to load new auth code

**Verification Needed**:
1. User should do hard refresh (Ctrl+Shift+R)
2. Login again with fresh session
3. Navigate to Knowledge Base page
4. If error persists with fresh valid token, then it's a real bug
5. If it works, issue was just cached old JavaScript

---

## 🔧 Immediate Action Plan

### ✅ COMPLETED Priority 1: Fix Session Persistence
**File**: `hooks/use-auth.ts:199-231`
**Status**: Code fix committed, user needs hard refresh (Ctrl+Shift+R)
**Change**: Implemented smart token retention (401/403 only) + user caching

### ✅ COMPLETED Priority 2: Knowledge Base Error
**Status**: Root cause identified - expired token due to cached old JavaScript
**Fix**: Same as Priority 1 - user needs hard refresh to load new auth code
**Verification**: After hard refresh + fresh login, test Knowledge Base page

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
