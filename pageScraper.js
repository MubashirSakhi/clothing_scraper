const scraperObject = {
    url: 'https://pk.khaadi.com/',
    async scraper(browser, category) {
        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);
        await page.goto(this.url + category + ".html");
        // let selectedCategory = await page.$$eval('.side_categories > ul > li > ul > li > a', (links, _category) => {
        //     links = links.map(a => a.textContent.replace(/(\r\n\t|\n|\r|\t|^\s|\s$|\B\s|\s\B)/gm, "") === _category ? a : null);
        //     let link = links.filter(tx => tx !== null)[0];
        //     return link.href;
        // }, category);
        //await page.goto(selectedCategory);
        let scrapedData = [];
        async function scrapeCurrentPage() {
            // Wait for the required DOM to be rendered
            await page.waitForSelector('.page-main');
            // Get the link to all the required books
            let urls = await page.$$eval('div ol.products > li', links => {
                // Make sure the book to be scraped is in stock
                // links = links.filter(link => link.querySelector('.instock.availability > i').textContent !== "In stock")
                // // Extract the links from the data
                // console.log('shiz:');
                links = links.map(el => el.querySelector('div.product-top > a').href)
                return links;
            });


            let pagePromise = (link) => new Promise(async (resolve, reject) => {
                let dataObj = {};
                let newPage = await browser.newPage();
                await newPage.goto(link, { waitUntil: "networkidle2" });

                page.on('console', msg => console.log(msg.text()));
                dataObj['productTitle'] = await newPage.$eval('h1.product-name', text => text.textContent);
                dataObj['productPrice'] = await newPage.$eval('.product-info-price > div > span > span > span > span', text => text.textContent);
                dataObj['productDescription'] = await newPage.$eval('.product.attribute > .value', text => text.textContent);
                dataObj['imageUrl'] = await newPage.$eval('.active .product.item-image img.img-responsive ', img => {
                    console.log(img);
                    return img.src;
                });
                dataObj['productColor'] = await newPage.$eval('.swatch-attribute-selected-option', text => text.textContent);
                resolve(dataObj);

                await newPage.close();
            })
            //Warning: note well that you waited for the Promise using a for-in loop.
            //Any other loop will be sufficient but avoid iterating over your URL arrays 
            //using an array - iteration method like forEach, or any other method that uses 
            //a callback function.This is because the callback function will have to go 
            //through the callback queue and event loop first, hence, multiple page instances
            //will open all at once.This will place a much larger strain on your memory.

            for (link in urls) {
                let currentPageData = await pagePromise(urls[link]);
                scrapedData.push(currentPageData);
                console.log(currentPageData);
            }
            let nextButtonExist = false;
            try {
                const nextButton = await page.$eval('li.pages-item-next > a', a => {
                    console.log(a);
                    return a.href
                });
                nextButtonExist = true;
            }
            catch (error) {
                nextButtonExist = false;
            }
            if (nextButtonExist) {
                
                await page.click('li.pages-item-next > a');
                return scrapeCurrentPage();
            }
            await page.close();
            return scrapedData;

        }
        let data = await scrapeCurrentPage();
        console.log(data);
        return data;

    }
}

module.exports = scraperObject;