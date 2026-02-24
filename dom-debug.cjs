const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    await page.goto('http://localhost:5173/login');

    await page.type('input[type="email"]', 'michaelmitry13@gmail.com');
    await page.type('input[type="password"]', 'Miko0019');
    await page.click('button[type="submit"]');

    await page.waitForNavigation();

    // Wait exactly 5 seconds for data to load
    await new Promise(r => setTimeout(r, 5000));

    const stats = await page.evaluate(() => {
        try {
            const textBlocks = Array.from(document.querySelectorAll('p')).map(p => p.innerText);
            return textBlocks.join(' | ');
        } catch (e) {
            return 'Error: ' + e.message;
        }
    });

    console.log('UI TEXT:', stats);

    await browser.close();
})();
