# Changelog

## [3.1.0](https://github.com/camphoric/camphoric-event-lark/compare/v3.0.0...v3.1.0) (2026-11-18)


### Features

* **emails:** add Lark Camp's four camper group emails ([ac2fe92](https://github.com/camphoric/camphoric-event-lark/commit/ac2fe92f1991165a018600bf58b99b03d719ec46)), closes [#8](https://github.com/camphoric/camphoric-event-lark/issues/8)
* **payments:** add Zelle and FCP Credit payment types ([93cfeaf](https://github.com/camphoric/camphoric-event-lark/commit/93cfeaf9aa2ff6c3a2d7b7782c9f73eb6c402d70)), closes [#24](https://github.com/camphoric/camphoric-event-lark/issues/24)
* **registration-form:** ask each camper for their own phone number ([2859652](https://github.com/camphoric/camphoric-event-lark/commit/2859652fbebc609377993573b2cf05bfe891b010)), closes [#22](https://github.com/camphoric/camphoric-event-lark/issues/22)


### Bug Fixes

* **emails:** show Off Site lodging, and break lines without a backslash ([bb2eb2a](https://github.com/camphoric/camphoric-event-lark/commit/bb2eb2ad320d5740fd356b235e6ca94d3a20f9c6))
* **invitations:** tell full-trade kitchen crew what they pay ([ffce4dd](https://github.com/camphoric/camphoric-event-lark/commit/ffce4dd516491a929ccfb26de5d6a3994811a15f)), closes [#16](https://github.com/camphoric/camphoric-event-lark/issues/16)
* **reports:** remove the always-empty Parking Exceptions report ([6b64f59](https://github.com/camphoric/camphoric-event-lark/commit/6b64f59430bd87a24da2edec3d8050312c10832e)), closes [#21](https://github.com/camphoric/camphoric-event-lark/issues/21)
* **reports:** send Camp 3 campers to Camp 2's kitchen in Confirmation Email Info ([2633cbe](https://github.com/camphoric/camphoric-event-lark/commit/2633cbe6575987c43bd69c248fe70eadde313c92))
* **reports:** show a camper's meal assignment in Confirmation Email Info ([93cfb18](https://github.com/camphoric/camphoric-event-lark/commit/93cfb18fbf9b5c523b9f813951e9591c12cec0aa)), closes [#23](https://github.com/camphoric/camphoric-event-lark/issues/23)

## [3.0.0](https://github.com/camphoric/camphoric-event-lark/compare/v2.0.0...v3.0.0) (2026-11-18)


### ⚠ BREAKING CHANGES

* **event:** the import-spec peer range is now ^1.3.0, the first spec with an event's cancellation fee, so the event needs Camphoric v0.19.0 or later.

### Features

* **event:** offer a $150 cancellation fee plus PayPal's fees (Camphoric v0.19) ([611fb9a](https://github.com/camphoric/camphoric-event-lark/commit/611fb9af873ae91a5ea1ccf3c9ea5326112930d7)), closes [#29](https://github.com/camphoric/camphoric-event-lark/issues/29)

## [2.0.0](https://github.com/camphoric/camphoric-event-lark/compare/v1.0.1...v2.0.0) (2026-11-12)


### ⚠ BREAKING CHANGES

* **deps:** the import-spec peer range is now ^1.2.0, the first spec with report categories.
* **reports:** needs a Camphoric release with report categories. An older server drops the category, leaving titles with no group. Importing again into an event that has the old titles adds the new reports beside
* **deps:** the e2e tests and npm run bulk need Camphoric v0.18.0 or later, and bulk needs an API token rather than a password.

### Features

* **deps:** need import-spec 1.2.0 for report categories ([1fdbda0](https://github.com/camphoric/camphoric-event-lark/commit/1fdbda0fe9897900a202ff27662de41cd21652a6))
* **promo-codes:** add a promo code for campers who refer a first-time camper ([04c8539](https://github.com/camphoric/camphoric-event-lark/commit/04c8539d260ab4178754b2c7b0dd62461d70f7d9)), closes [#12](https://github.com/camphoric/camphoric-event-lark/issues/12)
* **promo-codes:** add a promo code for first-time campers ([04c8539](https://github.com/camphoric/camphoric-event-lark/commit/04c8539d260ab4178754b2c7b0dd62461d70f7d9)), closes [#11](https://github.com/camphoric/camphoric-event-lark/issues/11)
* **registration-form:** give the form plain-language error messages ([ab8da93](https://github.com/camphoric/camphoric-event-lark/commit/ab8da937bc7f4697c4f9ba5f48cd1532d24575f1))
* **reports:** add a Kitchen, Meal Income CSV report ([9abff12](https://github.com/camphoric/camphoric-event-lark/commit/9abff126e71c6ed901d0e2080295204e0c5ecdcd))
* **reports:** add an "Admin, non-meal income" CSV report ([ae67c9e](https://github.com/camphoric/camphoric-event-lark/commit/ae67c9eda37b630984d643e6dcdb2c4c5c68cada))
* **reports:** add an "All payments" CSV report to Admin ([3fe3c57](https://github.com/camphoric/camphoric-event-lark/commit/3fe3c572f34d136f5fcb22ae52e92dbf8b8f996b))
* **reports:** give each report a category and drop it from the title ([05d2327](https://github.com/camphoric/camphoric-event-lark/commit/05d23270c15c06dbd5bf480a02de4e67a2ab411e))


### Bug Fixes

* **deps:** import with Camphoric v0.18's API tokens (import-tools 3.0.0) ([8e1316f](https://github.com/camphoric/camphoric-event-lark/commit/8e1316fe1a64845de550ee4afeaed00bed5c20cb))
* **emails:** don't list an empty meal type in the confirmation ([b189cc1](https://github.com/camphoric/camphoric-event-lark/commit/b189cc1422566a804876eb1ea25c1c2d905d648d))
* **emails:** name the camp year in kitchen invitations and drop a doubled period ([ab8da93](https://github.com/camphoric/camphoric-event-lark/commit/ab8da937bc7f4697c4f9ba5f48cd1532d24575f1))
* **promo-codes:** take the first-time camper discount off tuition only ([6188132](https://github.com/camphoric/camphoric-event-lark/commit/61881326bf6f438fac5bc296d0dfdcc124574b4f))
* **registration-form:** remove the doubled "basis" from the intro ([dba85dd](https://github.com/camphoric/camphoric-event-lark/commit/dba85dd37e520d16c96b26cdf1adb9e5ac8f6b5e))
* **registration-form:** spell "Relevant credentials" correctly ([ab8da93](https://github.com/camphoric/camphoric-event-lark/commit/ab8da937bc7f4697c4f9ba5f48cd1532d24575f1))
* **reports:** don't fail on a camper who didn't give an age ([26dc12f](https://github.com/camphoric/camphoric-event-lark/commit/26dc12f55f4742ab1c6feb93d34de2fde03e3f39))
* **reports:** drop a stray backslash from All Campers' phone column and a trailing comma from Parking Exceptions ([e720aae](https://github.com/camphoric/camphoric-event-lark/commit/e720aae0d5d79b2e6da73a6a49ed0992782f42c4))
* **reports:** format meal income as money and drop the free rows ([51c3fe8](https://github.com/camphoric/camphoric-event-lark/commit/51c3fe80b279d3e9a8201d8a75c45e5b64d30c8d))
* **reports:** name the meal income discount row after the codes it counts ([5d7f736](https://github.com/camphoric/camphoric-event-lark/commit/5d7f736032ad8b56392500e5baf470a1fb2d4648))
* **reports:** quote names and other free text in the CSV reports ([e720aae](https://github.com/camphoric/camphoric-event-lark/commit/e720aae0d5d79b2e6da73a6a49ed0992782f42c4))

## [1.0.1](https://github.com/camphoric/camphoric-event-lark/compare/v1.0.0...v1.0.1) (2026-10-20)


### Bug Fixes

* **build:** publish to and install from npm ([125149a](https://github.com/camphoric/camphoric-event-lark/commit/125149a798c48e225129da636133673c776e0ce5))

## 1.0.0 (2026-10-17)


### Features

* **event:** publish Lark Camp as its own package ([f33558c](https://github.com/camphoric/camphoric-event-lark/commit/f33558cc366c893057658e2a992bfc59ae70089b))
