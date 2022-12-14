/* eslint no-loop-func: 0 */
/**
 * Mnemonist SymSpell
 * ===================
 *
 * JavaScript implementation of the Symmetric Delete Spelling dictionary to
 * efficiently index & query expression based on edit distance.
 * Note that the current implementation target the v3.0 of the algorithm.
 *
 * [Reference]:
 * http://blog.faroo.com/2012/06/07/improved-edit-distance-based-spelling-correction/
 * https://github.com/wolfgarbe/symspell
 *
 * [Author]:
 * Wolf Garbe
 */

/**
 * Constants.
 */
const DEFAULT_MAX_DISTANCE = 2
const DEFAULT_VERBOSITY = 2
const DEFAULT_LIMIT = 20

enum VERBOSITY {
  TOP = 'TOP',
  SMALL = 'SMALL',
  ALL = 'ALL',
}

// const VERBOSITY = new Set([
//   // Returns only the top suggestion
//   0,
//   // Returns suggestions with the smallest edit distance
//   1,
//   // Returns every suggestion (no early termination)
//   2,
// ])

const VERBOSITY_EXPLANATIONS = {
  TOP: 'Returns only the top suggestion',
  SMALL: 'Returns suggestions with the smallest edit distance',
  ALL: 'Returns every suggestion (no early termination)',
}

/**
 * Functions.
 */

interface DictionaryItem {
  suggestions: Set<number>
  count: number
}

/**
 * Function creating a dictionary item.
 *
 * @param  {number} [value] - An optional suggestion.
 * @return {object}         - The created item.
 */
function createDictionaryItem(value?: number): DictionaryItem {
  const suggestions = new Set<number>()

  if (typeof value === 'number') suggestions.add(value)

  return {
    suggestions,
    count: 0,
  }
}

export interface SuggestionItem {
  term: string
  distance: number
  count: number
}

/**
 * Function creating a suggestion item.
 *
 * @return {object} - The created item.
 */
function createSuggestionItem(term: string, distance: number, count: number): SuggestionItem {
  return {
    term: term || '',
    distance: distance || 0,
    count: count || 0,
  }
}

/**
 * Simplified edit function.
 *
 * @param {string} word      - Target word.
 * @param {number} distance  - Distance.
 * @param {number} max       - Max distance.
 * @param {Set}    [deletes] - Set mutated to store deletes.
 */
function edits(word: string, distance: number, max: number, deletes?: Set<string>) {
  deletes = deletes || new Set()
  distance++

  let deletedItem
  const l = word.length
  let i

  if (l > 1) {
    for (i = 0; i < l; i++) {
      deletedItem = word.substring(0, i) + word.substring(i + 1)

      if (!deletes.has(deletedItem)) {
        deletes.add(deletedItem)

        if (distance < max) edits(deletedItem, distance, max, deletes)
      }
    }
  }

  return deletes
}

/**
 * Function used to conditionally add suggestions.
 *
 * @param {array}  words       - Words list.
 * @param {number} verbosity   - Verbosity level.
 * @param {object} item        - The target item.
 * @param {string} suggestion  - The target suggestion.
 * @param {number} int         - Integer key of the word.
 * @param {object} deletedItem - Considered deleted item.
 * @param {SymSpell}
 */
function addLowestDistance(
  words: Array<string>,
  verbosity: number,
  item: DictionaryItem,
  suggestion: string,
  int: number,
  deletedItem: string,
) {
  const first = item.suggestions.values().next().value

  if (
    verbosity < 2 &&
    item.suggestions.size > 0 &&
    words[first].length - deletedItem.length > suggestion.length - deletedItem.length
  ) {
    item.suggestions = new Set()
    item.count = 0
  }

  if (
    verbosity === 2 ||
    !item.suggestions.size ||
    words[first].length - deletedItem.length >= suggestion.length - deletedItem.length
  ) {
    item.suggestions.add(int)
  }
}

/**
 * Custom Damerau-Levenshtein used by the algorithm.
 *
 * @param  {string} source - First string.
 * @param  {string} target - Second string.
 * @return {number}        - The distance.
 */
function damerauLevenshtein(source: string, target: string): number {
  const m = source.length
  const n = target.length
  const H: Array<Array<number>> = [[]]
  const INF = m + n
  const sd = new Map()
  let i
  let l
  let j

  H[0][0] = INF

  for (i = 0; i <= m; i++) {
    if (!H[i + 1]) H[i + 1] = []
    H[i + 1][1] = i
    H[i + 1][0] = INF
  }

  for (j = 0; j <= n; j++) {
    H[1][j + 1] = j
    H[0][j + 1] = INF
  }

  const st = source + target
  let letter

  for (i = 0, l = st.length; i < l; i++) {
    letter = st[i]

    if (!sd.has(letter)) sd.set(letter, 0)
  }

  // Iterating
  for (i = 1; i <= m; i++) {
    let DB = 0

    for (j = 1; j <= n; j++) {
      const i1 = sd.get(target[j - 1]),
        j1 = DB

      if (source[i - 1] === target[j - 1]) {
        H[i + 1][j + 1] = H[i][j]
        DB = j
      } else {
        H[i + 1][j + 1] = Math.min(H[i][j], H[i + 1][j], H[i][j + 1]) + 1
      }

      H[i + 1][j + 1] = Math.min(H[i + 1][j + 1], H[i1][j1] + (i - i1 - 1) + 1 + (j - j1 - 1))
    }

    sd.set(source[i - 1], i)
  }

  return H[m + 1][n + 1]
}

interface LookupProps {
  dictionary: Record<string, DictionaryItem | number>,
  words: Array<string>,
  verbosity: number,
  maxDistance: number,
  maxLength: number,
  input: string,
  limit: number,
}

/**
 * Lookup function.
 *
 * @param  {object} dictionary  - A SymSpell dictionary.
 * @param  {array}  words       - Unique words list.
 * @param  {number} verbosity   - Verbosity level.
 * @param  {number} maxDistance - Maximum distance.
 * @param  {number} maxLength   - Maximum word length in the dictionary.
 * @param  {string} input       - Input string.
 * @return {array}              - The list of suggestions.
 */
function lookup(
  {dictionary,
  words,
  verbosity,
  maxDistance,
  maxLength,
  input,limit}: LookupProps
): Array<SuggestionItem> {
  const length = input.length

  if (length - maxDistance > maxLength) return []

  const candidates = [input]
  const candidateSet = new Set()
  const suggestionSet = new Set()

  let suggestions: Array<SuggestionItem> = []
  let item

  // Exhausting every candidates
  while (candidates.length > 0) {
    const candidate = candidates.shift()

    // Early termination
    if (!candidate) break

    if (
      verbosity < 2 &&
      suggestions.length > 0 &&
      length - candidate?.length > suggestions[0].distance
    )
      break

    item = dictionary[candidate]

    if (item !== undefined) {
      if (typeof item === 'number') item = createDictionaryItem(item)

      if (item.count > 0 && !suggestionSet.has(candidate)) {
        suggestionSet.add(candidate)

        const suggestItem = createSuggestionItem(candidate, length - candidate.length, item.count)

        suggestions.push(suggestItem)

        // Another early termination
        if (verbosity < 2 && length - candidate.length === 0) break
      }

      // Iterating over the item's suggestions
      item.suggestions.forEach((index) => {
        const suggestion = words[index]

        // Do we already have this suggestion?
        if (suggestionSet.has(suggestion)) return

        suggestionSet.add(suggestion)

        // Computing distance between candidate & suggestion
        let distance = 0

        if (input !== suggestion) {
          if (suggestion.length === candidate.length) {
            distance = length - candidate.length
          } else if (length === candidate.length) {
            distance = suggestion.length - candidate.length
          } else {
            let ii = 0,
              jj = 0

            const l = suggestion.length

            while (ii < l && ii < length && suggestion[ii] === input[ii]) {
              ii++
            }

            while (
              jj < l - ii &&
              jj < length &&
              suggestion[l - jj - 1] === input[length - jj - 1]
            ) {
              jj++
            }

            if (ii > 0 || jj > 0) {
              distance = damerauLevenshtein(
                suggestion.substr(ii, l - ii - jj),
                input.substr(ii, length - ii - jj),
              )
            } else {
              distance = damerauLevenshtein(suggestion, input)
            }
          }
        }

        // Removing suggestions of higher distance
        if (verbosity < 2 && suggestions.length > 0 && suggestions[0].distance > distance) {
          suggestions = []
        }

        if (verbosity < 2 && suggestions.length > 0 && distance > suggestions[0].distance) {
          return
        }

        if (distance <= maxDistance) {
          const target = dictionary[suggestion]

          if (target !== undefined && typeof target !== 'number') {
            suggestions.push(createSuggestionItem(suggestion, distance, target.count))
          }
        }
      })
    }

    // Adding edits
    if (length - candidate.length < maxDistance) {
      if (
        verbosity < 2 &&
        suggestions.length > 0 &&
        length - candidate.length >= suggestions[0].distance
      )
        continue

      for (let i = 0, l = candidate.length; i < l; i++) {
        const deletedItem = candidate.substring(0, i) + candidate.substring(i + 1)

        if (!candidateSet.has(deletedItem)) {
          candidateSet.add(deletedItem)
          candidates.push(deletedItem)
        }
      }
    }
  }

  if (verbosity === 0) return suggestions.slice(0, 1)

  return suggestions
}



interface SymSpellOptions {
  maxDistance: number
  verbosity: number, // 0 | 1 | 2 -> convert to enum,
  limit: number,
}

const defaultOptions: SymSpellOptions = {
  maxDistance: DEFAULT_MAX_DISTANCE,
  verbosity: DEFAULT_VERBOSITY,
  limit: DEFAULT_LIMIT,
}

class SymSpell {
  size = 0
  maxLength = 0
  dictionary: Record<string, DictionaryItem | number> = {}
  words: string[] = []
  options: SymSpellOptions = defaultOptions

  constructor(options?: Partial<SymSpellOptions>) {
    this.options = {...defaultOptions, ...options}
  }

  add(word: string) {
    let item = this.dictionary[word]

    if (item !== undefined) {
      if (typeof item === 'number') {
        item = createDictionaryItem(item)
        this.dictionary[word] = item
      }

      item.count++
    } else {
      item = createDictionaryItem()
      item.count++

      this.dictionary[word] = item

      if (word.length > this.maxLength) this.maxLength = word.length
    }

    if (item.count === 1) {
      const number = this.words.length
      this.words.push(word)

      const deletes = edits(word, 0, this.options.maxDistance)

      deletes.forEach((deletedItem) => {
        let target = this.dictionary[deletedItem]

        if (target !== undefined) {
          if (typeof target === 'number') {
            target = createDictionaryItem(target)

            this.dictionary[deletedItem] = target
          }

          if (!target.suggestions.has(number)) {
            addLowestDistance(this.words, this.options.verbosity, target, word, number, deletedItem)
          }
        } else {
          this.dictionary[deletedItem] = number
        }
      })
    }

    this.size++

    return this
  }

  search(input: string) {
    return lookup({
      dictionary: this.dictionary,
      words: this.words,
      maxLength: this.maxLength,
      input,
      ...this.options,
    }
    )
  }

  from(iterable: Array<string>, options?: SymSpellOptions) {
    const index = new SymSpell(options)

    iterable.forEach(function (value) {
      index.add(value)
    })

    return index
  }
}

export default SymSpell
