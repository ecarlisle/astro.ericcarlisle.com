# JSON-LD Structured Data Report

Generated: 2026-07-06T15:55:34.009Z

## Summary

| Metric | Value |
|---|---|
| Pages scanned | 13 |
| Total JSON-LD blocks | 11 |
| Top-level entity types | 10 |
| Nested/supporting types | 4 |
| Pages with JSON-LD | 11 |
| Pages without JSON-LD | 2 |
| Parse errors | 0 |

## Top-Level Entity Type Coverage

These are the primary schema types declared at the top level of each
JSON-LD graph (the `@type` of each `@graph` entry or root object).

| Type | Pages |
|---|---|
| Blog | 11 |
| Person | 11 |
| WebSite | 11 |
| CollectionPage | 5 |
| BlogPosting | 2 |
| BreadcrumbList | 2 |
| WebPage | 2 |
| ProfilePage | 1 |
| ContactPage | 1 |
| SearchResultsPage | 1 |

## Nested/Supporting Schema Object Types

These are `@type` values found recursively inside properties of
top-level entities — for example, an `ImageObject` inside a
`BlogPosting`'s "image" property, or a `ListItem` inside a
`BreadcrumbList`'s "itemListElement".

| Type | Pages |
|---|---|
| ImageObject | 11 |
| Organization | 11 |
| BreadcrumbList | 3 |
| ItemList | 1 |

## Per-Page Breakdown

| Route | Blocks | Types | Nested Types |
|---|---|---|---|
| /404.html/ | 1 | Blog, Person, WebSite | ImageObject, Organization |
| /about/ | 1 | Blog, Person, ProfilePage, WebSite | ImageObject, Organization |
| /blog/250mm-trading-card-box/ | 1 | Blog, BlogPosting, BreadcrumbList, Person, WebPage, WebSite | ImageObject, Organization |
| /blog/ | 1 | Blog, CollectionPage, Person, WebSite | BreadcrumbList, ImageObject, Organization |
| /blog/why-do-i-need-all-this-usb-and-sd-media-holder/ | 1 | Blog, BlogPosting, BreadcrumbList, Person, WebPage, WebSite | ImageObject, Organization |
| /contact/ | 1 | Blog, ContactPage, Person, WebSite | ImageObject, Organization |
| / | 1 | Blog, CollectionPage, Person, WebSite | ImageObject, Organization |
| /portfolio/ | 1 | Blog, CollectionPage, Person, WebSite | ImageObject, Organization |
| /posts/3d-printing/250mm-trading-card-box/ | 0 | - | - |
| /posts/3d-printing/why-do-i-need-all-this-usb-and-sd-media-holder/ | 0 | - | - |
| /search/ | 1 | Blog, Person, SearchResultsPage, WebSite | ImageObject, Organization |
| /tags/3d-printing/ | 1 | Blog, CollectionPage, Person, WebSite | BreadcrumbList, ImageObject, Organization |
| /tags/ | 1 | Blog, CollectionPage, Person, WebSite | BreadcrumbList, ImageObject, ItemList, Organization |
