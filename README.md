UofG (or anyone) Job Tracker

Honestly, I built this because Excel was driving me crazy.

I'm applying to internships right now, and tracking 50+ applications in a spreadsheet was impossible on my phone. I missed a deadline once because I couldn't check the date while I was on the bus, so I decided to build a proper mobile-friendly tracker.

How it works
It's a Kanban board (like Trello) but stripped down to just what a student needs:
1. The Funnel: You move jobs from "Applied" -> "Interview" -> "Offer" (hopefully).
2. Deadlines: The cards turn red if the application deadline is within 24 hours.
3. Import: You can upload your existing CSV so you don't have to re-type everything.

The CSV Parser
The most interesting part of this code is `utils/csvParser.ts`. I realized that job titles often have commas (e.g., "Engineer, Backend"), which breaks standard string splitting. I wrote a regex parser to handle quoted strings correctly so the data doesn't get corrupted during import.

Tech
React, Node.js, Express.
