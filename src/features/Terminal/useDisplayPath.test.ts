import { expect, test, describe, vi, MockedFunction } from 'vitest'
import { useDisplayPath } from './useDisplayPath'
import { renderHook } from '@testing-library/react'
import { useAppSelector } from '../../app/hooks'

vi.mock('./useTerminalContext', () => ({
  useTerminalContext: () => ({
    cwd: '/Users/test',
  }),
}))

vi.mock('../../app/hooks')
const mockUseAppSelector = useAppSelector as MockedFunction<typeof useAppSelector>;

describe('useDisplayPath', () => {
  test('should return the relative path when useRelative is true', () => {
    mockUseAppSelector.mockReturnValue(true)
    const { result } = renderHook(() => useDisplayPath('/Users/test/test', () => true))
    expect(result.current).toBe('./test')
  })
  test('should return the absolute path when useRelative is false', () => {
    mockUseAppSelector.mockReturnValue(false)
    const { result } = renderHook(() => useDisplayPath('/Users/test/test', () => true))
    expect(result.current).toBe('/Users/test/test')
  })
  test('relative path should start with .. when absolute path is a sibling of the cwd', () => {
    mockUseAppSelector.mockReturnValue(true)
    const { result } = renderHook(() => useDisplayPath('/Users/test2/one/two', () => true))
    expect(result.current).toBe('../test2/one/two')
  })
})
