import SimplePath from '../../@types/SimplePath'
import { HOME_TOKEN } from '../../constants'
import { getAllChildren } from '../../selectors/getChildren'
import getThoughtById from '../../selectors/getThoughtById'
import store from '../../stores/app'
import { importDataActionCreator as importData } from '../importData'

describe('onPaste', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    store.dispatch({ type: 'CLEAR_THOUGHT_CACHE' })
  })

  it('should correctly import nested bulleted lists from Notion', () => {
    const notionHtml = `
      <meta charset='utf-8'><ul>
        <li>a
          <ul>
            <li>m
              <ul>
                <li>x</li>
              </ul>
            </li>
          </ul>
        </li>
        <li>b
          <ul>
            <li>m
              <ul>
                <li>y</li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    `

    const plainText = ''

    // Dispatch the import action directly
    store.dispatch(
      importData({
        path: [HOME_TOKEN] as SimplePath,
        text: plainText,
        html: notionHtml,
        rawDestValue: '',
        isEmText: false,
      }),
    )

    // Get the root children
    const rootChildren = getAllChildren(store.getState(), HOME_TOKEN)

    // Verify the structure
    expect(rootChildren.length).toBe(2)

    // Find 'a' and 'b' thoughts
    const aThought = rootChildren.find(id => getThoughtById(store.getState(), id)?.value === 'a')
    const bThought = rootChildren.find(id => getThoughtById(store.getState(), id)?.value === 'b')

    expect(aThought).toBeDefined()
    expect(bThought).toBeDefined()

    // Verify 'a' branch
    const aChildren = getAllChildren(store.getState(), aThought!)
    const aM = aChildren.find(id => getThoughtById(store.getState(), id)?.value === 'm')
    expect(aM).toBeDefined()

    const aMChildren = getAllChildren(store.getState(), aM!)
    const aMX = aMChildren.find(id => getThoughtById(store.getState(), id)?.value === 'x')
    expect(aMX).toBeDefined()

    // Verify 'b' branch
    const bChildren = getAllChildren(store.getState(), bThought!)
    const bM = bChildren.find(id => getThoughtById(store.getState(), id)?.value === 'm')
    expect(bM).toBeDefined()

    const bMChildren = getAllChildren(store.getState(), bM!)
    const bMY = bMChildren.find(id => getThoughtById(store.getState(), id)?.value === 'y')
    expect(bMY).toBeDefined()

    // Verify the 'm' thoughts are distinct
    expect(aM).not.toBe(bM)
  })
})
