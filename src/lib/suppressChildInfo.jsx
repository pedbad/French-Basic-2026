import { Children, cloneElement, isValidElement, Suspense } from "react";

// Shared "tell my children not to render their own instructions" helper.
//
// Section and AccordionArticle both render the instruction/info callout from
// their own `config` and then need every child to stay quiet so the learner
// does not see the same instructions twice. They signalled that by cloning each
// child with `suppressInfo: true`.
//
// That broke once exercises moved behind React.lazy (see render/lazyRegistry):
// the child is no longer the exercise element but the <Suspense> boundary
// wrapping it. Suspense silently drops unknown props, so `suppressInfo` never
// reached the exercise and the callout rendered twice — once from the shell,
// once from the exercise itself.
//
// This clones THROUGH transparent boundaries: a Suspense element is cloned with
// its own children re-mapped (recursively, so nested boundaries and fragments
// also pass the flag along), while any other element gets the prop directly.
const REACT_FRAGMENT = Symbol.for("react.fragment");

// Recurse into a boundary's own children. A single child is mapped in place so
// its element identity and key survive untouched (Children.map would re-key it
// and force the exercise to remount); a list goes through Children.map, which
// is what React needs to keep list keys valid.
const mapBoundaryChildren = (children) =>
  Array.isArray(children)
    ? Children.map(children, cloneWithSuppressedInfo)
    : cloneWithSuppressedInfo(children);

export function cloneWithSuppressedInfo(child) {
  if (!isValidElement(child)) return child;

  const isTransparentBoundary =
    child.type === Suspense || child.type === REACT_FRAGMENT;

  if (isTransparentBoundary) {
    return cloneElement(child, {
      children: mapBoundaryChildren(child.props.children),
    });
  }

  return cloneElement(child, { suppressInfo: true });
}

// Map a children collection, suppressing info on each child.
export const withSuppressedChildInfo = (children) =>
  Children.map(children, cloneWithSuppressedInfo);
