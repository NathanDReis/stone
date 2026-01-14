import { EditorSelection } from "@codemirror/state";

export function wrapWithPair(view, open, close) {
  const { state } = view;
  const doc = state.doc.toString();

  const changes = [];
  const ranges = [];

  for (const range of state.selection.ranges) {
    if (range.empty) {
      changes.push({
        from: range.from,
        insert: open + close
      });

      ranges.push(
        EditorSelection.cursor(range.from + open.length)
      );
      continue;
    }

    const selectedText = doc.slice(range.from, range.to);

    changes.push({
      from: range.from,
      to: range.to,
      insert: `${open}${selectedText}${close}`
    });

    ranges.push(
      EditorSelection.range(
        range.from + open.length,
        range.to + open.length
      )
    );
  }

  view.dispatch({
    changes,
    selection: EditorSelection.create(ranges),
    scrollIntoView: true
  });

  return true;
}
