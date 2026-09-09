"use client";

import { useMemo } from "react";
import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
    "a", "b", "br", "code", "del", "div", "em", "h1", "h2", "h3", "h4", "h5", "h6",
    "hr", "i", "li", "ol", "p", "pre", "s", "small", "span", "strike", "strong", "sub",
    "sup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "u", "ul",
];

const ALLOWED_STYLE_PROPERTIES = new Set([
    "background-color", "border", "border-bottom", "border-left", "border-radius", "border-right",
    "border-top", "color", "font-family", "font-size", "font-style", "font-weight", "height",
    "letter-spacing", "line-height", "margin", "margin-bottom", "margin-left", "margin-right",
    "margin-top", "max-width", "padding", "padding-bottom", "padding-left", "padding-right",
    "padding-top", "text-align", "text-decoration", "vertical-align", "white-space", "width",
    "word-break",
]);

const DANGEROUS_STYLE_VALUE = /(?:url\s*\(|expression\s*\(|javascript\s*:|@import|behavior\s*:|-moz-binding)/i;

function removeElementAndFollowingSiblings(element: Element) {
    let current: Element | null = element;
    while (current) {
        const nextSibling: Element | null = current.nextElementSibling;
        current.remove();
        current = nextSibling;
    }
}

function removeQuotedHistoryAndSignatures(document: Document) {
    document.querySelectorAll([
        ".protonmail_signature_block",
        ".protonmail_quote",
        ".gmail_quote",
        ".gmail_extra",
        ".gmail_signature",
        "[data-smartmail='gmail_signature']",
        ".yahoo_quoted",
        ".moz-cite-prefix",
        ".moz-signature",
        "blockquote",
        "#divRplyFwdMsg",
    ].join(",")).forEach((element) => element.remove());

    const separator = Array.from(document.body.querySelectorAll("p, div")).find((element) => {
        const text = element.textContent?.replace(/\s+/g, " ").trim() || "";
        return /^on .+ wrote:\s*$/i.test(text)
            || /^-{2,}\s*original message\s*-{2,}$/i.test(text)
            || /^_{5,}$/.test(text);
    });
    if (separator) removeElementAndFollowingSiblings(separator);
}

function keepSafeInlineStyles(document: Document) {
    document.body.querySelectorAll<HTMLElement>("[style]").forEach((element) => {
        const safeDeclarations: string[] = [];
        for (const property of Array.from(element.style)) {
            const value = element.style.getPropertyValue(property).trim();
            if (ALLOWED_STYLE_PROPERTIES.has(property) && value && !DANGEROUS_STYLE_VALUE.test(value)) {
                safeDeclarations.push(`${property}: ${value}`);
            }
        }
        if (safeDeclarations.length) element.setAttribute("style", safeDeclarations.join("; "));
        else element.removeAttribute("style");
    });
}

function sanitizeEmailHtml(html: string, inbound: boolean) {
    const document = new DOMParser().parseFromString(html, "text/html");
    if (inbound) removeQuotedHistoryAndSignatures(document);
    keepSafeInlineStyles(document);

    const clean = DOMPurify.sanitize(document.body.innerHTML, {
        ALLOWED_TAGS,
        ALLOWED_ATTR: ["align", "colspan", "href", "rel", "rowspan", "style", "target"],
        ALLOW_DATA_ATTR: false,
    });

    const sanitizedDocument = new DOMParser().parseFromString(clean, "text/html");
    sanitizedDocument.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
        const href = link.getAttribute("href")?.trim() || "";
        if (!/^(?:https?:|mailto:)/i.test(href)) link.removeAttribute("href");
        link.target = "_blank";
        link.rel = "noopener noreferrer nofollow";
    });
    return sanitizedDocument.body.innerHTML.trim();
}

export default function EmailHtmlBody({
    bodyHtml,
    fallbackText,
    inbound,
}: {
    bodyHtml?: string;
    fallbackText: string;
    inbound: boolean;
}) {
    const safeHtml = useMemo(
        () => bodyHtml?.trim() ? sanitizeEmailHtml(bodyHtml, inbound) : "",
        [bodyHtml, inbound],
    );

    if (!safeHtml) {
        return <p className="mt-4 whitespace-pre-wrap text-xs leading-6 text-slate-700">{fallbackText}</p>;
    }

    return <div
        className="mt-4 max-w-full overflow-x-auto break-words text-xs leading-6 text-slate-700 [&_a]:text-blue-600 [&_a]:underline [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-2 [&_table]:max-w-full [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
    />;
}
