import SimplePath from '../@types/SimplePath'
import Thunk from '../@types/Thunk'
import * as selection from '../device/selection'
import rootedParentOf from '../selectors/rootedParentOf'
import isMarkdown from '../util/isMarkdown'
import strip from '../util/strip'
import timestamp from '../util/timestamp'
import { importFilesActionCreator as importFiles } from './importFiles'
import { importTextActionCreator as importText } from './importText'
import { newThoughtActionCreator as newThought } from './newThought'

interface ImportDataPayload {
  path: SimplePath
  text: string
  html: string | null
  rawDestValue: string
  transient?: boolean
  isEmText?: boolean
}

/** Action-creator for importData. */
export const importDataActionCreator = ({
  path,
  text,
  html,
  rawDestValue,
  transient,
  isEmText = false,
}: ImportDataPayload): Thunk => {
  return (dispatch, getState) => {
    const state = getState()

    // If transient first add new thought and then import the text
    if (transient) {
      dispatch(
        newThought({
          at: rootedParentOf(state, path),
          value: '',
        }),
      )
    }

    // For nested HTML lists (like from Notion), preserve the structure
    const processedText = html
      ? /<ul>.*?<\/ul>/s.test(html)
        ? html.replace(/<meta[^>]*>/g, '').trim() // Keep HTML structure for nested lists
        : strip(html, { preserveFormatting: isEmText, stripColors: !isEmText }).replace(/\n\s*\n+/g, '\n')
      : text.trim()

    const multiline = text.trim().includes('\n')
    const markdown = isMarkdown(processedText)

    if (!multiline || markdown) {
      dispatch(
        importText({
          caretPosition: (selection.isText() ? selection.offset() || 0 : state.cursorOffset) || 0,
          path,
          text: processedText,
          rawDestValue,
          ...(selection.isActive() && !selection.isCollapsed()
            ? {
                replaceStart: selection.offsetStart()!,
                replaceEnd: selection.offsetEnd()!,
              }
            : null),
        }),
      )
    } else {
      selection.clear()

      dispatch(
        importFiles({
          path,
          files: [
            {
              lastModified: timestamp(),
              name: 'from clipboard',
              size: processedText.length * 8,
              text: async () => processedText,
            },
          ],
        }),
      )
    }
  }
}

export default importDataActionCreator
