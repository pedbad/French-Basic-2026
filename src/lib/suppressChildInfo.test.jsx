import { Suspense } from "react";
import { describe, expect, it } from "vitest";

import { cloneWithSuppressedInfo, withSuppressedChildInfo } from "./suppressChildInfo";

// Regression coverage for the duplicated-instructions bug.
//
// Section / AccordionArticle render the instruction callout from their own
// config and rely on `suppressInfo` to keep the child exercise from rendering
// the same text again. Once exercises moved behind React.lazy the child became
// a <Suspense> boundary, which drops unknown props — so the flag never reached
// the exercise and every learner saw the instructions twice.
//
// These assertions inspect the cloned elements without rendering, matching the
// element-inspection style used by renderLearningObject.test.js.

const Exercise = () => null;

describe("cloneWithSuppressedInfo", () => {
  it("sets suppressInfo on a plain element child", () => {
    const cloned = cloneWithSuppressedInfo(<Exercise config={{}} />);

    expect(cloned.props.suppressInfo).toBe(true);
  });

  it("passes suppressInfo THROUGH a Suspense boundary to the wrapped element", () => {
    const wrapped = (
      <Suspense fallback={null}>
        <Exercise config={{}} />
      </Suspense>
    );

    const cloned = cloneWithSuppressedInfo(wrapped);

    // The boundary itself must NOT carry the prop — Suspense would drop it.
    expect(cloned.type).toBe(Suspense);
    expect(cloned.props.suppressInfo).toBeUndefined();

    const inner = cloned.props.children;
    expect(inner.type).toBe(Exercise);
    expect(inner.props.suppressInfo).toBe(true);
  });

  it("passes suppressInfo through a fragment", () => {
    const cloned = cloneWithSuppressedInfo(
      <>
        <Exercise config={{}} />
      </>,
    );

    const inner = cloned.props.children;
    expect(inner.props.suppressInfo).toBe(true);
  });

  it("passes suppressInfo through nested boundaries", () => {
    const cloned = cloneWithSuppressedInfo(
      <Suspense fallback={null}>
        <>
          <Exercise config={{}} />
        </>
      </Suspense>,
    );

    const fragment = cloned.props.children;
    expect(fragment.props.children.props.suppressInfo).toBe(true);
  });

  it("leaves non-element children untouched", () => {
    expect(cloneWithSuppressedInfo("plain text")).toBe("plain text");
    expect(cloneWithSuppressedInfo(null)).toBe(null);
  });
});

describe("withSuppressedChildInfo", () => {
  it("suppresses info on every child, boundaries included", () => {
    const mapped = withSuppressedChildInfo([
      <Exercise key="a" config={{}} />,
      <Suspense key="b" fallback={null}>
        <Exercise config={{}} />
      </Suspense>,
    ]);

    expect(mapped[0].props.suppressInfo).toBe(true);
    expect(mapped[1].props.children.props.suppressInfo).toBe(true);
  });
});
