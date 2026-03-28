# BusinessHub Pro - Button and Flow QA Checklist

Use this checklist on a real device (Android/iOS). Mark each item PASS/FAIL and note screenshots for failures.

## Test Data Setup
- Create one verified email account.
- Keep one unverified account (for negative auth test).
- Have at least one business row with:
  - phone number
  - coordinates (latitude/longitude)
  - optional website URL
- Have at least one active queue entry and one historical entry.
- Ensure notifications permission can be toggled in device settings.

## Legend
- PASS: Works exactly as expected.
- FAIL: Button/action does not work, wrong route, no response, wrong error, or crash.

## 1. App Launch and Routing
- [ ] Launch app from cold start -> lands on splash then correct route based on auth state.
- [ ] Unauthenticated user is routed to /(auth)/welcome.
- [ ] Authenticated user is routed to /(tabs).

## 2. Auth Screens

### Welcome
- [ ] Get Started button -> opens register screen.
- [ ] Sign In button -> opens login screen.

### Login
- [ ] Back button returns previous screen.
- [ ] Forgot Password opens forgot-password screen.
- [ ] Login with valid email/password logs in and routes to tabs.
- [ ] Login with invalid credentials shows error alert.
- [ ] Google Sign-In button starts OAuth flow.
- [ ] Apple Sign-In button works on supported devices.
- [ ] Create Account link opens register.
- [ ] Verification modal close button works.

### Register
- [ ] Back button works.
- [ ] Terms checkbox toggles correctly.
- [ ] Register button validates required fields.
- [ ] Register with valid inputs creates account and shows success flow.
- [ ] Google fill/sign-up starts OAuth and prefill flow.
- [ ] Apple sign-up works on supported devices.
- [ ] Sign In link opens login.
- [ ] Verification modal CTA routes to login with prefill email.

### Forgot Password
- [ ] Back button works.
- [ ] Submit sends reset link for valid email.
- [ ] Resend button works.
- [ ] Go to Login button works.

### Reset Password
- [ ] Reset button updates password with valid input.
- [ ] Back to Login works.

## 3. Bottom Tabs
- [ ] Home tab opens.
- [ ] Queue tab opens.
- [ ] Map tab opens.
- [ ] Orders tab opens.
- [ ] Profile tab opens.

## 4. Home Screen
- [ ] Avatar button opens profile tab.
- [ ] Notification bell opens notifications panel directly.
- [ ] Notification panel close works.
- [ ] Search input filters business list.
- [ ] Category filter chips update list.
- [ ] Radius filter updates list.
- [ ] No active queue card CTA opens scan tab.
- [ ] Pull to refresh reloads data.
- [ ] Business card tap opens business detail route /business/[id].

## 5. Business Detail Screen
- [ ] Back button works.
- [ ] Favorite heart toggles and persists after leaving/reopening screen.
- [ ] Share button opens native share sheet.
- [ ] Join Queue button joins queue and routes to /queue/[id].
- [ ] Call button opens dialer when phone exists.
- [ ] Directions button opens maps route/search.
- [ ] Website button opens website or fallback search.
- [ ] Get Directions button in location section works.

## 6. Queue Screens

### Queue Tab
- [ ] Active/History tab switch buttons work.
- [ ] Active queue item opens /queue/[id].
- [ ] Leave queue action confirms and removes entry.
- [ ] Pull to refresh syncs queues.

### Queue Detail (/queue/[id])
- [ ] Back-to-list action works.
- [ ] View business action opens /business/[id].
- [ ] Leave queue action works and updates status.

## 7. Scan Screen
- [ ] Camera permission request flow works.
- [ ] Manual entry button opens modal.
- [ ] Manual entry submit joins queue for valid business ID.
- [ ] Manual entry invalid input shows error.
- [ ] Manual modal cancel closes modal.

## 8. Map Screen
- [ ] Enable Location button triggers permission flow.
- [ ] Retry button works when permission/location fails.
- [ ] Refresh map action works.
- [ ] Radius controls update visible businesses.
- [ ] Add business flow saves and refreshes list.

## 9. Orders Screen
- [ ] Filter tabs switch order lists.
- [ ] Empty state renders correctly when no orders.
- [ ] Order cards render valid details and statuses.

## 10. Profile Main
- [ ] Notifications bell opens notifications panel.
- [ ] Notifications panel actions (read, delete, clear) work.
- [ ] Edit profile row opens /profile/edit.
- [ ] Loyalty row shows loyalty info alert.
- [ ] Payment row opens /profile/payment.
- [ ] Settings row opens /profile/settings.
- [ ] Help row opens /profile/help.
- [ ] Feedback row opens /profile/feedback.
- [ ] Logout button logs out and routes to welcome.

## 11. Profile Settings
- [ ] Back button works.
- [ ] Edit badge opens /profile/edit.
- [ ] Change password row opens /profile/change-password (for non-Google accounts).
- [ ] Delete account flow (2 confirmations) works and routes to welcome.
- [ ] All notification toggles work and persist.
- [ ] Dark mode toggle works and persists.
- [ ] Language picker opens and language changes.
- [ ] Compact view toggle works.
- [ ] Location and analytics toggles work.
- [ ] Clear cache action clears and shows success.
- [ ] Help Center opens /profile/help.
- [ ] Contact Support opens mail app.
- [ ] Report Bug opens mail app.
- [ ] Send Feedback opens /profile/feedback.
- [ ] Rate App opens Play Store/App Store (or search fallback).
- [ ] Terms row opens /profile/terms.
- [ ] About row opens /profile/about.

## 12. Profile Subpages

### Edit Profile
- [ ] Save profile button updates name/phone.
- [ ] Change password panel validates and updates password.

### Change Password
- [ ] Back button works.
- [ ] Eye toggles show/hide password fields.
- [ ] Submit validates and updates password.

### Feedback
- [ ] Back button works.
- [ ] Star rating selection works.
- [ ] Category chips selection works.
- [ ] Submit enforces validation and succeeds on valid input.

### Help
- [ ] Search works.
- [ ] Category chips filter FAQs.
- [ ] FAQ accordion toggles open/close.
- [ ] Contact actions open expected channels.

### About
- [ ] Back button works.
- [ ] External links open correctly.
- [ ] Terms link opens /profile/terms.

### Terms
- [ ] Back button works.
- [ ] Tabs switch content.
- [ ] Contact email link opens mail app.

### Payment
- [ ] Select payment method works.
- [ ] Amount validation works.
- [ ] Continue creates transaction and moves to instructions.
- [ ] Open payment app action works.
- [ ] Copy actions copy values.
- [ ] Upload receipt from gallery works.
- [ ] Capture receipt from camera works.
- [ ] Submit receipt validates and completes flow.
- [ ] Done/close action exits flow.

## 13. Regression and Persistence Checks
- [ ] Favorites remain after app restart.
- [ ] Theme and settings persist after app restart.
- [ ] Notification read/unread state persists correctly.
- [ ] Active queue and history sync correctly after restart.

## 14. Failure Log Template
Use this format for each failed step:
- Screen:
- Button/Action:
- Expected:
- Actual:
- Repro Steps:
- Device/OS:
- Screenshot/Video:
- Severity (Critical/High/Medium/Low):
