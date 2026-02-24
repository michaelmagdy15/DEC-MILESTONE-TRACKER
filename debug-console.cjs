const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    page.on('console', msg => {
        console.log('[BROWSER CONSOLE]', msg.type(), msg.text());
    });
    page.on('pageerror', err => {
        console.log('[PAGE ERROR]', err.message);
    });

    await page.goto('http://localhost:5173/login');

    await page.type('input[type="email"]', 'michaelmitry13@gmail.com');
    await page.type('input[type="password"]', 'Miko0019');
    await page.click('button[type="submit"]');

    await page.waitForNavigation();
    console.log('Navigated to dashboard');

    await new Promise(r => setTimeout(r, 4000));

    console.log('Clicking Log Out...');
    await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (let b of btns) {
            if (b.title === 'Sign Out') {
                b.click();
                break;
            }
        }
    });

    await new Promise(r => setTimeout(r, 2000));

    await browser.close();
})();
