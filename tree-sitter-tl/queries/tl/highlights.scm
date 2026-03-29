; Section structure
(section_name) @label
"|" @punctuation.delimiter
"---" @punctuation.delimiter

; Entries
(time) @number
(duration) @number
(percentage) @number
"@" @operator
(sub_marker) @punctuation.special
(wildcard) @constant.builtin

; Tags
(tag_ref) @tag

; GCT block
(gct_block) @embedded

; Comments
(comment) @comment
