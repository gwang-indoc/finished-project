## Requirements

### Requirement: Slugify text into a URL-safe ASCII slug

The system SHALL provide a `slugify(input: string): string` function under `lib/slug.ts` that converts arbitrary text into a deterministic, lowercase, ASCII-only slug suitable for use in URL path segments.

The function MUST:

1. Apply Unicode NFD normalization to the input.
2. Strip combining diacritical marks (Unicode range U+0300 through U+036F) introduced by NFD normalization.
3. Lowercase the result.
4. Replace any maximal run of characters outside `[a-z0-9]` with a single `-`.
5. Strip any leading or trailing `-` characters from the final string.
6. Return `''` when the input is empty, whitespace-only, or contains no characters that survive steps 1–4.

The function MUST NOT throw for any string input. The function MUST NOT mutate any external state and MUST NOT depend on any third-party package.

#### Scenario: ASCII text becomes lowercase kebab-case

- **WHEN** `slugify('Hello World')` is called
- **THEN** the result is `'hello-world'`

#### Scenario: Diacritics are stripped via NFD normalization

- **WHEN** `slugify('café')` is called
- **THEN** the result is `'cafe'`

#### Scenario: Multiple non-alphanumeric characters collapse to a single dash

- **WHEN** `slugify('foo!!bar??baz')` is called
- **THEN** the result is `'foo-bar-baz'`

#### Scenario: Leading and trailing separators are trimmed

- **WHEN** `slugify('--hi--')` is called
- **THEN** the result is `'hi'`
- **AND WHEN** `slugify('   spaces   ')` is called
- **THEN** the result is `'spaces'`

#### Scenario: Empty input produces an empty slug

- **WHEN** `slugify('')` is called
- **THEN** the result is `''`

#### Scenario: All-non-ASCII input produces an empty slug

- **WHEN** `slugify('你好')` is called
- **THEN** the result is `''`
- **AND** the caller is responsible for providing a fallback if a non-empty slug is required

### Requirement: Count words in plain text

The system SHALL provide a `wordCount(input: string): number` function under `lib/wordcount.ts` that returns the count of whitespace-delimited tokens in plain-text input.

The function MUST:

1. Trim leading and trailing whitespace from the input.
2. Return `0` when the trimmed input is empty.
3. Otherwise, split the trimmed input on any maximal run of whitespace (`\s+`) and return the resulting array length.

The function MUST treat all whitespace characters identically (spaces, tabs, newlines). The function MUST NOT throw for any string input. The function MUST NOT walk Tiptap JSON or any other structured document — it is plain-text only; calling it on a stringified JSON document is a caller error and produces a meaningless count.

#### Scenario: Empty string returns zero

- **WHEN** `wordCount('')` is called
- **THEN** the result is `0`

#### Scenario: Whitespace-only string returns zero

- **WHEN** `wordCount('   ')` is called
- **THEN** the result is `0`
- **AND WHEN** `wordCount('\n\t  ')` is called
- **THEN** the result is `0`

#### Scenario: Single word returns one

- **WHEN** `wordCount('hello')` is called
- **THEN** the result is `1`

#### Scenario: Multiple words separated by single spaces

- **WHEN** `wordCount('hello world')` is called
- **THEN** the result is `2`

#### Scenario: Runs of whitespace count as a single separator

- **WHEN** `wordCount('one  two   three')` is called
- **THEN** the result is `3`

#### Scenario: Leading and trailing whitespace is trimmed before counting

- **WHEN** `wordCount('  hello world  ')` is called
- **THEN** the result is `2`

#### Scenario: Newlines and tabs act as separators

- **WHEN** `wordCount('a\nb\nc')` is called
- **THEN** the result is `3`
- **AND WHEN** `wordCount('a\tb c')` is called
- **THEN** the result is `3`

### Requirement: Truncate plain text to a maximum length with an ellipsis suffix

The system SHALL provide a `truncate(input: string, maxLength: number): string` function under `lib/truncate.ts` that bounds the length of plain text by replacing the tail with a single Unicode horizontal-ellipsis character (`…`, U+2026) when the input exceeds the limit.

The function MUST:

1. Return the input unchanged when `input.length <= maxLength`.
2. Otherwise, return `input.slice(0, maxLength - 1) + '…'`, so the returned string's `.length` is exactly `maxLength`.

The function MUST NOT throw for any string input. The function MUST NOT mutate any external state and MUST NOT depend on any third-party package. The function MUST NOT attempt grapheme-cluster, code-point, or word-boundary segmentation; truncation operates on UTF-16 code units (the same units `String.prototype.length` and `String.prototype.slice` use).

The behavior is undefined when `maxLength < 1`; callers MUST pass `maxLength >= 1`.

#### Scenario: Input shorter than the limit is returned unchanged

- **WHEN** `truncate('hi', 10)` is called
- **THEN** the result is `'hi'`

#### Scenario: Input equal to the limit is returned unchanged

- **WHEN** `truncate('exactlyten', 10)` is called
- **THEN** the result is `'exactlyten'`

#### Scenario: Input longer than the limit is cut and ends with an ellipsis

- **WHEN** `truncate('hello world', 8)` is called
- **THEN** the result is `'hello w…'`
- **AND** the result's length is `8`

#### Scenario: Empty input is returned unchanged

- **WHEN** `truncate('', 5)` is called
- **THEN** the result is `''`

#### Scenario: Truncation replaces the last character with the ellipsis

- **WHEN** `truncate('abcdef', 4)` is called
- **THEN** the result is `'abc…'`
- **AND** the result's length is `4`

### Requirement: Estimate reading time in whole minutes from plain text

The system SHALL provide a `readingTime(input: string): number` function under `lib/reading-time.ts` that returns an estimated reading time in whole minutes for plain-text input, computed at 200 words per minute.

The function MUST:

1. Compute `n = wordCount(input)` using the existing `wordCount` helper from `lib/wordcount.ts`.
2. Return `0` when `n` is `0`.
3. Otherwise, return `Math.ceil(n / 200)`.

The function MUST NOT throw for any string input. The function MUST NOT walk Tiptap JSON or any other structured document — it is plain-text only and inherits `wordCount`'s contract for what counts as a word. The function MUST NOT introduce its own word-splitting logic.

#### Scenario: Empty input returns zero

- **WHEN** `readingTime('')` is called
- **THEN** the result is `0`

#### Scenario: Whitespace-only input returns zero

- **WHEN** `readingTime('   \n\t  ')` is called
- **THEN** the result is `0`

#### Scenario: A short note rounds up to one minute

- **WHEN** `readingTime('hello world')` is called
- **THEN** the result is `1`

#### Scenario: Exactly 200 words is one minute

- **WHEN** `readingTime` is called with input containing exactly 200 whitespace-delimited tokens
- **THEN** the result is `1`

#### Scenario: 201 words rounds up to two minutes

- **WHEN** `readingTime` is called with input containing exactly 201 whitespace-delimited tokens
- **THEN** the result is `2`

#### Scenario: 600 words rounds up to three minutes

- **WHEN** `readingTime` is called with input containing exactly 600 whitespace-delimited tokens
- **THEN** the result is `3`
