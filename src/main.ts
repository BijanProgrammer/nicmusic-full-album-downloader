import {CrawlerService, CrawlerServiceOptions} from './services/crawler.service';

const BASE_URL =
    'https://nicmusic.net/category/%d8%a2%d9%87%d9%86%da%af%d9%87%d8%a7%db%8c-%d9%85%d8%ad%d8%b3%d9%86-%db%8c%da%af%d8%a7%d9%86%d9%87';

const main = async () => {
    const options: Partial<CrawlerServiceOptions> = {
        pageUrlGenerator: (pageNumber) => `${BASE_URL}/page/${pageNumber}/`,
        minimumPageIndex: 1,
        maximumPageIndex: 6,
    };

    const crawlerService = new CrawlerService(options);
    await crawlerService.run();
};

main().then(() => console.log('done!'));
