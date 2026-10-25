NUDGE REFINED BUILD

1. Back up your existing Nudge data before replacing files.
2. Replace index.html, styles.css, app.js and manifest.json in the same existing project folder.
3. Do not delete or rename the project folder.
4. Restart Live Server and hard refresh with Ctrl+Shift+R.
5. Investment data is not displayed or used, but the old nudgeInvestments storage key is not deleted.
6. Existing transactions use nudgeFinanceTransactions. Existing nudgeSubscriptions are copied non-destructively into the new recurring section once.

V3: Rescan button changed to active navy styling and now displays a scan result.

V4: Added Dashboard with monthly expenses, recurring outflow, EMIs, outstanding balance, commitments, upcoming payments and recent expenses.

V5: Dashboard month navigation, amount privacy toggle, and broader legacy expense amount/date field migration.

V6: Correct support for amountPaise/costPaise, recurring commitments migration, and exact-name amount repair. Historical zero amounts without another source cannot be reconstructed.

V7: Import supports original Nudge version 7 backups with top-level transactions and payments. amountPaise is converted to rupees and exact IDs are preserved.

V8: Added SIP, Mutual Fund and Rotating Savings recurring categories; added Zomato / Swiggy and Blinkit / Zepto expense categories.

V9: Simplified Settings, CSV export, Light/Dark/Auto theme, and new Nudge logo/app icons.

V10: Simplified brand lockup to the N mark with Nudge beside it and Expense Tracker underneath. Removed the previous tagline.
