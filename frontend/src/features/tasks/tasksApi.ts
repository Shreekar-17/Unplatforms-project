import { api } from '../../lib/api'
import { Task, Activity, Comment } from './types'

type UpdatePayload = Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'owner' | 'tags' | 'estimate' | 'ordering_index'>> & {
  if_match: number
}

export const tasksApi = api.injectEndpoints({
  endpoints: (build) => ({
    listTasks: build.query<Task[], void>({
      query: () => '/tasks/',
      providesTags: (result: Task[] | undefined) =>
        result
          ? [
            ...result.map((t) => ({ type: 'Task' as const, id: t.id })),
            { type: 'Task' as const, id: 'LIST' },
          ]
          : [{ type: 'Task' as const, id: 'LIST' }],
    }),
    createTask: build.mutation<Task, Partial<Task>>({
      query: (body: Partial<Task>) => ({
        url: '/tasks/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }, { type: 'Activity', id: 'GLOBAL' }],
    }),
    updateTask: build.mutation<Task, { id: string; body: UpdatePayload }>({
      query: ({ id, body }) => ({
        url: `/tasks/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result) =>
        result
          ? [
            { type: 'Task', id: result.id },
            { type: 'Task', id: 'LIST' },
            { type: 'Activity', id: result.id },
            { type: 'Activity', id: 'GLOBAL' },
          ]
          : [],
    }),
    reorderTask: build.mutation<
      Task,
      { id: string; new_status?: string | null; new_ordering_index: number; if_match: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/tasks/${id}/reorder`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result) =>
        result
          ? [
            { type: 'Task', id: result.id },
            { type: 'Task', id: 'LIST' },
            { type: 'Activity', id: result.id },
            { type: 'Activity', id: 'GLOBAL' },
          ]
          : [],
    }),
    // Per-task activities
    getTaskActivities: build.query<Activity[], { taskId: string; limit?: number; offset?: number; exclude_type?: string }>({
      query: ({ taskId, limit = 10, offset = 0, exclude_type }) => {
        let url = `/activities/task/${taskId}?limit=${limit}&offset=${offset}`
        if (exclude_type) url += `&exclude_type=${exclude_type}`
        return url
      },
      serializeQueryArgs: ({ queryArgs }) => {
        // Cache by taskId AND exclude_type to avoid mixing filtered/unfiltered lists
        return `getTaskActivities(${queryArgs.taskId}-${queryArgs.exclude_type || 'all'})`
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.offset === 0) {
          // Reset cache on first page load/refresh
          return newItems
        }
        return [...currentCache, ...newItems]
      },
      forceRefetch({ currentArg, previousArg }) {
        // Refetch if args change
        return (
          currentArg?.offset !== previousArg?.offset ||
          currentArg?.taskId !== previousArg?.taskId ||
          currentArg?.exclude_type !== previousArg?.exclude_type
        )
      },
      providesTags: (result, error, { taskId }) => [
        { type: 'Activity', id: taskId },
        { type: 'Activity', id: 'GLOBAL' },
      ],
    }),
    // Global activities (all tasks)
    listAllActivities: build.query<Activity[], { limit?: number; offset?: number; type?: string | null; exclude_type?: string }>({
      query: ({ limit = 20, offset = 0, type, exclude_type }) => {
        let url = `/activities/?limit=${limit}&offset=${offset}`
        if (type) url += `&type=${type}`
        if (exclude_type) url += `&exclude_type=${exclude_type}`
        return url
      },
      serializeQueryArgs: ({ queryArgs }) => {
        // Cache by type/exclude_type
        return `listAllActivities(${queryArgs.type || 'all'}-${queryArgs.exclude_type || 'all'})`
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.offset === 0) return newItems
        return [...currentCache, ...newItems]
      },
      forceRefetch({ currentArg, previousArg }) {
        return (
          currentArg?.offset !== previousArg?.offset ||
          currentArg?.type !== previousArg?.type ||
          currentArg?.exclude_type !== previousArg?.exclude_type
        )
      },
      providesTags: [{ type: 'Activity', id: 'GLOBAL' }],
    }),
    getTaskComments: build.query<Comment[], string>({
      query: (taskId) => `/comments/task/${taskId}`,
      providesTags: (result, error, taskId) => [{ type: 'Comment', id: taskId }],
    }),
    createComment: build.mutation<Comment, { taskId: string; body: string; actor: string }>({
      query: ({ taskId, body, actor }) => ({
        url: `/comments/task/${taskId}`,
        method: 'POST',
        body: { body, actor },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'Comment', id: taskId },
        { type: 'Activity', id: taskId },
        { type: 'Activity', id: 'GLOBAL' },
      ],
    }),
    bulkUpdateTasks: build.mutation<
      Task[],
      { task_ids: string[]; status?: string; priority?: string; owner?: string; delete?: boolean }
    >({
      query: (body) => ({
        url: '/tasks/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }, { type: 'Activity', id: 'GLOBAL' }],
    }),
    deleteTask: build.mutation<void, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }, { type: 'Activity', id: 'GLOBAL' }],
    }),
  }),
})

export const {
  useListTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useReorderTaskMutation,
  useGetTaskActivitiesQuery,
  useListAllActivitiesQuery,
  useGetTaskCommentsQuery,
  useCreateCommentMutation,
  useBulkUpdateTasksMutation,
  useDeleteTaskMutation,
} = tasksApi

