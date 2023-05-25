import fs from 'fs/promises';

import puppeteer, {Browser, Page} from 'puppeteer';

export interface CrawlerServiceOptions {
    pageUrlGenerator: (pageNumber: number) => string;
    minimumPageIndex: number;
    maximumPageIndex: number;
    viewportWidth: number;
    viewportHeight: number;
    userAgent: string;
}

export class CrawlerService {
    private browser!: Browser;
    private page!: Page;
    private options!: CrawlerServiceOptions;

    public constructor({
        pageUrlGenerator = () => '',
        minimumPageIndex = 1,
        maximumPageIndex = 2,
        viewportWidth = 1920,
        viewportHeight = 1080,
        userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    }: Partial<CrawlerServiceOptions>) {
        this.options = {
            pageUrlGenerator,
            minimumPageIndex,
            maximumPageIndex,
            viewportWidth,
            viewportHeight,
            userAgent,
        };
    }

    public async run(): Promise<void> {
        await this.initializePuppeteer();

        const songPageUrls = await this.generateSongPageUrls();
        const downloadLinks = await this.generateDownloadLinks(songPageUrls);

        await this.writeDownloadLinksToOutputFile(downloadLinks);

        await this.browser.close();
    }

    private async initializePuppeteer(): Promise<void> {
        this.browser = await puppeteer.launch({
            headless: true,
            defaultViewport: {width: this.options.viewportWidth, height: this.options.viewportHeight, isMobile: false},
        });

        this.page = await this.browser.newPage();

        await this.page.setUserAgent(this.options.userAgent);
    }

    private async generateSongPageUrls(): Promise<string[]> {
        const songPageUrls: string[] = [];

        for (let i = this.options.minimumPageIndex; i <= this.options.maximumPageIndex; i++) {
            const urls = await this.extractSongPageUrlsFromListPage(i);
            songPageUrls.push(...urls);
        }

        return songPageUrls;
    }

    private async extractSongPageUrlsFromListPage(listPageIndex: number): Promise<string[]> {
        const listPageUrl = this.options.pageUrlGenerator(listPageIndex);

        console.log(`going to ${listPageUrl}`);
        await this.page.goto(listPageUrl, {waitUntil: 'domcontentloaded'});

        const selector = '.show-more';
        await this.page.waitForSelector(selector);

        return await this.page.evaluate((selector) => {
            const elements = Array.from(document.querySelectorAll<HTMLAnchorElement>(selector));
            return elements.map((element) => element.href);
        }, selector);
    }

    private async generateDownloadLinks(songPageUrls: string[]): Promise<string[]> {
        const downloadLinks: string[] = [];
        for (const songPageUrl of songPageUrls) {
            try {
                const downloadLink = await this.extractDownloadLinkFromSongPage(songPageUrl);
                downloadLinks.push(downloadLink);
            } catch {
                // ignored
            }
        }

        const validDownloadLinks = downloadLinks.filter(Boolean);
        console.log(validDownloadLinks.join('\n'));

        return validDownloadLinks;
    }

    private async extractDownloadLinkFromSongPage(songPageUrl: string): Promise<string> {
        console.log(`going to ${songPageUrl}`);
        await this.page.goto(songPageUrl, {waitUntil: 'domcontentloaded'});

        const selector = '.dl-320, .dl-128';
        await this.page.waitForSelector(selector, {timeout: 2000});

        return await this.page.evaluate((selector) => {
            const element = document.querySelectorAll<HTMLAnchorElement>(selector)[0];
            return element?.href || '<N/A>';
        }, selector);
    }

    private async writeDownloadLinksToOutputFile(downloadLinks: string[]): Promise<void> {
        await fs.writeFile('./output.txt', downloadLinks.join('\n'));
    }
}
