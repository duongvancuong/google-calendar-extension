// src/fuzzy.js — pure fuzzy match, rank, and highlight helpers
(function () {
  'use strict';

  function match(query, text) {
    const q = String(query || '').toLowerCase();
    const s = String(text || '').toLowerCase();
    if (q === '') return { score: 0, ranges: [] };

    const indices = [];
    let from = 0;
    for (const ch of q) {
      const found = s.indexOf(ch, from);
      if (found === -1) return null;
      indices.push(found);
      from = found + 1;
    }

    let score = 0;
    indices.forEach((idx, k) => {
      score += 1;
      if (idx === 0) score += 3;
      if (k > 0 && indices[k - 1] === idx - 1) score += 2;
    });

    return { score, ranges: mergeRanges(indices) };
  }

  function mergeRanges(indices) {
    const ranges = [];
    for (const idx of indices) {
      const last = ranges[ranges.length - 1];
      if (last && last[1] === idx) last[1] = idx + 1;
      else ranges.push([idx, idx + 1]);
    }
    return ranges;
  }

  function rank(query, items) {
    const q = String(query || '').trim();
    if (q === '') {
      return items.map((item) => ({ item, score: 0, titleRanges: [], hostnameRanges: [] }));
    }
    const scored = [];
    items.forEach((item, inputOrder) => {
      const titleM = match(q, item.title);
      const hostM = match(q, item.hostname);
      if (!titleM && !hostM) return;
      const score = (titleM ? titleM.score * 2 : 0) + (hostM ? hostM.score : 0);
      scored.push({
        item,
        score,
        titleRanges: titleM ? titleM.ranges : [],
        hostnameRanges: hostM ? hostM.ranges : [],
        inputOrder,
      });
    });
    scored.sort((a, b) => b.score - a.score || a.inputOrder - b.inputOrder);
    return scored.map(({ inputOrder, ...rest }) => rest);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function highlight(text, ranges) {
    const s = String(text == null ? '' : text);
    if (!ranges || ranges.length === 0) return escapeHtml(s);
    let html = '';
    let cursor = 0;
    for (const [start, end] of ranges) {
      html += escapeHtml(s.slice(cursor, start));
      html += '<mark>' + escapeHtml(s.slice(start, end)) + '</mark>';
      cursor = end;
    }
    html += escapeHtml(s.slice(cursor));
    return html;
  }

  const Fuzzy = { match, rank, highlight };

  if (typeof module !== 'undefined') module.exports = Fuzzy;
  else globalThis.Fuzzy = Fuzzy;
})();
