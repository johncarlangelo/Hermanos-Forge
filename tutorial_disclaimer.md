Privacy/local-only reassurance — belongs early, before anyone installs anything, since it's the thing that makes people comfortable doing the rest: "This stays entirely on your device. Hermanos Forge — and its developer — never sees, stores, or sends your cookies anywhere. They're saved in a local file on this computer only, used only to talk to YouTube."

Don't share this file — belongs right before the import step, since that's the exact moment a sensitive file is in their hands: "⚠️ This file can contain login info for other sites too. Never share it or upload it anywhere. Hermanos Forge automatically keeps only the YouTube-related cookies and discards the rest once you import it." — this also gives you a concrete reason to keep the domain-filtering step, not just as good practice but as something you can point to in this exact sentence.

It'll expire, you'll need to redo this — belongs at the confirmation screen (so it's the last thing they see, sets expectation going forward), and gets echoed later by the stale-cookie notification you already designed: "This usually stays working for a few weeks. If downloads start failing again, just repeat these steps — you'll get a heads-up in the app when that happens."

ULR FOR THE CHROMIUM EXTENSION: https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc

use this to point the user the correct extension to use.

use this as reference for this cookie passing feature: https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp

### Technical Validation of Cookie Handling

For users requesting validation on how their cookies are securely processed during Drag & Drop import:
1. **Path Resolution:** The front-end safely grabs the absolute file path of the dropped file and sends it to the local Node.js backend.
2. **Validation:** The backend opens the file and checks the very first line to ensure it has a valid `# Netscape HTTP Cookie File` header. If not, it rejects it.
3. **Filtering (Security Step):** The backend reads the file line by line and **discards everything** except cookies belonging to `.youtube.com` or `.google.com`. This ensures that other session cookies (e.g. banking, social media) never touch the app data.
4. **Saving:** It writes the filtered, safe list of YouTube cookies directly into `%AppData%\Hermanos Forge\cookies.txt` and records metadata.
5. **Cleanup:** The original downloaded file remains untouched in the user's Downloads folder, but users are advised they can safely delete it after import.