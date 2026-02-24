import puppeteer from 'puppeteer';

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

    console.log('Navigating to app...');
    // We navigate to the email callback route just like Zoho would redirect us.
    await page.goto('https://dec-milestone-tracker-new-407900536579.europe-west1.run.app/emails/callback?code=1000.b3f0b3e84817aee047b4870d5a7aff40.0d8c80e10eb7021174c78cdd659bfe18&location=us&accounts-server=https%3A%2F%2Faccounts.zoho.com', { waitUntil: 'networkidle2' });

    console.log('Waiting for 5 seconds to let React render and execute effects...');
    await new Promise(r => setTimeout(r, 5000));

    await browser.close();
    console.log('Done.');
})();
