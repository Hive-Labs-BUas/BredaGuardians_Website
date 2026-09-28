# Breda Guardians Esports Hub

Build a website for Breda Guardians, a competitive esports community based at Breda University of Applied Sciences (BUas). This should feel like a real, modern, professional esports organization site — energetic and community-driven, not a generic template. Be explicit and literal with every instruction below; do not simplify or skip details.

Visual Identity
Colors: Primary gold 
#F2C744 used boldly and visibly throughout (buttons, section accents, borders, icons) — not just as a thin decorative line. Primary background is deep near-black 
#0A0A0A. Card/section surfaces use dark charcoal 
#1A1A1A or 
#1E1E1E, always slightly lighter than the page background so cards visibly stand out against it. Text on dark backgrounds is off-white 
#F5F5F5, never pure white.
Typography: Headings and major titles use a bold, condensed, slightly angular display font — specifically Rajdhani (weight 700) or Teko (weight 600), whichever renders more cleanly. Body text, navigation labels, buttons, and all UI copy use Inter (weight 400 for body, 600 for emphasis/buttons). Headings should be noticeably larger and bolder than body text — aim for a clear size jump (e.g. a page's main heading should be at least 2.5x the size of body paragraph text).
Corners & surfaces: Every card, button, input field, and image container uses consistently rounded corners (approximately 12-16px radius) — no sharp/square corners anywhere in the interface.
Spacing: Generous whitespace between sections (large vertical padding, not cramped) so the page feels premium and easy to scan, not dense.
Overall mood: Modern dark mode, confident and competitive, clean and uncluttered — every section should have one clear focal point, not multiple competing elements.
Hero Section
Full-width hero taking up most of the first screen's height on both desktop and mobile.
A large, bold character/key-art illustration as the visual centerpiece — a stylized gaming character or mascot-style figure, positioned so it visually breaks out of its container (e.g. angled, extending past the section's edge) rather than sitting in a plain rectangular box. Use a dark, moody background behind/around the character, with the gold accent color used in lighting highlights or a subtle glow effect around the character.
Headline: short and punchy, 2-4 words, in the display font, very large size (e.g. something in the spirit of "WE ARE GUARDIANS" or "BUILT TO COMPETE" — pick wording that fits, but keep it this short and bold).
One subheading line beneath the headline (a single sentence, not a paragraph) explaining who Breda Guardians is.
One bold primary CTA button directly under the subheading (e.g. "Join The Community" or "Meet The Teams").
A small, subtle "scroll down" indicator (arrow icon or text) near the bottom of the hero, animated with a gentle bounce.
The hero section's bottom edge should be a diagonal/angled cut (not a straight horizontal line) transitioning into the next section below it.
Navigation
A sticky top navigation bar, dark background (
#0A0A0A or 
#1A1A1A), gold accents on hover/active states, present identically on every single page of the site.
Logo on the far left. Nav links center or right-aligned: Home, About, Teams/Hall of Fame, News, Membership, FAQ, Contact.
A distinct "Login" or account/avatar element on the far right (shows Discord avatar and username once logged in).
Desktop: standard horizontal nav bar, all links visible at once, no collapsing.
Mobile: replace the desktop nav with a fixed bottom tab bar containing icons + short labels for the 5 most important sections (e.g. Home, Teams, News, Membership, Account) — this bottom bar should remain visible at all times while scrolling, similar to a native mobile app's tab bar. Do not rely only on a hamburger menu for primary navigation on mobile.
Mobile-First

Design and build mobile-first — the mobile layout is the primary design target, and desktop is the expanded version, not the other way around.

Page and section transitions on mobile should use smooth slide or fade animations (roughly 200-300ms), not instant hard cuts or full page reloads.
All tap targets (buttons, links, form fields) must be large enough for comfortable thumb use — minimum 44x44px touch area.
Where a section shows multiple cards (News, Hall of Fame highlights, Research entries), make them horizontally swipeable on mobile instead of stacking every card vertically.
Do not use hover-only interactions anywhere (e.g. a tooltip or reveal that only appears on mouse hover) since these don't work on touchscreens — every interactive element must be usable with a tap.
Every single feature — Discord login, Membership purchase flow, Contact form, Newsletter signup, Admin panel — must be fully functional and comfortable to use on a phone screen, tested at a width of roughly 375px.
Structural Inspiration
Scrolling fact ticker: A thin horizontal strip directly beneath the hero section, dark background, containing short facts separated by a divider (e.g. "Est. 2020 - Breda, Netherlands - Competing at the Top - BUas Esports"), scrolling continuously and smoothly from right to left in an infinite loop, never stopping.
"What We Do" section: Three columns on desktop (stacked vertically on mobile), each numbered "01", "02", "03" in large gold text, with a short bold title (e.g. "Compete", "Community", "Content"), one sentence of description beneath each, and a small text link at the bottom of each column pointing to a relevant page.
Partners marquee: A horizontal strip of partner/sponsor logos that scrolls automatically and continuously from left to right (or right to left) in an infinite loop, rather than a static grid of logos.
"Choose Your Path" CTA block: Placed near the bottom of the homepage, three distinct cards side by side (stacked on mobile), each targeting a different visitor type: one labeled "Player" with a short line about trying out and a button linking to the tryout/application flow; one labeled "Partner" with a line about sponsorship and a button linking to Contact; one labeled "Curious" with a line about meeting the team and a button linking to the About or Staff page.
Call-to-Action Buttons

Define and reuse exactly one consistent CTA button system across the entire site:

Primary CTA: solid gold (
#F2C744) background, dark near-black text, rounded corners (12-16px), bold label text. On hover: slightly brighten the gold and scale up by about 3-5%.
Secondary CTA: transparent/dark background with a gold border and gold text, same corner radius as primary. Used for a less dominant action placed next to a primary CTA (e.g. "Learn More" next to "Join Now").
Button labels are always short and action-driven - examples: "Join Discord", "Get Membership", "Apply Now", "View Teams". Never use vague labels like "Click Here" or "Submit" alone.
Every page has exactly one clearly dominant primary CTA — avoid placing multiple primary-styled buttons competing for attention in the same view.
Footer

A footer with identical content and layout on every page, dark background (
#0A0A0A), gold accent details:

Left section: logo plus one short tagline sentence beneath it (e.g. "Breda's competitive esports community.").
Middle section: three grouped columns of text links with clear headers above each group — "Quick Links" (Home, About, Teams), "Organization" (Staff, Partners, Contact), "Community" (Discord, Instagram, Twitch, YouTube — whichever apply).
A prominent "Join Our Discord" button, styled exactly like the site's primary CTA (solid gold, rounded), placed clearly in the footer — not a plain text link.
A row of social media icons linking out to the relevant profiles.
A bottom line with copyright text (e.g. "© 2026 Breda Guardians. All rights reserved.") and a link to the Privacy Policy page.
Authentication
Regular visitors log in / sign up using Discord OAuth only. Logging in via Discord automatically creates an account, pulling the user's Discord username and avatar image into their profile.
Logged-in users get an account page showing: their Discord username and avatar, current membership status (active/inactive, and which tier if applicable), and a simple order/payment history list.
Admin Panel Access (Dummy Login)

In addition to Discord OAuth for regular users, set up a separate, simple email + password login specifically for admin/staff access to the Admin Panel, so it can be tested without needing a real Discord account connected as staff.

Admin access is granted per account in the database; no credentials are stored in the code.
Membership
A Membership page presented as a modern pricing showcase, not a plain list: pricing tiers shown as side-by-side cards (stacked on mobile), each card containing a tier name, price, a short bullet list of included perks with a small checkmark or icon beside each one, and its own bold CTA button at the bottom of the card.
If there is more than one tier, visually highlight one card as "Most Popular" — give it a distinct gold border, a small badge/ribbon in the corner, and slightly larger size than the other cards so it stands out immediately.
Purchasing requires being logged in via Discord first; if a visitor isn't logged in, prompt them to log in via Discord before completing a purchase.
After a successful purchase, the user's account page should immediately reflect their new active membership status.
Above the pricing cards, include a short paragraph clearly explaining the real benefits of membership in plain language (not just repeating the feature list) — e.g. what a member actually gets to do that a non-member can't.
Pages

About / What We Offer — Explains Breda Guardians' mission, values, and what the community actually does: competitive teams, community events, and the Hive (a physical gaming space). Present this content in bold, angled or offset card blocks rather than long paragraphs of plain text — break it into short, scannable sections with a heading and 2-3 sentences each.

Interns — Introduces the current interns running Breda Guardians. Each intern shown as a card with a photo, name, role/title, and one short sentence about what they do for the organization.

Join Us — For people interested in becoming an intern or getting involved. Show a short, visual step-by-step "How It Works" process near the top (e.g. three or four numbered steps: "1. Apply", "2. Interview", "3. Onboard"), followed by a large, bold, highly visible "Apply Now" primary CTA button leading to an application form or contact point. This page's CTA should be the single most visually prominent button on the entire site, since applying is the page's whole purpose.

Hall of Fame — Past achievements, tournament results, and standout members/teams, shown as bold card-based highlights (image, title/achievement, short description, date), not a plain text list.

Timeline — A vertical timeline layout showing Breda Guardians' history chronologically: each milestone as a point on the timeline with a date, short title, and one-sentence description, alternating left/right on desktop if space allows, stacked in a single column on mobile.

Research — A public archive of research and studies the community has produced. Each entry displayed as a card with a cover image, a category tag (small colored label, e.g. "Community Survey", "Case Study"), a date, a title, a short summary, and a "Read More" link/button to the full piece. Visitors can filter the archive by category using simple filter buttons or a dropdown above the grid. New entries are added, edited, or removed through the Admin Panel.

News — An announcements feed, most recent first, displayed as a card grid (image, title, short excerpt, date) rather than plain text rows.

Opening Hours — Displays the Hive's current weekly opening hours as a simple, clearly readable table or list (one row per day), plus a separate, visually distinct callout for any special closures or event days.

FAQ — A clean, categorized list of frequently asked questions, grouped under category headers, with each question expandable/collapsible (accordion-style) to reveal its answer.

Contact — A simple form with Name, Email, and Message fields, a clear "Send Message" primary CTA button, and a short line of text explaining this is for general inquiries (partners, parents, press) separate from the Discord community.

Homepage Additions
Partners/Sponsors section: the auto-scrolling logo marquee described above, including BUas's logo as the backing institution, placed directly on the homepage (not a separate page).
Newsletter signup section: a simple section with a short headline (e.g. "Stay Updated"), one email input field, and a "Subscribe" button, for visitors who want updates without creating a full account or joining Discord.
Admin Panel

A staff-only admin area, accessible only after logging in via the dummy admin login described above (or a real staff Discord account, if that's implemented instead), for managing site content without touching code. Include a clear sidebar or tab-based navigation between these sections:

News: create, edit, and delete News posts (title, image, content, publish date).
Research: create, edit, and delete Research entries (title, category tag, date, summary, cover image, link).
Hall of Fame: add and edit entries (image, title, description, date).
Opening Hours: edit each day's hours, and add/remove special event days or closures.
FAQ: add, edit, reorder, and delete FAQ entries and their categories.
Contact Submissions: view a list of messages submitted through the Contact form.
Newsletter Signups: view a list of collected email addresses.
Memberships: view a list of members with their tier and status.
SEO
Each page has its own unique meta title and meta description reflecting that page's specific content (not one generic set copied across the whole site).
Open Graph tags (title, description, image) on every page, so links shared on Discord or social media show a proper rich preview.
A generated sitemap.xml and a robots.txt file.
Structured data (schema.org "Organization" and/or "SportsTeam" markup) included on the homepage and About page.
All images properly sized and compressed for fast load times, with descriptive alt text.
Cookies & Privacy
A cookie consent banner shown on first visit, with clear "Accept" and "Reject" buttons, that doesn't reappear once a choice has been made.
A Privacy Policy page explaining what data is collected (Discord account info, membership/payment details, newsletter emails, contact form submissions) and how it's used, written to align with GDPR as a Dutch organization.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://breda-guardians-hub.lovable.app


## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
