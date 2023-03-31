# Please refer to the new project [chart-img-telegram-bot](https://github.com/hawooni/chart-img-telegram-bot) that supports API versions 1 and 2 and will be actively maintained.

# CHART-IMG TELEGRAM BOT

It is a simple Telegram bot based on [CHART-IMG](https://doc.chart-img.com) API with serverless Cloudflare Workers. It supports all public TradingView symbols, and the preset symbols can be customized by modifying the file `config.json`.

## Live Telegram Bot

http://t.me/chartImgOpnBot

You are welcome to use this bot if you don't want to customize your own. It will always run with the latest version.

## Requirement

- [Cloudflare](https://workers.cloudflare.com) Account
- [CHART-IMG](https://chart-img.com) API Key
- [Telegram](https://core.telegram.org/bots) API Token

## Setup

### Wrangler Install & Login

To install [wrangler](https://github.com/cloudflare/wrangler2), ensure you have [npm](https://docs.npmjs.com/getting-started) installed, preferably using a Node version manager like [Volta](https://volta.sh) or [nvm](https://github.com/nvm-sh/nvm) to avoid permission issues or to easily change Node.js versions, then run:

```
$ npm install -g wrangler
```

```
$ wrangler login
```

### config.json

Setup the authentication value `chartImgApiKey` and `telegramApiToken`.

```
{
  "authentication": {
    "chartImgApiKey": "YOUR_CHART_IMG_API_KEY_HERE",
    "telegramApiToken": "YOUR_TELEGRAM_API_TOKEN_HERE"
  },
  ...
}
```

## Deploy

After you publish your worker, `wrangler publish`; you have to set up the Telegram webhook URL by running the command `npm run setup`, then enter the published domain name.

```
$ wrangler publish

> cf-chart-img-telegram-bot@0.1.0 publish
> wrangler publish

 ⛅️ wrangler 2.0.14
--------------------
Uploaded chart-img-telegram-bot (0.80 sec)
Published chart-img-telegram-bot (3.33 sec)
  chart-img-telegram-bot.YOUR_ID.workers.dev

$ npm run setup

> cf-chart-img-telegram-bot@0.1.0 setup
> node setup/telegram.js

? Enter published domain name : chart-img-telegram-bot.YOUR_ID.workers.dev
```

## Commands

### /start

![/start](doc/start.png?raw=true)

### /example

![/example](doc/example.png?raw=true)

### /price

![/price](doc/price.png?raw=true)

### /chart

![/chart](doc/chart.png?raw=true)
