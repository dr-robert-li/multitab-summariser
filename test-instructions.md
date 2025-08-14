# Testing Instructions for Multi-Tab Summarizer

## Pre-Testing Setup

### 1. Create PNG Icons (Required)
```bash
# Install ImageMagick if not already installed
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Convert SVG to required PNG sizes
convert icons/icon.svg -resize 16x16 icons/icon16.png
convert icons/icon.svg -resize 48x48 icons/icon48.png
convert icons/icon.svg -resize 128x128 icons/icon128.png
```

### 2. Verify File Structure
Ensure all files are present:
```
multi-tab-summariser/
├── manifest.json
├── popup.html, popup.css, popup.js
├── content.js
├── sidebar.css
├── background.js
├── error-handler.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Loading Extension

### 1. Open Chrome Extensions Page
- Navigate to `chrome://extensions/`
- Enable "Developer mode" toggle (top right)

### 2. Load Unpacked Extension
- Click "Load unpacked" button
- Select the `multi-tab-summariser` folder
- Extension should appear with purple gradient icon

### 3. Pin Extension
- Click the puzzle piece icon in Chrome toolbar
- Find "Multi-Tab Summarizer"
- Click the pin icon to add to toolbar

## Basic Functionality Testing

### Test 1: Popup Interface
1. Click extension icon
2. Verify popup opens with:
   - Title "Multi-Tab Summarizer"
   - API key input field
   - "Summarize All Tabs" button (disabled)
   - "Clear Summaries" button

### Test 2: API Key Management
1. Enter test API key (format: sk-...)
2. Verify "Summarize All Tabs" button becomes enabled
3. Close and reopen popup
4. Verify API key is remembered

### Test 3: Multi-Tab Setup
1. Open 3-5 different websites with text content:
   - News article
   - Wikipedia page
   - Documentation site
   - Blog post
2. Ensure tabs have finished loading

### Test 4: Summarization Process
1. Click "Summarize All Tabs"
2. Verify status shows "Starting summarization..."
3. Check that sidebar appears on each tab
4. Verify loading indicators appear
5. Wait for summaries to generate (requires valid API key)

## Advanced Testing

### Test 5: Error Handling
1. **Invalid API Key**: Use fake key, verify error message
2. **No API Key**: Clear key, verify button disabled
3. **Network Issues**: Disconnect internet, test error handling
4. **Chrome System Pages**: Navigate to `chrome://settings/`, verify skipped

### Test 6: Sidebar Functionality
1. Verify sidebar appears on right side
2. Check current tab is highlighted
3. Click different tab summaries to navigate
4. Test close button functionality
5. Verify responsive design

### Test 7: Content Script Injection
1. Test on various site types:
   - Regular websites ✓
   - HTTPS sites ✓
   - Sites with CSP headers
   - Chrome extension pages (should skip)
   - chrome:// pages (should skip)

## Manual Verification Checklist

### UI/UX
- [ ] Extension icon appears in toolbar
- [ ] Popup opens correctly with modern design
- [ ] Sidebar has gradient theme matching popup
- [ ] Text is readable and properly sized
- [ ] Loading states are clear
- [ ] Error messages are user-friendly

### Functionality
- [ ] API key saves and persists
- [ ] Tabs are processed correctly
- [ ] Screenshots are captured
- [ ] Summaries appear in sidebar
- [ ] Tab navigation works from sidebar
- [ ] Clear function removes all data
- [ ] Extension handles tab closes gracefully

### Error Scenarios
- [ ] Invalid API key shows clear error
- [ ] Rate limiting is handled gracefully
- [ ] Network errors display appropriate messages
- [ ] Inaccessible tabs are skipped with notice
- [ ] Chrome system pages are ignored

### Performance
- [ ] Processing doesn't freeze browser
- [ ] Memory usage is reasonable
- [ ] Multiple summarization requests are handled
- [ ] Large numbers of tabs (10+) work correctly

## Debugging Tips

### Browser Console
- Open DevTools (F12)
- Check Console tab for errors
- Look for "Extension Error:" logs

### Extension Console
- Go to `chrome://extensions/`
- Click "Inspect views: service worker"
- Check for background script errors

### Common Issues
1. **Manifest errors**: Check file paths and permissions
2. **Content script failures**: Verify CSP compatibility
3. **API errors**: Check key validity and OpenAI status
4. **Icon issues**: Ensure PNG files exist and are valid

## Production Checklist

Before distribution:
- [ ] All PNG icons created and optimized
- [ ] Remove console.log statements
- [ ] Test with real OpenAI API key
- [ ] Verify on multiple Chrome versions
- [ ] Test privacy/security settings
- [ ] Update version numbers if needed
- [ ] Create proper app store screenshots