# 🎁 Gift Polls Feature

The Gift Polls feature allows users to send polls as personalized gifts to friends, family, or colleagues via Telegram. Recipients receive a beautifully wrapped poll that they can "unwrap" to reveal and participate in.

## Features Implemented

### 1. **Gift Poll Creation**
- **Location**: Poll Creation component, Step 3 (Configuration)
- **Toggle**: "🎁 Send this poll as a gift" checkbox
- **Fields**:
  - Recipient (Telegram username)
  - Personal message
  - Gift theme selection (Default, Birthday, Celebration, Question)

### 2. **Gift Themes**
- **Default** 🎁: Standard gift presentation with gold wrapping
- **Birthday** 🎂: Pink theme for birthday celebrations
- **Celebration** 🎉: Green theme for achievements and milestones
- **Question** ❓: Blue theme for surveys and questions

### 3. **Gift URL Generation**
- **Format**: `{baseUrl}/gift/{giftId}?poll={pollId}`
- **Unique IDs**: Generated using timestamp + random string
- **Deep Linking**: Supports Telegram startapp parameter format

### 4. **Gift Unwrapping Experience**
- **Animated Gift Box**: Bouncing gift box with themed colors
- **Personal Message**: Display sender's custom message
- **Unwrap Button**: Prominent call-to-action with glow animation
- **Reveal Animation**: Celebration animation when poll is revealed

### 5. **Telegram Integration**
- **Sharing**: Direct integration with Telegram's sharing mechanism
- **Deep Links**: Support for `startapp=gift_{giftId}` format
- **Haptic Feedback**: Touch feedback for mobile users

### 6. **Data Storage**
- **Primary**: Backend API for persistent storage
- **Fallback**: localStorage for offline functionality
- **Tracking**: Gift unwrapping analytics and user engagement

## Technical Implementation

### Core Components

#### 1. **PollCreation.jsx** - Enhanced
- Added gift options to Step 3
- Gift toggle and configuration fields
- `handleGiftPollCreation()` function for processing gifts
- API integration for gift metadata storage

#### 2. **GiftPollReceiver.jsx** - New
- Complete gift unwrapping experience
- Theme-based styling and animations
- Error handling for invalid/expired gifts
- Integration with PollResponse component

#### 3. **App.jsx** - Enhanced
- Deep link routing for gift URLs
- Support for `gift_{giftId}` start parameters
- Route handling for gift receiver component

#### 4. **tpollsApi.js** - Enhanced
- `storeGiftMetadata()` - Store gift data
- `getGiftMetadata()` - Retrieve gift data
- `markGiftUnwrapped()` - Track unwrapping events

### API Endpoints (Backend)

```javascript
// Store gift metadata
POST /api/database/gifts/store
{
  giftId: string,
  pollId: number,
  recipient: string,
  message: string,
  theme: string,
  sender: string,
  createdAt: string
}

// Get gift metadata
GET /api/database/gifts/{giftId}

// Mark gift as unwrapped
POST /api/database/gifts/{giftId}/unwrap
{
  unwrappedBy: string,
  unwrappedAt: string
}
```

### URL Formats

#### Web App URLs
```
https://your-app.com/?startapp=gift_{giftId}
```

#### Telegram Bot URLs
```
https://t.me/your_bot/tpolls?startapp=gift_{giftId}
```

## User Experience Flow

### 1. **Creating a Gift Poll**
1. User creates poll normally through Steps 1-2
2. In Step 3, user enables "Send this poll as a gift"
3. User fills recipient details and selects theme
4. User completes poll creation
5. Gift URL is generated and shared via Telegram

### 2. **Receiving a Gift Poll**
1. Recipient clicks on shared Telegram link
2. App opens to gift unwrapping page
3. Themed gift box displayed with personal message
4. Recipient clicks "Unwrap Gift" button
5. Celebration animation plays
6. Poll is revealed for participation

### 3. **Error Handling**
- Invalid gift IDs show friendly error message
- Expired gifts handled gracefully
- Network failures fall back to localStorage
- Missing poll data shows appropriate errors

## Styling and Animations

### CSS Features
- **Responsive Design**: Works on all screen sizes
- **Theme Variables**: Uses Telegram's theme colors
- **Animations**:
  - Gift box bouncing animation
  - Unwrap button glow effect
  - Celebration reveal animation
- **Backdrop Blur**: Modern glassmorphism effects

### Animation Keyframes
```css
@keyframes giftBounce { /* Gift box bounce */ }
@keyframes glow { /* Button glow effect */ }
@keyframes celebrate { /* Unwrap celebration */ }
```

## Testing

### Test Page
- **Location**: `/public/test-gift-polls.html`
- **Purpose**: Standalone testing of gift poll functionality
- **Features**:
  - Pre-populated test data
  - Multiple theme examples
  - Deep link testing
  - Copy-to-clipboard functionality

### Test Gift IDs
- `test123` - Default theme
- `birthday456` - Birthday theme
- `celebration789` - Celebration theme
- `question101` - Question theme

### Test URLs
```
http://localhost:5173/?startapp=gift_test123
http://localhost:5173/?startapp=gift_birthday456
http://localhost:5173/?startapp=gift_celebration789
http://localhost:5173/?startapp=gift_question101
```

## Configuration

### Environment Variables
No additional environment variables required. Uses existing:
- `VITE_DPOLLS_API` - Backend API URL
- `VITE_SIMPLE_CONTRACT_ADDRESS` - Smart contract address

### Backend Requirements
Backend API should implement the gift endpoints mentioned above. If unavailable, the feature gracefully falls back to localStorage.

## Future Enhancements

### Potential Improvements
1. **Gift Expiration**: Time-limited gifts with countdown timers
2. **Gift Templates**: Pre-designed templates for common occasions
3. **Gift Collections**: Send multiple polls as a gift bundle
4. **Gift Scheduling**: Schedule gifts for future delivery
5. **Gift Analytics**: Detailed analytics for gift senders
6. **Custom Animations**: User-uploadable gift animations
7. **Gift Rewards**: Special rewards for gift recipients
8. **Gift Chains**: Viral gift-passing mechanics

### Integration Opportunities
1. **Calendar Integration**: Birthday and anniversary reminders
2. **Social Features**: Gift leaderboards and sharing stats
3. **Monetization**: Premium gift themes and animations
4. **AI Features**: AI-suggested gift messages and themes

## Security Considerations

### Data Privacy
- Gift metadata doesn't contain sensitive information
- Sender addresses are truncated in display
- Recipients can't see full sender wallet addresses

### Validation
- Gift IDs are validated before processing
- Poll IDs are verified to exist
- Input sanitization for messages and recipients

### Rate Limiting
- Backend should implement rate limiting for gift creation
- Prevent spam through gift sharing mechanisms

## Deployment Checklist

- [ ] Backend API endpoints implemented
- [ ] Database tables for gift storage created
- [ ] Telegram bot configured for deep linking
- [ ] Test cases verified across all themes
- [ ] Error handling tested for edge cases
- [ ] Mobile responsiveness verified
- [ ] Analytics tracking implemented
- [ ] Documentation updated

## Support and Troubleshooting

### Common Issues
1. **Gift not found**: Check gift ID format and expiration
2. **Sharing fails**: Verify Telegram WebApp API availability
3. **Animations not working**: Check CSS animation support
4. **Data not saving**: Verify backend API connectivity

### Debug Information
- Gift metadata logged to console
- API calls logged with success/failure status
- Fallback mechanisms clearly indicated in logs
- Error messages provide actionable information

---

**Built with ❤️ for the tPolls ecosystem**

*This feature enhances user engagement by making poll sharing more personal and interactive, leveraging Telegram's social features and blockchain transparency.*