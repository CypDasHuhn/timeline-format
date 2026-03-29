/**
 * @file Tree-sitter grammar for the timelog (.tl) file format.
 * @author CypDasHuhn <Martinfischer533@gmail.com>
 * @license MIT
 */
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
module.exports = grammar({
  name: "tl",

  // All whitespace (including newlines) is ignored between tokens.
  extras: (_) => [/[ \t\n\r]/],

  // Entries in a section can be followed by another entry, creating a
  // shift-reduce conflict where @ could be the duration of the current entry
  // or the start of the next. Allow GLR for this specific conflict.
  conflicts: ($) => [[$.entry, $.entry]],

  rules: {
    source_file: ($) => repeat(choice($.gct_block, $.section, $.comment)),

    // Fenced GCT block: ```gct\n...\n```
    // Split into fence + content so the GCT parser can be injected into gct_content.
    gct_block: ($) => seq("```gct", $.gct_content, "```"),

    // Raw GCT content between the fences (no backticks allowed inside).
    // Matched as a single token so internal newlines are preserved.
    gct_content: (_) => token(/[^`]*/),

    // ─── Section ──────────────────────────────────────────────────────────────
    section: ($) =>
      seq($.section_header, "---", repeat(choice($.entry, $.comment)), "---"),

    section_header: ($) => seq($.section_name, "|", repeat($.tag_ref)),

    // Any non-whitespace string that doesn't start with '-' (avoids ambiguity
    // with the sub-entry marker and the --- separator) or '/' (avoids
    // ambiguity with line/block comments).
    section_name: (_) => /[^-/\s|][^\s|]*/,

    // ─── Entry ────────────────────────────────────────────────────────────────
    // @ is the universal "fill in" placeholder for any computable value.
    //
    // Examples:
    //   10:30 @ #wake-up      time=10:30  dur=@     tags=[#wake-up]
    //   @ 30min #gct          time=@      dur=30min tags=[#gct]
    //   18:50 20min #uml      time=18:50  dur=20min tags=[#uml]
    //   22:15 @               time=22:15  dur=@     tags=[]
    //   11:30 @ _             time=11:30  dur=@     tags=[_]
    //   - @ @ #slack          sub  time=@  dur=@    tags=[#slack]
    //   - @ 2h20m #learn      sub  time=@  dur=2h20m tags=[#learn]
    //   - 70% @ #slack        sub  pct=70% dur=@    tags=[#slack]
    entry: ($) =>
      seq(
        optional($.sub_marker),
        $._time_slot,
        optional($._duration_slot),
        repeat($.tag_or_wildcard),
      ),

    sub_marker: (_) => "-",

    _time_slot: ($) => choice($.time, "@", $.percentage),
    _duration_slot: ($) => choice($.duration, "@"),

    tag_or_wildcard: ($) => choice($.tag_ref, $.wildcard),

    // _ is an anonymous/unspecified activity placeholder.
    wildcard: (_) => "_",

    // #identifier
    tag_ref: (_) => /#[a-zA-Z][a-zA-Z0-9_-]*/,

    // HH:MM  (24-hour)
    time: (_) => /[0-9]{2}:[0-9]{2}/,

    // Duration: 2h20m | 2h | 30min | 20m  (longer alternatives first)
    duration: (_) => /[0-9]+h[0-9]+m|[0-9]+h|[0-9]+min|[0-9]+m/,

    // Percentage: 70%, 05%
    percentage: (_) => /[0-9]+%/,

    comment: ($) => choice($.line_comment, $.block_comment),
    line_comment: (_) => token(prec(1, /\/\/[^\n]*/)),
    block_comment: (_) =>
      token(seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
  },
});
