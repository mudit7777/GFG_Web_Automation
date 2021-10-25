let minimist = require("minimist");
let puppeteer = require("puppeteer");
let fs = require("fs");
let pdf = require("pdf-lib");
let args = minimist(process.argv);
let path = require("path");

// run -> fetchQuestions.js --config=config.json --dataFolder=Companies

let configJson = fs.readFileSync(args.config, "utf-8");
// configJSON ka object bana do 
let config = JSON.parse(configJson);
fs.mkdirSync(args.dataFolder);

(async function() {
    // browser launching
    let browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ["--start-maximized"]
    });
    let pages = await browser.pages();
    let page = pages[0];

    await page.goto("https://www.geeksforgeeks.org/");

    await page.waitFor(5000);

    // await page.waitForSelector("span.close");
    // await page.click("span.close");
 
    await page.waitForSelector("a.header-main__signup.login-modal-btn");
    await page.hover("a.header-main__signup.login-modal-btn");
    await page.click("a.header-main__signup.login-modal-btn");

    await page.waitForTimeout(4000);

    // # -> id tag ke lie 
    await page.waitForSelector("input#luser");
    await page.type("input#luser", config.username, { delay: 100 });
    

    await page.waitForTimeout(2000);

    await page.waitForSelector("input#password");
    await page.type("input#password", config.password, { delay: 100 });

    // await page.waitForTimeout(2000);

    // await page.waitForSelector("input[type='checkbox]");
    // await page.click("input[type='checkbox']", {delay: 200});

    await page.waitForTimeout(2000);

    await page.waitForSelector(".btn.btn-green.signin-button");
    await page.click(".btn.btn-green.signin-button");

    await page.waitForTimeout(3000);

    // tutorial pe click 
    await page.waitForSelector(".gfg-icon.gfg-icon_arrow-down.gfg-icon_header");
    await page.hover(".gfg-icon.gfg-icon_arrow-down.gfg-icon_header");
    await page.click(".gfg-icon.gfg-icon_arrow-down.gfg-icon_header");

    // click on interview corner 
    


    await page.waitForTimeout(000);
    await page.waitForSelector("i.gfg-icon.gfg-icon_arrow-right");
    await page.click("i.gfg-icon.gfg-icon_arrow-right");

    await page.waitForTimeout(3000);

    await page.waitForSelector('li.mega-dropdown__list-item a[href="https://practice.geeksforgeeks.org/company-tags"]');
    await page.hover('li.mega-dropdown__list-item a[href="https://practice.geeksforgeeks.org/company-tags"]');
    await page.click('li.mega-dropdown__list-item a[href="https://practice.geeksforgeeks.org/company-tags"]');

    await page.waitForTimeout(3000);
    await page.waitForSelector("td.text-center a b");

    let TotalCompanies = await page.$$eval("td.text-center a b", function (CName) {
        let companyName = [];
        for (let i = 0; i < CName.length; i++) {
            let name = CName[i].textContent;
            companyName.push(name);
        }
        return companyName;
    });
    // https://practice.geeksforgeeks.org/explore/?company%5B%5D=Microsoft&page=1&company%5B%5D=Microsoft
    //https://practise.geeksforgeeks.org/explore/?company%5B%5D=Amazon&page=1&company%5B%5D=Amazon
    for (let i = 0; i < TotalCompanies.length; i++) {
        let url = "https://practice.geeksforgeeks.org/explore/?company%5B%5D=" + TotalCompanies[i] + "&page=1&company%5B%5D=" + TotalCompanies[i];
        let OpenNewTabForACompany = await browser.newPage();
        await OpenNewTabForACompany.waitForTimeout(2000);
        await OpenNewTabForACompany.bringToFront();
        await OpenNewTabForACompany.goto(url);

        await OpenNewTabForACompany.waitForTimeout(3000);

        await autoScroll(OpenNewTabForACompany);

        await OpenNewTabForACompany.waitForTimeout(3000);

        await createAndModifyPdf(OpenNewTabForACompany, TotalCompanies[i], url);

        await OpenNewTabForACompany.close();

        page.waitForTimeout(3000);

    }

})();

// function for auto scroll
async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
        var totalHeight = 0 ;
        var distance = 100;
        var timer = setInterval(() => {
            var scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if(totalHeight >= scrollHeight) {
                clearInterval(timer);
                resolve();
            }
          }, 100);
        })
    })
}

async function fetchProblemNames(OpenNewTabForACompany) {
    await OpenNewTabForACompany.waitForSelector("div.col-sm-6.col-md-6.col-lg-6.col-xs-12.item  div.panel-body > span");
    let ProblemName = await OpenNewTabForACompany.$$eval("div.col-sm-6.col-md-6.col-lg-6.col-xs-12.item  div.panel-body > span",
        function(span) {
            let problemSpan = [];
            for(let i = 0 ; i < span.length; i++) {
                let name = span[i].textContent;
                problemSpan.push(name);
          }
          return problemSpan;
        })
        return Promise.resolve(ProblemName);
}

async function createAndModifyPdf(OpenNewTabForACompany , companyName , url) {
    let pdf_document = await pdf.PDFDocument.create();
    let page = pdf_document.addPage();

    let YCordinates = 700;
    let ProblemName = await fetchProblemNames(OpenNewTabForACompany);
    let pages = pdf_document.getPages();
    let firstPage = pages[0];
        if(firstPage) {
            page.drawText(companyName + "Archives" , {
                x: 150 , y: 800, size: 24
            });
            page.drawText("[" + url + "]" , {
                x:100  , y: 750, size : 15
            });
        }
        for(let i = 0 ; i < ProblemName.length; i++) {
            if(YCordinates == 25 || YCordinates < 25) 
            {
                page = pdf_document.addPage(); YCordinates = 800;
            }
            page.drawText(ProblemName[i] , {
                x: 70,
                y: YCordinates,
                size: 14
            });
            YCordinates -= 25;
        }
        let finalPDF = await pdf_document.save();
        let CName = await companyName+".pdf";
        let one = path.join(args.dataFolder, CName);
        fs.writeFileSync(one, finalPDF);
};
