# Friend Connect

Absolutely. Below is a **copy-paste-ready, atomic-level master prompt** designed to make an AI coding agent build **Friend**, a production-quality Instagram-inspired social platform.

# MASTER BUILD PROMPT — FRIEND

## 0. ROLE

Act as a **world-class product designer, UI/UX architect, frontend engineer, backend engineer, Firebase architect, media-upload architect, security engineer, QA engineer, and performance engineer**.

You are responsible for designing and implementing a complete production-ready social media web application called:

# FRIEND

Friend is an Instagram-inspired social networking platform. It should provide the core user experience and feature set users expect from a modern visual social platform, while using **original branding, original UI styling, and original implementation**.

Do not simply create a visual mockup.

Build a **fully functional, dynamic, database-backed application**.

---

# 1. PRIMARY OBJECTIVE

Build a complete responsive social media web application named **Friend** with:

* Email/password authentication
* Google authentication
* User profiles
* Follow/unfollow system
* Personalized feed
* Posts
* Image posts
* Video posts
* Multiple-image carousel posts
* Stories
* Likes
* Comments
* Replies
* Saves/bookmarks
* Shares
* Direct messaging
* Notifications
* Search
* Explore/discovery
* Hashtags
* Mentions
* User settings
* Profile editing
* Privacy controls
* Responsive navigation
* Mobile-first UX
* Real-time interactions where appropriate
* Media uploads
* Media optimization
* Infinite scrolling/pagination
* Loading states
* Empty states
* Error states
* Toasts
* Modals
* Accessibility
* Strong security
* Production-quality architecture

Everything must be **dynamic**.

---

# 2. NON-NEGOTIABLE REQUIREMENT: NO HARDCODED APPLICATION DATA

This is critical.

The application must NOT use hardcoded mock users, posts, comments, likes, followers, stories, notifications, messages, etc.

Do NOT create fake static data such as:

```js
const posts = [...]
const users = [...]
const comments = [...]
```

for actual application functionality.

All persistent application data must come from Firebase.

The UI may contain temporary loading skeletons and placeholder states, but actual application content must be database-driven.

If there is no data, display a proper empty state.

---

# 3. TECHNOLOGY REQUIREMENTS

Use a modern production-quality stack.

Preferred stack:

* React
* TypeScript
* Vite
* Tailwind CSS
* Firebase
* Firebase Authentication
* Cloud Firestore
* Firebase Cloud Functions where required
* Cloudinary for image/video storage and delivery
* Modern routing solution such as React Router
* Component-based architecture
* Responsive CSS
* Accessible semantic HTML

Do not introduce unnecessary libraries.

Choose libraries based on actual requirements.

Keep the architecture maintainable and scalable.

---

# 4. FIREBASE CONFIGURATION

Use the following Firebase project:

```js
const firebaseConfig = {
  apiKey: "AIzaSyAgGmqGfET8eKY_TLLE1z3Ml5sWhNXwc0",
  authDomain: "friend-7b157.firebaseapp.com",
  projectId: "friend-7b157",
  storageBucket: "friend-7b157.firebasestorage.app",
  messagingSenderId: "56217805650",
  appId: "1:56217805650:web:2068b72ce7f7e7aae4108",
  measurementId: "G-92CHBRTL5L"
};
```

Do not expose additional secrets in frontend code.

Authentication must be implemented using Firebase Authentication.

Primary application data must be stored in Cloud Firestore.

---

# 5. AUTHENTICATION

Implement:

## Sign up

Users can create an account using:

* Email
* Password
* Username
* Display name

Validate:

* Email format
* Password strength
* Username format
* Username uniqueness
* Required fields

Show useful validation errors.

After successful registration:

1. Create Firebase Authentication account.
2. Create the user's Firestore profile document.
3. Assign timestamps.
4. Initialize default user settings.
5. Redirect the user into Friend.

---

## Login

Support:

* Email/password login
* Google login

Implement proper loading states.

Handle:

* Wrong password
* Invalid email
* User not found
* Disabled account
* Network errors
* Google authentication errors

---

## Google authentication

Use Firebase Google OAuth.

When a Google user signs in for the first time:

* Create their Friend profile automatically.
* Generate an available username if necessary.
* Store profile metadata.
* Store creation timestamp.

---

## Logout

Implement secure logout.

---

## Forgot password

Provide:

* Forgot password page
* Email reset flow
* Success state
* Error state

---

# 6. APPLICATION ARCHITECTURE

Structure the application cleanly.

Suggested structure:

```text
src/
  components/
  pages/
  layouts/
  hooks/
  context/
  services/
  firebase/
  lib/
  utils/
  types/
  styles/
  features/
    auth/
    feed/
    posts/
    stories/
    profile/
    search/
    explore/
    messages/
    notifications/
    settings/
```

Separate:

* UI
* business logic
* Firebase queries
* Cloudinary operations
* state management
* utility functions
* types

Do not put the entire application inside one component.

---

# 7. BRANDING

Application name:

# Friend

Create an original visual identity.

Do NOT directly copy Instagram's branding, logo, proprietary illustrations, exact icons, or exact visual design.

Friend should feel familiar as a modern social platform while having its own:

* Logo
* Color system
* Typography
* Icon treatment
* Components
* Motion language
* Interaction patterns

The design should feel premium, modern, elegant and highly polished.

---

# 8. DESIGN DIRECTION

Create a world-class UI/UX.

Design characteristics:

* Minimal
* Premium
* Modern
* Mobile-first
* Fast-feeling
* Clean
* Highly visual
* Intuitive
* Spacious
* Accessible
* Consistent

Avoid:

* Generic dashboard appearance
* Excessive gradients
* Clutter
* Huge unnecessary cards
* Poor spacing
* Desktop-first layouts
* Inconsistent buttons
* Excessive animations
* Amateur-looking forms

---

# 9. RESPONSIVENESS

Mobile is the primary platform.

Design for:

### Mobile

Approximately:

* 320px
* 375px
* 390px
* 414px
* 430px

### Tablet

Approximately:

* 768px
* 834px
* 1024px

### Desktop

Approximately:

* 1280px
* 1440px
* 1920px+

Everything must adapt gracefully.

Never allow:

* Horizontal overflow
* Broken grids
* Cropped navigation
* Unusable dialogs
* Tiny tap targets
* Text overflow
* Broken media

Use mobile-friendly touch targets.

---

# 10. GLOBAL NAVIGATION

Create responsive navigation.

## Mobile

Use a bottom navigation system containing:

* Home
* Explore
* Create
* Activity
* Profile

Provide access to:

* Search
* Messages
* Settings

where appropriate.

Bottom navigation must respect mobile safe areas.

---

## Desktop

Use a responsive side navigation or left navigation.

Include:

* Friend logo
* Home
* Search
* Explore
* Messages
* Notifications
* Create
* Profile
* Settings

Navigation should collapse/adapt appropriately at intermediate breakpoints.

---

# 11. HOME FEED

The Home page is the primary experience.

Display posts from:

* Followed users
* Appropriate discovery content if desired

Each post should contain:

* Author avatar
* Username
* Verification indicator if applicable
* Timestamp
* More menu
* Media
* Like button
* Comment button
* Share button
* Save button
* Like count
* Caption
* Hashtags
* Mentions
* Comment preview
* View comments
* Post interaction state

---

# 12. POST MEDIA

Support:

### Images

* JPG
* JPEG
* PNG
* WebP

### Videos

Support common browser-compatible formats.

Allow:

* Single image
* Single video
* Multiple-image carousel

Media must be uploaded to Cloudinary.

Do not store large media blobs inside Firestore.

Store Cloudinary metadata/URLs in Firestore.

---

# 13. CLOUDINARY

Cloudinary configuration:

```text
Cloud Name:
e8mmudhk

Upload Preset:
Friend
```

Use Cloudinary for:

* Profile pictures
* Post images
* Post videos
* Story media

Firestore should store references/metadata, not the actual media files.

Example post media metadata:

```ts
{
  url: string,
  publicId: string,
  resourceType: "image" | "video",
  width?: number,
  height?: number,
  duration?: number
}
```

Optimize media delivery.

Use responsive image transformations.

Use appropriate compression.

Use lazy loading.

Do not load massive original assets when unnecessary.

---

# 14. CREATE POST

Create a polished post composer.

Users can:

* Upload image
* Upload video
* Select multiple images
* Reorder carousel media
* Preview media
* Write caption
* Add hashtags
* Mention users
* Add location
* Remove selected media
* Cancel
* Publish

Validate:

* File type
* File size
* Number of media items
* Caption length

Show upload progress.

Show processing state.

Prevent accidental duplicate submissions.

---

# 15. POST DATA MODEL

Use a scalable Firestore structure.

Example:

```text
users/{userId}
posts/{postId}
comments/{commentId}
likes/{likeId}
follows/{followId}
stories/{storyId}
notifications/{notificationId}
conversations/{conversationId}
messages/{messageId}
```

You may use subcollections where appropriate.

Do not blindly follow this structure if a more scalable Firestore design is better.

Optimize for:

* Query performance
* Pagination
* Security rules
* Indexing
* Real-time listeners
* Scalability

---

# 16. PROFILE SYSTEM

Each user gets a profile.

Profile should contain:

* Profile image
* Username
* Display name
* Bio
* Website/link
* Followers
* Following
* Post count
* Follow button
* Message button
* Edit profile button for own profile

Tabs:

* Posts
* Reels/videos
* Saved where applicable
* Tagged posts where implemented

---

# 17. EDIT PROFILE

Users can edit:

* Profile image
* Display name
* Username
* Bio
* Website
* Gender where applicable

Validate username uniqueness.

Prevent invalid usernames.

Show save progress.

Persist changes to Firestore.

---

# 18. FOLLOW SYSTEM

Implement:

* Follow
* Unfollow
* Follow request for private accounts
* Accept request
* Reject request
* Remove follower

Maintain accurate follower/following counts.

Prevent duplicate follow records.

Use secure Firestore rules.

---

# 19. PRIVATE ACCOUNTS

Allow users to make their account private.

For private accounts:

* Only approved followers can see private content.
* Non-followers see limited profile information.
* Follow becomes a request.
* Owner can approve/reject requests.

---

# 20. LIKES

Implement:

* Like
* Unlike
* Like count
* User-specific liked state

Prevent duplicate likes.

Use optimistic UI carefully.

Ensure database consistency.

---

# 21. COMMENTS

Users can:

* Add comments
* Delete their own comments
* Like comments
* Reply to comments
* Delete their own replies

Display:

* Comment author
* Avatar
* Comment text
* Timestamp
* Like count
* Reply action

Paginate comments.

Do not load thousands of comments at once.

---

# 22. SAVED POSTS

Users can bookmark posts.

Create:

* Save
* Unsave
* Saved posts page

Saved posts are private unless explicitly designed otherwise.

---

# 23. SHARING

Implement sharing functionality.

Users should be able to:

* Copy post link
* Share through supported browser/mobile mechanisms
* Share internally through Friend messages

Handle unsupported browser share APIs gracefully.

---

# 24. STORIES

Implement stories.

Users can upload:

* Image
* Video

Stories:

* Expire after 24 hours.
* Appear in a horizontal story tray.
* Show viewed/unviewed state.
* Support next/previous navigation.
* Support tap navigation.
* Support progress indicator.
* Support close gesture/button.

Story viewer should feel polished.

Track story views.

Users should be able to delete their own stories.

---

# 25. STORY CREATION

Create a dedicated story composer.

Allow:

* Media upload
* Preview
* Publish
* Cancel

Keep the interface fast and mobile-friendly.

---

# 26. EXPLORE

Build an Explore page.

Use dynamic Firestore data.

Display:

* Images
* Videos
* Trending content
* Recommended users

Create a responsive visual grid.

Use media aspect ratios intelligently.

Do not hardcode Explore content.

---

# 27. SEARCH

Implement global search.

Search:

* Users
* Usernames
* Display names
* Hashtags

Provide:

* Search input
* Debouncing
* Results
* Empty state
* Loading state
* Recent searches if implemented

Do not query the entire database unnecessarily.

Design Firestore indexes/data structures to support the intended queries.

---

# 28. HASHTAGS

Support hashtags in captions.

Example:

```text
Having a great day! #travel #friends
```

Detect hashtags.

Make hashtags clickable.

Create hashtag result pages.

Show:

* Hashtag
* Post count if available
* Related posts

---

# 29. MENTIONS

Support mentions:

```text
Amazing day with @username
```

Mentions should be clickable.

Where appropriate, create notifications for mentioned users.

---

# 30. NOTIFICATIONS

Build a notification center.

Notifications should include events such as:

* New follower
* Follow request
* Follow request accepted
* Post like
* Comment
* Comment reply
* Mention
* Story interaction where implemented
* Message

Display:

* Actor avatar
* Description
* Timestamp
* Related content where applicable
* Read/unread state

Use real-time updates where appropriate.

---

# 31. DIRECT MESSAGING

Build a complete messaging system.

Users can:

* Search for users
* Start conversations
* Send text messages
* Receive messages
* See timestamps
* See unread state
* See conversation list
* Open individual conversation
* Send media if implemented

Messaging must be database-backed.

Use Firestore real-time listeners appropriately.

---

# 32. CONVERSATION MODEL

A conversation should support:

* Multiple participants where appropriate
* Last message
* Last message timestamp
* Unread count
* Participants
* Updated timestamp

Messages should contain:

```ts
{
  senderId: string,
  text: string,
  createdAt: Timestamp,
  readBy: string[]
}
```

Adapt the schema when necessary.

---

# 33. REAL-TIME FUNCTIONALITY

Use Firebase real-time capabilities for areas where immediate updates materially improve UX:

* Messages
* Notifications
* Important interaction counters
* Follow requests where appropriate

Do not attach unnecessary real-time listeners everywhere.

Avoid excessive reads.

---

# 34. USER SETTINGS

Create a complete settings area.

Include:

### Account

* Edit profile
* Change email where supported
* Password management

### Privacy

* Private account
* Activity visibility
* Messaging permissions

### Notifications

* Likes
* Comments
* Followers
* Messages

### Security

* Logout
* Account controls

### Appearance

If implemented:

* Light mode
* Dark mode
* System mode

---

# 35. DARK MODE

Implement a polished dark mode.

Do not simply invert colors.

Create a deliberate dark design system.

Ensure:

* Proper contrast
* Correct borders
* Correct surfaces
* Correct text hierarchy
* Correct media treatment
* Correct dialogs
* Correct navigation

Persist theme preference.

---

# 36. UI COMPONENT SYSTEM

Build reusable components.

Examples:

```text
Button
IconButton
Avatar
PostCard
PostMedia
StoryAvatar
StoryViewer
Comment
CommentList
Modal
BottomSheet
Dropdown
Toast
Skeleton
Input
Textarea
SearchInput
UserRow
FollowButton
NotificationItem
MessageBubble
Navigation
```

Avoid duplicate UI implementations.

---

# 37. MOBILE UX

Mobile UX is a priority.

Implement:

* Bottom sheets
* Touch-friendly controls
* Swipe-friendly story viewer
* Full-screen media where appropriate
* Mobile-safe modals
* Sticky navigation where appropriate
* Safe-area handling
* Keyboard-aware messaging UI
* Smooth scrolling

Do not make desktop UI simply shrink down.

Design mobile layouts intentionally.

---

# 38. DESKTOP UX

Desktop should use available space intelligently.

Use:

* Multi-column layouts
* Feed + suggested users where appropriate
* Persistent navigation
* Comfortable content widths
* Hover states
* Keyboard accessibility

Avoid unnecessarily stretching posts across the entire viewport.

---

# 39. LOADING STATES

Every asynchronous operation must have a meaningful loading state.

Examples:

* Skeleton feed
* Skeleton profile
* Button loading
* Upload progress
* Search loading
* Message loading
* Story loading

Avoid blank screens during data loading.

---

# 40. EMPTY STATES

Design intentional empty states.

Examples:

### No posts

"Your feed is quiet"

### No followers

"Your community starts here"

### No saved posts

"Posts you save will appear here"

### No messages

"Start a conversation"

Use subtle illustrations/icons where appropriate.

---

# 41. ERROR HANDLING

Never expose raw Firebase errors directly to users.

Map technical errors to understandable messages.

Examples:

Instead of:

```text
FirebaseError: permission-denied
```

show:

```text
You don't have permission to perform this action.
```

Provide retry actions when useful.

---

# 42. TOASTS

Use unobtrusive toast notifications for:

* Post published
* Profile updated
* Follow successful
* Post saved
* Link copied
* Message sent
* Upload failed

Do not overuse toasts.

---

# 43. MODALS AND BOTTOM SHEETS

Use appropriate interaction patterns.

Desktop:

* Modal/dialog

Mobile:

* Bottom sheet
* Full-screen sheet where appropriate

Examples:

* Post menu
* Delete confirmation
* Share menu
* User options
* Settings

---

# 44. ACCESSIBILITY

Follow accessibility best practices.

Implement:

* Semantic HTML
* Keyboard navigation
* Focus management
* ARIA labels
* Visible focus states
* Sufficient contrast
* Alt text
* Accessible dialogs
* Screen-reader-friendly controls

All icon-only buttons must have accessible labels.

---

# 45. PERFORMANCE

Optimize aggressively.

Implement:

* Lazy-loaded routes
* Lazy-loaded images
* Responsive image transformations
* Pagination
* Infinite scroll where appropriate
* Firestore query limits
* Memoization where beneficial
* Code splitting
* Efficient listeners
* Debounced search
* Optimistic updates where safe

Do not fetch data that is not needed.

---

# 46. FIRESTORE PAGINATION

Never fetch unlimited documents.

Use:

* `limit()`
* `startAfter()`
* Cursor pagination

Implement infinite scroll or "load more" appropriately.

---

# 47. FIRESTORE SECURITY

Create proper Firestore security rules.

Users must only be able to:

* Modify their own profile.
* Modify their own posts.
* Delete their own posts.
* Modify their own comments.
* Modify their own stories.
* Manage their own saved posts.
* Access private content according to privacy rules.
* Access conversations they participate in.
* Modify only permitted data.

Do not use insecure rules such as:

```text
allow read, write: if true;
```

Never ship permissive production rules.

---

# 48. DATA VALIDATION

Validate both client-side and server-side where applicable.

Never trust client input.

Validate:

* Text lengths
* File types
* File sizes
* IDs
* Permissions
* Ownership
* Relationships

Sanitize user-generated content.

Prevent malicious content from becoming executable HTML.

---

# 49. SECURITY

Protect against:

* Unauthorized document access
* Privilege escalation
* Duplicate interactions
* Spam
* Malicious input
* XSS
* Unauthorized media manipulation
* Excessive database reads

Never put private server credentials in client-side code.

---

# 50. MEDIA SECURITY

Cloudinary upload configuration must be handled securely.

Do not expose sensitive API secrets.

If signed uploads are necessary, implement them through a secure backend/Cloud Function.

The provided unsigned upload preset may be used only according to its configured permissions.

---

# 51. FIREBASE INITIALIZATION

Create a dedicated Firebase configuration module.

Example:

```text
src/firebase/config.ts
```

Initialize:

* Firebase App
* Auth
* Firestore
* Any required Firebase services

Avoid initializing Firebase repeatedly.

---

# 52. AUTH STATE

Create a centralized authentication state.

Expose:

```ts
user
loading
isAuthenticated
```

Handle:

* Initial auth loading
* Signed-in state
* Signed-out state

Protect authenticated routes.

---

# 53. ROUTING

Implement clean routes.

Example:

```text
/
 /login
 /signup
 /forgot-password
 /home
 /explore
 /search
 /create
 /messages
 /messages/:conversationId
 /notifications
 /profile/:username
 /settings
 /saved
 /post/:postId
 /hashtag/:tag
```

Adjust routes if a better architecture is appropriate.

Unknown routes should display a polished 404 page.

---

# 54. FEED ALGORITHM

Do not hardcode feed content.

At minimum:

1. Retrieve posts from followed users.
2. Sort according to a sensible ranking strategy.
3. Include recent content.
4. Support pagination.

If a more advanced ranking system is implemented, consider:

* Recency
* Engagement
* Relationship strength
* Content relevance

Keep the first implementation reliable and understandable.

---

# 55. RECOMMENDATIONS

Implement "Suggested for you" using dynamic data.

Possible signals:

* Mutual followers
* Popular users
* Recent activity
* Similar interests

Do not recommend the current user.

Do not show users they already follow.

---

# 56. PROFILE GRID

Profile posts should display in a responsive grid.

Use proper aspect-ratio containers.

Avoid layout shifts.

Use optimized Cloudinary thumbnails.

Clicking a post opens a post detail experience.

---

# 57. POST DETAIL

Implement a dedicated post detail view.

Display:

* Media
* Author
* Caption
* Likes
* Comments
* Actions
* Timestamp

Desktop may use a split media/details layout.

Mobile may use a vertically optimized layout.

---

# 58. INTERACTION DESIGN

Buttons must provide immediate visual feedback.

Examples:

Like:

* Animate subtly
* Change visual state
* Update count optimistically

Save:

* Toggle state immediately

Follow:

* Toggle immediately when safe
* Roll back if request fails

Do not create excessive animations.

---

# 59. ANIMATION

Use subtle, premium motion.

Examples:

* Modal entrance
* Bottom sheet entrance
* Like animation
* Story transitions
* Toast entrance
* Page transitions

Animations should generally be:

* Fast
* Smooth
* Purposeful

Respect:

```css
prefers-reduced-motion
```

---

# 60. TYPOGRAPHY

Create a consistent type scale.

Prioritize:

* Readability
* Hierarchy
* Mobile legibility
* Strong metadata distinction

Avoid excessive font weights.

---

# 61. COLOR SYSTEM

Create semantic design tokens.

Example categories:

```text
background
surface
surfaceElevated
textPrimary
textSecondary
border
accent
danger
success
warning
```

Do not scatter arbitrary colors throughout the codebase.

---

# 62. ICONS

Use a consistent icon library.

Do not mix unrelated icon styles.

Icons must have:

* Consistent stroke/weight
* Appropriate sizing
* Accessible labels

---

# 63. FORMS

All forms must include:

* Labels
* Validation
* Error states
* Loading states
* Success states
* Disabled states

Never rely only on placeholder text for field labels.

---

# 64. PROFILE IMAGE UPLOAD

Allow users to:

1. Select image.
2. Preview image.
3. Crop if appropriate.
4. Upload to Cloudinary.
5. Save resulting URL/metadata to Firestore.

Display fallback avatar if no profile image exists.

---

# 65. POST DELETION

Users can delete their own posts.

Require confirmation.

After deletion:

* Remove post from feed
* Remove or handle associated interactions appropriately
* Update profile count

Use a safe deletion strategy.

---

# 66. COMMENT DELETION

Users can delete their own comments.

Post owners may optionally moderate comments on their posts.

---

# 67. BLOCKING

Implement user blocking.

When user A blocks user B:

* Prevent unwanted interactions.
* Hide appropriate content.
* Prevent messaging where appropriate.
* Remove relationship as appropriate.

Ensure security rules and client behavior are aligned.

---

# 68. REPORTING

Implement report functionality.

Allow reporting:

* Post
* Comment
* User
* Message/content where appropriate

Store reports securely.

Example:

```text
reports/{reportId}
```

Include:

* reporterId
* targetId
* targetType
* reason
* createdAt
* status

---

# 69. CONTENT MODERATION ARCHITECTURE

Do not claim automated moderation exists unless actually implemented.

Design the data architecture so moderation can be added later.

Possible fields:

```ts
moderationStatus:
  "pending"
  | "approved"
  | "flagged"
  | "removed"
```

---

# 70. SEO

For publicly accessible pages where relevant:

* Proper document titles
* Meta descriptions
* Open Graph metadata
* Canonical URLs where appropriate

Authenticated application pages can remain app-oriented.

---

# 71. PWA-READY DESIGN

Structure the application so it can later support:

* Installable PWA
* Offline shell
* Push notifications

Do not fake offline functionality.

---

# 72. DATABASE INDEXING

Identify Firestore queries that require indexes.

Create the necessary indexes.

Do not ignore Firestore query constraints.

---

# 73. FIRESTORE TIMESTAMPS

Use Firebase server timestamps where appropriate.

Do not rely on client device clocks for authoritative creation timestamps.

---

# 74. USERNAME SYSTEM

Usernames must:

* Be unique
* Be normalized for lookup
* Follow a defined format
* Avoid dangerous characters
* Have a reasonable length

Create an efficient username lookup strategy.

---

# 75. DATA TYPES

Use TypeScript types/interfaces for major entities.

At minimum:

```ts
User
Post
PostMedia
Comment
Story
Notification
Conversation
Message
Follow
Report
```

Avoid `any` unless genuinely necessary.

---

# 76. STATE MANAGEMENT

Keep state predictable.

Separate:

* Authentication state
* Server/database state
* UI state
* Form state

Do not place every piece of state into one global store.

---

# 77. FIRESTORE READ OPTIMIZATION

Be conscious of Firebase costs.

Avoid:

* Repeated identical queries
* Unnecessary real-time listeners
* Fetching entire collections
* Re-fetching unchanged data
* N+1 queries where avoidable

Cache data appropriately.

---

# 78. CLOUDINARY OPTIMIZATION

Use Cloudinary transformations for:

* Thumbnail generation
* Responsive sizing
* Compression
* Quality optimization
* Video optimization

Use appropriate transformations based on displayed dimensions.

---

# 79. RESPONSIVE MEDIA

Images should use:

```text
object-fit: cover
```

or

```text
object-fit: contain
```

based on context.

Do not distort images.

Preserve useful aspect ratios.

---

# 80. VIDEO UX

Videos should support:

* Play/pause
* Mute/unmute
* Poster/thumbnail
* Responsive sizing
* Appropriate autoplay behavior
* Mobile-friendly controls

Do not autoplay videos with unexpected audio.

---

# 81. ACCESSIBLE MEDIA

Every user-uploaded image should support an alt-text strategy.

If explicit alt text is provided, use it.

Otherwise use sensible fallback text rather than meaningless values.

---

# 82. MOBILE STORY VIEWER

The story viewer should support:

* Tap left/right navigation
* Progress indicator
* Close
* Pause while holding where practical
* Swipe/gesture-friendly interaction
* Video playback
* Automatic progression

Do not create inaccessible gesture-only controls.

---

# 83. MESSAGING MOBILE UX

The message composer should:

* Stay above the keyboard where possible.
* Support multiline text.
* Provide send button.
* Prevent accidental submission.
* Scroll to latest message intelligently.

Do not force the user to manually scroll every time a new message arrives.

---

# 84. NOTIFICATION READ STATES

Support:

* Unread
* Read

Provide a clear visual distinction.

Do not mark notifications read simply because they were fetched unless that behavior is intentional.

---

# 85. USER EXPERIENCE DETAILS

Include:

* Skeleton loaders
* Smooth state transitions
* Disabled buttons during network operations
* Retry buttons
* Confirmation dialogs for destructive actions
* Helpful empty states
* Clear success states

Every important action should have a visible result.

---

# 86. ERROR BOUNDARIES

Implement application-level error boundaries.

If one component fails, do not necessarily crash the entire application.

Provide a recovery experience.

---

# 87. NETWORK FAILURE

Handle:

* Offline state
* Slow network
* Failed upload
* Failed Firestore request
* Authentication failure

Do not silently fail.

---

# 88. DUPLICATE SUBMISSIONS

Prevent users from accidentally:

* Publishing the same post twice
* Sending duplicate messages
* Creating duplicate follows
* Liking the same content repeatedly

Use proper IDs/transactions where necessary.

---

# 89. FIRESTORE TRANSACTIONS

Use transactions/batched writes when consistency requires atomic updates.

Examples:

* Like count + like record
* Follow count + relationship
* Comment count + comment
* Notification creation + action

Choose carefully to avoid excessive transaction contention.

---

# 90. SECURITY RULE DESIGN

Write Firestore rules based on authenticated identity:

```text
request.auth.uid
```

Never trust a client-provided:

```text
userId
```

for authorization.

Ownership must be validated against authenticated user identity.

---

# 91. DEVELOPMENT EXPERIENCE

Create:

* `.env.example`
* Clear setup instructions
* Firebase setup instructions
* Cloudinary setup instructions
* Firestore rules
* Firestore indexes
* Deployment instructions

Never commit secret credentials.

---

# 92. ENVIRONMENT VARIABLES

Use environment variables for configuration where appropriate.

Example:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID

VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_UPLOAD_PRESET
```

Important:

Firebase web configuration values are not equivalent to private server secrets.

Never place Cloudinary API secret credentials in frontend environment variables.

---

# 93. UI QUALITY BAR

Before considering the application complete, inspect every screen visually.

Ask:

* Does this look like a professional consumer product?
* Is spacing consistent?
* Are typography levels clear?
* Are icons aligned?
* Are touch targets large enough?
* Does the mobile experience feel native?
* Are loading states polished?
* Are empty states intentional?
* Does dark mode look designed rather than inverted?
* Are interactions obvious?
* Are animations subtle?

Fix anything that looks like a prototype.

---

# 94. DO NOT CREATE A FAKE DEMO

This requirement is critical.

Do NOT:

* Fake authentication
* Fake posts
* Fake messages
* Fake notifications
* Fake follower counts
* Hardcode profile data
* Hardcode likes
* Hardcode comments
* Use static JSON as the application's permanent data source
* Simulate successful Firebase operations without actually performing them

The finished application must actually work with Firebase and Cloudinary.

---

# 95. IMPLEMENTATION WORKFLOW

Follow this order.

## Phase 1 — Architecture

First establish:

* Project structure
* Firebase integration
* Authentication
* Firestore
* Cloudinary
* Routing
* Design system

## Phase 2 — Authentication

Build:

* Login
* Signup
* Google auth
* Forgot password
* Protected routes
* Auth state

## Phase 3 — User System

Build:

* Profiles
* Profile editing
* Follow system
* Privacy

## Phase 4 — Content

Build:

* Create post
* Cloudinary uploads
* Feed
* Post details
* Likes
* Comments
* Saves
* Sharing

## Phase 5 — Stories

Build:

* Story creation
* Story tray
* Story viewer
* Story views
* Expiration

## Phase 6 — Discovery

Build:

* Search
* Explore
* Hashtags
* Recommendations

## Phase 7 — Communication

Build:

* Notifications
* Direct messages

## Phase 8 — Settings

Build:

* Account
* Privacy
* Notifications
* Theme
* Security

## Phase 9 — Quality

Perform:

* Responsive testing
* Accessibility testing
* Security review
* Firestore rule review
* Performance optimization
* Error handling
* Empty-state review

---

# 96. BUILD STRATEGY

Do not attempt to generate a huge amount of disconnected code at once.

Work feature-by-feature.

For each feature:

1. Define data model.
2. Define Firestore operations.
3. Define security requirements.
4. Define reusable components.
5. Implement service layer.
6. Implement UI.
7. Connect UI to Firebase.
8. Add loading states.
9. Add error states.
10. Test the feature.
11. Check mobile responsiveness.
12. Move to the next feature.

Maintain compatibility with previously implemented features.

Do not rewrite working features unnecessarily.

---

# 97. WHEN SOMETHING IS AMBIGUOUS

Make a professional engineering decision.

Prioritize:

1. Security
2. Data integrity
3. User experience
4. Mobile usability
5. Performance
6. Maintainability
7. Visual polish

Do not stop unnecessarily to ask trivial implementation questions.

---

# 98. OUTPUT REQUIREMENTS FOR THE CODING AGENT

When implementing:

* Explain what is being built briefly.
* Create the required files.
* Provide complete code, not pseudo-code.
* Do not omit critical implementation details.
* Do not replace functionality with comments such as:
  `// implement later`
* Do not leave TODOs for core functionality.
* Keep TypeScript types accurate.
* Ensure imports are valid.
* Ensure components compile.
* Ensure Firebase queries match the data model.
* Ensure Firestore rules correspond to the actual schema.

---

# 99. FINAL VALIDATION

Before declaring Friend complete, verify:

## Authentication

* Email signup works
* Email login works
* Google login works
* Logout works
* Password reset works

## Profiles

* Profile creation works
* Profile editing works
* Avatar upload works
* Username uniqueness works

## Social

* Follow works
* Unfollow works
* Private account works
* Likes work
* Comments work
* Replies work
* Saves work
* Shares work

## Posts

* Image upload works
* Video upload works
* Carousel works
* Captions work
* Hashtags work
* Mentions work
* Delete works

## Stories

* Upload works
* Viewer works
* Expiration works
* View tracking works

## Discovery

* Search works
* Explore works
* Hashtags work
* Suggestions are dynamic

## Communication

* Notifications work
* Messages work
* Unread states work

## Security

* Unauthorized users cannot modify other users' content.
* Private profiles enforce access restrictions.
* Message privacy is enforced.
* Firestore rules are not permissive.

## Responsive

Test:

* 320px
* 375px
* 390px
* 430px
* 768px
* 1024px
* 1280px
* 1440px
* 1920px

## UX

Verify:

* Loading states
* Empty states
* Error states
* Toasts
* Modals
* Bottom sheets
* Keyboard interaction
* Touch interaction
* Accessibility

---

# 100. FINAL PRODUCT STANDARD

The final result should feel like a **real consumer social network**, not a coding exercise.

Friend must be:

* Beautiful
* Fast
* Responsive
* Dynamic
* Secure
* Accessible
* Maintainable
* Scalable
* Mobile-first
* Production-oriented

The UI should immediately communicate:

> "This is a polished social platform called Friend."

Do not copy Instagram's proprietary branding or exact interface.

Use Instagram as a **feature/category reference**, while creating an original Friend identity and design system.

Most importantly:

# DO NOT HARDcode application data.

# DO NOT BUILD A STATIC DEMO.

# USE FIREBASE AS THE PRIMARY APPLICATION DATABASE.

# USE FIREBASE AUTHENTICATION FOR IDENTITY.

# USE CLOUDINARY FOR IMAGE/VIDEO STORAGE AND DELIVERY.

# MAKE EVERY CORE FEATURE ACTUALLY FUNCTIONAL.

# MAKE MOBILE UX THE FIRST-CLASS EXPERIENCE.

# BUILD THE APPLICATION END-TO-END.

This version is intentionally structured so a coding agent can execute it **feature-by-feature rather than treating “clone Instagram” as a vague UI request**. It also explicitly separates Firebase's role as the application database from Cloudinary's role as the media layer.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
