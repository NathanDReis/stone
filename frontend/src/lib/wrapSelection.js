import { EditorSelection } from "@codemirror/state";

function hasWrapper(doc, from, to, wrapper) {
  if (from < 0 || to > doc.length) return false;

  const before = doc.slice(from - wrapper.length, from);
  const after = doc.slice(to, to + wrapper.length);

  return before === wrapper && after === wrapper;
}

function removeWrapper(from, to, wrapper) {
  return [
    { from: from - wrapper.length, to: from },
    { from: to, to: to + wrapper.length }
  ];
}

function expandRangeToWrapper(doc, from, to, wrapper) {
  let newFrom = from;
  let newTo = to;

  if (
    newFrom >= wrapper.length &&
    doc.slice(newFrom - wrapper.length, newFrom) === wrapper
  ) {
    newFrom -= wrapper.length;
  }

  if (
    doc.slice(newTo, newTo + wrapper.length) === wrapper
  ) {
    newTo += wrapper.length;
  }

  return { from: newFrom, to: newTo };
}

export function wrapSelection(view, wrapper) {
  const { state } = view;
  const doc = state.doc.toString();

  const changes = [];
  const ranges = [];

  for (const range of state.selection.ranges) {
    if (range.empty) {
      changes.push({
        from: range.from,
        insert: wrapper + wrapper
      });

      ranges.push(
        EditorSelection.cursor(range.from + wrapper.length)
      );
      continue;
    }

    const expanded = expandRangeToWrapper(
      doc,
      range.from,
      range.to,
      wrapper
    );

    const from = expanded.from;
    const to = expanded.to;

    const innerFrom = from + wrapper.length;
    const innerTo = to - wrapper.length;

    if (
      innerFrom >= 0 &&
      innerTo >= innerFrom &&
      hasWrapper(doc, innerFrom, innerTo, wrapper)
    ) {
      changes.push(
        ...removeWrapper(innerFrom, innerTo, wrapper)
      );

      ranges.push(
        EditorSelection.range(
          from,
          to - wrapper.length * 2
        )
      );
    } else {
      changes.push({
        from,
        to,
        insert: `${wrapper}${doc.slice(from, to)}${wrapper}`
      });

      ranges.push(
        EditorSelection.range(
          from + wrapper.length,
          to + wrapper.length
        )
      );
    }
  }

  view.dispatch({
    changes,
    selection: EditorSelection.create(ranges),
    scrollIntoView: true
  });

  return true;
}
