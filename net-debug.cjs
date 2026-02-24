const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    page.on('console', msg => {
        console.log('[BROWSER CONSOLE]', msg.type(), msg.text());
    });

    page.on('request', request => {
        if (request.url().includes('supabase.co')) {
            console.log('>>', request.method(), request.url());
        }
    });

    page.on('response', response => {
        if (response.url().includes('supabase.co')) {
            console.log('<<', response.status(), response.url());
        }
    });

    await page.goto('http://localhost:5173/login');

    await page.type('input[type="email"]', 'michaelmitry13@gmail.com');
    await page.type('input[type="password"]', 'Miko0019');
    await page.click('button[type="submit"]');

    await page.waitForNavigation();

    await new Promise(r => setTimeout(r, 6000));
    await browser.close();
})();
