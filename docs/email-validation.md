# Email Validation Rules

Validation runs **on blur** (when the user leaves the email field). The field is required.

---

## Validation Checks

The email must meet all of the following conditions in order:

### 1. Valid Email Format

Must match standard email structure:

```
local-part@domain.extension
```

**Valid examples:**
- `user@example.com`
- `mcrane2@gmail.com`
- `first.last@company.co`

**Invalid examples:**
- `mcrane2@gma`
- `mcrane2@gmail`
- `mcrane2@`
- `@gmail.com`

**Error message:** `Enter a valid email address`

---

### 2. Valid Domain Extension

The domain must include a recognised extension of 2+ characters.

**Accepted extensions include (not exhaustive):**
`.com` `.net` `.org` `.io` `.co` `.edu` `.gov` `.uk` `.us` `.ca` `.au` `.ai` `.app` `.dev` `.tech` `.info` `.biz`

**Invalid examples:**
- `mcrane2@gma` — no dot or extension
- `mcrane2@gmail` — no extension

**Error message:** `Email address appears incomplete`

---

### 3. Detect Common Domain Misspellings

If the domain appears to be a common typo of a known provider, show an inline suggestion.

| Typed | Suggested correction |
|---|---|
| `gmil.com` | `gmail.com` |
| `gmaill.com` | `gmail.com` |
| `gmal.com` | `gmail.com` |
| `gamil.com` | `gmail.com` |
| `yaho.com` | `yahoo.com` |
| `yahooo.com` | `yahoo.com` |
| `hotmial.com` | `hotmail.com` |
| `hotmal.com` | `hotmail.com` |
| `outlok.com` | `outlook.com` |
| `outloo.com` | `outlook.com` |

**Error message:** `Did you mean {suggested_email}?`

The suggested email is a **clickable link**. Clicking it autofills the corrected address and clears the error.

---

## Error Message Behaviour

| Condition | Message |
|---|---|
| Format invalid (missing `@`, invalid structure) | `Enter a valid email address` |
| Domain extension missing or incomplete | `Email address appears incomplete` |
| Likely typo detected | `Did you mean mcrane2@gmail.com?` |

---

## UI Behaviour

### When invalid:
- Error message appears below the email field
- Field border highlights in error colour (`#DE350B`)
- Label text changes to error colour
- `aria-invalid="true"` set on the input
- "Send Verification Code" button remains disabled

### When corrected:
- Error state removed immediately on next blur (or on suggestion click)
- Error message hidden
- `aria-invalid="false"` restored

---

## Edge Cases

| Case | Behaviour |
|---|---|
| Field is empty on blur | Show `Enter a valid email address` (field is required) |
| Field has leading/trailing whitespace | Trim before validation: `" user@example.com "` → `"user@example.com"` |
| Domain portion casing | Convert domain to lowercase before validation |

---

## Accessibility

- Error message div uses `role="alert"` and `aria-live="polite"`
- Input uses `aria-describedby="emailError"` pointing to the error div
- Input uses `aria-invalid="true"` when in error state, `"false"` when valid

---

## Implementation

**File:** `src/js/main.js`  
**Trigger:** `blur` event on `#email` input  
**Current basic check:** `isValidEmail()` — regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` (used for button enablement only)  
**Full validation:** `validateEmailField()` — runs on blur, covers all rules above
