# AJ's Basketball Training Website

This is a simple one-page website for a basketball training business with a built-in booking request flow.

## What's included

- Landing page with basketball-specific branding
- Training services section
- Booking form with date and time slot picker
- Admin page for posting date-specific availability
- Text-message booking request submission
- Mobile-friendly layout

## Files

- `index.html` - page structure and content
- `admin.html` - schedule manager page
- `styles.css` - layout, colors, and responsive styling
- `script.js` - client booking logic
- `admin.js` - saved schedule management

## Customize your business info

Update these placeholders before publishing:

1. In `script.js`, edit `businessConfig`:
   - `businessName`
   - `phoneNumber`
2. In `index.html`, replace:
   - the footer email link
   - the footer phone number
   - any service prices or wording you want to change
3. In `admin.html`, use the schedule editor to post the dates and times you want clients to see

## How booking works

You choose available sessions in `admin.html`.

Clients then choose:

- session type
- date
- available time slot
- contact info
- training goals

When they click **Send Booking Request**, the site opens a text message draft to your business phone number with the booking details filled in.

## How to manage availability

1. Open `admin.html`
2. Pick a date
3. Add one or more start/end times
4. Open `index.html`
5. Clients will only see the session times you posted for that date

## Open the site

You can open `index.html` directly in a browser.

If you want to run a local server instead, from this folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Next upgrade ideas

- connect to Calendly for real calendar syncing
- add online payments or deposits
- add a gallery, testimonials, and trainer bio
- connect the form to Formspree or a backend instead of text drafts
