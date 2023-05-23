const express = require("express");
const puppeteer = require("puppeteer-core");

require("dotenv").config();

const app = express();

app.get("/api", async (req, res) => {
  let browser;

  try {
    const auth = process.env.AUTH;
    const proxyUrl = process.env.PROXY_URL;
    const url = `wss://${auth}@${proxyUrl}`;

    browser = await puppeteer.connect({
      browserWSEndpoint: url,
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(2 * 60 * 1000);

    await page.goto(
      "https://www.linkedin.com/jobs/search/?currentJobId=3598748052&geoId=100506914&keywords=react%20developer"
    );

    const liElements = await page.evaluate(() => {
      const jobs = document.querySelectorAll(".jobs-search__results-list li");

      return Array.from(jobs).map((job) => {
        const titleName = job
          .querySelector("h3.base-search-card__title")
          .textContent.trim();
        const companyName = job
          .querySelector("a.hidden-nested-link")
          .textContent.trim();
        const locationName = job
          .querySelector("span.job-search-card__location")
          .textContent.trim();
        const link = job.querySelector("a.base-card__full-link").href;
        const imageLink = job
          .querySelector("img.artdeco-entity-image")
          .getAttribute("src");

        return {
          title: titleName,
          company: companyName,
          location: locationName,
          uri: link,
          thumb: imageLink,
        };
      });
    });

    const jsonString = JSON.stringify(liElements);

    res.send(jsonString);
  } catch (e) {
    console.log("Scrape failed", e);
    res.status(500).send("Scrape failed");
  } finally {
    await browser?.close();
  }
});

const serverPort = 3000;

app.listen(serverPort, () => {
  console.log(
    `\x1b[32m API is running on \x1b[0m`,
    `http://localhost:${serverPort}`
  );
});
