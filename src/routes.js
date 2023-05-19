import { Dataset, createPlaywrightRouter, KeyValueStore } from 'crawlee';
import dayjs from 'dayjs';
export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ page, enqueueLinks, log }) => {
    log.info(`enqueueing new URLs`);

    for(const article of await page.getByRole('article').all()) {
        const dateLocator = await article.locator('span.date');
        const headingLocator = await article.locator('h2');
        const linkLocator = await headingLocator.locator('a');
        const date = await dateLocator.innerText();
        const dayDate = dayjs(date);
        log.info(dayDate);
        const url = await linkLocator.evaluate((a) => a.href);
        const key = url.replaceAll('/', '_').replaceAll(':', '-');
        await KeyValueStore.setValue(key, date);
    }

    await enqueueLinks({
        globs: ['https://sanangelolive.com/news/**/**'],
        label: 'detail',
        exclude: [
            'https://sanangelolive.com/news/live',
            'https://sanangelolive.com/news/business',
            'https://sanangelolive.com/news/county',
            'https://sanangelolive.com/news/crashes',
            'https://sanangelolive.com/news/crime',
            'https://sanangelolive.com/news/education',
            'https://sanangelolive.com/news/entertainment',
            'https://sanangelolive.com/news/health',
            'https://sanangelolive.com/news/national',
            'https://sanangelolive.com/news/international',
            'https://sanangelolive.com/news/live-thought',
            'https://sanangelolive.com/news/outdoors',
            'https://sanangelolive.com/news/politics',
            'https://sanangelolive.com/news/rodeo',
            'https://sanangelolive.com/news/san-angelo',
            'https://sanangelolive.com/news/sports',
            'https://sanangelolive.com/news/cover1',
            'https://sanangelolive.com/news/texas',
            'https://sanangelolive.com/news/urban-texas'
        ]
    });
});

router.addHandler('detail', async ({ request, page, log }) => {
    const title = await page.title();
    log.info(`${title}`, { url: request.loadedUrl });
    const key = request.loadedUrl.replaceAll('/', '_').replaceAll(':', '-');
    const date = await KeyValueStore.getValue(key);

    const articleLocator = page.locator('.block-region-article-content').first();
    const articleContent = await articleLocator.evaluateAll((ps) => ps.map((p) => `${p.innerText}`));

    await Dataset.pushData({
        url: request.loadedUrl,
        title,
        date,
        articleContent
    });
});
