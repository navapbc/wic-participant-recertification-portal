import { Grid, GridContainer } from "@trussworks/react-uswds";
import React from "react";
import { Trans, useTranslation } from "react-i18next";

type imgObj = {
  src: string;
  alt: string;
  href: string;
};

export default function Index() {
  const { t } = useTranslation();
  const Griddify = (image_list: imgObj[]) => {
    const chunkSize = 4;
    const content = [];
    for (let i = 0; i < image_list.length; i += chunkSize) {
      const chunk = image_list.slice(i, i + chunkSize);
      content.push(
        <Grid
          row
          gap={6}
          className="usa-graphic-list__row margin-bottom-1"
          key={`logos-row-${i / 4 + 1}`}
        >
          {chunk.map((img) => (
            <Grid
              tablet={{ col: true }}
              className="usa-media-block"
              key={`logo-${img.alt}`}
            >
              <a key={img.href} href={img.href}>
                <img
                  src={img.src}
                  alt={img.alt}
                  className="usa-media-block__img height-15 width-15 "
                />
              </a>
            </Grid>
          ))}
        </Grid>
      );
    }
    return <>{content}</>;
  };
  return (
    <div>
      <section className="usa-hero" aria-label="Introduction">
        <GridContainer>
          <Grid offset={8}>
            <div className="usa-hero__callout">
              <h1 className="usa-hero__heading">
                <span className="usa-hero__heading--alt">
                  {t("Index.title")}:
                </span>
                <Trans i18nKey={"Index.subtitle"} />
              </h1>
              <p>{t("Index.subtitle2")}</p>
              <a className="usa-button" href="../README.md">
                {t("Index.button")}
              </a>
            </div>
          </Grid>
        </GridContainer>
      </section>

      <section className="grid-container usa-section">
        <Grid row gap>
          <Grid tablet={{ col: 4 }}>
            <h2 className="font-heading-xl margin-top-0 tablet:margin-bottom-0 text-primary-darker">
              <Trans i18nKey={"Index.readme.header"} />
            </h2>
          </Grid>
          <Grid tablet={{ col: 8 }} className="usa-prose">
            <Trans i18nKey={"Index.readme.description"} />
          </Grid>
        </Grid>
      </section>

      <section className="grid-container usa-section">
        <Grid row gap>
          <Grid
            tablet={{ col: 4 }}
            className="usa-media-block"
            key="logo-uswds"
          >
            <a
              key="uswds-href"
              href={t("Index.uswds.uswdsHref") || "#brokenLink"}
            >
              <img
                src="img/uswds.svg"
                alt={t("Index.uswds.uswdsAlt") || "Logo"}
                className="usa-media-block__img height-15 width-15 "
              />
            </a>
          </Grid>
          <Grid tablet={{ col: 4 }}>
            <h3 className="font-heading-xl margin-top-0 tablet:margin-bottom-0 text-primary-darker">
              <Trans i18nKey={"Index.uswds.header"} />
            </h3>
          </Grid>
        </Grid>
        <Grid row gap>
          <Grid tablet={{ col: 4 }}></Grid>
          <Grid tablet={{ col: 4 }} className="usa-prose">
            <Trans i18nKey={"Index.uswds.description"} />
          </Grid>
        </Grid>
      </section>

      <section className="usa-section usa-section--dark">
        <GridContainer>
          <div className="usa-hero__callout bg-accent-warm-dark margin-bottom-2">
            <h1 className="usa-hero__heading">
              <span className="usa-hero__heading--alt">
                <Trans i18nKey={"Index.technologies.title"} />:
              </span>
            </h1>
            <Trans i18nKey={"Index.technologies.subtitle"} />
          </div>
          {Griddify([
            {
              src: "img/remix.svg",
              alt: "Remix",
              href: "https://remix.run",
            },
            {
              src: "img/postgres.png",
              alt: "PostgreSQL",
              href: "https://www.postgresql.org/",
            },
            {
              src: "img/prisma.svg",
              alt: "Prisma",
              href: "https://prisma.io",
            },
            {
              src: "img/testing-library.png",
              alt: "Testing Library",
              href: "https://testing-library.com",
            },
            {
              src: "img/playwright.png",
              alt: "Playwright",
              href: "https://playwright.dev",
            },
            {
              src: "img/jest.png",
              alt: "Jest",
              href: "https://jestjs.io/",
            },
            {
              src: "img/prettier.svg",
              alt: "Prettier",
              href: "https://prettier.io",
            },
            {
              src: "img/ts.svg",
              alt: "TypeScript",
              href: "https://typescriptlang.org",
            },
          ])}
        </GridContainer>
      </section>
    </div>
  );
}
