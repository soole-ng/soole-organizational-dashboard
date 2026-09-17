/**
 * Nigerian vehicle plate numbers - the same rule the server applies.
 *
 * Two formats are on the road and both are accepted:
 *
 *   ABC-123DE    current, since the 2011 revision. Three letters for the
 *                Local Government Area, three digits for the sequence, then
 *                the year letter (2011 = A) and the batch.
 *
 *   AB123-CDE    pre-2011, with the three-letter code at the END. Nigeria
 *                runs a great many older imports, so refusing this would
 *                refuse vehicles that are legal and on the road today. The
 *                fleet form used to hyphenate after the third character
 *                whatever was typed, so an older plate was displayed as
 *                "AB1-23CDE" while somebody typed it.
 *
 * Register Vehicle had a placeholder reading ABC-123DE and no check at all -
 * the plate was uppercased and sent, so "667-777" registered an org vehicle
 * and it went out carrying passengers. A plate that is not a plate makes the
 * vehicle untraceable, which is the whole job of the number.
 *
 * Deliberately in step with `verification/plate.py` on the backend and
 * `lib/src/core/utils/nigerian_plate.dart` in the mobile app. If one
 * changes, change all three: a client stricter than the server refuses
 * vehicles that were fine, and a looser one sends somebody into a 400 they
 * cannot read.
 *
 * It does not try to be exhaustive. Diplomatic, consular, military and some
 * government plates use other patterns entirely; those are refused here and
 * a human reviewer is the backstop, which is a better judge of an unusual
 * plate than a regular expression.
 */

/** ABC123DE - three letters, three digits, two letters. */
const CURRENT = /^[A-Z]{3}[0-9]{3}[A-Z]{2}$/

/** AB123CDE - two letters, three digits, three letters. */
const PRE_2011 = /^[A-Z]{2}[0-9]{3}[A-Z]{3}$/

/** Letters and digits only, uppercased. The comparable form. */
export function plateCompact(plate: string): string {
  return (plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/** Whether this matches either format Nigeria actually issues. */
export function plateLooksValid(plate: string): boolean {
  const c = plateCompact(plate)
  return CURRENT.test(c) || PRE_2011.test(c)
}

/**
 * The canonical spelling, with the hyphen where the plate carries it.
 *
 *   abc123de    -> ABC-123DE
 *   ab 123 cde  -> AB123-CDE
 *
 * Anything unrecognised comes back compacted rather than thrown away -
 * storing it consistently still beats storing whatever spacing somebody
 * happened to type, and it is what keeps the duplicate check honest.
 */
export function plateNormalise(plate: string): string {
  const c = plateCompact(plate)
  if (CURRENT.test(c)) return `${c.slice(0, 3)}-${c.slice(3)}`
  if (PRE_2011.test(c)) return `${c.slice(0, 5)}-${c.slice(5)}`
  return c
}

/**
 * Shapes a plate as it is typed, deciding the format from the characters
 * themselves rather than assuming the current one.
 *
 * Three letters at the front means the hyphen goes after them; two letters
 * and a digit means it goes after the fifth. A half-typed field defaults to
 * the current format, which is what the placeholder promises.
 */
export function plateFormatAsTyped(raw: string): string {
  const clean = plateCompact(raw).slice(0, 8)
  const hyphenAt = clean.length >= 3 && /^[A-Z]{2}[0-9]$/.test(clean.slice(0, 3)) ? 5 : 3
  return clean.length > hyphenAt
    ? `${clean.slice(0, hyphenAt)}-${clean.slice(hyphenAt)}`
    : clean
}

/** What somebody reads when their plate does not match. */
export const PLATE_EXPECTED_MESSAGE =
  'Enter a Nigerian plate number, for example ABC-123DE ' +
  '(three letters, three numbers, two letters) or an older AB123-CDE plate.'
