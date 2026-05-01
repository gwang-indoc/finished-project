## ADDED Requirements

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
