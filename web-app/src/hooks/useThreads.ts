import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { localStorageKey } from '@/constants/localStorage'
import { ulid } from 'ulidx'
import { createThread, deleteThread, updateThread } from '@/services/threads'
import { Fzf } from 'fzf'
import { highlightFzfMatch } from '../utils/highlight'
type ThreadState = {
  threads: Record<string, Thread>
  currentThreadId?: string
  getCurrentThread: () => Thread | undefined
  setThreads: (threads: Thread[]) => void
  getFavoriteThreads: () => Thread[]
  getThreadById: (threadId: string) => Thread | undefined
  toggleFavorite: (threadId: string) => void
  deleteThread: (threadId: string) => void
  renameThread: (threadId: string, newTitle: string) => void
  deleteAllThreads: () => void
  unstarAllThreads: () => void
  setCurrentThreadId: (threadId?: string) => void
  createThread: (
    model: ThreadModel,
    title?: string,
    assistant?: Assistant
  ) => Promise<Thread>
  updateCurrentThreadModel: (model: ThreadModel) => void
  getFilteredThreads: (searchTerm: string) => Thread[]
  updateCurrentThreadAssistant: (assistant: Assistant) => void
  searchIndex: Fzf<Thread[]> | null
}

export const useThreads = create<ThreadState>()(
  persist(
    (set, get) => ({
      threads: {},
      searchIndex: null,
      setThreads: (threads) => {
        threads.forEach((thread, index) => {
          thread.order = index + 1
          updateThread({
            ...thread,
            order: index + 1,
          })
        })
        const threadMap = threads.reduce(
          (acc: Record<string, Thread>, thread) => {
            acc[thread.id] = thread
            return acc
          },
          {} as Record<string, Thread>
        )
        set({
          threads: threadMap,
          searchIndex: new Fzf<Thread[]>(Object.values(threadMap), {
            selector: (item: Thread) => item.title,
          }),
        })
      },
      getFilteredThreads: (searchTerm: string) => {
        const { threads, searchIndex } = get()

        // If no search term, return all threads
        if (!searchTerm) {
          // return all threads
          return Object.values(threads)
        }

        let currentIndex = searchIndex
        if (!currentIndex) {
          currentIndex = new Fzf<Thread[]>(Object.values(threads), {
            selector: (item: Thread) => item.title,
          })
          set({ searchIndex: currentIndex })
        }

        // Use the index to search and return matching threads
        const fzfResults = currentIndex.find(searchTerm)
        return fzfResults.map(
          (result: { item: Thread; positions: Set<number> }) => {
            const thread = result.item // Fzf stores the original item here
            // Ensure result.positions is an array, default to empty if undefined
            const positions = Array.from(result.positions) || []
            const highlightedTitle = highlightFzfMatch(thread.title, positions)
            return {
              ...thread,
              title: highlightedTitle, // Override title with highlighted version
            }
          }
        )
      },
      toggleFavorite: (threadId) => {
        set((state) => {
          updateThread({
            ...state.threads[threadId],
            isFavorite: !state.threads[threadId].isFavorite,
          })
          return {
            threads: {
              ...state.threads,
              [threadId]: {
                ...state.threads[threadId],
                isFavorite: !state.threads[threadId].isFavorite,
              },
            },
          }
        })
      },
      deleteThread: (threadId) => {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [threadId]: _, ...remainingThreads } = state.threads
          deleteThread(threadId)
          return {
            threads: remainingThreads,
            searchIndex: new Fzf<Thread[]>(Object.values(remainingThreads), {
              selector: (item: Thread) => item.title,
            }),
          }
        })
      },
      deleteAllThreads: () => {
        set((state) => {
          const allThreadIds = Object.keys(state.threads)
          allThreadIds.forEach((threadId) => {
            deleteThread(threadId)
          })
          return {
            threads: {},
            searchIndex: null, // Or new Fzf([], {selector...})
          }
        })
      },
      unstarAllThreads: () => {
        set((state) => {
          const updatedThreads = Object.keys(state.threads).reduce(
            (acc, threadId) => {
              acc[threadId] = {
                ...state.threads[threadId],
                isFavorite: false,
              }
              return acc
            },
            {} as Record<string, Thread>
          )
          Object.values(updatedThreads).forEach((thread) => {
            updateThread({ ...thread, isFavorite: false })
          })
          return { threads: updatedThreads }
        })
      },
      getFavoriteThreads: () => {
        return Object.values(get().threads).filter(
          (thread) => thread.isFavorite
        )
      },
      getThreadById: (threadId: string) => {
        return get().threads[threadId]
      },
      setCurrentThreadId: (threadId) => {
        set({ currentThreadId: threadId })
      },
      createThread: async (model, title, assistant) => {
        const newThread: Thread = {
          id: ulid(),
          title: title ?? 'New Thread',
          model,
          order: 1, // Will be set properly by setThreads
          updated: Date.now() / 1000,
          assistants: assistant ? [assistant] : [],
        }
        return await createThread(newThread).then((createdThread) => {
          set((state) => {
            // Get all existing threads as an array
            const existingThreads = Object.values(state.threads)

            // Create new array with the new thread at the beginning
            const reorderedThreads = [createdThread, ...existingThreads]

            // Use setThreads to handle proper ordering (this will assign order 1, 2, 3...)
            get().setThreads(reorderedThreads)

            return {
              currentThreadId: createdThread.id,
            }
          })
          return createdThread
        })
      },
      updateCurrentThreadAssistant: (assistant) => {
        set((state) => {
          if (!state.currentThreadId) return { ...state }
          const currentThread = state.getCurrentThread()
          if (currentThread)
            updateThread({
              ...currentThread,
              assistants: [{ ...assistant, model: currentThread.model }],
            })
          return {
            threads: {
              ...state.threads,
              [state.currentThreadId as string]: {
                ...state.threads[state.currentThreadId as string],
                assistants: [assistant],
              },
            },
          }
        })
      },
      updateCurrentThreadModel: (model) => {
        set((state) => {
          if (!state.currentThreadId) return { ...state }
          const currentThread = state.getCurrentThread()
          if (currentThread) updateThread({ ...currentThread, model })
          return {
            threads: {
              ...state.threads,
              [state.currentThreadId as string]: {
                ...state.threads[state.currentThreadId as string],
                model,
              },
            },
          }
        })
      },
      renameThread: (threadId, newTitle) => {
        set((state) => {
          const thread = state.threads[threadId]
          if (!thread) return state
          const updatedThread = {
            ...thread,
            title: newTitle,
          }
          updateThread(updatedThread) // External call, order is fine
          const newThreads = { ...state.threads, [threadId]: updatedThread }
          return {
            threads: newThreads,
            searchIndex: new Fzf<Thread[]>(Object.values(newThreads), {
              selector: (item: Thread) => item.title,
            }),
          }
        })
      },
      getCurrentThread: () => {
        const { currentThreadId, threads } = get()
        return currentThreadId ? threads[currentThreadId] : undefined
      },
    }),
    {
      name: localStorageKey.threads,
      storage: createJSONStorage(() => localStorage),
    }
  )
)
