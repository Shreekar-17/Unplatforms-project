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
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    updateTask: build.mutation<Task, { id: string; body: UpdatePayload }>({
      query: ({ id, body }) => ({
        url: `/tasks/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result) => (result ? [{ type: 'Task', id: result.id }, { type: 'Task', id: 'LIST' }] : []),
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
      invalidatesTags: (result) => (result ? [{ type: 'Task', id: result.id }, { type: 'Task', id: 'LIST' }] : []),
    }),
    getTaskActivities: build.query<Activity[], { taskId: string; limit?: number; offset?: number }>({
      query: ({ taskId, limit = 50, offset = 0 }) => `/activities/task/${taskId}?limit=${limit}&offset=${offset}`,
      providesTags: (result, error, { taskId }) => [{ type: 'Activity', id: taskId }],
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
      invalidatesTags: (result, error, { taskId }) => [{ type: 'Comment', id: taskId }, { type: 'Activity', id: taskId }],
    }),
  }),
})

export const {
  useListTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useReorderTaskMutation,
  useGetTaskActivitiesQuery,
  useGetTaskCommentsQuery,
  useCreateCommentMutation,
} = tasksApi
