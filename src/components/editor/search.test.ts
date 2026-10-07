// @vitest-environment happy-dom
import { Editor } from "@tiptap/react";
import { afterEach, describe, expect, it } from "vitest";

import { sectionExtensions } from "@/components/editor/extensions";
import {
  findInDoc,
  replaceRanges,
  searchKey,
  setSearch,
} from "@/components/editor/search";

/**
 * Éditeur sans vue montée : ProseMirror n'a besoin du DOM que pour
 * dessiner, et ces tests ne vérifient que l'état.
 */
let editor: Editor | null = null;
const make = (content: string) => {
  editor = new Editor({ extensions: sectionExtensions(), content });
  return editor;
};
afterEach(() => editor?.destroy());

const text = (ed: Editor, ranges: { from: number; to: number }[]) =>
  ranges.map((range) => ed.state.doc.textBetween(range.from, range.to));

describe("findInDoc", () => {
  it("trouve sans tenir compte de la casse, à travers les marques", () => {
    const ed = make(
      "<p>Le <strong>foie</strong> est normal. FOIE homogène.</p>",
    );
    const ranges = findInDoc(ed.state.doc, {
      text: "foie",
      caseSensitive: false,
    });
    expect(text(ed, ranges)).toEqual(["foie", "FOIE"]);
    expect(
      text(
        ed,
        findInDoc(ed.state.doc, { text: "Le foie", caseSensitive: true }),
      ),
    ).toEqual(["Le foie"]);
  });

  it("respecte la casse quand on le demande", () => {
    const ed = make("<p>Foie, foie.</p>");
    expect(
      findInDoc(ed.state.doc, { text: "foie", caseSensitive: true }),
    ).toHaveLength(1);
  });

  it("ne traverse pas un saut de paragraphe, et ne se chevauche pas", () => {
    const ed = make("<p>rein</p><p>droit</p><p>aaaa</p>");
    expect(
      findInDoc(ed.state.doc, { text: "rein droit", caseSensitive: false }),
    ).toEqual([]);
    expect(
      findInDoc(ed.state.doc, { text: "aa", caseSensitive: false }),
    ).toHaveLength(2);
  });

  it("ne trouve rien pour une recherche vide", () => {
    const ed = make("<p>texte</p>");
    expect(findInDoc(ed.state.doc, { text: "", caseSensitive: false })).toEqual(
      [],
    );
  });
});

describe("remplacement", () => {
  it("remplace toutes les occurrences en gardant la mise en forme", () => {
    const ed = make("<p><strong>gauche</strong> et gauche.</p>");
    const ranges = findInDoc(ed.state.doc, {
      text: "gauche",
      caseSensitive: false,
    });
    replaceRanges(ed, ranges, "droit");
    expect(ed.getHTML()).toContain("<strong>droit</strong> et droit.");
  });

  it("supprime quand le remplacement est vide, en une seule annulation", () => {
    const ed = make("<p>le le foie</p>");
    replaceRanges(
      ed,
      [findInDoc(ed.state.doc, { text: "le ", caseSensitive: false })[0]],
      "",
    );
    expect(ed.getText()).toBe("le foie");
    ed.commands.undo();
    expect(ed.getText()).toBe("le le foie");
  });

  it("surligne sans toucher au document ni à l'historique", () => {
    const ed = make("<p>foie foie</p>");
    const before = ed.getHTML();
    setSearch(ed, { text: "foie", caseSensitive: false }, 1);
    const state = searchKey.getState(ed.state)!;
    expect(state.decorations.find()).toHaveLength(2);
    expect(state.active).toBe(1);
    expect(ed.getHTML()).toBe(before);
    expect(ed.can().undo()).toBe(false);
  });
});
