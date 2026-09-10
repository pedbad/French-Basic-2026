import { Card, CardContent } from "@/components/ui/card";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import DOMPurify from "dompurify";
import React from "react";

import { Info } from "..";
import { withSuppressedChildInfo } from "@/lib/suppressChildInfo";

const ACCORDION_TITLE_TEXT_CLASS = "text-base";
const ACCORDION_TITLE_STYLE = {
  fontSize: "calc(var(--font-size-lg) * 1.215)",
  lineHeight: "var(--line-height-2xl)",
  marginBottom: 0,
  marginTop: 0,
};

const parsePersistedExpandedState = (id, fallback) => {
  if (!id || typeof window === "undefined") return fallback;

  try {
    const stored = window.sessionStorage.getItem(`${id}-expanded`);
    if (stored === null) return fallback;
    const parsed = JSON.parse(stored);
    return typeof parsed === "boolean" ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const persistExpandedState = (id, expanded) => {
  if (!id || typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(`${id}-expanded`, JSON.stringify(expanded));
  } catch {
    // Ignore storage write failures (privacy mode/quota), keep UI responsive.
  }
};

const renderSplitTitle = (rawTitle) => {
  if (typeof rawTitle !== "string") return rawTitle;

  const match = rawTitle.match(/\s*\(part\s*(\d+)\)$/i);
  if (!match) return rawTitle;

  const [, partNumber] = match;
  const partText = `(part ${partNumber})`;
  const baseText = rawTitle.replace(/\s*\(part\s*\d+\)$/i, "").trimEnd();
  return (
    <>
      {baseText}
      {" "}
      <span className="accordion-title-part">{partText}</span>
    </>
  );
};

export function AccordionArticle({
  children,
  className,
  config,
  expandedByDefault = false,
  id,
  info,
  noCard = false,
  semanticAs = "article",
  target,
  title = "",
  titleHTML = "",
}) {
  const [expanded, setExpanded] = React.useState(() =>
    parsePersistedExpandedState(id, expandedByDefault)
  );

  const handleValueChange = React.useCallback(
    (values) => {
      const isExpanded = values.includes(id);
      setExpanded(isExpanded);
      persistExpandedState(id, isExpanded);

      // Keep the URL hash in sync so the address bar reflects the open section
      // and deep links can be shared. Use replaceState so back/forward history
      // is not polluted with every section click.
      if (typeof window !== "undefined") {
        if (isExpanded) {
          window.history.replaceState(null, "", `#${id}`);
        } else if (window.location.hash === `#${id}`) {
          // Clear the hash when the matching section is closed.
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search,
          );
        }
      }
    },
    [id]
  );

  const handleTriggerClick = React.useCallback(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      window.navigator.vibrate(100);
    }
  }, []);

  const headingContent =
    titleHTML !== "" ? (
      <>
        <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(titleHTML) }} />
        {info ? <Info infoMessage={info.infoMessage} infoTitle={info.infoTitle} /> : null}
      </>
    ) : (
      <>
        {renderSplitTitle(title)}
        {info ? <Info infoMessage={info.infoMessage} infoTitle={info.infoTitle} /> : null}
      </>
    );

  const contentId = `${id}-content`;
  const headingId = target ? `${target}-heading` : `section-title-${id}`;
  const {
    informationText,
    informationTextHTML,
    informationAlertType,
    infoAlertType,
  } = config || {};
  const resolvedInfoAlertType = informationAlertType || infoAlertType;
  const hasInfo = Boolean(informationText || informationTextHTML);
  const shouldSuppressChildInfo = hasInfo;
  const RootTag = semanticAs === "section" ? "section" : "article";
  const renderedChildren = shouldSuppressChildInfo
    ? withSuppressedChildInfo(children)
    : children;

  return (
    <RootTag
      aria-labelledby={headingId}
      className={`accordion-article w-full min-w-0 ${expanded ? "expanded" : ""} ${className || ""}`}
      data-state={expanded ? "open" : "closed"}
      id={id}
      key={`article${id}`}
    >
      <AccordionPrimitive.Root
        className="accordion-radix-root w-full min-w-0"
        onValueChange={handleValueChange}
        type="multiple"
        value={expanded ? [id] : []}
      >
        <AccordionPrimitive.Item className="accordion-item border-none" value={id}>
          <header>
            <AccordionPrimitive.Header asChild>
              <h3
                className={`accordion-title modal-link-target ${ACCORDION_TITLE_TEXT_CLASS}`}
                data-modal-target={target || undefined}
                id={headingId}
                style={ACCORDION_TITLE_STYLE}
              >
                <AccordionPrimitive.Trigger
                  aria-controls={contentId}
                  className="accordion-trigger"
                  onClick={handleTriggerClick}
                  title={expanded ? "Click to close" : "Click to expand"}
                >
                  <svg
                    aria-hidden="true"
                    className="arrow accordion-chevron"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  <span className="accordion-trigger-label">{headingContent}</span>
                </AccordionPrimitive.Trigger>
              </h3>
            </AccordionPrimitive.Header>
          </header>

          <AccordionPrimitive.Content
            className="content accordion-content overflow-hidden"
            id={contentId}
          >
            {noCard ? (
              <>
                {hasInfo ? (
                  <Info
                    id={`info-${id}`}
                    alertType={resolvedInfoAlertType}
                    informationText={informationText}
                    informationTextHTML={informationTextHTML}
                  />
                ) : null}
                {renderedChildren}
              </>
            ) : (
              <Card className="w-full sortable mt-2 border border-t-0 rounded-t-none">
                <CardContent className="p-2 accordion-card-content">
                  {hasInfo ? (
                    <Info
                      id={`info-${id}`}
                      alertType={resolvedInfoAlertType}
                      informationText={informationText}
                      informationTextHTML={informationTextHTML}
                    />
                  ) : null}
                  {renderedChildren}
                </CardContent>
              </Card>
            )}
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      </AccordionPrimitive.Root>
    </RootTag>
  );
}
